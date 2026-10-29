# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
