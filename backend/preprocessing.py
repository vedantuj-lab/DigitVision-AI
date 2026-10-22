"""
DigitVision AI — Image Preprocessing Pipeline
=============================================
Converts arbitrary user drawings or uploaded images (RGB, RGBA, Grayscale, PNG, JPEG)
into the exact 28x28 normalized grayscale tensor required by the MNIST CNN model.

Preprocessing steps:
1. Decode image bytes and validate dimensions/channels.
2. Flatten transparency (if RGBA) with an appropriate background.
3. Convert to single-channel 8-bit grayscale.
4. Polarity detection: inspect edge/border pixels vs. interior pixels to determine
   whether the image is dark-on-light (black ink on white paper) or light-on-dark
   (white stroke on black canvas). Invert if dark-on-light so digit is foreground (>0)
   on black background (0), matching standard MNIST format.
5. Foreground detection & whitespace cropping: calculate threshold, find bounding box
   [ymin, xmin, ymax, xmax]. If no foreground pixels exist, raise EmptyImageError.
6. Aspect ratio preservation & resizing: scale the largest bounding box dimension
   to fit within a 20x20 box (leaving standard 4px border margin on 28x28 canvas).
7. Center of mass centering: place the 20x20 scaled digit inside a 28x28 black canvas
   and shift so its center of mass aligns with (13.5, 13.5), matching MNIST specifications.
8. Normalization: scale pixel values to [0.0, 1.0] as float32.
9. Reshape to model input shape: (1, 28, 28, 1).
"""

import io
import math
from typing import Dict, Any, Tuple, Optional
import numpy as np
from PIL import Image


class PreprocessingError(Exception):
    """Base exception for image preprocessing errors."""
    pass


class InvalidImageError(PreprocessingError):
    """Raised when the image bytes cannot be decoded or are corrupt."""
    pass


class EmptyImageError(PreprocessingError):
    """Raised when the submitted image contains no visible strokes/digits."""
    pass


def decode_image(image_bytes: bytes) -> Image.Image:
    """Safely decodes raw image bytes into a PIL Image."""
    if not image_bytes or len(image_bytes) == 0:
        raise InvalidImageError("Image payload is empty.")
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.load()  # Force decode to detect corrupted data
        return img
    except Exception as e:
        raise InvalidImageError(f"Failed to decode image data: {str(e)}")


def flatten_alpha_and_grayscale(img: Image.Image) -> np.ndarray:
    """
    Handles RGBA/LA transparency.
    If image has an alpha channel, we blend onto a neutral background.
    Returns 2D numpy array with shape (H, W) in uint8 [0, 255].
    """
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        rgba = img.convert("RGBA")
        alpha = np.array(rgba.getchannel("A"), dtype=np.float32) / 255.0
        rgb = np.array(rgba.convert("RGB"), dtype=np.float32)
        gray = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
        
        # If canvas was transparent with white brush strokes:
        # strokes have high alpha and high RGB. If fully transparent, background is 0.
        blended = gray * alpha
        return np.clip(blended, 0, 255).astype(np.uint8)
    else:
        gray_img = img.convert("L")
        return np.array(gray_img, dtype=np.uint8)


def detect_and_normalize_polarity(gray: np.ndarray) -> Tuple[np.ndarray, str]:
    """
    Determines if image is dark-on-light (paper document) or light-on-dark (canvas).
    Uses border pixels to estimate background intensity.
    Returns (normalized_array, polarity_mode) where normalized_array has bright foreground on dark background.
    """
    h, w = gray.shape
    border_pixels = []
    # Sample top, bottom, left, right borders (5% margin)
    bh = max(1, int(h * 0.05))
    bw = max(1, int(w * 0.05))
    
    border_pixels.extend(gray[:bh, :].ravel())
    border_pixels.extend(gray[-bh:, :].ravel())
    border_pixels.extend(gray[:, :bw].ravel())
    border_pixels.extend(gray[:, -bw:].ravel())
    
    border_mean = float(np.mean(border_pixels))
    
    # If border is bright (> 128), it's dark text on white/light paper -> invert
    if border_mean > 127.5:
        normalized = 255 - gray
        polarity = "dark_on_light"
    else:
        normalized = gray.copy()
        polarity = "light_on_dark"
        
    return normalized, polarity


