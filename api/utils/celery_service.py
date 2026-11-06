"""Celery task dispatcher and cluster control utilities."""

from typing import Any, Optional
from celery import Celery
from celery.result import AsyncResult


class CeleryService:
    """Service wrapping Celery task orchestration and control inspection."""

    def __init__(self, app: Celery) -> None:
        """Initializes CeleryService with Celery instance.

        Args:
            app: Celery application instance.
        """
        self.app = app

    def dispatch_manage_study(self, config_data: dict[str, Any], eta: Optional[Any] = None) -> AsyncResult:
        """Enqueues manage_study task on managers queue.

        Args:
            config_data: Study configuration payload.
            eta: Optional execution ETA datetime.

        Returns:
            AsyncResult: Celery async job handle.
        """
        send_kwargs: dict[str, Any] = {"args": [config_data], "queue": "managers"}
        if eta:
            send_kwargs["eta"] = eta

        return self.app.send_task("tasks.manage_study", **send_kwargs)

    def revoke_task(self, task_id: str) -> None:
        """Revokes and terminates a Celery task immediately.

        Args:
            task_id: Task UUID string to revoke.
        """
        self.app.control.revoke(task_id, terminate=True, signal="SIGKILL")

    def inspect_active_queues(self) -> dict[str, list[str]]:
        """Queries active workers and their configured queues.

        Returns:
            dict[str, list[str]]: Worker names mapped to queue names.
        """
        workers_info: dict[str, list[str]] = {}
        inspector = self.app.control.inspect(timeout=1.5)
        active_queues = inspector.active_queues()
        if active_queues:
            for worker_name, queues in active_queues.items():
                workers_info[worker_name] = [q.get("name", "") for q in queues]
        return workers_info

    def inspect_running_tasks(self) -> list[dict[str, Any]]:
        """Queries all running tasks across active workers.

        Returns:
            list[dict[str, Any]]: List of running task summaries.
        """
        running: list[dict[str, Any]] = []
        inspector = self.app.control.inspect(timeout=1.0)
        active = inspector.active()
        if active:
            for worker, tasks in active.items():
                for t in tasks:
                    running.append(
                        {
                            "worker": worker,
                            "id": t.get("id"),
                            "name": t.get("name"),
                            "args": str(t.get("args"))[:100],
                        }
                    )
        return running

    def broadcast_docker_pull(self, image_name: str) -> tuple[int, int, dict[str, Any]]:
        """Broadcasts force_docker_pull command to all worker nodes.

        Args:
            image_name: Docker image name with tag to pull.

        Returns:
            tuple[int, int, dict[str, Any]]: Success count, fail count, node responses.
        """
        responses = self.app.control.broadcast(
            "force_docker_pull",
            arguments={"image_name": image_name},
            reply=True,
            timeout=8.0,
        )
        if not responses:
            return 0, 0, {}

        formatted_responses: dict[str, Any] = {}
        success_count = 0
        failed_count = 0

        for response in responses:
            for node, details in response.items():
                if isinstance(details, dict):
                    status = details.get("status", "unknown")
                    if status == "success":
                        success_count += 1
                    else:
                        failed_count += 1
                    formatted_responses[node] = details
                else:
                    failed_count += 1
                    formatted_responses[node] = {"status": "error", "error": str(details)}

        return success_count, failed_count, formatted_responses
