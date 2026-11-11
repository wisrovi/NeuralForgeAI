<p align="center">
  <a href="https://linkedin.com/in/wisrovi-rodriguez"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" /></a>
  <a href="https://wisrovi.dev"><img src="https://img.shields.io/badge/Author-wisrovi.dev-111827?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Portal" /></a>
  <a href="https://orcid.org/0009-0005-0710-1861"><img src="https://img.shields.io/badge/ORCID-0009--0005--0710--1861-A6CE39?style=for-the-badge&logo=orcid&logoColor=white" alt="ORCID" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License" /></a>
</p>

# NeuralForgeAI - Frontend & API Gateway

This repository contains the web user interface dashboard (WDarwin Ops) and the centralized API Gateway for the NeuralForgeAI YOLO training cluster ecosystem.

---

## 📂 Repository Structure
*   `UI/`: React frontend application built with Vite, TypeScript, and Tailwind CSS.
*   `api/`: REST API Gateway built with FastAPI and Celery.

---

## 🛠️ Technology Stack & Key Libraries
*   **Frontend UI:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons.
*   **API Gateway:** Python 3.10+, FastAPI, Uvicorn, PyYAML, Pydantic, wpipe (DAG orchestration & state steps).
*   **Distributed Messaging & State:** Celery, Redis (study metadata persistence with dynamic `2.0x` TTL scaling based on optional `train.time`).
*   **Testing & Quality Assurance:** Pytest, `pytest-cov`, Docker isolated test runner.

---

## 🧪 Running Unit Tests & Coverage (Docker)
```bash
# Run unit tests inside an isolated Docker container
bash run_tests.sh

# Run code coverage report inside Docker
bash coverage.sh
```

---

## 🚀 Getting Started

### 1. Frontend Dashboard (UI)
```bash
cd UI
npm install
npm run dev
```

### 2. API Gateway
```bash
cd api
# Make sure control_host.env is configured
docker compose up -d
```

### 3. Docker Network Configuration
Both microservices connect via the shared external Docker network `control_network`. Ensure this network exists before starting containers:
```bash
docker network create control_network
```

### 4. Environment Variables
*   The API Gateway reads `api/control_host.env` for cluster endpoints configuration.
*   The UI dashboard reads `UI/.env` for Vite endpoints mapping (API, Redis, MLflow, FileBrowser).

---

## 📜 Changelog & Version History

### Version 2.2.2 (Current Release) - 2026-11-11
*   **Kubernetes Production Control Stack Deployment:** Introduced complete Kubernetes manifests in `deploy/k8s/` orchestrating the FastAPI REST gateway (`neuralforge-api`), Optuna study manager (`neuralforge-manager`), and W-Darwin Ops React UI (`neuralforge-ui`) within the `train-service` namespace, decoupling compute from NAS storage.
*   **Universal MLflow Proxying:** Replaced local-only host checks in `LiveTrainingTelemetry`, `VisualXaiStudio`, and `StudyResultsViewer` with universal browser proxy routing via `/mlflow-proxy`, completely eliminating cross-origin CORS errors across all client networks.
*   **High Availability Manager Worker:** Deployed Celery manager worker directly inside Kubernetes, synchronized across all 11 worker invokers.

### Version 2.2.1 - 2026-11-11
*   **Universal Control Proxy Routing:** Switched all UI browser client communication (workers inspection, study details tracking, and training submissions) to route via Vite's `/control-proxy` endpoint, completely resolving browser CORS blocks when accessed across heterogeneous cluster subnets.
*   **Target Control Server Synchronization:** Configured reverse proxy destination to target `http://192.168.1.68:23442` and upgraded local gateway deployment to `wisrovi/train_service:api_server_v1.2.2` with `redis>=6.1.0,<7` and `wpipe==2.4.0`.

### Version 2.2.0 - 2026-11-10
*   **Celery Redis-py Dependency Upgrade:** Upgraded `redis` to `>=6.1.0,<7` across backend APIs and Gradio launcher services to resolve the Kombu runtime exception `ImproperlyConfigured: Redis transport requires redis-py versions 6.1.0 or later`, restoring worker discovery and study queuing.
*   **Resilient Worker Inspection:** Wrapped worker queue inspection and running task queries in defensive error handlers to safeguard the API gateway from unexpected broker timeouts.
*   **Authentic Telemetry & Results Isolation:** Fixed premature display of completed metrics and XAI heatmaps while training studies are in `STARTED` or `PENDING` states.
*   **Dataset Separation in VisualXaiStudio:** Eliminated cross-dataset mock sample fallbacks, guaranteeing that only authentic heatmaps and artifacts from the current study's dataset (e.g. Prótesis Superior vs Césped vs Tattoo) are presented.
*   **Zero-Mock Live Telemetry:** Replaced hardcoded fallback loss and recall values (e.g. 2.379, 84.4%) with live synchronization status indicators until MLflow records the first training epochs.

