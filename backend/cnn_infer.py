"""
DigitVision AI — CNN Inference Engine
======================================
Loads the trained model weights and computes class predictions and softmax probabilities
for preprocessed 28x28 tensors.
"""

import os
import json
from typing import Tuple, List
import numpy as np

MODEL_PT_PATH = os.path.join(os.path.dirname(__file__), "models", "digit_model.pt")
WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), "models", "weights.json")

_torch_model = None
_weights_cache = None


def get_inference_engine():
    """Returns PyTorch model if available, else lightweight NumPy inference."""
    global _torch_model, _weights_cache

    if _torch_model is not None:
        return "torch", _torch_model

    if os.path.exists(MODEL_PT_PATH):
        try:
            import torch
            from training.train_mnist_cnn import DigitCNN
            model = DigitCNN()
            model.load_state_dict(torch.load(MODEL_PT_PATH, map_location="cpu"))
            model.eval()
            _torch_model = model
            return "torch", _torch_model
        except Exception as e:
            pass

    if os.path.exists(WEIGHTS_PATH):
        try:
            if _weights_cache is None:
                with open(WEIGHTS_PATH, "r") as f:
                    _weights_cache = json.load(f)
            return "numpy", _weights_cache
        except Exception:
            pass

    return None, None


def infer_digit(tensor_28x28: np.ndarray) -> Tuple[int, float, List[float]]:
    """
    Given a (1, 28, 28, 1) or (28, 28) numpy array with values in [0.0, 1.0],
    returns (predicted_digit, confidence, list_of_10_probabilities).
    """
    engine_type, engine = get_inference_engine()

    # Shape preparation
    if tensor_28x28.ndim == 4:
        img_2d = tensor_28x28[0, :, :, 0]
    elif tensor_28x28.ndim == 3:
        img_2d = tensor_28x28[:, :, 0]
    else:
        img_2d = tensor_28x28

    if engine_type == "torch":
        import torch
        # PyTorch expects shape (batch, channels, H, W)
        t = torch.from_numpy(img_2d).unsqueeze(0).unsqueeze(0).float()
        with torch.no_grad():
            logits = engine(t)
            probs_t = torch.softmax(logits, dim=1)[0]
            probs = [round(float(p), 5) for p in probs_t.cpu().numpy()]
            pred_digit = int(np.argmax(probs))
            conf = float(probs[pred_digit])
            return pred_digit, conf, probs

    elif engine_type == "numpy":
        # Pure NumPy forward pass through the exact CNN
        W = engine
        x = img_2d[np.newaxis, :, :]  # (1, 28, 28)
        
        # Conv1: (32, 1, 3, 3)
        c1_w = np.array(W["conv1_w"], dtype=np.float32)  # (32, 1, 3, 3)
        c1_b = np.array(W["conv1_b"], dtype=np.float32)  # (32,)
        # 28x28 with 3x3 valid -> 26x26
        feat1 = np.zeros((32, 26, 26), dtype=np.float32)
        for i in range(26):
            for j in range(26):
                patch = x[:, i:i+3, j:j+3]
                feat1[:, i, j] = np.sum(c1_w * patch, axis=(1, 2, 3)) + c1_b
        # ReLU
        feat1 = np.maximum(0, feat1)
        # MaxPool 2x2 -> 13x13
        p1 = np.zeros((32, 13, 13), dtype=np.float32)
        for i in range(13):
            for j in range(13):
                p1[:, i, j] = np.max(feat1[:, i*2:i*2+2, j*2:j*2+2], axis=(1, 2))
                
        # Conv2: (64, 32, 3, 3)
        c2_w = np.array(W["conv2_w"], dtype=np.float32)
        c2_b = np.array(W["conv2_b"], dtype=np.float32)
        # 13x13 with 3x3 valid -> 11x11
        feat2 = np.zeros((64, 11, 11), dtype=np.float32)
        for i in range(11):
            for j in range(11):
                patch = p1[:, i:i+3, j:j+3]
                feat2[:, i, j] = np.sum(c2_w * patch, axis=(1, 2, 3)) + c2_b
        # ReLU
        feat2 = np.maximum(0, feat2)
        # MaxPool 2x2 -> 5x5
        p2 = np.zeros((64, 5, 5), dtype=np.float32)
        for i in range(5):
            for j in range(5):
                p2[:, i, j] = np.max(feat2[:, i*2:i*2+2, j*2:j*2+2], axis=(1, 2))
                
        # Flatten: 64 * 5 * 5 = 1600
        flat = p2.flatten()
        
        # Dense 1: 1600 -> 128
        fc1_w = np.array(W["fc1_w"], dtype=np.float32) # (128, 1600)
        fc1_b = np.array(W["fc1_b"], dtype=np.float32)
        dense1 = np.maximum(0, np.dot(fc1_w, flat) + fc1_b)
        
        # Dense 2: 128 -> 10
        fc2_w = np.array(W["fc2_w"], dtype=np.float32) # (10, 128)
        fc2_b = np.array(W["fc2_b"], dtype=np.float32)
        logits = np.dot(fc2_w, dense1) + fc2_b
        
        # Softmax
        exp_l = np.exp(logits - np.max(logits))
        probs_raw = exp_l / np.sum(exp_l)
        probs = [round(float(p), 5) for p in probs_raw]
        pred_digit = int(np.argmax(probs))
        conf = float(probs[pred_digit])
        return pred_digit, conf, probs

    # If no model weights found yet:
    raise RuntimeError("No model weights found. Please train the model first.")
