"""Study submission and monitoring router for NeuralForge API."""

import json
import os
from typing import Any, Optional
import urllib.parse
import urllib.request
import yaml
from celery.result import AsyncResult
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from loguru import logger

from celery_config import app as celery_app
from dto.api_dto import StudyStatusDTO, TasksReportDTO, TrainResponseDTO
from pipelines import neuralforge_api_training_pipeline
from utils.celery_service import CeleryService
from utils.preflight import normalize_fitness_and_routing
from utils.redis_service import RedisService
from utils.time_parser import normalize_train_time, parse_scheduled_eta

router = APIRouter()
celery_svc = CeleryService(celery_app)
redis_svc = RedisService(celery_app.conf.broker_url)


def get_mlflow_study_info(study_name: str, base_url: str = "http://192.168.10.252:23435") -> dict[str, Any]:
    """Resolves experiment ID, latest run ID, and real metrics from MLflow Tracking server."""
    info: dict[str, Any] = {
        "experiment_id": None,
        "run_id": None,
        "url": f"{base_url}/",
        "metrics": {},
    }
    if not study_name:
        return info

    try:
        encoded_name = urllib.parse.quote(study_name)
        exp_req = urllib.request.Request(
            f"{base_url}/api/2.0/mlflow/experiments/get-by-name?experiment_name={encoded_name}"
        )
        with urllib.request.urlopen(exp_req, timeout=1.5) as resp:
            exp_data = json.loads(resp.read().decode())
            exp_id = exp_data.get("experiment", {}).get("experiment_id")
            if exp_id:
                info["experiment_id"] = exp_id
                info["url"] = f"{base_url}/#/experiments/{exp_id}"

                runs_payload = json.dumps({
                    "experiment_ids": [exp_id],
                    "max_results": 1,
                    "order_by": ["start_time DESC"],
                }).encode("utf-8")
                runs_req = urllib.request.Request(
                    f"{base_url}/api/2.0/mlflow/runs/search",
                    data=runs_payload,
                    headers={"Content-Type": "application/json"},
                )
                with urllib.request.urlopen(runs_req, timeout=1.5) as r2:
                    runs_data = json.loads(r2.read().decode())
                    runs_list = runs_data.get("runs", [])
                    if runs_list:
                        run = runs_list[0]
                        run_id = run.get("info", {}).get("run_id")
                        if run_id:
                            info["run_id"] = run_id
                            info["url"] = f"{base_url}/#/experiments/{exp_id}/runs/{run_id}"

                            raw_metrics = run.get("data", {}).get("metrics", [])
                            metrics_map = {m["key"]: m["value"] for m in raw_metrics if "key" in m and "value" in m}
                            info["metrics"] = metrics_map
    except Exception as exc:
        print(f"[MLflow Info] Could not resolve MLflow link for {study_name}: {exc}")
    return info


@router.post("/train", response_model=TrainResponseDTO)
async def start_training(
    config_file: UploadFile = File(...),
    mode: str = Form("public", description="Execution mode: public or private"),
    worker_name: Optional[str] = Form(None, description="Target worker name (for private mode)"),
    priority: str = Form("medium", description="Priority: high, medium, low (public mode only)"),
    start_at: Optional[str] = Form(None, description="Optional scheduled execution time"),
) -> TrainResponseDTO:
    """Launches a new training study based on a YAML configuration.

    Args:
        config_file: Uploaded YAML configuration file.
        mode: Execution mode (public or private).
        worker_name: Specific worker name for private dispatch.
        priority: Priority level in public mode.
        start_at: Optional delayed start time string.

    Returns:
        TrainResponseDTO: Submission confirmation payload.
    """
    if not config_file.filename or not config_file.filename.lower().endswith((".yaml", ".yml")):
        raise HTTPException(status_code=400, detail="File must be a YAML (.yaml or .yml)")

    content = await config_file.read()
    config_data = yaml.safe_load(content)
    if not isinstance(config_data, dict):
        raise HTTPException(status_code=400, detail="Invalid YAML: content must be a dictionary")

    train_block, user_time_hours = normalize_train_time(config_data.get("train"))
    if train_block:
        config_data["train"] = train_block

    target_info = normalize_fitness_and_routing(config_data, mode, worker_name, priority)

    eta_datetime = parse_scheduled_eta(start_at or config_data.get("start_at"))
    if eta_datetime:
        config_data.setdefault("schedule", {})["start_at"] = eta_datetime.isoformat()

    pipe = neuralforge_api_training_pipeline()
    context = pipe.run(
        {
            "config_data": config_data,
            "eta_datetime": eta_datetime,
            "user_time_hours": user_time_hours,
        }
    )

    return TrainResponseDTO(
        status="Scheduled" if eta_datetime else "Queued",
        study_id=context["study_id"],
        mode=mode,
        routing=target_info,
        scheduled_eta=eta_datetime.isoformat() if eta_datetime else None,
    )


