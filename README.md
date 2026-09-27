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

### Version 2.1.0 (Current Release) - 2026-07-31
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
