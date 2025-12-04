from typing import Dict, Any, List, Optional
import json
import random
import time
import asyncio
from datetime import datetime, timedelta

try:
    from fastapi import FastAPI, HTTPException, File, UploadFile
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
except ImportError:
    print("FastAPI not installed. Run: pip install -r requirements.txt")
    exit(1)

app = FastAPI(title="NeuroForge AI Backend", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5810"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request bodies
class MetricRequest(BaseModel):
    query: Optional[str] = None
    status: Optional[str] = None
    limit: Optional[int] = None
    instance: Optional[str] = None
    bucket: Optional[str] = None
    job_ids: Optional[str] = None

class TrainingJobRequest(BaseModel):
    user_id: str
    project_id: str
    config: Dict[str, Any]
    yaml_content: Optional[str] = None

class DataUploadRequest(BaseModel):
    filename: str
    size: int
    type: str
    user_id: Optional[str] = None

# Mock data storage
mock_jobs = [
    {"id": "job_001", "name": "yolov8_training_01", "status": "running", "progress": 67, "eta": "12m"},
    {"id": "job_002", "name": "yolov8_training_02", "status": "running", "progress": 45, "eta": "25m"},
    {"id": "job_003", "name": "yolov8_training_03", "status": "queued", "progress": 0, "eta": "45m"},
    {"id": "job_004", "name": "yolov8_training_04", "status": "completed", "progress": 100, "eta": "0m"},
    {"id": "job_005", "name": "yolov8_training_05", "status": "running", "progress": 89, "eta": "3m"},
]

# Dashboard metrics endpoints
@app.post("/posts")
async def generic_post_endpoint(request: Dict[str, Any]):
    """Generic POST endpoint that handles all frontend requests"""
    
    # Simulate processing time
    await asyncio.sleep(0.1)
    
    # Check if this is a metrics request based on query parameters
    if "metric" in request:
        metric_type = request.get("metric", "")
        
        if metric_type == "workers":
            # Random number of active workers
            random_int = random.randint(2, 10)
            return {
                "id": random.randint(1, 1000),
                "value": random.randint(8, 24),
                "timestamp": datetime.now().isoformat(),
                "metric": "active_workers",
                "active_nodes": random_int
            }
        
        elif metric_type == "gpu":
            # Random GPU utilization with some variation
            base_util = random.uniform(65.0, 95.0)
            gpu_count = random.randint(1, 4)
            return {
                "id": random.randint(1, 1000),
                "value": round(base_util, 1),
                "timestamp": datetime.now().isoformat(),
                "metric": "gpu_utilization",
                "gpu_count": gpu_count,
                "avg_util": round(base_util * 0.9, 1),
                "peak_util": round(min(100, base_util * 1.1), 1)
            }
        
        elif metric_type == "queue":
            # Random queue depth with priority jobs
            total_jobs = random.randint(3, 18)
            priority_jobs = random.randint(0, min(5, total_jobs))
            return {
                "id": random.randint(1, 1000),
                "value": total_jobs,
                "timestamp": datetime.now().isoformat(),
                "metric": "queue_depth",
                "priority_jobs": priority_jobs,
                "normal_jobs": total_jobs - priority_jobs
            }
        
        elif metric_type == "storage":
            # Random storage usage with breakdown
            total_storage = random.uniform(2.1, 8.7)
            used_storage = total_storage * random.uniform(0.6, 0.9)
            return {
                "id": random.randint(1, 1000),
                "value": round(total_storage, 1),
                "timestamp": datetime.now().isoformat(),
                "metric": "storage_used_tb",
                "used_tb": round(used_storage, 1),
                "free_tb": round(total_storage - used_storage, 1),
                "usage_percent": round((used_storage / total_storage) * 100, 1)
            }
        
        elif metric_type == "jobs_list":
            # Random number of jobs to show
            random_int = random.randint(2, 10)
            random_int = min(random_int, len(mock_jobs))
            
            # Add some random progress updates to jobs
            jobs_to_return = []
            for job in mock_jobs[:random_int]:
                job_copy = job.copy()
                if job["status"] == "running":
                    job_copy["progress"] = min(100, job["progress"] + random.randint(-5, 10))
                    job_copy["eta"] = f"{random.randint(1, 30)}m"
                elif job["status"] == "queued" and random.random() > 0.7:
                    # Occasionally promote queued jobs to running
                    job_copy["status"] = "running"
                    job_copy["progress"] = random.randint(1, 15)
                    job_copy["eta"] = f"{random.randint(20, 60)}m"
                jobs_to_return.append(job_copy)
            
            return {
                "id": random.randint(1, 1000),
                "jobs": jobs_to_return,
                "timestamp": datetime.now().isoformat(),
                "metric": "active_jobs",
                "total_jobs": len(mock_jobs),
                "showing_jobs": len(jobs_to_return)
            }
        
        elif metric_type == "redis_mem":
            # Random Redis memory usage with breakdown
            total_mem = random.uniform(1.2, 4.8)
            used_mem = total_mem * random.uniform(0.4, 0.8)
            return {
                "id": random.randint(1, 1000),
                "value": round(total_mem, 1),
                "timestamp": datetime.now().isoformat(),
                "metric": "redis_memory_gb",
                "used_gb": round(used_mem, 1),
                "free_gb": round(total_mem - used_mem, 1),
                "cache_hit_rate": round(random.uniform(85, 99), 1)
            }
        
        elif metric_type == "minio_bw":
            # Random MinIO bandwidth with direction
            upload_bw = random.uniform(20, 150)
            download_bw = random.uniform(30, 200)
            total_bw = upload_bw + download_bw
            return {
                "id": random.randint(1, 1000),
                "value": round(total_bw, 0),
                "timestamp": datetime.now().isoformat(),
                "metric": "minio_bandwidth_mbps",
                "upload_mbps": round(upload_bw, 0),
                "download_mbps": round(download_bw, 0),
                "connections": random.randint(5, 25)
            }
        
        elif metric_type == "eta":
            # Random ETA with job breakdown
            total_jobs = random.randint(1, 8)
            completed_jobs = random.randint(0, max(0, total_jobs - 2))
            remaining_jobs = total_jobs - completed_jobs
            avg_eta_per_job = random.randint(5, 25)
            total_eta = remaining_jobs * avg_eta_per_job
            
            return {
                "id": random.randint(1, 1000),
                "value": f"{total_eta}m",
                "timestamp": datetime.now().isoformat(),
                "metric": "estimated_completion",
                "total_jobs": total_jobs,
                "completed_jobs": completed_jobs,
                "remaining_jobs": remaining_jobs,
                "avg_eta_minutes": avg_eta_per_job
            }
    
    # Default response for generic POST requests
    return {
        "id": random.randint(1, 1000),
        "timestamp": datetime.now().isoformat(),
        "status": "success",
        "message": "Request processed successfully",
        "request_id": f"req_{random.randint(10000, 99999)}"
    }

@app.post("/upload")
async def upload_data(file: UploadFile = File(...), user_id: Optional[str] = None):
    """Handle data upload for training"""
    
    # Simulate file processing
    content = await file.read()
    file_size = len(content)
    
    # Mock response
    return {
        "id": random.randint(1, 1000),
        "filename": file.filename,
        "size": file_size,
        "type": file.content_type,
        "user_id": user_id,
        "upload_time": datetime.now().isoformat(),
        "status": "uploaded",
        "message": f"File {file.filename} uploaded successfully"
    }

@app.post("/launch-training")
async def launch_training(job_request: TrainingJobRequest):
    """Launch a new training job"""
    
    job_id = f"job_{random.randint(1000, 9999)}"
    
    # Create new job entry
    new_job = {
        "id": job_id,
        "name": f"yolov8_training_{job_id}",
        "status": "queued",
        "progress": 0,
        "eta": "Processing...",
        "user_id": job_request.user_id,
        "project_id": job_request.project_id,
        "config": job_request.config,
        "created_at": datetime.now().isoformat()
    }
    
    # Add to mock jobs
    mock_jobs.insert(0, new_job)
    
    return {
        "id": random.randint(1, 1000),
        "job_id": job_id,
        "status": "queued",
        "message": f"Training job {job_id} launched successfully",
        "timestamp": datetime.now().isoformat(),
        "job": new_job
    }

@app.get("/jobs")
async def get_jobs():
    """Get all training jobs"""
    return {
        "jobs": mock_jobs,
        "total": len(mock_jobs),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/jobs/{job_id}")
async def get_job(job_id: str):
    """Get specific job details"""
    job = next((job for job in mock_jobs if job["id"] == job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

# Service UI endpoints
@app.get("/mlflow")
async def get_mlflow():
    """MLflow Tracking UI redirect"""
    return {
        "message": "MLflow Tracking Service",
        "service": "MLflow",
        "description": "Experiment logging, metrics, and artifact storage",
        "status": "active",
        "experiments_count": random.randint(15, 45),
        "active_runs": random.randint(3, 12),
        "total_artifacts": random.randint(250, 1200),
        "ui_url": "http://mlflow:5000",
        "api_url": "http://mlflow:5000/api/2.0/mlflow"
    }

@app.get("/redis")
async def get_redis():
    """Redis Queue Monitor"""
    return {
        "message": "Redis Queue Management",
        "service": "Redis",
        "description": "Job orchestration and task scheduling status",
        "status": "active",
        "connected_clients": random.randint(5, 25),
        "memory_usage": f"{random.uniform(1.2, 4.8):.1f} GB",
        "queue_depth": random.randint(3, 18),
        "processing_rate": f"{random.uniform(10, 50):.1f} jobs/sec",
        "ui_url": "http://redis-commander:8081",
        "monitoring_url": "http://redis-insight:8001"
    }

@app.get("/filebrowser")
async def get_filebrowser():
    """File Browser for Datasets"""
    return {
        "message": "Dataset File Browser",
        "service": "MinIO File Browser",
        "description": "File Browser for Training Data management",
        "status": "active",
        "total_datasets": random.randint(8, 25),
        "total_size_gb": random.randint(150, 800),
        "recent_uploads": random.randint(1, 8),
        "active_downloads": random.randint(0, 5),
        "ui_url": "http://minio-console:9001",
        "api_url": "http://minio:9000"
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "NeuroForge AI Backend API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": [
            "/posts - Generic POST endpoint for metrics",
            "/upload - File upload endpoint",
            "/launch-training - Launch training jobs",
            "/jobs - Get all jobs",
            "/jobs/{job_id} - Get specific job",
            "/health - Health check",
            "/mlflow - MLflow Tracking UI",
            "/redis - Redis Queue Monitor",
            "/filebrowser - File Browser for Datasets"
        ]
    }

# Service UI endpoints
@app.get("/mlflow")
async def mlflow_ui():
    """MLflow Tracking UI redirect"""
    return {
        "message": "MLflow Tracking Service",
        "service": "MLflow",
        "description": "Experiment logging, metrics, and artifact storage",
        "status": "active",
        "experiments_count": random.randint(15, 45),
        "active_runs": random.randint(3, 12),
        "total_artifacts": random.randint(250, 1200),
        "ui_url": "http://mlflow:5000",
        "api_url": "http://mlflow:5000/api/2.0/mlflow"
    }

@app.get("/redis")
async def redis_ui():
    """Redis Queue Monitor"""
    return {
        "message": "Redis Queue Management",
        "service": "Redis",
        "description": "Job orchestration and task scheduling status",
        "status": "active",
        "connected_clients": random.randint(5, 25),
        "memory_usage": f"{random.uniform(1.2, 4.8):.1f} GB",
        "queue_depth": random.randint(3, 18),
        "processing_rate": f"{random.uniform(10, 50):.1f} jobs/sec",
        "ui_url": "http://redis-commander:8081",
        "monitoring_url": "http://redis-insight:8001"
    }

@app.get("/filebrowser")
async def filebrowser_ui():
    """File Browser for Datasets"""
    return {
        "message": "Dataset File Browser",
        "service": "MinIO File Browser",
        "description": "File Browser for Training Data management",
        "status": "active",
        "total_datasets": random.randint(8, 25),
        "total_size_gb": random.randint(150, 800),
        "recent_uploads": random.randint(1, 8),
        "active_downloads": random.randint(0, 5),
        "ui_url": "http://minio-console:9001",
        "api_url": "http://minio:9000"
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "NeuroForge AI Backend API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": [
            "/posts - Generic POST endpoint for metrics",
            "/upload - File upload endpoint",
            "/launch-training - Launch training jobs",
            "/jobs - Get all jobs",
            "/jobs/{job_id} - Get specific job",
            "/health - Health check",
            "/mlflow - MLflow Tracking UI",
            "/redis - Redis Queue Monitor",
            "/filebrowser - File Browser for Datasets"
        ]
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "NeuroForge AI Backend API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": [
            "/posts - Generic POST endpoint for metrics",
            "/upload - File upload endpoint",
            "/launch-training - Launch training jobs",
            "/jobs - Get all jobs",
            "/jobs/{job_id} - Get specific job",
            "/health - Health check",
            "/mlflow - MLflow Tracking UI",
            "/redis - Redis Queue Monitor",
            "/filebrowser - File Browser for Datasets"
        ]
    }

# Service UI endpoints
@app.get("/mlflow")
async def mlflow_ui():
    """MLflow Tracking UI redirect"""
    return {
        "message": "MLflow Tracking Service",
        "service": "MLflow",
        "description": "Experiment logging, metrics, and artifact storage",
        "status": "active",
        "experiments_count": random.randint(15, 45),
        "active_runs": random.randint(3, 12),
        "total_artifacts": random.randint(250, 1200),
        "ui_url": "http://mlflow:5000",
        "api_url": "http://mlflow:5000/api/2.0/mlflow"
    }

@app.get("/redis")
async def redis_ui():
    """Redis Queue Monitor"""
    return {
        "message": "Redis Queue Management",
        "service": "Redis",
        "description": "Job orchestration and task scheduling status",
        "status": "active",
        "connected_clients": random.randint(5, 25),
        "memory_usage": f"{random.uniform(1.2, 4.8):.1f} GB",
        "queue_depth": random.randint(3, 18),
        "processing_rate": f"{random.uniform(10, 50):.1f} jobs/sec",
        "ui_url": "http://redis-commander:8081",
        "monitoring_url": "http://redis-insight:8001"
    }

@app.get("/filebrowser")
async def filebrowser_ui():
    """File Browser for Datasets"""
    return {
        "message": "Dataset File Browser",
        "service": "MinIO File Browser",
        "description": "File Browser for Training Data management",
        "status": "active",
        "total_datasets": random.randint(8, 25),
        "total_size_gb": random.randint(150, 800),
        "recent_uploads": random.randint(1, 8),
        "active_downloads": random.randint(0, 5),
        "ui_url": "http://minio-console:9001",
        "api_url": "http://minio:9000"
    }

if __name__ == "__main__":
    import uvicorn
    print("Starting FastAPI server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)