@router.get("/workers")
async def get_available_workers() -> dict[str, Any]:
    """Retrieves a list of active workers and their queues.

    Returns:
        dict[str, Any]: Count and dictionary of workers.
    """
    workers = celery_svc.inspect_active_queues()
    return {"count": len(workers), "workers": workers}


@router.get("/status/{study_id}", response_model=StudyStatusDTO)
async def get_status(study_id: str) -> StudyStatusDTO:
    """Gets the status and result of a specific study.

    Args:
        study_id: Dispatched study UUID string.

    Returns:
        StudyStatusDTO: Study status payload.
    """
    res = AsyncResult(study_id, app=celery_app)
    return StudyStatusDTO(
        study_id=study_id,
        state=str(res.state),
        ready=res.ready(),
        result=str(res.result) if res.state == "FAILURE" else (res.result if res.ready() else None),
    )


@router.get("/study/{study_id}")
async def get_study_details(study_id: str) -> dict[str, Any]:
    """Gets detailed study status: Celery state, active invoker, config metadata, and Redis data.

    Args:
        study_id: Target study UUID string.

    Returns:
        dict[str, Any]: Combined Celery and Redis metadata dictionary.
    """
    res = AsyncResult(study_id, app=celery_app)
    meta = redis_svc.get_study_metadata(study_id)
    response = {"study_id": study_id, "state": str(res.state), "ready": res.ready()}
    response.update(meta)
    if res.ready() and isinstance(res.result, dict):
        response["result"] = res.result
        best_val = res.result.get("best_value")
        if best_val is not None:
            res_data = response.setdefault("results_data", {})
            if isinstance(res_data, dict):
                best_float = float(best_val)
                curr_acc = float(res_data.get("accuracy", 0))
                final_acc = max(best_float, curr_acc)
                res_data["accuracy"] = final_acc
                res_data["fitness"] = final_acc
                res_data["best_value"] = best_float

    study_name = response.get("study_name") or response.get("config", {}).get("sweeper", {}).get("study_name")
    if study_name:
        mlflow_uri = os.getenv("MLFLOW_TRACKING_URI", "http://192.168.10.252:23435")
        mlflow_info = get_mlflow_study_info(study_name, mlflow_uri)
        if mlflow_info.get("url"):
            response["mlflow_url"] = mlflow_info["url"]
            response["mlflow_experiment_id"] = mlflow_info.get("experiment_id")
            response["mlflow_run_id"] = mlflow_info.get("run_id")
            res_data = response.setdefault("results_data", {})
            if isinstance(res_data, dict):
                res_data["mlflow_url"] = mlflow_info["url"]
                res_data["mlflow_experiment_id"] = mlflow_info.get("experiment_id")
                res_data["mlflow_run_id"] = mlflow_info.get("run_id")
            if mlflow_info.get("metrics"):
                response["real_metrics"] = mlflow_info["metrics"]
                if isinstance(res_data, dict):
                    res_data["real_metrics"] = mlflow_info["metrics"]
                    for k, v in mlflow_info["metrics"].items():
                        res_data[k] = v

    if str(res.state) == "SUCCESS" or response.get("state") == "COMPLETED" or response.get("results_data"):
        response.pop("error_data", None)
    return response


@router.post("/study/{study_id}/cancel")
async def cancel_study(study_id: str) -> dict[str, str]:
    """Gracefully requests cancellation of a study by setting a Redis flag.

    Args:
        study_id: Target study UUID.

    Returns:
        dict[str, str]: Confirmation response.
    """
    redis_svc.request_study_cancel(study_id)
    return {"status": "Cancellation requested", "study_id": study_id}


@router.get("/tasks", response_model=TasksReportDTO)
async def list_tasks() -> TasksReportDTO:
    """Lists tasks both in the Redis queue and currently running.

    Returns:
        TasksReportDTO: Summary of queued and active tasks.
    """
    report = TasksReportDTO()
    try:
        client = redis_svc.get_client()
        for q in ["managers", "gpus_high", "gpus_medium", "gpus_low", "gpus"]:
            length = client.llen(q)
            if length > 0:
                report.queued[q] = length
                report.total_queued += length
        report.running = celery_svc.inspect_running_tasks()
    except Exception as exc:
        report.error = str(exc)
    return report


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str) -> dict[str, Any]:
    """Revokes a task.

    Args:
        task_id: Task UUID to revoke.

    Returns:
        dict[str, Any]: Revocation confirmation.
    """
    celery_svc.revoke_task(task_id)
    return {"status": "revoked", "task_id": task_id}
