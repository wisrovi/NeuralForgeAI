"""API Module for ML Training Cluster.

This module provides FastAPI endpoints to launch and monitor ML training studies
using Optuna and Celery. It supports YAML configuration uploads and priority-based
task routing.
"""

from typing import Any, Optional
import redis
import yaml
import json
import psutil
import shutil
import time
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from celery.result import AsyncResult

# Import Celery app from the local configuration
from celery_config import app as celery_app

app: FastAPI = FastAPI(title="ML CLUSTER API v5 - Strict Priority & Private Mode")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/train")
async def start_training(
    config_file: UploadFile = File(...),
    mode: str = Form("public", description="Execution mode: public or private"),
    worker_name: Optional[str] = Form(
        None, description="Target worker name (for private mode)"
    ),
    priority: str = Form(
        "medium", description="Priority: high, medium, low (public mode only)"
    ),
) -> dict[str, str]:
    """Launches a new training study based on a YAML configuration."""
    if not config_file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    if not config_file.filename.lower().endswith((".yaml", ".yml")):
        raise HTTPException(
            status_code=400, detail="File must be a YAML (.yaml or .yml)"
        )

    try:
        content: bytes = await config_file.read()
        config_data: dict[str, Any] = yaml.safe_load(content)

        if not isinstance(config_data, dict):
            raise HTTPException(
                status_code=400, 
                detail="Invalid YAML: content must be a dictionary"
            )

        if mode == "private":
            if not worker_name:
                raise HTTPException(
                    status_code=400, detail="Worker name is required for private mode"
                )
            if "sweeper" not in config_data:
                config_data["sweeper"] = {}
            config_data["sweeper"]["target_worker_queue"] = worker_name
            target_info = f"private:{worker_name}"
        else:
            target_info = f"public:{priority}"

        job: AsyncResult = celery_app.send_task(
            "tasks.manage_study", args=[config_data], queue="managers"
        )

        return {
            "status": "Queued",
            "study_id": str(job.id),
            "mode": mode,
            "routing": target_info,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {exc}")


@app.get("/workers")
async def get_available_workers() -> dict[str, Any]:
    """Retrieves a list of active workers and their queues."""
    workers_info = {}
    
    try:
        inspector = celery_app.control.inspect(timeout=1.5)
        active_queues = inspector.active_queues()
        
        if active_queues:
            for worker_name, queues in active_queues.items():
                workers_info[worker_name] = [q.get("name") for q in queues]
        
        # Fallback: Check Redis for heartbeats if inspector fails
        if not workers_info:
            r = redis.from_url(celery_app.conf.broker)
            # Celery stores worker info in keys like 'found.worker_name'
            # or in the 'unacked' / 'unacked_index' keys.
            # But the most reliable is to look at the 'celery' key for registered workers
            for key in r.keys("worker.*"): # Some celery versions
                workers_info[key.decode()] = "detected_via_redis"

    except Exception as exc:
        return {"error": f"Inspection failed: {exc}", "workers": []}

    return {
        "count": len(workers_info),
        "workers": workers_info
    }


@app.get("/status/{study_id}")
async def get_status(study_id: str) -> dict[str, Any]:
    """Gets the status and result of a specific study."""
    res: AsyncResult = AsyncResult(study_id, app=celery_app)
    
    response = {
        "study_id": study_id,
        "state": str(res.state),
        "ready": res.ready(),
        "result": res.result if res.ready() else None,
    }
    
    if res.state == "FAILURE":
        response["result"] = str(res.result)
        
    return response


@app.get("/tasks")
async def list_tasks() -> dict[str, Any]:
    """Lists tasks both in the Redis queue and currently running."""
    tasks_report = {
        "queued": {},
        "running": [],
        "total_queued": 0
    }
    
    try:
        # 1. Check Redis queues directly (The absolute truth)
        r = redis.from_url(celery_app.conf.broker_url)
        queues = ["managers", "gpus_high", "gpus_medium", "gpus_low", "gpus"]
        
        for q in queues:
            q_len = r.llen(q)
            if q_len > 0:
                tasks_report["queued"][q] = q_len
                tasks_report["total_queued"] += q_len

        # 2. Check what's actually running in workers
        inspector = celery_app.control.inspect(timeout=1.0)
        active = inspector.active()
        if active:
            for worker, tasks in active.items():
                for t in tasks:
                    tasks_report["running"].append({
                        "worker": worker,
                        "id": t.get("id"),
                        "name": t.get("name"),
                        "args": str(t.get("args"))[:100]
                    })

    except Exception as exc:
        tasks_report["error"] = str(exc)

    return tasks_report


@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str) -> dict[str, Any]:
    """Revokes a task."""
    celery_app.control.revoke(task_id, terminate=True, signal='SIGKILL')
    return {"status": "revoked", "task_id": task_id}


