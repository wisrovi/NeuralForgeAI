#!/bin/bash
# Calculates API unit test code coverage inside an isolated Docker container
echo "Calculating API test coverage in Docker container..."
docker run --rm -v $(pwd):/app -w /app python:3.10-slim bash -c "pip install -q -r requirements.txt pytest pytest-cov httpx pyyaml redis && pytest --cov=. --cov-report=term-missing tests/test_api_minimal_yaml.py"
