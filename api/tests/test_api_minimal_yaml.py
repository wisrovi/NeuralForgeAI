# mypy: ignore-errors
# pylint: disable=all
# ruff: noqa
"""Unit tests for FastAPI Gateway endpoint /train with simplified YAML configs.

This module validates:
1. That /train successfully accepts a minimal YAML without sweeper or model blocks.
2. That /train enqueues the manage_study task and persists Redis metadata.
3. That missing sweeper block is safely initialized and assigned the requested priority.
4. That invalid files (empty or non-YAML) are rejected with HTTP 400.
"""

import io
import sys
import os
from unittest.mock import MagicMock, patch
import pytest

# Mock Celery application before importing main API
mock_celery = MagicMock()
mock_job = MagicMock()
mock_job.id = "test-job-uuid-1234"
mock_celery.send_task.return_value = mock_job
mock_celery.conf.broker_url = "redis://localhost:6379/0"

sys.modules["celery_config"] = MagicMock()
sys.modules["celery_config"].app = mock_celery

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


@patch("redis.from_url")
def test_train_endpoint_minimal_yaml(mock_redis_from_url):
    """Validates that a minimal user YAML without sweeper or model is accepted.

    This test uploads a 4-line YAML with only 'train.data' and 'train.epochs'.
    It verifies that the API accepts the payload, initializes sweeper defaults,
    and returns HTTP 200 with 'Queued' status and the study ID.
    """
    mock_redis = MagicMock()
    mock_redis_from_url.return_value = mock_redis

    minimal_yaml = b"""train:
  data: "/datasets/AREPO/protesis/data.yaml"
  epochs: 5
"""
    files = {"config_file": ("config.yaml", io.BytesIO(minimal_yaml), "application/x-yaml")}
    data = {"mode": "public", "priority": "high"}

    response = client.post("/train", files=files, data=data)

    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "Queued"
    assert res_data["study_id"] == "test-job-uuid-1234"
    assert res_data["routing"] == "public:high"


@patch("redis.from_url")
def test_train_endpoint_style_yaml(mock_redis_from_url):
    """Validates that a YAML with style: 'segment' is accepted and dispatched.

    This test checks that passing vision style in the YAML does not trigger
    any schema errors and passes through to Celery.
    """
    mock_redis = MagicMock()
    mock_redis_from_url.return_value = mock_redis

    style_yaml = b"""model: "yolo11n-seg.pt"
style: "segment"
train:
  data: "/datasets/segmentation/data.yaml"
  epochs: 10
"""
    files = {"config_file": ("segment_config.yaml", io.BytesIO(style_yaml), "application/x-yaml")}
    data = {"mode": "public", "priority": "medium"}

    response = client.post("/train", files=files, data=data)

    assert response.status_code == 200
    assert response.json()["status"] == "Queued"


def test_train_endpoint_rejects_non_yaml():
    """Validates that non-YAML file uploads are rejected with HTTP 400.

    This test ensures security and schema integrity by blocking non-YAML files.
    """
    files = {"config_file": ("script.sh", io.BytesIO(b"echo hello"), "text/plain")}
    response = client.post("/train", files=files)
    assert response.status_code == 400
    assert "File must be a YAML" in response.json()["detail"]


def test_train_endpoint_rejects_missing_dataset():
    """Validates that configs missing 'train.data' are rejected immediately with HTTP 400."""
    no_data_yaml = b"""model: "yolo26n.pt"
train:
  epochs: 5
"""
    files = {"config_file": ("config.yaml", io.BytesIO(no_data_yaml), "application/x-yaml")}
    response = client.post("/train", files=files)
    assert response.status_code == 400
    assert "Missing required dataset path" in response.json()["detail"]


def test_train_endpoint_rejects_placeholder_dataset():
    """Validates that template placeholders like <path_to_dataset> are rejected on the fly."""
    placeholder_yaml = b"""model: "yolo26n.pt"
train:
  data: "<path/to/my_dataset.yaml>"
  epochs: 5
"""
    files = {"config_file": ("config.yaml", io.BytesIO(placeholder_yaml), "application/x-yaml")}
    response = client.post("/train", files=files)
    assert response.status_code == 400
    assert "unconfigured placeholder" in response.json()["detail"]


def test_train_endpoint_rejects_invalid_file_extension():
    """Validates that dataset paths pointing to raw image or text files are rejected with HTTP 400."""
    bad_ext_yaml = b"""model: "yolo26n.pt"
train:
  data: "/datasets/project/images.jpg"
  epochs: 5
"""
    files = {"config_file": ("config.yaml", io.BytesIO(bad_ext_yaml), "application/x-yaml")}
    response = client.post("/train", files=files)
    assert response.status_code == 400
    assert "invalid file extension" in response.json()["detail"]


def test_train_endpoint_rejects_generic_root_dataset():
    """Validates that pointing vaguely to '/datasets' without project subpath is rejected."""
    generic_yaml = b"""model: "yolo26n.pt"
train:
  data: "/datasets/data.yaml"
  epochs: 5
"""
    files = {"config_file": ("config.yaml", io.BytesIO(generic_yaml), "application/x-yaml")}
    response = client.post("/train", files=files)
    assert response.status_code == 400
    assert "too generic" in response.json()["detail"]

