"""FastAPI Application Gateway for NeuralForge AI Cluster.

This module provides FastAPI endpoints to launch and monitor ML training studies
using Optuna and Celery, structured following the WPipe architecture.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.admin_router import router as admin_router
from routers.study_router import router as study_router
from utils.preflight import validate_training_config_preflight

VERSION: str = "v1.4.5"

app: FastAPI = FastAPI(title="ML CLUSTER API v5 - Strict Priority & Private Mode")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register modular routers
app.include_router(study_router)
app.include_router(admin_router)

__all__ = ["app", "VERSION", "validate_training_config_preflight"]

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
