import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RefreshCw, RotateCcw, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import { ProbabilityChart } from './ProbabilityChart';
import { PredictionResponse } from '../types';

interface PredictionResultProps {
  prediction: PredictionResponse;
  originalImage: string;
  onReset: () => void;
}

export const PredictionResult: React.FC<PredictionResultProps> = ({
  prediction,
  originalImage,
  onReset
}) => {
  const { predicted_digit, confidence, probabilities, preprocessed_preview, preprocessing_details } =
    prediction;

  useEffect(() => {
    if (confidence > 0.85) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#a3e635', '#c084fc', '#ffffff']
      });
    }
  }, [confidence]);

  const confidencePct = Math.round(confidence * 1000) / 10;
  const isHighConfidence = confidence >= 0.85;
  const isModerateConfidence = confidence >= 0.55 && confidence < 0.85;

  return (
    <div className="w-full bg-[#12141f] border border-white/[0.1] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      {/* Background radial accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-lime-400/5 blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Digit Hero & Inputs */}
        <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Model Prediction
            </span>
            <div className="flex items-baseline gap-3">
              <div className="text-7xl font-extrabold font-mono text-lime-400 drop-shadow-[0_0_25px_rgba(163,230,53,0.35)]">
                {predicted_digit}
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold font-mono text-white tabular-nums">
                  {confidencePct.toFixed(1)}%
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  {isHighConfidence ? (
                    <span className="flex items-center gap-1 text-lime-400 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> High Confidence
                    </span>
                  ) : isModerateConfidence ? (
                    <span className="flex items-center gap-1 text-amber-400 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5" /> Moderate Confidence
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-400 font-medium">
                      <HelpCircle className="w-3.5 h-3.5" /> Ambiguous Stroke
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Preprocessing Visual Comparison */}
          <div className="w-full p-3.5 bg-black/40 border border-white/[0.08] rounded-xl space-y-3">
            <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Pipeline Visual Inspection</span>
              <span className="text-[10px] font-mono text-slate-400">
                {preprocessing_details?.detected_polarity === 'dark_on_light'
                  ? 'Inverted (Dark on Light)'
                  : 'Native Polarity'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center p-2 bg-[#090a0f] rounded-lg border border-white/5">
                <div className="text-[10px] font-mono text-slate-400 mb-1">User Input</div>
                <img
                  src={originalImage}
                  alt="Original drawing or upload"
                  className="w-16 h-16 object-contain rounded bg-black"
                />
              </div>

              <div className="flex flex-col items-center p-2 bg-[#090a0f] rounded-lg border border-white/5">
                <div className="text-[10px] font-mono text-slate-400 mb-1">
                  CNN Input (28×28)
                </div>
                {preprocessed_preview ? (
                  <img
                    src={preprocessed_preview}
                    alt="Preprocessed 28x28 matrix"
                    className="w-16 h-16 object-contain rounded bg-black [image-rendering:pixelated]"
                  />
                ) : (
                  <div className="w-16 h-16 bg-slate-900 rounded flex items-center justify-center text-[10px] text-slate-500 font-mono">
                    28×28
                  </div>
                )}
              </div>
            </div>

            {preprocessing_details && (
              <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-white/5">
                <span>Scaled: {preprocessing_details.scaled_size.join('×')}px</span>
                <span>CoM Shift: [{preprocessing_details.center_of_mass_shift.join(', ')}]</span>
              </div>
            )}
          </div>

          {/* Reset & Clear Buttons */}
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={onReset}
              className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-200 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear & Try Again</span>
            </button>
          </div>
        </div>

        {/* Right Column: Probability Chart & Confidence Disclaimer */}
        <div className="lg:col-span-7 space-y-4">
          <ProbabilityChart
            probabilities={probabilities}
            predictedDigit={predicted_digit}
          />

          {/* Disclaimer */}
          <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-[11px] text-slate-400 leading-relaxed">
            <span className="text-slate-300 font-medium">Model Confidence Notice:</span>{' '}
            Softmax output probabilities reflect relative activation scores among digits 0–9.
            High confidence does not guarantee factual ground truth on non-digit symbols or complex multi-glyph inputs.
          </div>
        </div>
      </div>
    </div>
  );
};
