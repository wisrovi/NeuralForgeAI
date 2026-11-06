"""Time parsing and training duration normalization utilities."""

from datetime import datetime, timedelta
from typing import Any, Optional


def parse_scheduled_eta(raw_start_at: Any) -> Optional[datetime]:
    """Parses optional scheduled execution time string into a future datetime.

    Args:
        raw_start_at: Time string or ISO datetime representation.

    Returns:
        Optional[datetime]: Target future UTC/local datetime or None if invalid.
    """
    if not raw_start_at or isinstance(raw_start_at, bool):
        return None

    try:
        raw_str = str(raw_start_at).strip()
        now_dt = datetime.now()
        if ":" in raw_str and len(raw_str) <= 8 and "-" not in raw_str:
            parts = raw_str.split(":")
            sh, sm = int(parts[0]), int(parts[1])
            candidate = now_dt.replace(hour=sh, minute=sm, second=0, microsecond=0)
            if candidate <= now_dt:
                candidate += timedelta(days=1)
            return candidate

        candidate = datetime.fromisoformat(raw_str)
        if candidate.tzinfo is not None:
            now_with_tz = datetime.now(candidate.tzinfo)
            if candidate > now_with_tz:
                return candidate
        elif candidate > now_dt:
            return candidate
    except Exception:
        return None

    return None


def normalize_train_time(train_block: Any) -> tuple[dict[str, Any], Optional[float]]:
    """Normalizes optional train.time in hours.

    Args:
        train_block: Dictionary or object under 'train' section of config.

    Returns:
        tuple[dict[str, Any], Optional[float]]: Updated train block and parsed hours.
    """
    if not isinstance(train_block, dict):
        return {}, None

    user_time_hours: Optional[float] = None
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

    return train_block, user_time_hours
