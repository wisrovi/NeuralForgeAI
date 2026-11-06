"""Dispatch study step in WPipe pipeline."""

from typing import Any, Dict
from wpipe import step

from celery_config import app as celery_app
from utils.celery_service import CeleryService
from utils.redis_service import RedisService


@step(name="dispatch_study_step", version="v1.0", tags=["api", "dispatch"])
def dispatch_study_step(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Submit the validated study configuration to Celery broker and persist metadata.

    Args:
        input_data (Dict[str, Any]): Pipeline context containing config_data and execution parameters.

    Returns:
        Dict[str, Any]: Updated context dictionary with study_id and job status.
    """
    config_data = input_data["config_data"]
    eta_datetime = input_data.get("eta_datetime")
    user_time_hours = input_data.get("user_time_hours")

    celery_service = CeleryService(celery_app)
    redis_service = RedisService(celery_app.conf.broker_url)

    job = celery_service.dispatch_manage_study(config_data, eta=eta_datetime)
    study_id = str(job.id)

    redis_service.persist_study_metadata(
        study_id, config_data, eta_datetime, user_time_hours
    )

    input_data["study_id"] = study_id
    input_data["dispatched"] = True
    return input_data
