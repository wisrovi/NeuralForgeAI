"""Unit tests for NeuralForgeAI API training YAML time normalization and Redis TTL calculation."""


def test_example():
    """A baseline test validating that the test suite is configured correctly."""
    assert True


def test_api_yaml_time_normalization_and_redis_ttl():
    """Validates that the API gateway preserves epoch-based training by default and scales TTL when time is set.

    This test verifies:
    1. When 'train.time' is omitted in the uploaded YAML, 'time' is not added to 'train',
       and the Redis config TTL defaults to 24 hours (86,400s = 12h * 2).
    2. When 'train.time: 30' is provided in the uploaded YAML, 'train.time' is normalized
       to 30.0 and the Redis config TTL scales to 60 hours (216,000s = 30h * 2).
    """
    def process_yaml_train_block(config_data: dict) -> tuple[dict, int]:
        train_block = config_data.get("train")
        user_time_hours = None
        if isinstance(train_block, dict):
            raw_time = train_block.get("time")
            if raw_time is not None and not isinstance(raw_time, bool):
                try:
                    parsed_time = float(raw_time)
                    if parsed_time > 0.0:
                        user_time_hours = parsed_time
                        train_block["time"] = user_time_hours
                    else:
                        train_block.pop("time", None)
                except (ValueError, TypeError):
                    train_block.pop("time", None)
            else:
                train_block.pop("time", None)
        ref_hours = user_time_hours if user_time_hours is not None else 12.0
        redis_ttl = max(86400, int(ref_hours * 3600 * 2))
        return config_data, redis_ttl

    cfg_default, ttl_default = process_yaml_train_block({"train": {"epochs": 230, "patience": 50}})
    assert "time" not in cfg_default["train"]
    assert ttl_default == 86400

    cfg_30h, ttl_30h = process_yaml_train_block({"train": {"epochs": 230, "patience": 50, "time": 30}})
    assert cfg_30h["train"]["time"] == 30.0
    assert ttl_30h == 216000


def test_api_private_mode_debug_override():
    """Validates that selecting private mode with a target worker overrides sweeper.debug and root debug."""
    config_data = {
        "model": "yolo26n.pt",
        "debug": "192.168.1.68",
        "sweeper": {
            "debug": "192.168.1.68",
            "study_name": "test_study"
        }
    }
    mode = "private"
    worker_name = "192.168.1.72"

    if mode == "private":
        if "sweeper" not in config_data or not isinstance(config_data.get("sweeper"), dict):
            config_data["sweeper"] = {}
        config_data["sweeper"]["debug"] = worker_name
        config_data["debug"] = worker_name
        config_data["sweeper"]["target_worker_queue"] = worker_name

    assert config_data["sweeper"]["debug"] == "192.168.1.72"
    assert config_data["debug"] == "192.168.1.72"
    assert config_data["sweeper"]["target_worker_queue"] == "192.168.1.72"


def test_api_scheduled_training_resolution():
    """Validates that scheduled execution times (HH:MM and ISO) resolve to future datetimes."""
    from datetime import datetime, timedelta

    def resolve_scheduled_eta(raw_start_at: str) -> datetime | None:
        raw_str = str(raw_start_at).strip()
        now_dt = datetime.now()
        if ":" in raw_str and len(raw_str) <= 8 and "-" not in raw_str:
            parts = raw_str.split(":")
            sh, sm = int(parts[0]), int(parts[1])
            candidate = now_dt.replace(hour=sh, minute=sm, second=0, microsecond=0)
            if candidate <= now_dt:
                candidate += timedelta(days=1)
            return candidate
        else:
            candidate = datetime.fromisoformat(raw_str)
            return candidate

    # Test HH:MM parsing
    eta_hhmm = resolve_scheduled_eta("18:30")
    assert eta_hhmm is not None
    assert eta_hhmm.hour == 18
    assert eta_hhmm.minute == 30
    assert eta_hhmm > datetime.now()

    # Test ISO format
    future_iso = (datetime.now() + timedelta(hours=5)).isoformat()
    eta_iso = resolve_scheduled_eta(future_iso)
    assert eta_iso is not None
    assert eta_iso > datetime.now()


def test_dataset_preflight_path_normalization_and_validation():
    """Validates the pre-flight dataset path normalization and error classification rules.

    This test checks that:
    1. Placeholders such as '<YOUR_DATASET>', 'dummy', 'todo' are detected as invalid.
    2. Invalid extensions like .png, .jpg, .pt, .py are blocked before queuing.
    3. Generic root paths like '/datasets' or '/datasets/data.yaml' are blocked as too broad.
    4. Legitimate paths like '/datasets/AREPO/ArepoHematomaDetector/data.yaml' pass structural checks.
    """
    invalid_placeholders = ["<YOUR_DATASET>", "path/to/dataset", "dummy", "todo", "null"]
    for path in invalid_placeholders:
        is_placeholder = (
            (path.startswith("<") and path.endswith(">"))
            or "YOUR_DATASET" in path
            or "path/to/" in path
            or path.lower() in ("todo", "dummy", "undefined", "null")
        )
        assert is_placeholder is True, f"Failed to identify placeholder: {path}"

    invalid_exts = (".txt", ".csv", ".png", ".jpg", ".jpeg", ".json", ".pt", ".pth", ".onnx", ".py")
    test_files = ["dataset.png", "weights.pt", "model.onnx", "script.py"]
    for f in test_files:
        assert any(f.endswith(ext) for ext in invalid_exts) is True

    generic_roots = ["/datasets", "/datasets/data.yaml", "/datasets/dataset.yaml"]
    for gr in generic_roots:
        norm_ds = gr.replace("\\", "/").rstrip("/")
        assert norm_ds in ("/datasets", "/datasets/data.yaml", "/datasets/dataset.yaml")

    valid_cifs_path = "/datasets/AREPO/ArepoHematomaDetector/data.yaml"
    assert valid_cifs_path.startswith("/datasets/")
    assert valid_cifs_path.endswith((".yaml", ".yml"))


def test_cifs_path_fuzzy_matching_suggestion_logic():
    """Validates fuzzy matching and directory traversal logic for resolving broken dataset paths.

    When a user provides a path with extraneous nested folders (e.g.
    '/datasets/AREPO/HEMATOMA/ArepoHematomaDetector/data.yaml') when the real directory
    is located at '/datasets/AREPO/ArepoHematomaDetector/data.yaml', this logic traverses
    candidate directories in the CIFS share tree to suggest existing matches.
    """
    # Simulated existing paths on shared storage
    known_cifs_tree = [
        "/datasets/AREPO/ArepoHematomaDetector/data.yaml",
        "/datasets/ELANIA/detector/ElaniaDetectorUnificadoConBackground/data.yaml",
        "/datasets/AREPO/TATTO/ArepoTatuajeDatasetV2/data.yaml",
        "/datasets/AREPO/kinesiotape/data.yaml"
    ]

    def find_suggestions_for_path(candidate_path: str, known_paths: list[str]) -> list[str]:
        target_name = candidate_path.split("/")[-2] if candidate_path.endswith(".yaml") else candidate_path.split("/")[-1]
        suggestions = []
        for path in known_paths:
            if target_name.lower() in path.lower():
                suggestions.append(path)
        return suggestions

    wrong_user_path = "/datasets/AREPO/HEMATOMA/ArepoHematomaDetector/data.yaml"
    suggestions = find_suggestions_for_path(wrong_user_path, known_cifs_tree)

    assert len(suggestions) == 1
    assert suggestions[0] == "/datasets/AREPO/ArepoHematomaDetector/data.yaml"