### Version 2.1.0 - 2026-07-31
*   **Cluster Broadcast Docker Pull Interface:** Added a new Cluster Admin tab (accessible for administrators only) in the UI settings panel and registered the `/admin/broadcast-pull` API endpoint in the FastAPI gateway, allowing immediate, massive docker image updates to all remote invokers in the cluster.

### Version 2.0.0 - 2026-07-03
*   **Advanced E2E Smoke Test Integration:** Added E2E training validation button (Flame icon) in React UI header to concurrently submit classification, detection, and segmentation trials.
*   **Optuna cancellation support:** Added `POST /study/{study_id}/cancel` API endpoint to gracefully interrupt active training sweeps.
*   **Cleaned layout build:** Upgraded Vite UI container dependencies to run builds smoothly under Node 18 environments.

### Version 1.0.0 (Initial Release) - 2026-02-10
*   FastAPI backend endpoints managing study uploads.
*   React dashboard UI mapping live node telemetry and basic activity checks.

## Licensing and Usage

This project uses a **PolyForm Noncommercial License** model:
- **Community/Research**: Licensed under the PolyForm Noncommercial. See [LICENSE](LICENSE).
- **Commercial**: Requires a commercial license. See [COMMERCIAL.md](COMMERCIAL.md) for details.

### Academic Research
If you use this project in academic research, you are required to cite this repository using the provided `CITATION.cff` and notify the author with a link to your publication.


## Changelog
- **v1.5.0**:
  - **Live Training Telemetry & Loss Curves:** Added `LiveTrainingTelemetry` component for real-time epoch tracking and zero-dependency SVG sparkline charts of box and classification loss convergence.
  - **Visual Explainability (XAI) Suite:** Integrated `VisualXaiStudio` featuring an interactive Before/After split slider for Grad-CAM heatmaps with natural language focal diagnostics.
  - **Production Model Export Studio:** Integrated `ModelExportDeploymentStudio` supporting 1-click ONNX, TensorRT, OpenVINO, and CoreML packaging alongside edge device latency benchmarks.
  - **Pre-Flight Dataset Health Inspector:** Integrated `DatasetPreflightHealth` to prevent GPU resource allocation on misconfigured or empty CIFS dataset folders.
  - **Worker VRAM Optimization:** Added GPU memory cache flush controls in `WorkerFleetSelector`.
- **v1.4.5**: Suppressed lingering retry errors unconditionally in `study_router.py` whenever studies complete successfully with valid results or SUCCESS status.
- **v1.4.4**: 
  - **Dual-Audience W-Darwin Ops UI:** Integrated intuitive dual-mode interfaces accommodating both non-expert end users and expert AI researchers:
    - `WorkerFleetSelector`: Visual GPU worker cards with friendly station names ("Estación Titán", "Nodo CIMA 65") and technical hardware specifications.
    - `PipelineProgressViewer`: 5-phase visual WPipe DAG progress lifecycle with plain language explanations.
    - `StudyResultsViewer`: Executive scorecards (0-100%) with automated natural language diagnostics and one-click markdown report download, alongside deep technical metric tabs.
    - `SmartConfigBuilder`: 3-step Guided Wizard for training presets plus raw YAML drag-and-drop studio.
  - **Transient Retry Error Filtering:** Cleaned obsolete retry errors in `redis_service.py` when studies complete successfully.
- **v1.4.1**: Fixed uncaught ReferenceError `startPolling` in `LaunchTrainingView.tsx` with dedicated status polling mechanism.
- **v1.4.0**: Added full support for simplified minimal YAML configurations, relaxed frontend client validation in WDarwin Ops UI (`LaunchTrainingView.tsx`), and updated API gateway to gracefully handle omitted sweeper and model blocks.
- **v1.3.0**: Added visual Scheduled Start Time (`start_at`) control in `LaunchTrainingView.tsx` allowing developers to delay execution until specific wall-clock hours without conflicting with daytime work.
- **v1.2.1**: Fixed private mode queue targeting by setting and overriding `sweeper.debug` and root `debug` with target worker name.
- Bumped version due to License update to PolyForm Noncommercial and Dual Licensing model.

---

## 👤 Autor & Afiliación Oficial

* **William Steve Rodriguez Villamizar (Wisrovi)**
* **Cargo:** Principal AI Engineer & Applied AI Solutions Architect | Scientific Researcher
* 📧 **Email:** [wisrovi.rodriguez@gmail.com](mailto:wisrovi.rodriguez@gmail.com)
* 🌐 **Portal Oficial:** [wisrovi.dev](https://wisrovi.dev)
* 💼 **LinkedIn:** [wisrovi-rodriguez](https://www.linkedin.com/in/wisrovi-rodriguez/)
* 🆔 **ORCID:** [0009-0005-0710-1861](https://orcid.org/0009-0005-0710-1861)
* 📦 **PyPI:** [pypi.org/user/wisrovi/](https://pypi.org/user/wisrovi/)
* 🐙 **GitHub:** [@wisrovi](https://github.com/wisrovi)
