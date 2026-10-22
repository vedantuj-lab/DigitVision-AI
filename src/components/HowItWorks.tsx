import React from 'react';
import { PenTool, Split, Crosshair, Cpu, BarChart2 } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      index: '01',
      title: 'Input Capture',
      desc: 'Vector brush strokes are captured on an HTML5 canvas or decoded from uploaded scans (PNG, JPG).',
      icon: PenTool
    },
    {
      index: '02',
      title: 'Polarity Detection',
      desc: 'Border pixels are sampled to identify background luminance, auto-inverting black ink on white paper.',
      icon: Split
    },
    {
      index: '03',
      title: 'Centering & Resampling',
      desc: 'Whitespace is cropped, aspect ratio preserved within 20×20, and shifted by center of mass into 28×28.',
      icon: Crosshair
    },
    {
      index: '04',
      title: 'CNN Feature Maps',
      desc: 'Two Conv2D (3×3) and MaxPooling layers detect hierarchical stroke contours and topological loops.',
      icon: Cpu
    },
    {
      index: '05',
      title: 'Softmax Distribution',
      desc: 'Dense layers produce normalized class probabilities for all ten digits summing to 1.0.',
      icon: BarChart2
    }
  ];

  return (
    <section className="py-12 border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="space-y-2 mb-10 text-center sm:text-left">
          <div className="text-xs font-mono uppercase tracking-wider text-lime-400 font-semibold">
            INSPECTION PIPELINE
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            How DigitVision AI Works
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            From raw user pixels to neural network inference: every image undergoes a mathematically
            rigorous preprocessing journey aligned with MNIST standard specifications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.index}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-lime-400/30 transition-all space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:text-lime-400 group-hover:bg-lime-400/10 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-500">{st.index}</span>
                </div>

                <h3 className="text-sm font-bold text-white">{st.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
