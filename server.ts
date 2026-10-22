import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  const metricsPath = path.resolve(process.cwd(), 'training/metrics.json');
  const weightsPath = path.resolve(process.cwd(), 'backend/models/weights.json');
  const ptModelPath = path.resolve(process.cwd(), 'backend/models/digit_model.pt');

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    const hasModel = fs.existsSync(ptModelPath) || fs.existsSync(weightsPath);
    const hasMetrics = fs.existsSync(metricsPath);

    return res.status(200).json({
      status: 'healthy',
      service: 'DigitVision AI',
      model_loaded: hasModel,
      metrics_available: hasMetrics,
      model_path: 'backend/models/digit_model.pt',
      message: hasModel
        ? 'Model ready for real-time handwritten digit recognition.'
        : 'Model training in progress or pending.'
    });
  });

  // Model Info endpoint
  app.get('/api/model-info', (req: Request, res: Response) => {
    let metricsData: Record<string, any> = {};
    if (fs.existsSync(metricsPath)) {
      try {
        metricsData = JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));
      } catch (err) {
        console.error('Error reading metrics:', err);
      }
    }

    return res.status(200).json({
      model_name: 'DigitVision-CNN',
      dataset: 'MNIST Handwritten Digits (60,000 train / 10,000 test)',
      num_classes: 10,
      classes: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
      input_shape: [28, 28, 1],
      architecture: [
        { layer: 'InputLayer', output: '28x28x1', params: 0, description: 'Single-channel grayscale matrix normalized to [0.0, 1.0]' },
        { layer: 'Conv2D (32 filters, 3x3)', output: '26x26x32', params: 320, description: 'Extracts 32 edge/curve features with ReLU activation' },
        { layer: 'MaxPooling2D (2x2)', output: '13x13x32', params: 0, description: 'Subsamples feature maps by 2x, translation invariance' },
        { layer: 'Conv2D (64 filters, 3x3)', output: '11x11x64', params: 18496, description: 'Extracts 64 higher-level stroke topology features' },
        { layer: 'MaxPooling2D (2x2)', output: '5x5x64', params: 0, description: 'Spatial pooling to 5x5 spatial resolution' },
        { layer: 'Flatten', output: '1600', params: 0, description: 'Unrolls 5x5x64 tensor into 1600-dimensional vector' },
        { layer: 'Dense (128 units, ReLU)', output: '128', params: 204928, description: 'Fully connected feature combination layer' },
        { layer: 'Dropout (0.3 rate)', output: '128', params: 0, description: '30% dropout during training to prevent co-adaptation' },
        { layer: 'Dense (10 units, Softmax)', output: '10', params: 1290, description: 'Probability distribution over digits 0 through 9' }
      ],
      metrics: metricsData
    });
  });

  // Predict endpoint
  app.post('/api/predict', async (req: Request, res: Response) => {
    let base64Image = req.body?.image || req.body?.file;

    if (!base64Image || typeof base64Image !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'No image provided. Please draw on the canvas or upload an image.'
      });
    }

    // Call Python prediction CLI
    const py = spawn('python3', ['-m', 'backend.predict_cli', base64Image], {
      cwd: process.cwd(),
      env: { ...process.env, PYTHONPATH: process.cwd() }
    });

    let stdoutData = '';
    let stderrData = '';

    py.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    py.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    py.on('close', (code) => {
      try {
        const trimmed = stdoutData.trim();
        if (trimmed) {
          const parsed = JSON.parse(trimmed);
          if (!parsed.success) {
            return res.status(400).json(parsed);
          }
          return res.status(200).json(parsed);
        }
      } catch (e) {
        console.error('Failed to parse Python output:', stdoutData, stderrData);
      }

      // If python failed or errored:
      if (stderrData.includes('EmptyImageError') || stdoutData.includes('EmptyImageError') || stdoutData.includes('empty')) {
        return res.status(400).json({
          success: false,
          error: 'Canvas or uploaded image is empty. Please draw or upload a clear digit.'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Prediction failed during image inference.',
        details: stderrData || 'Unknown Python error'
      });
    });
  });

  // Mount Vite middlewares in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DigitVision AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[DigitVision AI] Server failed to start:', err);
  process.exit(1);
});
