"""
DigitVision AI — Model Evaluation Script
=========================================
Loads a trained Keras model and evaluates it against the MNIST test dataset.
Generates metrics, per-class classification report, and confusion matrix.
"""

import os
import json
import numpy as np


def evaluate():
    model_path = "backend/models/digit_model.keras"
    if not os.path.exists(model_path):
        print(f"[Error] Model not found at '{model_path}'. Please run 'python training/train_model.py' first.")
        return False

    import tensorflow as tf

    print(f"[DigitVision AI] Loading model from {model_path}...")
    model = tf.keras.models.load_model(model_path)

    print("[DigitVision AI] Loading MNIST test dataset...")
    (_, _), (x_test, y_test) = tf.keras.datasets.mnist.load_data()
    x_test = (x_test.astype("float32") / 255.0)[..., np.newaxis]

    test_loss, test_acc = model.evaluate(x_test, y_test, verbose=0)
    print(f"\n================ Evaluation Results ================")
    print(f"Overall Accuracy: {test_acc * 100:.2f}%")
    print(f"Overall Loss:     {test_loss:.4f}")
    print("===================================================\n")

    predictions = model.predict(x_test, batch_size=64, verbose=0)
    pred_labels = np.argmax(predictions, axis=1)

    print(f"{'Digit':<6} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'Support':<8}")
    print("-" * 54)
    for d in range(10):
        tp = np.sum((y_test == d) & (pred_labels == d))
        fp = np.sum((y_test != d) & (pred_labels == d))
        fn = np.sum((y_test == d) & (pred_labels != d))
        support = int(np.sum(y_test == d))

        p = tp / (tp + fp) if (tp + fp) > 0 else 0
        r = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * p * r / (p + r) if (p + r) > 0 else 0

        print(f"{d:<6} | {p:<10.4f} | {r:<10.4f} | {f1:<10.4f} | {support:<8}")

    return True


if __name__ == "__main__":
    evaluate()
