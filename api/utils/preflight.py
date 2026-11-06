"""Pre-flight configuration validation module."""

from typing import Any
from fastapi import HTTPException


def validate_training_config_preflight(config_data: dict[str, Any]) -> None:
    """Pre-flight validation ensuring configuration has valid dataset and model parameters before queuing.

    Rejects invalid submissions on the fly before creating Optuna studies or dispatching Celery tasks.

    Args:
        config_data: Dictionary parsed from the submitted YAML configuration.

    Raises:
        HTTPException: If any configuration check fails (status code 400).
    """
    train_block = config_data.get("train")
    if train_block is not None and not isinstance(train_block, dict):
        raise HTTPException(
            status_code=400,
            detail="Pre-flight validation failed: 'train' section must be a dictionary/mapping.",
        )

    # 1. Dataset verification
    dataset_path = None
    if isinstance(train_block, dict):
        dataset_path = train_block.get("data") or train_block.get("dataset")
    if not dataset_path:
        dataset_path = config_data.get("data") or config_data.get("dataset")

    if not dataset_path or not str(dataset_path).strip():
        raise HTTPException(
            status_code=400,
            detail="Pre-flight validation failed: Missing required dataset path ('data:' under 'train:' or root).",
        )

    str_ds = str(dataset_path).strip()
    # Check placeholders
    if (
        (str_ds.startswith("<") and str_ds.endswith(">"))
        or "YOUR_DATASET" in str_ds
        or "path/to/" in str_ds
        or str_ds.lower() in ("todo", "dummy", "undefined", "null")
    ):
        raise HTTPException(
            status_code=400,
            detail=f"Pre-flight validation failed: Dataset path contains unconfigured placeholder '{str_ds}'.",
        )

    # Check invalid extensions (e.g. raw images, weights, code)
    invalid_exts = (".txt", ".csv", ".png", ".jpg", ".jpeg", ".json", ".pt", ".pth", ".onnx", ".py")
    lower_ds = str_ds.lower()
    if any(lower_ds.endswith(ext) for ext in invalid_exts):
        raise HTTPException(
            status_code=400,
            detail=f"Pre-flight validation failed: Dataset path '{str_ds}' has invalid file extension. Must be a YAML (.yaml, .yml) or dataset directory.",
        )

    # Check generic root /datasets
    norm_ds = str_ds.replace("\\", "/").rstrip("/")
    if norm_ds in ("/datasets", "/datasets/data.yaml", "/datasets/dataset.yaml"):
        raise HTTPException(
            status_code=400,
            detail=f"Pre-flight validation failed: Dataset path '{str_ds}' is too generic. Specify project subpath (e.g. '/datasets/<project>/data.yaml').",
        )

    # 2. Model placeholder check (if model is specified)
    model_val = config_data.get("model")
    if model_val:
        str_m = str(model_val).strip()
        if (
            (str_m.startswith("<") and str_m.endswith(">"))
            or "YOUR_MODEL" in str_m
            or str_m.lower() in ("todo", "dummy", "null")
        ):
            raise HTTPException(
                status_code=400,
                detail=f"Pre-flight validation failed: Model parameter contains unconfigured placeholder '{str_m}'.",
            )
