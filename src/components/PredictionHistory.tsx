import React from 'react';
import { History, Trash2, Clock, CheckCircle } from 'lucide-react';
import { PredictionRecord } from '../types';

interface PredictionHistoryProps {
  records: PredictionRecord[];
  onClear: () => void;
  onSelectRecord?: (record: PredictionRecord) => void;
}

export const PredictionHistory: React.FC<PredictionHistoryProps> = ({
  records,
  onClear,
  onSelectRecord
}) => {
  if (records.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center p-8 bg-[#12141f] border border-white/[0.08] rounded-2xl">
        <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-500 mb-3">
          <History className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">No Prediction History Yet</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Draw or upload a handwritten digit in the Recognizer tab to start tracking inference results.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-lime-400" />
          <h3 className="text-base font-bold text-white">Recent Predictions ({records.length})</h3>
        </div>

        <button
          onClick={onClear}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {records.map((rec) => {
          const formattedDate = new Date(rec.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          return (
            <div
              key={rec.id}
              onClick={() => onSelectRecord?.(rec)}
              className="p-3.5 bg-[#12141f] hover:bg-[#161826] border border-white/[0.08] hover:border-lime-400/40 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-black p-1 border border-white/10 shrink-0 flex items-center justify-center overflow-hidden">
                  <img
                    src={rec.preprocessed_preview || rec.thumbnail}
                    alt={`Input for digit ${rec.predicted_digit}`}
                    className="w-full h-full object-contain [image-rendering:pixelated]"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-mono font-extrabold text-lime-400">
                      {rec.predicted_digit}
                    </span>
                    <span className="text-xs font-mono text-white tabular-nums">
                      {(rec.confidence * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                    <span className="capitalize">{rec.input_method}</span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {formattedDate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
                <CheckCircle className="w-4 h-4 text-lime-400" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
