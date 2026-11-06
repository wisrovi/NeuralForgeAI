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


def normalize_fitness_and_routing(
    config_data: dict[str, Any],
    mode: str,
    worker_name: str | None,
    priority: str,
) -> str:
    """Normalizes sweeper fitness metric and destination worker routing.

    Args:
        config_data: Mutable configuration payload dictionary.
        mode: Dispatch mode ('public' or 'private').
        worker_name: Optional private worker identifier.
        priority: Public queue priority ('low', 'medium', 'high').

    Returns:
        str: Diagnostic routing string (e.g. 'private:192.168.1.68').
    """
    sweeper_cfg = config_data.setdefault("sweeper", {})
    if not isinstance(sweeper_cfg, dict):
        sweeper_cfg = {}
        config_data["sweeper"] = sweeper_cfg

    model_str = str(config_data.get("model", "")).lower()
    style = (
        config_data.get("style")
        or config_data.get("task")
        or ("segment" if "-seg" in model_str
            else "classify" if "-cls" in model_str
            else "pose" if "-pose" in model_str
            else "obb" if "-obb" in model_str
            else "detect")
    )
    fitness_map = {
        "detect": "metrics/mAP50-95(B)",
        "segment": "metrics/mAP50-95(M)",
        "classify": "metrics/accuracy_top1",
        "pose": "metrics/mAP50-95(P)",
        "obb": "metrics/mAP50-95(B)",
    }
    cur_fit = sweeper_cfg.get("fitness")
    if not cur_fit or (cur_fit == "metrics/accuracy_top1" and str(style).lower() != "classify"):
        sweeper_cfg["fitness"] = fitness_map.get(str(style).lower(), "metrics/mAP50-95(B)")

    target_node = (
        worker_name
        or sweeper_cfg.get("debug")
        or config_data.get("debug")
        or sweeper_cfg.get("target_worker_queue")
        or config_data.get("target_worker_queue")
    )

    if mode == "private" or (target_node and mode != "public"):
        if not target_node:
            raise HTTPException(status_code=400, detail="Worker name is required for private mode")
        sweeper_cfg["debug"] = str(target_node)
        config_data["debug"] = str(target_node)
        sweeper_cfg["target_worker_queue"] = str(target_node)
        return f"private:{target_node}"

    if target_node:
        sweeper_cfg["debug"] = str(target_node)
        config_data["debug"] = str(target_node)
        sweeper_cfg["target_worker_queue"] = str(target_node)
        return f"private:{target_node}"

    sweeper_cfg.setdefault("priority", priority)
    return f"public:{priority}"
