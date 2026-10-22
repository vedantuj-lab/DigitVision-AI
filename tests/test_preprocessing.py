"""
Unit tests for the DigitVision AI preprocessing module.
Tests polarity detection, dimension constraints, whitespace cropping, and error handling.
"""

import io
import pytest
import numpy as np
from PIL import Image, ImageDraw

from backend.preprocessing import (
    preprocess_image,
    decode_image,
    detect_and_normalize_polarity,
    crop_and_center_digit,
    InvalidImageError,
    EmptyImageError
)


def create_test_image(size=(100, 100), bg="white", stroke_color="black", draw_digit=True):
    """Helper to generate in-memory synthetic images for testing."""
    img = Image.new("RGB", size, color=bg)
    draw = ImageDraw.Draw(img)
    if draw_digit:
        # Draw a vertical stroke mimicking digit '1'
        draw.line([(size[0] // 2, 10), (size[0] // 2, size[1] - 10)], fill=stroke_color, width=8)
    
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_empty_bytes_raises_invalid_image():
    with pytest.raises(InvalidImageError):
        decode_image(b"")


def test_corrupt_bytes_raises_invalid_image():
    with pytest.raises(InvalidImageError):
        decode_image(b"not_a_valid_image_header_bytes")


def test_empty_canvas_raises_empty_image_error():
    blank_white = create_test_image(bg="white", draw_digit=False)
    with pytest.raises(EmptyImageError):
        preprocess_image(blank_white)

    blank_black = create_test_image(bg="black", draw_digit=False)
    with pytest.raises(EmptyImageError):
        preprocess_image(blank_black)


def test_dark_on_light_polarity_normalization():
    # Black stroke on white paper
    img_bytes = create_test_image(bg="white", stroke_color="black", draw_digit=True)
    tensor, processed_28, meta = preprocess_image(img_bytes)

    assert meta["detected_polarity"] == "dark_on_light"
    assert tensor.shape == (1, 28, 28, 1)
    assert processed_28.shape == (28, 28)
    assert np.max(processed_28) > 100  # Foreground stroke should now be bright
    assert np.mean(processed_28[0, :]) < 10  # Borders should be dark


def test_light_on_dark_polarity_preservation():
    # White stroke on black canvas
    img_bytes = create_test_image(bg="black", stroke_color="white", draw_digit=True)
    tensor, processed_28, meta = preprocess_image(img_bytes)

    assert meta["detected_polarity"] == "light_on_dark"
    assert tensor.shape == (1, 28, 28, 1)
    assert processed_28.shape == (28, 28)
    assert np.max(processed_28) > 100


def test_aspect_ratio_preservation_and_sizing():
    # Test tall image
    tall_bytes = create_test_image(size=(80, 240), bg="black", stroke_color="white", draw_digit=True)
    tensor, processed_28, meta = preprocess_image(tall_bytes)
    assert tensor.shape == (1, 28, 28, 1)
    assert meta["scaled_size"][1] <= 20
    assert meta["scaled_size"][0] <= 20

    # Test wide image
    wide_bytes = create_test_image(size=(300, 100), bg="black", stroke_color="white", draw_digit=True)
    tensor, processed_28, meta = preprocess_image(wide_bytes)
    assert tensor.shape == (1, 28, 28, 1)
    assert meta["scaled_size"][0] <= 20
    assert meta["scaled_size"][1] <= 20


def test_tensor_normalization_range():
    img_bytes = create_test_image(bg="black", stroke_color="white", draw_digit=True)
    tensor, _, _ = preprocess_image(img_bytes)

    assert tensor.dtype == np.float32
    assert np.min(tensor) >= 0.0
    assert np.max(tensor) <= 1.0
