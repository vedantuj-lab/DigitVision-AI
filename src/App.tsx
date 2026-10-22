/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { DrawingCanvas } from './components/DrawingCanvas';
import { ImageUploader } from './components/ImageUploader';
import { PredictionResult } from './components/PredictionResult';
import { ModelInfo } from './components/ModelInfo';
import { PredictionHistory } from './components/PredictionHistory';
import { HowItWorks } from './components/HowItWorks';
import { Footer } from './components/Footer';
import { LoginModal } from './components/LoginModal';
import { api } from './services/api';
import { PredictionResponse, PredictionRecord } from './types';
import { PenTool, Upload, AlertCircle, Sparkles, User, ShieldCheck } from 'lucide-react';

const STORAGE_KEY = 'digitvision_history_v1';

function AppContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'recognizer' | 'model' | 'history'>('home');
  const [inputMode, setInputMode] = useState<'draw' | 'upload'>('draw');
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<PredictionRecord[]>([]);
  const [isHealthy, setIsHealthy] = useState<boolean>(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Initialize history from localStorage safely
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('LocalStorage unavailable:', e);
    }

    // Health check
    api.checkHealth().then((res) => {
      setIsHealthy(res.status === 'healthy');
    });
  }, []);

  const saveToHistory = (newRecord: PredictionRecord) => {
    const updated = [newRecord, ...history.slice(0, 24)]; // Keep latest 25
    setHistory(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  };

  const handlePredict = async (imageDataUrl: string, method: 'canvas' | 'upload' | 'preset') => {
    setIsLoading(true);
    setErrorMessage(null);
    setInputImage(imageDataUrl);

    try {
      const res = await api.predictDigit(imageDataUrl);
      if (!res.success) {
        setErrorMessage(res.error || 'Prediction was not successful.');
        setPrediction(null);
      } else {
        setPrediction(res);

        // Add to history
        const record: PredictionRecord = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          timestamp: new Date().toISOString(),
          predicted_digit: res.predicted_digit,
          confidence: res.confidence,
          input_method: method,
          thumbnail: imageDataUrl,
          probabilities: res.probabilities,
          preprocessed_preview: res.preprocessed_preview
        };
        saveToHistory(record);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to communicate with prediction service.');
      setPrediction(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPrediction(null);
    setInputImage(null);
    setErrorMessage(null);
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }
  };

  const handleSelectHistoryRecord = (rec: PredictionRecord) => {
    setPrediction({
      success: true,
      predicted_digit: rec.predicted_digit,
      confidence: rec.confidence,
      probabilities: rec.probabilities,
      preprocessed_preview: rec.preprocessed_preview
    });
    setInputImage(rec.thumbnail);
    setActiveTab('recognizer');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0c10] text-slate-100 font-sans selection:bg-lime-400 selection:text-black">
      <Navbar
        activeTab={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isBackendHealthy={isHealthy}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      <main className="flex-1">
        {/* VIEW 1: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            <Hero
              onStart={() => {
                setActiveTab('recognizer');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onViewModel={() => {
                setActiveTab('model');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            <HowItWorks />

            {/* Quick Interactive Teaser Strip */}
            <section className="py-12 max-w-7xl mx-auto px-4 lg:px-8">
              <div className="p-8 rounded-3xl bg-gradient-to-r from-violet-950/40 via-[#10121a] to-black border border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                <div className="space-y-2">
                  <div className="text-xs font-mono text-lime-400 uppercase tracking-wider font-semibold">
                    UNIVERSAL DOCUMENT & SCAN INFERENCE
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Ready to evaluate handwritten digits?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                    Draw with mouse or touchscreen, or drop in images, multi-page PDFs, Word docs, PowerPoint
                    slides, or Excel sheets.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab('recognizer')}
                    className="px-6 py-3 text-sm font-bold text-black bg-lime-400 hover:bg-lime-300 rounded-xl shadow-lg shadow-lime-400/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0"
                  >
                    Open Recognizer Canvas
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: RECOGNIZER */}
        {activeTab === 'recognizer' && (
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-mono uppercase tracking-wider text-lime-400 font-semibold">
                  INTERACTIVE INFERENCE ENGINE
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Handwritten Digit Recognizer
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                  Draw a digit (0–9), or upload any image, PDF, Word, PowerPoint, or Excel document.
                  The system extracts and normalizes the digit before CNN inference.
                </p>
              </div>

              {/* User badge in Recognizer view */}
              {user && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-slate-300 self-start sm:self-auto">
                  <ShieldCheck className="w-3.5 h-3.5 text-lime-400" />
                  <span>Session: <strong className="text-white">{user.name}</strong></span>
                </div>
              )}
            </div>

            {/* Mode Selector Tabs (Draw vs Upload) */}
            <div className="inline-flex items-center p-1 bg-white/[0.04] border border-white/[0.08] rounded-xl">
              <button
                onClick={() => {
                  setInputMode('draw');
                  handleReset();
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  inputMode === 'draw'
                    ? 'bg-lime-400 text-black shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Draw on Canvas</span>
              </button>

              <button
                onClick={() => {
                  setInputMode('upload');
                  handleReset();
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  inputMode === 'upload'
                    ? 'bg-lime-400 text-black shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Images & Documents (PDF, Word, PPT, Excel)</span>
              </button>
            </div>

            {/* Global Error Banner */}
            {errorMessage && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-3">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Main Recognizer Layout: Left = Input (Canvas/Upload), Right = Result */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-lg bg-[#12141f] border border-white/[0.08] rounded-2xl p-6 shadow-xl flex flex-col items-center">
                  <div className="text-xs font-semibold text-slate-300 mb-4 w-full text-center">
                    {inputMode === 'draw'
                      ? 'Draw Digit on Canvas'
                      : 'Upload Files (Images, PDF, Word, PPT, Excel)'}
                  </div>

                  {inputMode === 'draw' ? (
                    <DrawingCanvas
                      onPredict={handlePredict}
                      isLoading={isLoading}
                    />
                  ) : (
                    <ImageUploader
                      onPredict={handlePredict}
                      isLoading={isLoading}
                    />
                  )}
                </div>
              </div>

              <div className="lg:col-span-7">
                {prediction && inputImage ? (
                  <PredictionResult
                    prediction={prediction}
                    originalImage={inputImage}
                    onReset={handleReset}
                  />
                ) : (
                  <div className="h-full min-h-[360px] bg-[#12141f]/50 border border-white/[0.06] rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-slate-500 font-mono text-xl font-bold">
                      ?
                    </div>
                    <div className="text-sm font-semibold text-white">Awaiting Handwritten Digit</div>
                    <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                      Draw a digit or upload any document/image on the left, then click{' '}
                      <strong className="text-lime-400">Predict</strong> to view the CNN classification and
                      probability distribution.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: MODEL INFORMATION */}
        {activeTab === 'model' && (
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <ModelInfo />
          </div>
        )}

        {/* VIEW 4: PREDICTION HISTORY */}
        {activeTab === 'history' && (
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
            <PredictionHistory
              records={history}
              onClear={handleClearHistory}
              onSelectRecord={handleSelectHistoryRecord}
            />
          </div>
        )}
      </main>

      <Footer />

      {/* Frictionless Login / User Profile Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
