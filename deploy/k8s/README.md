# NeuralForgeAI Control Stack - Kubernetes Deployment

This directory contains the production Kubernetes manifests to deploy the centralized control stack (API Gateway, Manager Orchestrator, and W-Darwin Ops React Frontend) within the `train-service` namespace.

---

## 🛠️ Key Technologies and Libraries

*   **Kubernetes Orchestration:** Deployments, NodePort Services, and Ingress routing under RKE2 (`v1.31.14+rke2r1`).
*   **FastAPI REST Gateway:** Python 3.10, FastAPI, Uvicorn, Celery, `wpipe` DAG orchestration, `redis>=6.1.0,<7`.
*   **Optuna Study Manager:** Celery distributed task worker (`-Q managers`), Optuna RDB storage with PostgreSQL backend, Redis broker.
*   **React Frontend Dashboard:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React, reverse proxying through `/control-proxy`.

---

## 📂 Manifests Architecture

| File | Resource | Description |
|---|---|---|
| `01-configmap.yaml` | `ConfigMap/neuralforge-control-config` | Shared cluster endpoints (Redis, Optuna, MLflow, MinIO, proxy target). |
| `02-api-deployment.yaml` | `Deployment/neuralforge-api` + `Service/neuralforge-api-svc` | FastAPI REST gateway exposed via internal port `8000` and NodePort `32442`. |
| `03-manager-deployment.yaml` | `Deployment/neuralforge-manager` | Celery Optuna orchestrator worker consuming the `managers` queue. |
| `04-ui-deployment.yaml` | `Deployment/neuralforge-ui` + `Service/neuralforge-ui-svc` | W-Darwin Ops React frontend exposed via port `4173` and NodePort `32432`. |

---

## 🚀 Deployment Instructions

```bash
# Apply all control stack manifests to the train-service namespace
kubectl apply -f 01-configmap.yaml
kubectl apply -f 02-api-deployment.yaml
kubectl apply -f 03-manager-deployment.yaml
kubectl apply -f 04-ui-deployment.yaml

# Verify pod readiness and status
kubectl -n train-service get pods -l 'app.kubernetes.io/part-of=train-service2'
```

---

## 🌐 Network Access

*   **Frontend Dashboard:** Available across any cluster node at port `32432` (e.g. `http://<NODE_IP>:32432/`).
*   **API Gateway:** Available across any cluster node at port `32442` (e.g. `http://<NODE_IP>:32442/docs`).
*   **Internal Service DNS:**
    *   API: `http://neuralforge-api-svc.train-service.svc.cluster.local:8000`
    *   UI: `http://neuralforge-ui-svc.train-service.svc.cluster.local:4173`
