# NeuralForgeAI - Frontend & API Gateway

This repository contains the web user interface dashboard (WDarwin Ops) and the centralized API Gateway for the NeuralForgeAI YOLO training cluster ecosystem.

---

## 📂 Repository Structure
*   `UI/`: React frontend application built with Vite, TypeScript, and Tailwind CSS.
*   `api/`: REST API Gateway built with FastAPI and Celery.

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

### Version 2.0.0 (Current Release) - 2026-07-03
*   **Advanced E2E Smoke Test Integration:** Added E2E training validation button (Flame icon) in React UI header to concurrently submit classification, detection, and segmentation trials.
*   **Optuna cancellation support:** Added `POST /study/{study_id}/cancel` API endpoint to gracefully interrupt active training sweeps.
*   **Cleaned layout build:** Upgraded Vite UI container dependencies to run builds smoothly under Node 18 environments.

### Version 1.0.0 (Initial Release) - 2026-02-10
*   FastAPI backend endpoints managing study uploads.
*   React dashboard UI mapping live node telemetry and basic activity checks.
