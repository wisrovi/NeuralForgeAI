"""Preflight validation step in WPipe pipeline."""

from typing import Any, Dict
from wpipe import step

from utils.preflight import validate_training_config_preflight


@step(name="validate_config_step", version="v1.0", tags=["api", "validation"])
def validate_config_step(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate submitted training configuration against schema integrity rules.

    Args:
        input_data (Dict[str, Any]): Dictionary containing config_data.

    Returns:
        Dict[str, Any]: Context dictionary with validation flag.
    """
    config_data = input_data.get("config_data", {})
    validate_training_config_preflight(config_data)
    input_data["is_valid"] = True
    return input_data
