export interface PreprocessingDetails {
  original_dimensions: [number, number];
  bounding_box: [number, number, number, number]; // [xmin, ymin, xmax, ymax]
  cropped_size: [number, number];
  scaled_size: [number, number];
  detected_polarity: 'light_on_dark' | 'dark_on_light';
  center_of_mass_shift: [number, number];
  foreground_pixel_count: number;
}

export interface PredictionResponse {
  success: boolean;
  predicted_digit: number;
  confidence: number;
  probabilities: number[];
  preprocessed_preview?: string;
  preprocessing_details?: PreprocessingDetails;
  error?: string;
}

export interface PredictionRecord {
  id: string;
  timestamp: string;
  predicted_digit: number;
  confidence: number;
  input_method: 'canvas' | 'upload' | 'preset';
  thumbnail: string;
  probabilities: number[];
  preprocessed_preview?: string;
}

export interface LayerArchitecture {
  layer: string;
  output: string;
  params: number;
  description: string;
}

export interface ClassMetric {
  precision: number;
  recall: number;
  f1_score: number;
  support: number;
}

export interface ModelMetrics {
  test_loss: number;
  test_accuracy: number;
  precision_macro: number;
  recall_macro: number;
  f1_macro: number;
}

export interface ModelInfoData {
  model_name: string;
  dataset: string;
  num_classes: number;
  classes: string[];
  input_shape: number[];
  architecture: LayerArchitecture[];
  metrics: {
    epochs_trained?: number;
    batch_size?: number;
    optimizer?: string;
    learning_rate?: number;
    test_metrics?: ModelMetrics;
    per_class_metrics?: Record<string, ClassMetric>;
    confusion_matrix?: number[][];
    total_parameters?: number;
    trainable_parameters?: number;
  };
}

export interface HealthResponse {
  status: string;
  service: string;
  model_loaded: boolean;
  metrics_available: boolean;
  model_path: string;
  message: string;
}
