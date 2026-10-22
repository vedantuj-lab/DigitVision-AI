"""
Integration tests for the DigitVision AI Flask backend API.
Tests /api/health, /api/model-info, /api/predict validation, and response schema.
"""

import io
import json
import base64
import pytest
from PIL import Image, ImageDraw

from backend.app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def create_sample_digit_b64():
    img = Image.new("L", (100, 100), color=0)
    draw = ImageDraw.Draw(img)
    draw.line([(50, 15), (50, 85)], fill=255, width=10)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "healthy"
    assert data["service"] == "DigitVision AI"
    assert "model_loaded" in data


def test_model_info_endpoint(client):
    response = client.get("/api/model-info")
    assert response.status_code == 200
    data = response.get_json()
    assert data["model_name"] == "DigitVision-CNN"
    assert data["num_classes"] == 10
    assert len(data["architecture"]) > 0


def test_predict_missing_payload(client):
    response = client.post("/api/predict", json={})
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert "No image provided" in data["error"]


def test_predict_invalid_base64(client):
    response = client.post("/api/predict", json={"image": "%%%not-valid-base64&&&"})
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False


def test_predict_empty_image(client):
    # Blank all-black image with no stroke
    img = Image.new("L", (100, 100), color=0)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64_str = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

    response = client.post("/api/predict", json={"image": b64_str})
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert "empty" in data["error"].lower()


def test_predict_valid_digit(client):
    b64_digit = create_sample_digit_b64()
    response = client.post("/api/predict", json={"image": b64_digit})
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert "predicted_digit" in data
    assert 0 <= data["predicted_digit"] <= 9
    assert "confidence" in data
    assert 0.0 <= data["confidence"] <= 1.0
    assert "probabilities" in data
    assert len(data["probabilities"]) == 10
    assert abs(sum(data["probabilities"]) - 1.0) < 0.05
    assert "preprocessed_preview" in data

