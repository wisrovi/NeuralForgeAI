"""Dataset validation and discovery router for NeuralForge API."""

from typing import Any, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from utils.cifs_validator import validate_dataset_cifs

router = APIRouter(prefix="/api/v1/datasets", tags=["datasets"])


class DatasetValidationRequest(BaseModel):
    """Payload schema for dataset validation."""

    path: str = Field(..., description="Target dataset path in POSIX format (e.g. /datasets/PROJECT/data.yaml)")


class DatasetValidationResponse(BaseModel):
    """Response schema containing physical dataset validation results."""

    valid: bool
    path: str
    size_bytes: Optional[int] = None
    error: Optional[str] = None
    suggestions: List[str] = []


@router.get("/validate", response_model=DatasetValidationResponse)
def validate_dataset_get(
    path: str = Query(..., description="POSIX dataset path to validate (e.g. /datasets/AREPO/data.yaml)")
) -> DatasetValidationResponse:
    """Validate that a dataset path physically exists on the shared cluster storage.

    Args:
        path: Path to descriptor.

    Returns:
        DatasetValidationResponse: Validation outcome and potential suggestions.
    """
    if not path or not path.strip():
        raise HTTPException(status_code=400, detail="Path parameter is required.")

    result = validate_dataset_cifs(path.strip())
    return DatasetValidationResponse(**result)


@router.post("/validate", response_model=DatasetValidationResponse)
def validate_dataset_post(payload: DatasetValidationRequest) -> DatasetValidationResponse:
    """Validate dataset path via JSON POST request.

    Args:
        payload: DatasetValidationRequest instance.

    Returns:
        DatasetValidationResponse: Validation outcome and suggestions.
    """
    result = validate_dataset_cifs(payload.path.strip())
    return DatasetValidationResponse(**result)
