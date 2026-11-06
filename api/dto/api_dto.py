"""Data Transfer Objects for NeuralForge API Gateway."""

from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field


class TrainResponseDTO(BaseModel):
    """Response DTO for training job submission.

    Attributes:
        status: Current scheduling status (Queued or Scheduled).
        study_id: UUID string of the dispatched study.
        mode: Execution mode (public or private).
        routing: Target routing descriptor.
        scheduled_eta: Optional ISO formatted execution time.
    """

    model_config = ConfigDict(arbitrary_types_allowed=True)

    status: str = Field(..., description="Current status of the study dispatch")
    study_id: str = Field(..., description="Dispatched study UUID")
    mode: str = Field(..., description="Dispatch mode")
    routing: str = Field(..., description="Routing identifier")
    scheduled_eta: Optional[str] = Field(None, description="ISO scheduled datetime")


class StudyStatusDTO(BaseModel):
    """Response DTO for study execution status.

    Attributes:
        study_id: Dispatched study UUID.
        state: Celery task state string.
        ready: Boolean flag indicating if task has finished.
        result: Optional result payload.
    """

    model_config = ConfigDict(arbitrary_types_allowed=True)

    study_id: str = Field(..., description="Study UUID")
    state: str = Field(..., description="Task state")
    ready: bool = Field(..., description="Execution completion flag")
    result: Optional[Any] = Field(None, description="Task return value or error")


class TasksReportDTO(BaseModel):
    """Response DTO for tasks overview.

    Attributes:
        queued: Dictionary mapping queue names to lengths.
        running: List of currently running task details.
        total_queued: Aggregate count of queued tasks.
        error: Optional error message if inspection failed.
    """

    model_config = ConfigDict(arbitrary_types_allowed=True)

    queued: dict[str, int] = Field(default_factory=dict, description="Queue lengths")
    running: list[dict[str, Any]] = Field(default_factory=list, description="Running tasks")
    total_queued: int = Field(0, description="Total number of queued tasks")
    error: Optional[str] = Field(None, description="Optional error description")


class AppConfigDTO(BaseModel):
    """Response DTO for application global configuration.

    Attributes:
        gemini_enabled: Flag indicating if Gemini features are active.
        favorites: List of bookmarked item identifiers.
        theme: UI color theme.
        user_role: Access role.
    """

    model_config = ConfigDict(arbitrary_types_allowed=True)

    gemini_enabled: bool = Field(False, description="Gemini integration flag")
    favorites: list[str] = Field(default_factory=list, description="Favorite items")
    theme: str = Field("dark", description="Visual theme")
    user_role: str = Field("guest", description="Assigned role")


class BroadcastPullResponseDTO(BaseModel):
    """Response DTO for Docker broadcast pull command.

    Attributes:
        success: Boolean flag indicating overall broadcast delivery.
        image: Target container image pulled.
        summary: Human-readable execution summary.
        responses: Node-by-node execution responses.
    """

    model_config = ConfigDict(arbitrary_types_allowed=True)

    success: bool = Field(..., description="Execution success flag")
    image: str = Field(..., description="Target Docker image")
    summary: str = Field(..., description="Summary string")
    responses: dict[str, Any] = Field(default_factory=dict, description="Node responses")
