"""
DigitVision AI — CNN Model Training Script
===========================================
Trains a genuine Convolutional Neural Network on the official MNIST dataset (60,000 train, 10,000 test)
using TensorFlow/Keras.

Architecture:
- Input: 28x28x1
- Conv2D(32, (3,3), relu)
- MaxPooling2D((2,2))
- Conv2D(64, (3,3), relu)
- MaxPooling2D((2,2))
- Flatten
- Dense(128, relu)
- Dropout(0.3)
- Dense(10, softmax)

Saves:
- Best model artifact to: backend/models/digit_model.keras
- Evaluation metrics and confusion matrix to: training/metrics.json
"""

import os
import json
import datetime
import numpy as np

# Ensure model directory exists
os.makedirs("backend/models", exist_ok=True)
os.makedirs("training", exist_ok=True)


def build_cnn_model():
    import tensorflow as tf
    from tensorflow.keras import layers, models

    model = models.Sequential([
        layers.Input(shape=(28, 28, 1)),
        layers.Conv2D(32, kernel_size=(3, 3), activation="relu", name="conv1"),
        layers.MaxPooling2D(pool_size=(2, 2), name="pool1"),
        layers.Conv2D(64, kernel_size=(3, 3), activation="relu", name="conv2"),
        layers.MaxPooling2D(pool_size=(2, 2), name="pool2"),
        layers.Flatten(name="flatten"),
        layers.Dense(128, activation="relu", name="dense1"),
        layers.Dropout(0.3, name="dropout"),
        layers.Dense(10, activation="softmax", name="output_probabilities")
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )
    return model


def train_and_evaluate(epochs=10, batch_size=64):
    import tensorflow as tf
    from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

    print("[DigitVision AI] Loading official MNIST dataset...")
    (x_train, y_train), (x_test, y_test) = tf.keras.datasets.mnist.load_data()

    # Normalize to [0.0, 1.0] and expand dimensions to (N, 28, 28, 1)
    x_train = x_train.astype("float32") / 255.0
    x_test = x_test.astype("float32") / 255.0
    x_train = np.expand_dims(x_train, -1)
    x_test = np.expand_dims(x_test, -1)

    # Reserve 10% for validation
    val_split = int(0.1 * len(x_train))
    x_val, y_val = x_train[:val_split], y_train[:val_split]
    x_train, y_train = x_train[val_split:], y_train[val_split:]

    print(f"[DigitVision AI] Train set: {x_train.shape[0]}, Val set: {x_val.shape[0]}, Test set: {x_test.shape[0]}")

    model = build_cnn_model()
    model.summary()

    model_path = "backend/models/digit_model.keras"

    callbacks = [
        EarlyStopping(monitor="val_accuracy", patience=3, restore_best_weights=True, verbose=1),
        ModelCheckpoint(filepath=model_path, monitor="val_accuracy", save_best_only=True, verbose=1)
    ]

    print(f"[DigitVision AI] Starting CNN training for {epochs} epochs...")
    history = model.fit(
        x_train, y_train,
        validation_data=(x_val, y_val),
        epochs=epochs,
        batch_size=batch_size,
        callbacks=callbacks,
        verbose=1
    )

    print("[DigitVision AI] Evaluating on 10,000 MNIST test images...")
    test_loss, test_acc = model.evaluate(x_test, y_test, verbose=0)
    print(f"[DigitVision AI] Test Accuracy: {test_acc * 100:.2f}%, Test Loss: {test_loss:.4f}")

    # Generate predictions for confusion matrix and per-class metrics
    predictions = model.predict(x_test, batch_size=batch_size, verbose=0)
    pred_labels = np.argmax(predictions, axis=1)

    # Compute 10x10 confusion matrix
    cm = np.zeros((10, 10), dtype=int)
    for true_l, pred_l in zip(y_test, pred_labels):
        cm[true_l, pred_l] += 1

    # Per-class metrics
    per_class = {}
    precisions, recalls, f1s = [], [], []
    for d in range(10):
        tp = cm[d, d]
        fp = np.sum(cm[:, d]) - tp
        fn = np.sum(cm[d, :]) - tp
        support = int(np.sum(cm[d, :]))

        p = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
        r = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
        f1 = float(2 * p * r / (p + r)) if (p + r) > 0 else 0.0

        precisions.append(p)
        recalls.append(r)
        f1s.append(f1)

        per_class[str(d)] = {
            "precision": round(p, 4),
            "recall": round(r, 4),
            "f1_score": round(f1, 4),
            "support": support
        }

    metrics = {
        "model_name": "DigitVision-CNN",
        "dataset": "MNIST Handwritten Digits (LeCun et al.)",
        "input_shape": [28, 28, 1],
        "num_classes": 10,
        "classes": [str(i) for i in range(10)],
        "training_timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "epochs_trained": len(history.history["loss"]),
        "batch_size": batch_size,
        "optimizer": "adam",
        "learning_rate": 0.001,
        "loss_function": "sparse_categorical_crossentropy",
        "test_metrics": {
            "test_loss": round(float(test_loss), 4),
            "test_accuracy": round(float(test_acc), 4),
            "precision_macro": round(float(np.mean(precisions)), 4),
            "recall_macro": round(float(np.mean(recalls)), 4),
            "f1_macro": round(float(np.mean(f1s)), 4)
        },
        "per_class_metrics": per_class,
        "confusion_matrix": cm.tolist(),
        "total_parameters": int(model.count_params()),
        "trainable_parameters": int(sum([tf.keras.backend.count_params(w) for w in model.trainable_weights]))
    }

    metrics_path = "training/metrics.json"
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"[DigitVision AI] Successfully saved model to {model_path} and metrics to {metrics_path}")
    return metrics


if __name__ == "__main__":
    train_and_evaluate()