@app.get("/users")
async def get_users() -> list[dict[str, Any]]:
    """Retrieves the list of users from Redis."""
    try:
        r = redis.from_url(celery_app.conf.broker_url)
        data = r.get("omni_users")
        if data:
            return json.loads(data)
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/users")
async def save_users(users: list[dict[str, Any]]):
    """Saves the entire list of users to Redis."""
    try:
        r = redis.from_url(celery_app.conf.broker_url)
        r.set("omni_users", json.dumps(users))
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/projects")
async def get_projects() -> list[dict[str, Any]]:
    """Retrieves the list of projects from Redis."""
    try:
        r = redis.from_url(celery_app.conf.broker_url)
        data = r.get("omni_projects")
        if data:
            return json.loads(data)
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/projects")
async def save_projects(projects: list[dict[str, Any]]):
    """Saves the entire list of projects to Redis."""
    try:
        r = redis.from_url(celery_app.conf.broker_url)
        r.set("omni_projects", json.dumps(projects))
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/services")
async def get_services() -> list[dict[str, Any]]:
    """Retrieves the list of microservices from Redis."""
    try:
        r = redis.from_url(celery_app.conf.broker_url)
        data = r.get("omni_services_config")
        if data:
            return json.loads(data)
        return []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/services")
async def save_services(services: list[dict[str, Any]]):
    """Saves the microservices configuration to Redis."""
    try:
        r = redis.from_url(celery_app.conf.broker_url)
        r.set("omni_services_config", json.dumps(services))
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/config")
async def get_config() -> dict[str, Any]:
    """Retrieves general app configuration (favorites, gemini, theme) from Redis."""
    try:
        r = redis.from_url(celery_app.conf.broker_url)
        data = r.get("omni_app_config")
        if data:
            return json.loads(data)
        return {
            "gemini_enabled": False,
            "favorites": [],
            "theme": "dark",
            "user_role": "guest"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/config")
async def save_config(config: dict[str, Any]):
    """Saves general app configuration to Redis."""
    try:
        r = redis.from_url(celery_app.conf.broker_url)
        r.set("omni_app_config", json.dumps(config))
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Checks connection to Redis and retrieves system telemetry."""
    telemetry = {
        "status": "ok",
        "redis": "disconnected",
        "system": {
            "cpu_percent": psutil.cpu_percent(interval=None),
            "memory_used_gb": round(psutil.virtual_memory().used / (1024**3), 2),
            "memory_total_gb": round(psutil.virtual_memory().total / (1024**3), 2),
            "disk_used_percent": psutil.disk_usage('/').percent,
            "disk_free_gb": round(psutil.disk_usage('/').free / (1024**3), 2),
            "disk_total_gb": round(psutil.disk_usage('/').total / (1024**3), 2)
        },
        "timestamp": time.time()
    }
    try:
        r = redis.from_url(celery_app.conf.broker_url)
        r.ping()
        telemetry["redis"] = "connected"
        telemetry["broker"] = celery_app.conf.broker_url
        
        info = r.info()
        telemetry["redis_metrics"] = {
            "used_memory_human": info.get("used_memory_human"),
            "used_memory": info.get("used_memory"),
            "connected_clients": info.get("connected_clients")
        }
    except Exception as e:
        telemetry["status"] = "error"
        telemetry["message"] = str(e)
    return telemetry


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
