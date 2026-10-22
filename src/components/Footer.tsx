import React, { useState } from 'react';
import { Github, BookOpen, Terminal, Check, Copy } from 'lucide-react';

export const Footer: React.FC = () => {
  const [showGithubModal, setShowGithubModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const gitCommands = `# 1. Initialize local repository
git init
git add .
git commit -m "feat: complete DigitVision AI handwritten recognition platform"

# 2. Add remote GitHub repo
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/digitvision-ai.git

# 3. Push code
git push -u origin main`;

  const copyGit = () => {
    navigator.clipboard.writeText(gitCommands);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="mt-20 border-t border-white/[0.08] bg-[#08090d] py-12 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-lime-400/20 border border-lime-400/30 flex items-center justify-center font-mono font-bold text-lime-400 text-xs">
              9
            </div>
            <div>
              <span className="font-bold text-sm text-white">DigitVision AI</span>
              <span className="block text-[11px] text-slate-500">
                Turn Handwritten Digits into Digital Intelligence
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs">
            <button
              onClick={() => setShowGithubModal(true)}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Github className="w-4 h-4 text-slate-400" />
              <span>GitHub Publish Instructions</span>
            </button>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span className="text-slate-400 font-mono">Internship Capstone Project</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/[0.05] text-[11px] text-slate-500">
          <div>
            Built with React 19, TypeScript, PyTorch/Keras, and Flask · MNIST Dataset (LeCun et al.)
          </div>
          <div>
            Author: <span className="text-slate-300 font-medium">Internship Candidate</span> · All Rights Reserved
          </div>
        </div>
      </div>

      {/* GitHub Publication Modal */}
      {showGithubModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141f] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Github className="w-4 h-4 text-lime-400" />
                <span>Publish to GitHub</span>
              </div>
              <button
                onClick={() => setShowGithubModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Run these commands in PowerShell or Bash from your project root folder to publish DigitVision AI
              to your GitHub account for evaluation:
            </p>

            <div className="relative">
              <pre className="p-4 bg-black/60 rounded-xl border border-white/10 text-xs font-mono text-lime-300 overflow-x-auto">
                {gitCommands}
              </pre>
              <button
                onClick={copyGit}
                className="absolute top-2.5 right-2.5 p-1.5 bg-white/10 hover:bg-white/20 rounded-md text-slate-200 transition-colors"
                title="Copy commands"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-lime-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="text-[11px] text-slate-400 space-y-1">
              <div>• Replace <code className="text-violet-300">YOUR_USERNAME</code> with your GitHub account.</div>
              <div>• A comprehensive <code className="text-lime-300">README.md</code> is included with instructions.</div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
