"""
DigitVision AI — Flask Backend Application
===========================================
Production-ready REST API for handwritten digit recognition powered by a CNN model on MNIST.
Endpoints:
  - GET  /api/health       -> Health check and model readiness
  - GET  /api/model-info   -> Architecture, training metrics, and confusion matrix
  - POST /api/predict      -> Predicts digit from image (multipart/form-data or JSON base64)
"""

import os
import io
import json
import base64
import logging
from typing import Optional, Dict, Any, Tuple
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("DigitVisionAPI")

app = Flask(__name__)
# Enable CORS for cross-origin requests when frontend runs on different port
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configuration
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB limit
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "digit_model.keras")
METRICS_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "training", "metrics.json")

# In-memory cached model and metrics
_cached_model = None
_cached_metrics = None


def load_model_if_available():
    """Loads the trained Keras CNN model once into memory."""
    global _cached_model
    if _cached_model is not None:
        return _cached_model

    if not os.path.exists(MODEL_PATH):
        logger.warning(f"Trained model not found at '{MODEL_PATH}'.")
        return None

    try:
        import tensorflow as tf
        logger.info(f"Loading trained CNN model from {MODEL_PATH}...")
        _cached_model = tf.keras.models.load_model(MODEL_PATH)
        logger.info("Model loaded successfully into memory.")
        return _cached_model
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        return None


def load_metrics_if_available() -> Optional[Dict[str, Any]]:
    """Loads cached evaluation metrics from training/metrics.json."""
    global _cached_metrics
    if _cached_metrics is not None:
        return _cached_metrics

    if os.path.exists(METRICS_PATH):
        try:
            with open(METRICS_PATH, "r") as f:
                _cached_metrics = json.load(f)
                return _cached_metrics
        except Exception as e:
            logger.error(f"Failed to read metrics: {str(e)}")
    return None


@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({
        "success": False,
        "error": "File size exceeds the 10MB limit. Please upload a smaller image."
    }), 413


@app.errorhandler(500)
def internal_server_error(error):
    return jsonify({
        "success": False,
        "error": "An internal server error occurred while processing the request."
    }), 500


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint indicating service status and model readiness."""
    model = load_model_if_available()
    model_ready = model is not None
    metrics_ready = os.path.exists(METRICS_PATH)

    status_code = 200
    return jsonify({
        "status": "healthy",
        "service": "DigitVision AI",
        "model_loaded": model_ready,
        "metrics_available": metrics_ready,
        "model_path": "backend/models/digit_model.keras",
        "message": "Model ready for inference." if model_ready else "Model not found. Train via 'python training/train_model.py'."
    }), status_code


@app.route("/api/model-info", methods=["GET"])
def model_info():
    """Returns architecture details, training configuration, and evaluation metrics."""
    metrics = load_metrics_if_available()

    info = {
        "model_name": "DigitVision-CNN",
        "dataset": "MNIST Handwritten Digits (60,000 train / 10,000 test)",
        "num_classes": 10,
        "classes": ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
        "input_shape": [28, 28, 1],
        "architecture": [
            {"layer": "Input", "output": "28x28x1", "description": "Single-channel 28x28 grayscale image normalized to [0, 1]"},
            {"layer": "Conv2D (32)", "output": "26x26x32", "description": "3x3 kernel, ReLU activation, 32 feature maps"},
            {"layer": "MaxPooling2D", "output": "13x13x32", "description": "2x2 pool window, stride 2 spatial subsampling"},
            {"layer": "Conv2D (64)", "output": "11x11x64", "description": "3x3 kernel, ReLU activation, 64 feature maps"},
            {"layer": "MaxPooling2D", "output": "5x5x64", "description": "2x2 pool window, stride 2 spatial subsampling"},
            {"layer": "Flatten", "output": "1600", "description": "Reshapes 5x5x64 tensor into 1600-dim feature vector"},
            {"layer": "Dense (128)", "output": "128", "description": "Fully connected hidden layer with ReLU activation"},
            {"layer": "Dropout (0.3)", "output": "128", "description": "30% dropout rate for regularizing against overfitting"},
            {"layer": "Dense (10)", "output": "10", "description": "Softmax output layer yielding class probability distribution"}
        ],
        "metrics": metrics or {}
    }
    return jsonify(info), 200


@app.route("/api/predict", methods=["POST"])
def predict():
    """
    Accepts an image via:
    1. multipart/form-data: 'image' or 'file' field
    2. JSON payload: { 'image': '<base64-encoded-string>' }

    Returns predicted digit, confidence, and 10 class probabilities.
    """
    from backend.preprocessing import (
        preprocess_image,
        InvalidImageError,
        EmptyImageError,
        PreprocessingError
    )

    image_bytes = None

    # Check for multipart/form-data
    if "image" in request.files:
        image_bytes = request.files["image"].read()
    elif "file" in request.files:
        image_bytes = request.files["file"].read()
    elif request.is_json:
        data = request.get_json(silent=True) or {}
        b64_str = data.get("image") or data.get("file")
        if b64_str:
            # Handle data URL prefix if present e.g. "data:image/png;base64,..."
            if "," in b64_str:
                b64_str = b64_str.split(",", 1)[1]
            try:
                image_bytes = base64.b64decode(b64_str)
            except Exception:
                return jsonify({
                    "success": False,
                    "error": "Invalid base64 encoding provided in JSON body."
                }), 400

    if not image_bytes:
        return jsonify({
            "success": False,
            "error": "No image provided. Please supply an image file or base64 encoded image."
        }), 400

    # Preprocessing
    try:
        tensor, processed_28, metadata = preprocess_image(image_bytes)
    except EmptyImageError as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400
    except InvalidImageError as e:
        return jsonify({
            "success": False,
            "error": f"Invalid or unreadable image: {str(e)}"
        }), 400
    except PreprocessingError as e:
        return jsonify({
            "success": False,
            "error": f"Preprocessing failed: {str(e)}"
        }), 400
    except Exception as e:
        logger.error(f"Unexpected preprocessing error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "An unexpected error occurred while preprocessing the image."
        }), 500

    # Model inference
    model = load_model_if_available()
    try:
        from backend.cnn_infer import infer_digit
        predicted_digit, confidence, probs = infer_digit(tensor)

        # Generate base64 thumbnail of the 28x28 normalized preprocessed image
        from PIL import Image
        thumb_img = Image.fromarray(processed_28)
        buffer = io.BytesIO()
        thumb_img.save(buffer, format="PNG")
        thumb_b64 = "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")

        return jsonify({
            "success": True,
            "predicted_digit": predicted_digit,
            "confidence": round(confidence, 4),
            "probabilities": probs,
            "preprocessed_preview": thumb_b64,
            "preprocessing_details": metadata
        }), 200

    except Exception as e:
        logger.error(f"Inference error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "An error occurred while computing neural network inference."
        }), 500


if __name__ == "__main__":
    port = int(os.environ.get("FLASK_PORT", 5000))
    logger.info(f"Starting DigitVision AI Flask server on port {port}...")
    load_model_if_available()
    app.run(host="0.0.0.0", port=port, debug=False)
