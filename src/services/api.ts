import { HealthResponse, ModelInfoData, PredictionResponse } from '../types';

/**
 * Centralized API client for DigitVision AI.
 * Uses relative paths matching the server proxy or configured backend URL.
 */
class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = (import.meta as any).env?.VITE_BACKEND_URL || '';
  }

  async checkHealth(): Promise<HealthResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/api/health`);
      if (!res.ok) {
        throw new Error(`Health check returned status ${res.status}`);
      }
      return await res.json();
    } catch (err: any) {
      return {
        status: 'unreachable',
        service: 'DigitVision AI',
        model_loaded: false,
        metrics_available: false,
        model_path: 'backend/models/digit_model.pt',
        message: err?.message || 'Unable to connect to backend server'
      };
    }
  }

  async getModelInfo(): Promise<ModelInfoData> {
    const res = await fetch(`${this.baseUrl}/api/model-info`);
    if (!res.ok) {
      throw new Error(`Failed to fetch model info (Status ${res.status})`);
    }
    return await res.json();
  }

  async predictDigit(imageDataUrlOrBase64: string): Promise<PredictionResponse> {
    const res = await fetch(`${this.baseUrl}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ image: imageDataUrlOrBase64 })
    });

    const data: PredictionResponse = await res.json();
    if (!res.ok && !data.error) {
      throw new Error(`Server returned status ${res.status}`);
    }
    return data;
  }
}

export const api = new ApiService();
