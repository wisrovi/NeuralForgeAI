"""Administrative and system management router for NeuralForge API."""

import time
from typing import Any
from fastapi import APIRouter, HTTPException
import psutil

from celery_config import app as celery_app
from dto.api_dto import AppConfigDTO, BroadcastPullResponseDTO
from utils.celery_service import CeleryService
from utils.redis_service import RedisService

router = APIRouter()
celery_svc = CeleryService(celery_app)
redis_svc = RedisService(celery_app.conf.broker_url)


@router.get("/users")
async def get_users() -> list[dict[str, Any]]:
    """Retrieves the list of users from Redis.

    Returns:
        list[dict[str, Any]]: Stored users list.
    """
    return redis_svc.get_json("omni_users", default=[])


@router.post("/users")
async def save_users(users: list[dict[str, Any]]) -> dict[str, str]:
    """Saves the entire list of users to Redis.

    Args:
        users: User definitions to persist.

    Returns:
        dict[str, str]: Operation status.
    """
    redis_svc.set_json("omni_users", users)
    return {"status": "success"}


@router.get("/projects")
async def get_projects() -> list[dict[str, Any]]:
    """Retrieves the list of projects from Redis.

    Returns:
        list[dict[str, Any]]: Stored projects list.
    """
    return redis_svc.get_json("omni_projects", default=[])


@router.post("/projects")
async def save_projects(projects: list[dict[str, Any]]) -> dict[str, str]:
    """Saves the entire list of projects to Redis.

    Args:
        projects: Project definitions to persist.

    Returns:
        dict[str, str]: Operation status.
    """
    redis_svc.set_json("omni_projects", projects)
    return {"status": "success"}


@router.get("/services")
async def get_services() -> list[dict[str, Any]]:
    """Retrieves the list of microservices from Redis.

    Returns:
        list[dict[str, Any]]: Stored services configuration.
    """
    return redis_svc.get_json("omni_services_config", default=[])


@router.post("/services")
async def save_services(services: list[dict[str, Any]]) -> dict[str, str]:
    """Saves the microservices configuration to Redis.

    Args:
        services: Service configurations to persist.

    Returns:
        dict[str, str]: Operation status.
    """
    redis_svc.set_json("omni_services_config", services)
    return {"status": "success"}


@router.get("/config", response_model=AppConfigDTO)
async def get_config() -> AppConfigDTO:
    """Retrieves general app configuration from Redis.

    Returns:
        AppConfigDTO: Application configuration.
    """
    data = redis_svc.get_json("omni_app_config")
    if data and isinstance(data, dict):
        return AppConfigDTO(**data)
    return AppConfigDTO()


@router.post("/config")
async def save_config(config: dict[str, Any]) -> dict[str, str]:
    """Saves general app configuration to Redis.

    Args:
        config: Application configuration dictionary.

    Returns:
        dict[str, str]: Operation status.
    """
    redis_svc.set_json("omni_app_config", config)
    return {"status": "success"}


@router.get("/health")
async def health_check() -> dict[str, Any]:
    """Checks connection to Redis and retrieves system telemetry.

    Returns:
        dict[str, Any]: System health telemetry.
    """
    telemetry: dict[str, Any] = {
        "status": "ok",
        "redis": "disconnected",
        "system": {
            "cpu_percent": psutil.cpu_percent(interval=None),
            "memory_used_gb": round(psutil.virtual_memory().used / (1024**3), 2),
            "memory_total_gb": round(psutil.virtual_memory().total / (1024**3), 2),
            "disk_used_percent": psutil.disk_usage("/").percent,
            "disk_free_gb": round(psutil.disk_usage("/").free / (1024**3), 2),
            "disk_total_gb": round(psutil.disk_usage("/").total / (1024**3), 2),
        },
        "timestamp": time.time(),
    }
    try:
        client = redis_svc.get_client()
        client.ping()
        telemetry["redis"] = "connected"
        telemetry["broker"] = celery_app.conf.broker_url

        info = client.info()
        telemetry["redis_metrics"] = {
            "used_memory_human": info.get("used_memory_human"),
            "used_memory": info.get("used_memory"),
            "connected_clients": info.get("connected_clients"),
        }
    except Exception as exc:
        telemetry["status"] = "error"
        telemetry["message"] = str(exc)
    return telemetry


@router.post("/admin/broadcast-pull", response_model=BroadcastPullResponseDTO)
async def trigger_broadcast_pull(payload: dict[str, Any]) -> BroadcastPullResponseDTO:
    """Sends a remote control broadcast command to pull a docker image.

    Args:
        payload: Dictionary containing 'image_name'.

    Returns:
        BroadcastPullResponseDTO: Summary of pull command dispatch.
    """
    image_name = payload.get("image_name", "wisrovi/train_service:worker_executor_v1.0.0")
    try:
        success_count, failed_count, responses = celery_svc.broadcast_docker_pull(image_name)
        if not responses:
            return BroadcastPullResponseDTO(
                success=False,
                image=image_name,
                summary="No active workers responded. Make sure the invoker nodes are online.",
                responses={},
            )

        return BroadcastPullResponseDTO(
            success=True,
            image=image_name,
            summary=f"Broadcast pull sent. {success_count} nodes succeeded, {failed_count} nodes failed/timed out.",
            responses=responses,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to trigger Celery broadcast: {exc}")