def crop_and_center_digit(img_arr: np.ndarray, threshold: int = 30) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Locates the foreground bounding box, crops it, scales preserving aspect ratio
    to at most 20x20, and places in 28x28 centered by center of mass (MNIST standard).
    """
    h, w = img_arr.shape
    # Mask foreground pixels
    foreground_mask = img_arr > threshold
    active_indices = np.argwhere(foreground_mask)
    
    if len(active_indices) < 8:  # Less than 8 non-zero pixels is effectively empty
        raise EmptyImageError("Canvas or uploaded image is empty. Please draw or upload a clear digit.")
    
    ymin, xmin = active_indices.min(axis=0)
    ymax, xmax = active_indices.max(axis=0)
    
    # Crop to bounding box
    cropped = img_arr[ymin : ymax + 1, xmin : xmax + 1]
    ch, cw = cropped.shape
    
    if ch == 0 or cw == 0:
        raise EmptyImageError("Digit region has zero dimension.")
        
    # Scale longest dimension to 20 pixels while preserving aspect ratio
    longest_dim = max(ch, cw)
    scale = 20.0 / float(longest_dim)
    new_w = max(1, int(round(cw * scale)))
    new_h = max(1, int(round(ch * scale)))
    
    cropped_pil = Image.fromarray(cropped)
    resized_pil = cropped_pil.resize((new_w, new_h), Image.Resampling.BILINEAR)
    resized_arr = np.array(resized_pil, dtype=np.float32)
    
    # Create empty 28x28 canvas
    canvas_28 = np.zeros((28, 28), dtype=np.float32)
    
    # Initial geometric placement in center of 28x28
    start_y = (28 - new_h) // 2
    start_x = (28 - new_w) // 2
    canvas_28[start_y : start_y + new_h, start_x : start_x + new_w] = resized_arr
    
    # Center of mass calculation for MNIST alignment
    total_mass = float(np.sum(canvas_28))
    shift_x, shift_y = 0.0, 0.0
    if total_mass > 0:
        y_coords, x_coords = np.indices((28, 28))
        cy = float(np.sum(y_coords * canvas_28) / total_mass)
        cx = float(np.sum(x_coords * canvas_28) / total_mass)
        
        # Center of 28x28 is (13.5, 13.5)
        shift_y = 13.5 - cy
        shift_x = 13.5 - cx
        
        # Shift canvas by integer or interpolated offsets within bounds [-4, 4]
        sy = int(round(np.clip(shift_y, -4, 4)))
        sx = int(round(np.clip(shift_x, -4, 4)))
        if sy != 0 or sx != 0:
            shifted = np.zeros((28, 28), dtype=np.float32)
            src_y1 = max(0, -sy)
            src_y2 = min(28, 28 - sy)
            src_x1 = max(0, -sx)
            src_x2 = min(28, 28 - sx)
            
            dst_y1 = max(0, sy)
            dst_y2 = min(28, 28 + sy)
            dst_x1 = max(0, sx)
            dst_x2 = min(28, 28 + sx)
            
            shifted[dst_y1:dst_y2, dst_x1:dst_x2] = canvas_28[src_y1:src_y2, src_x1:src_x2]
            canvas_28 = shifted

    metadata = {
        "original_dimensions": [w, h],
        "bounding_box": [int(xmin), int(ymin), int(xmax), int(ymax)],
        "cropped_size": [int(cw), int(ch)],
        "scaled_size": [int(new_w), int(new_h)],
        "center_of_mass_shift": [round(float(shift_x), 2), round(float(shift_y), 2)],
        "foreground_pixel_count": int(len(active_indices))
    }
    
    return np.clip(canvas_28, 0, 255).astype(np.uint8), metadata


def preprocess_image(image_bytes: bytes) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
    """
    Main preprocessing pipeline.
    
    Returns:
    - tensor: float32 numpy array with shape (1, 28, 28, 1), normalized to [0.0, 1.0].
    - processed_28: uint8 numpy array with shape (28, 28) for visual debugging / preview.
    - metadata: dict of preprocessing diagnostics.
    """
    pil_img = decode_image(image_bytes)
    gray = flatten_alpha_and_grayscale(pil_img)
    normalized_gray, polarity = detect_and_normalize_polarity(gray)
    processed_28, meta = crop_and_center_digit(normalized_gray)
    
    meta["detected_polarity"] = polarity
    
    # Normalize to [0.0, 1.0]
    tensor = processed_28.astype(np.float32) / 255.0
    tensor = np.reshape(tensor, (1, 28, 28, 1))
    
    return tensor, processed_28, meta
