"""
DigitVision AI — Prediction CLI Tool
====================================
Runs the full preprocessing and CNN inference pipeline on an image file or base64 string.
Outputs JSON to stdout.
"""

import sys
import json
import base64
from backend.preprocessing import preprocess_image, EmptyImageError, InvalidImageError
from backend.cnn_infer import infer_digit


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No image input provided"}))
        sys.exit(1)

    raw_input = sys.argv[1]

    # Check if input is a file path
    import os
    if os.path.exists(raw_input):
        with open(raw_input, "rb") as f:
            image_bytes = f.read()
    else:
        # Base64 string
        b64_str = raw_input
        if "," in b64_str:
            b64_str = b64_str.split(",", 1)[1]
        try:
            image_bytes = base64.b64decode(b64_str)
        except Exception as e:
            print(json.dumps({"success": False, "error": f"Invalid base64: {str(e)}"}))
            sys.exit(1)

    try:
        tensor, processed_28, metadata = preprocess_image(image_bytes)
    except EmptyImageError as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(0)
    except InvalidImageError as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Preprocessing error: {str(e)}"}))
        sys.exit(1)

    try:
        pred_digit, conf, probs = infer_digit(tensor)

        # Build base64 preview of 28x28
        import io
        from PIL import Image
        thumb = Image.fromarray(processed_28)
        buf = io.BytesIO()
        thumb.save(buf, format="PNG")
        preview_b64 = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

        result = {
            "success": True,
            "predicted_digit": pred_digit,
            "confidence": conf,
            "probabilities": probs,
            "preprocessed_preview": preview_b64,
            "preprocessing_details": metadata
        }
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Inference failed: {str(e)}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
