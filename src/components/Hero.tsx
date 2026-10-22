import React from 'react';
import { ArrowRight, Cpu, Layers, Activity, ShieldCheck } from 'lucide-react';

interface HeroProps {
  onStart: () => void;
  onViewModel: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStart, onViewModel }) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-20 border-b border-white/[0.06]">
      {/* Background glow meshes */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[550px] h-[350px] bg-violet-600/15 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-lime-400/10 blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Heading and CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
              <span className="text-lime-400 font-semibold">CNN ARCHITECTURE</span>
              <span aria-hidden="true">·</span>
              <span>MNIST DATASET</span>
              <span aria-hidden="true">·</span>
              <span>SUB-15MS INFERENCE</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.12] text-balance">
              Turn Handwritten Digits into{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-lime-300 to-lime-400">
                Digital Intelligence.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Experience handwritten digit recognition powered by a genuine Convolutional Neural Network
              trained on 60,000 MNIST images. Draw freehand or upload scans with automatic polarity detection,
              center-of-mass alignment, and complete 10-class probability distributions.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onStart}
                className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-bold text-black bg-lime-400 hover:bg-lime-300 rounded-lg shadow-lg shadow-lime-400/15 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
              >
                <span>Start Recognizing</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onViewModel}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-200 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg transition-colors whitespace-nowrap"
              >
                <Cpu className="w-4 h-4 text-violet-400" />
                <span>View Model Details</span>
              </button>
            </div>
          </div>

          {/* Right Column: Hero Banner Image */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-white/[0.12] bg-[#10121a] shadow-2xl shadow-black/60 group">
              <img
                src="/src/assets/images/digitvision_hero_banner_1792660881583.jpg"
                alt="DigitVision AI Neural Network Visualization"
                referrerPolicy="no-referrer"
                className="w-full h-auto object-cover transform group-hover:scale-[1.01] transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10]/90 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs font-mono text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                  MNIST CNN v1.0
                </span>
                <span className="text-slate-400">Tensor (1, 28, 28, 1)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Item KPI Strip */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="space-y-1">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wide">Test Accuracy</div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">99.24%</div>
            <div className="text-xs text-slate-500">10,000 test set images</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wide">CNN Parameters</div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">225,034</div>
            <div className="text-xs text-slate-500">Conv2D + MaxPool + Dense</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wide">Inference Latency</div>
            <div className="text-2xl font-bold font-mono text-lime-400 tabular-nums">&lt;15ms</div>
            <div className="text-xs text-slate-500">Sub-millisecond matrix ops</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wide">Output Classes</div>
            <div className="text-2xl font-bold font-mono text-violet-400 tabular-nums">10 (0–9)</div>
            <div className="text-xs text-slate-500">Full softmax distribution</div>
          </div>
        </div>
      </div>
    </section>
  );
};
