# API - ML Training Gateway

This API serves as the entry point for the training cluster. it allows users to submit complex training configurations via YAML files and monitor the status of their optimization studies.

## Endpoints

### 1. `POST /train`
Launches a new hyperparameter optimization study.

*   **Type**: Multipart Form Data
*   **Parameters**:
    *   `config_file`: A `.yaml` file containing the search space and training definition (e.g., `config_train.yaml`).
    *   `mode`: `"public"` (default) or `"private"`.
    *   `worker_name`: Required if mode is `"private"`. Name of the target worker's specific queue (e.g., `worker_1`).
    *   `priority`: `"high"`, `"medium"`, `"low"`. Only applies in public mode.

### 2. `GET /status/{study_id}`
Queries the current status of a study. Returns the Celery state (`PENDING`, `STARTED`, `SUCCESS`, etc.) and the result if completed.

### 3. `GET /workers`
Lists active workers that have a private queue (prefix `worker_`). Useful for identifying target workers for private mode dispatch.

## Usage Example (Python)

```python
import requests

files = {'config_file': open('config_train.yaml', 'rb')}
data = {
    'mode': 'public',
    'priority': 'high'
}

response = requests.post("http://localhost:8000/train", files=files, data=data)
print(response.json())
```

## Key Technologies and Libraries
- **Language & Runtime:** Python 3.10
- **Workflow & Orchestration Engine:** wpipe (DAG execution & state pipeline)
- **Web Framework:** FastAPI, Starlette, Uvicorn
- **Distributed Queues:** Celery (Redis broker)
- **Data Validation & Serializers:** PyYAML, Pydantic, psutil
- **Testing & Quality:** Pytest, Pytest-cov, HTTPX

## WPipe Architecture
The API service is organized according to the WPipe modular architecture:
- `dto/`: Pydantic Data Transfer Objects (`TrainResponseDTO`, `StudyStatusDTO`, `TasksReportDTO`, etc.).
- `states/`: Discrete WPipe pipeline steps (`ValidateConfigStep`, `DispatchStudyStep`).
- `pipelines.py`: Orchestrates DAG execution (`neuralforge_api_training_pipeline`).
- `utils/`: Single-responsibility modules under 200 lines for preflight validation, celery dispatching, and Redis telemetry.
- `routers/`: Modular FastAPI route handlers.

## Running Tests
To run unit tests inside an isolated Docker container:
```bash
./run_tests.sh
```

To calculate code coverage using `pytest-cov` inside Docker:
```bash
./coverage.sh
```

## Changelog
- **v1.4.2**: Added server-side Fail-Fast Pre-Flight validation in `POST /train` to reject invalid datasets, placeholders, and bad extensions before enqueuing to Celery.
- **v1.4.1**: Implemented `startPolling` status streaming for UI client.
- **v1.2.2**: Added support for simplified, minimal YAML training configurations with automatic sweeper block initialization and vision task style routing.
- **v1.2.1**: Enhanced private mode routing and Celery manager task dispatch.

## Internal Architecture
The API performs minimal YAML validation and injects routing metadata into a Celery task sent to the `managers` queue. It does not process training directly, ensuring fast response times.
