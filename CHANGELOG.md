# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.5.0] - 2026-11-09
### Added
- **Live Training Telemetry & Loss Curves (`LiveTrainingTelemetry.tsx`):** Real-time epoch tracking with native SVG loss sparklines (`box_loss`, `cls_loss`) and convergence accuracy metrics (`mAP50`), plus active worker GPU temperature and dynamic ETA predictor.
- **Visual Explainability (XAI) Suite (`VisualXaiStudio.tsx`):** Interactive Before/After split slider comparing original input images against `ImageECamYOLO` Grad-CAM heatmaps with natural language focal diagnostics and outlier failure analysis.
- **One-Click Model Export & Deployment Studio (`ModelExportDeploymentStudio.tsx`):** Production export studio supporting ONNX, TensorRT, OpenVINO, CoreML, and TorchScript formats, along with edge latency benchmarks (Jetson, RTX, Intel CPU) and 1-click technical deployment specifications.
- **Pre-Flight Dataset Health Inspector (`DatasetPreflightHealth.tsx`):** Automated pre-submission verification of dataset descriptor files, folder existence, class sample count, and CIFS mount paths.
- **GPU VRAM Optimizer (`WorkerFleetSelector.tsx`):** Interactive action on GPU worker cards to trigger PyTorch cache flushing and VRAM optimization.

## [1.4.5] - 2026-11-09
### Fixed
- **API Error Sanitization on Success:** In `study_router.py`, unconditionally suppress `error_data` from API responses whenever the study has completed (`res.state == "SUCCESS"`, `state == "COMPLETED"`, or `results_data` present), ensuring retry logs do not pollute study status.

## [1.4.4] - 2026-11-09
### Fixed
- **Transient Retry Error Filtering:** In `redis_service.py`, discarded historical retry error keys when a study reaches `COMPLETED` state with valid `results_data`, preventing obsolete initialization errors from obscuring successful training outcomes in the UI.

## [1.4.3] - 2026-11-06
### Added
- **WPipe Architectural Compliance:** Refactored `api` to 100% compliance with WPipe architecture and QA validation rules.
- **Dedicated DAG Pipeline:** Created `neuralforge_api_training_pipeline` in `pipelines.py` with `ValidateConfigStep` and `DispatchStudyStep`.
- **Modular Layout:** Decomposed `main.py` into dedicated SRP modules under `utils/` (`preflight.py`, `time_parser.py`, `redis_service.py`, `celery_service.py`) and `routers/` (`study_router.py`, `admin_router.py`), strictly adhering to the 200-line SRP ceiling.
- **Typed DTOs:** Created Pydantic DTO models in `dto/api_dto.py` for structured request/response payload handling.
- **Dependency Pinning:** Strictly pinned all package versions in `requirements.txt` (Rule 15).

## [1.4.2] - 2026-11-03
### Added
- **Server-Side Fail-Fast Pre-Flight Validation:** Added `validate_training_config_preflight` in `api/main.py` (`POST /train`) to reject invalid configurations on the fly before enqueuing to Celery or creating Optuna studies. Rejects missing dataset paths, unconfigured placeholders (`<path_to_dataset>`), invalid descriptor file extensions, and generic root `/datasets` references with HTTP 400.
- **Docker Unit Tests:** Extended `tests/test_api_minimal_yaml.py` with 4 new tests validating fail-fast server rejection, passing in isolated Docker container.

## [1.4.1] - 2026-11-03
### Fixed
- Fixed uncaught ReferenceError `startPolling is not defined` in `LaunchTrainingView.tsx` by implementing the `startPolling` polling mechanism to stream study status and terminal execution states directly in the UI.

## [1.4.0] - 2026-11-03
### Added
- Added full support for simplified minimal YAML configurations, relaxed frontend client validation in WDarwin Ops UI (`LaunchTrainingView.tsx`), and updated API gateway to gracefully handle omitted sweeper and model blocks.

## [1.3.0] - 2026-10-29
### Added
- Added visual **Scheduled Start Time** control in `LaunchTrainingView.tsx` allowing developers to delay training execution until a designated wall-clock time (e.g. `18:30` or ISO timestamp) to run overnight without interfering with active work hours.

## [1.2.1] - 2026-10-28
### Fixed
- Fixed private mode queue targeting by directly setting and overriding `sweeper.debug` and root `debug` with the selected worker name so the Manager accurately routes trials to the intended private worker queue instead of falling back to public queues.

## [1.2.0] - 2026-10-26
### Added
- Standardized testing infrastructure (tests folder, run_tests.sh, coverage.sh via Docker).
- Dynamic study config Redis TTL scaling based on optional `train.time`.
