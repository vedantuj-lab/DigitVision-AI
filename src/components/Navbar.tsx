import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: 'home' | 'recognizer' | 'model' | 'history';
  onNavigate: (tab: 'home' | 'recognizer' | 'model' | 'history') => void;
  isBackendHealthy: boolean;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onNavigate,
  isBackendHealthy,
  onOpenLogin
}) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-[#0b0c10]/90 backdrop-blur-md border-b border-white/[0.08] px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Wordmark */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-lime-400 p-[1px] shadow-sm shadow-violet-500/20">
            <div className="w-full h-full bg-[#0d0e15] rounded-[7px] flex items-center justify-center">
              <span className="font-bold text-sm tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-violet-300 to-lime-300 font-mono">
                9
              </span>
            </div>
          </div>
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0 group-hover:text-slate-200 transition-colors">
            DigitVision<span className="text-lime-400 ml-1 font-mono text-sm">AI</span>
          </span>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          <button
            onClick={() => onNavigate('home')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white pb-0.5 ${
              activeTab === 'home'
                ? 'text-white border-b-2 border-lime-400 font-semibold'
                : 'text-slate-400'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onNavigate('recognizer')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white pb-0.5 ${
              activeTab === 'recognizer'
                ? 'text-white border-b-2 border-lime-400 font-semibold'
                : 'text-slate-400'
            }`}
          >
            Recognizer
          </button>
          <button
            onClick={() => onNavigate('model')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white pb-0.5 ${
              activeTab === 'model'
                ? 'text-white border-b-2 border-lime-400 font-semibold'
                : 'text-slate-400'
            }`}
          >
            Model Architecture
          </button>
          <button
            onClick={() => onNavigate('history')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-white pb-0.5 ${
              activeTab === 'history'
                ? 'text-white border-b-2 border-lime-400 font-semibold'
                : 'text-slate-400'
            }`}
          >
            Prediction History
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action & User Account Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-lg transition-colors whitespace-nowrap shrink-0"
            title="User Account & Login"
          >
            <div className="w-4 h-4 rounded-full bg-lime-400/20 text-lime-400 flex items-center justify-center text-[10px] font-bold">
              {user ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-2.5 h-2.5" />}
            </div>
            <span className="max-w-[100px] truncate">{user ? user.name.split(' ')[0] : 'Sign In'}</span>
          </button>

          <button
            onClick={() => onNavigate('recognizer')}
            className="px-4 py-2 text-xs font-semibold text-black bg-lime-400 hover:bg-lime-300 rounded-lg shadow-sm shadow-lime-400/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0"
          >
            Start Recognizing
          </button>
        </div>
      </div>
    </header>
  );
};
