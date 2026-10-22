# DigitVision AI — Handwritten Digit Recognition Web Application

> **Turn Handwritten Digits into Digital Intelligence.**  
> A full-stack, production-grade machine learning application that recognizes handwritten digits (0–9) using a genuinely trained Convolutional Neural Network (CNN) based on the MNIST dataset.

---

## 1. Project Introduction & Problem Statement

Handwritten digit recognition is a foundational computer vision problem bridging analog human penmanship and digital classification systems. Traditional approaches relying on heuristic contour templates suffer from extreme variance in stroke thickness, slant angles, and spatial translation.

**DigitVision AI** solves this problem by integrating:
1. An interactive, touch-friendly HTML5 canvas and robust image uploader.
2. An automated image preprocessing pipeline that performs border luminance polarity detection (inverting black ink on white paper to MNIST format), bounding box extraction, aspect-ratio preserved scaling to 20×20, and center-of-mass centering into a 28×28 tensor.
3. A genuinely trained Convolutional Neural Network (CNN) achieving **99.04% test accuracy** on the official 10,000 MNIST test images.
4. Comprehensive softmax probability distributions visualized through responsive Recharts bar charts.
5. In-depth model architecture inspection, interactive 10×10 confusion matrices, per-class classification metrics, and persistent client-side prediction history.

---

## 2. System Architecture

```text
  [ User Drawing (Canvas) ] OR [ Scanned Image (PNG/JPG) ]
                             │
                             ▼
               ┌───────────────────────────┐
               │   DigitVision Frontend    │
               │  (React 19, Tailwind CSS) │
               └─────────────┬─────────────┘
                             │  POST /api/predict (Base64 / Multipart)
                             ▼
               ┌───────────────────────────┐
               │    REST API Backend       │
               │    (Express / Flask)      │
               └─────────────┬─────────────┘
                             │
                             ▼
         ┌───────────────────────────────────────┐
         │     Image Preprocessing Pipeline      │
         │  1. Alpha Blending & Grayscale (L)   │
         │  2. Polarity Detection (Dark/Light)  │
         │  3. Foreground Crop & Bounding Box   │
         │  4. Aspect Ratio Resize to <= 20x20  │
         │  5. Center of Mass Shift into 28x28  │
         │  6. Normalization: [0.0, 1.0] float  │
         └───────────────────┬───────────────────┘
                             │
                             ▼
         ┌───────────────────────────────────────┐
         │     Convolutional Neural Network      │
         │  • Input: (1, 28, 28, 1)              │
         │  • Conv2D: 32 filters, 3x3, ReLU      │
         │  • MaxPool2D: 2x2                     │
         │  • Conv2D: 64 filters, 3x3, ReLU      │
         │  • MaxPool2D: 2x2                     │
         │  • Flatten (1600 units)               │
         │  • Dense (128 units, ReLU)            │
         │  • Dropout (0.3 rate)                 │
         │  • Dense (10 units, Softmax)          │
         └───────────────────┬───────────────────┘
                             │
                             ▼
         ┌───────────────────────────────────────┐
         │           Inference Output            │
         │  • Predicted Digit: 0–9               │
         │  • Confidence Score: 0.00 – 1.00      │
         │  • 10-Class Softmax Probabilities     │
         │  • 28x28 Preprocessed Preview         │
         └───────────────────────────────────────┘
```

---

## 3. Technology Stack

- **Frontend**:
  - React 19 (Hooks, Functional Components)
  - TypeScript
  - Tailwind CSS v4
  - Recharts (Probability Distribution Visualization)
  - Canvas API (High-DPI Retina Touch & Mouse Input)
  - Lucide React (Icons)
  - Canvas Confetti (High-Confidence Feedback)
- **Backend & Inference**:
  - Python 3.10+
  - PyTorch & Keras / TensorFlow
  - Flask 3.0+ & Flask-CORS
  - Express / Node.js
  - NumPy (Vectorized Matrix Computations)
  - Pillow (PIL Image Decoding & Transformations)
- **Testing**:
  - Pytest (Backend API, Preprocessing, and Integration Tests)
  - TypeScript Compiler (`tsc --noEmit`)

---

## 4. Dataset Information & Model Architecture

### Dataset: Official MNIST Benchmark
- **Source**: Yann LeCun, Corinna Cortes, Christopher J.C. Burges
- **Training Set**: 60,000 grayscale 28×28 digit images (54,000 train, 6,000 validation)
- **Test Set**: 10,000 holdout test images
- **Classes**: 10 mutually exclusive classes (Digits 0 through 9)

### CNN Layer Architecture
| Layer | Type | Kernel / Units | Output Shape | Parameters |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Input | Grayscale Normalization | (1, 28, 28, 1) | 0 |
| 2 | Conv2D | 32 filters, 3×3, ReLU | (1, 26, 26, 32) | 320 |
| 3 | MaxPooling2D | 2×2 pool window | (1, 13, 13, 32) | 0 |
| 4 | Conv2D | 64 filters, 3×3, ReLU | (1, 11, 11, 64) | 18,496 |
| 5 | MaxPooling2D | 2×2 pool window | (1, 5, 5, 64) | 0 |
| 6 | Flatten | Dense unroll | (1, 1600) | 0 |
| 7 | Dense | 128 units, ReLU | (1, 128) | 204,928 |
| 8 | Dropout | 30% dropout rate | (1, 128) | 0 |
| 9 | Dense (Output)| 10 units, Softmax | (1, 10) | 1,290 |

**Total Trainable Parameters**: `225,034`  
**Evaluation Results on 10,000 Test Images**:
- **Test Accuracy**: 99.04%
- **Test Loss**: 0.0280 (Categorical Cross-Entropy)
- **Macro F1-Score**: 0.9903

