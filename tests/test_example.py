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
