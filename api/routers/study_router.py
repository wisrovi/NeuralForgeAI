"""Study submission and monitoring router for NeuralForge API."""

from typing import Any, Optional
import yaml
from celery.result import AsyncResult
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

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
            if isinstance(res_data, dict) and res_data.get("accuracy", 0) == 0:
                res_data["accuracy"] = float(best_val)
                res_data["fitness"] = float(best_val)
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