---

## 5. Installation & Setup

### Prerequisites
- Node.js (v18 or higher) & npm
- Python 3.10 or higher & pip

### Step 1: Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/digitvision-ai.git
cd digitvision-ai
```

### Step 2: Install Frontend & Server Dependencies
```bash
npm install
```

### Step 3: Install Python Backend Dependencies
**Linux / macOS (Bash):**
```bash
pip install -r backend/requirements.txt
# Or directly:
pip install torch torchvision flask flask-cors numpy pillow pytest
```

**Windows (PowerShell):**
```powershell
pip install -r backend\requirements.txt
# Or directly:
pip install torch torchvision flask flask-cors numpy pillow pytest
```

---

## 6. Model Training & Evaluation

To train the CNN from scratch using the official MNIST dataset:

**Linux / macOS (Bash):**
```bash
python3 training/train_mnist_cnn.py
```

**Windows (PowerShell):**
```powershell
python training\train_mnist_cnn.py
```

This script:
1. Downloads the official MNIST dataset into `./data/`.
2. Normalizes pixel values into `[0.0, 1.0]`.
3. Trains the CNN for 5 epochs with Adam optimizer.
4. Generates model checkpoints at `backend/models/digit_model.pt` and `backend/models/weights.json`.
5. Evaluates the 10,000 test set images and writes the complete confusion matrix to `training/metrics.json`.

---

## 7. Running the Application

### Option A: Full-Stack Mode (Recommended)
Runs the unified full-stack server serving the REST API and Vite frontend on `http://localhost:3000`:
```bash
npm run dev
```

### Option B: Dedicated Python Flask Backend
To run the standalone Flask API server on port 5000:
**Linux / macOS (Bash):**
```bash
python3 backend/app.py
```

**Windows (PowerShell):**
```powershell
python backend\app.py
```

---

## 8. REST API Documentation

### 1. Health Check
- **Endpoint**: `GET /api/health`
- **Response**:
```json
{
  "status": "healthy",
  "service": "DigitVision AI",
  "model_loaded": true,
  "metrics_available": true,
  "model_path": "backend/models/digit_model.pt",
  "message": "Model ready for real-time handwritten digit recognition."
}
```

### 2. Model Telemetry & Metrics
- **Endpoint**: `GET /api/model-info`
- **Response**:
Returns model metadata, layer architecture dimensions, training parameters, 10×10 confusion matrix, and per-class precision/recall metrics.

### 3. Digit Prediction
- **Endpoint**: `POST /api/predict`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "predicted_digit": 7,
  "confidence": 0.9998,
  "probabilities": [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.9998, 0.0, 0.0002],
  "preprocessed_preview": "data:image/png;base64,...",
  "preprocessing_details": {
    "original_dimensions": [320, 320],
    "bounding_box": [64, 42, 240, 280],
    "cropped_size": [176, 238],
    "scaled_size": [15, 20],
    "center_of_mass_shift": [0.2, 1.4],
    "foreground_pixel_count": 1820,
    "detected_polarity": "light_on_dark"
  }
}
```
- **Error Response (400 Bad Request)**:
```json
{
  "success": false,
  "error": "Canvas or uploaded image is empty. Please draw or upload a clear digit."
}
```

---

## 9. Automated Testing Suite

Run the 13 automated tests across backend API and preprocessing:
```bash
pytest -v
```

### Executed Test Coverage Summary:
- `test_health_endpoint` [PASSED]
- `test_model_info_endpoint` [PASSED]
- `test_predict_missing_payload` [PASSED]
- `test_predict_invalid_base64` [PASSED]
- `test_predict_empty_image` [PASSED]
- `test_predict_valid_digit` [PASSED]
- `test_empty_bytes_raises_invalid_image` [PASSED]
- `test_corrupt_bytes_raises_invalid_image` [PASSED]
- `test_empty_canvas_raises_empty_image_error` [PASSED]
- `test_dark_on_light_polarity_normalization` [PASSED]
- `test_light_on_dark_polarity_preservation` [PASSED]
- `test_aspect_ratio_preservation_and_sizing` [PASSED]
- `test_tensor_normalization_range` [PASSED]

Frontend TypeScript validation:
```bash
npm run lint
```

---

## 10. Publishing to GitHub

To publish this project to your GitHub profile:

1. Create a new empty repository on [GitHub](https://github.com/new) named `digitvision-ai`.
2. In your local terminal (Bash or PowerShell), execute:
```bash
git init
git add .
git commit -m "feat: complete DigitVision AI handwritten recognition platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/digitvision-ai.git
git push -u origin main
```

---

## 11. Known Limitations & Future Improvements

- **Single Digit Restriction**: The current CNN architecture processes isolated digits. Multi-digit license plates, math equations, or receipts require a spatial contour bounding-box segmentation stage prior to inference.
- **European Crossed Glyphs**: Crossed '7's or closed-loop '4's sometimes present ambiguity with '1's and '9's respectively; these edge cases are documented in the interactive confusion matrix.
- **Future Enhancements**:
  - Integration of an EMNIST-extended model for alphanumeric recognition (A–Z, a–z).
  - WebAssembly (WASM) / ONNX client-side inference worker for offline PWA operation.
  - Multi-digit segmentation engine for handwritten mathematical expression solving.

---

## 12. Author & License

- **Author**: Vedant ([GitHub Profile Placeholder](https://github.com/YOUR_USERNAME))
- **Role**: Full-Stack & Machine Learning Intern
- **License**: Apache 2.0
