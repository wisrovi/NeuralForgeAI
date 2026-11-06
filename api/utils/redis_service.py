"""Redis service and cache helper module."""

import json
from typing import Any, Optional
import redis


class RedisService:
    """Helper service managing Redis connections and state persistence."""

    def __init__(self, broker_url: str) -> None:
        """Initializes RedisService with target broker URL.

        Args:
            broker_url: Connection URL string for Redis.
        """
        self.broker_url = broker_url

    def get_client(self) -> redis.Redis:
        """Creates or returns a Redis client instance.

        Returns:
            redis.Redis: Active Redis client.
        """
        return redis.from_url(self.broker_url)

    def persist_study_metadata(
        self, study_id: str, config_data: dict[str, Any], eta_datetime: Optional[Any], user_time_hours: Optional[float]
    ) -> None:
        """Persists initial study config and ETA in Redis.

        Args:
            study_id: UUID string of the study.
            config_data: Full dictionary of configuration.
            eta_datetime: Optional future target datetime.
            user_time_hours: Optional max training duration in hours.
        """
        try:
            ref_hours = user_time_hours if user_time_hours is not None else 12.0
            redis_ttl = max(86400, int(ref_hours * 3600 * 2))
            client = self.get_client()
            client.set(f"study:{study_id}:config", json.dumps(config_data), ex=redis_ttl)
            if eta_datetime:
                client.set(f"study:{study_id}:scheduled_eta", eta_datetime.isoformat(), ex=redis_ttl)
                client.set(f"study:{study_id}:status", "SCHEDULED", ex=redis_ttl)
        except Exception:
            pass

    def request_study_cancel(self, study_id: str) -> None:
        """Sets cancellation flag for a study.

        Args:
            study_id: Target study UUID string.
        """
        client = self.get_client()
        client.set(f"study:{study_id}:cancel", "1", ex=3600)

    def get_study_metadata(self, study_id: str) -> dict[str, Any]:
        """Gathers study information from Redis.

        Args:
            study_id: UUID of the target study.

        Returns:
            dict[str, Any]: Extracted metadata fields from Redis keys.
        """
        meta: dict[str, Any] = {}
        try:
            client = self.get_client()
            for key in client.scan_iter(match=f"wyolo:request:*:{study_id}:*"):
                raw = client.hget(key, "config")
                if raw:
                    meta["config"] = json.loads(raw)
            for key in client.scan_iter(match=f"wyolo:results:*:{study_id}:*"):
                raw = client.hget(key, "results")
                if raw:
                    meta["results_data"] = json.loads(raw)
                    meta["state"] = "COMPLETED"
                    meta["ready"] = True
            for key in client.scan_iter(match=f"wyolo:errors:*:{study_id}:*"):
                raw = client.hget(key, "error")
                if raw:
                    meta["error_data"] = json.loads(raw)

            config_raw = client.get(f"study:{study_id}:config")
            if config_raw:
                meta["config"] = json.loads(config_raw)

            progress_raw = client.get(f"study:{study_id}:progress")
            if progress_raw:
                progress = json.loads(progress_raw)
                meta["eta"] = progress.get("eta")
                meta["completed_trials"] = progress.get("completed_trials")
                meta["total_trials"] = progress.get("total_trials")

            active_trial_raw = client.get(f"study:{study_id}:active_trial")
            if active_trial_raw:
                active_trial = json.loads(active_trial_raw)
                meta["active_trial"] = active_trial
                meta["active_worker"] = active_trial.get("invoker")
            else:
                recorded_invoker = client.get(f"study:{study_id}:invoker")
                if recorded_invoker:
                    meta["active_worker"] = recorded_invoker.decode()

            all_invokers_set = client.smembers(f"study:{study_id}:all_invokers")
            if all_invokers_set:
                meta["all_invokers"] = [v.decode() for v in all_invokers_set]
        except Exception:
            pass

        return meta

    def get_json(self, key: str, default: Any = None) -> Any:
        """Retrieves and deserializes JSON from a Redis key.

        Args:
            key: Redis key.
            default: Default value if key is missing.

        Returns:
            Any: Parsed object or default.
        """
        client = self.get_client()
        data = client.get(key)
        if data:
            return json.loads(data)
        return default

    def set_json(self, key: str, value: Any) -> None:
        """Serializes and saves a value to Redis.

        Args:
            key: Redis key.
            value: Object to serialize.
        """
        client = self.get_client()
        client.set(key, json.dumps(value))
