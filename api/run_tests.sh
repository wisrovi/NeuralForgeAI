#!/bin/bash
# Runs API unit tests inside an isolated Docker container
echo "Running API tests in Docker container..."
docker run --rm -v $(pwd):/app -w /app python:3.10-slim bash -c "pip install -q -r requirements.txt pytest httpx pyyaml redis && pytest tests/test_api_minimal_yaml.py"
