import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, LogIn, Shield, X, Check, Sparkles } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { user, login, loginAsGuest, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [role, setRole] = useState<'intern' | 'researcher' | 'evaluator' | 'guest'>('evaluator');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(name, email, role);
    onClose();
  };

  const handleQuickDemo = () => {
    login('Vedant (Evaluator)', 'vedantuj@gmail.com', 'evaluator');
    onClose();
  };

  const handleGuest = () => {
    loginAsGuest();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#12141f] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          title="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-lime-400 font-semibold uppercase">
            <Shield className="w-3.5 h-3.5" />
            <span>Researcher Authentication</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            {user ? 'Account Management' : 'Sign In to DigitVision AI'}
          </h3>
          <p className="text-xs text-slate-400">
            Sign in to track your personal prediction history, metrics, and document analyses.
          </p>
        </div>

        {/* Currently Logged In Status Banner */}
        {user && (
          <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-lime-400/20 border border-lime-400/40 flex items-center justify-center text-lime-400 font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-xs">
                <div className="text-white font-semibold">{user.name}</div>
                <div className="text-slate-400 font-mono text-[11px]">{user.email}</div>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
              }}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 hover:bg-rose-500/10 rounded"
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Quick 1-Click Access */}
        <div className="space-y-2">
          <button
            onClick={handleQuickDemo}
            className="w-full py-2.5 px-4 bg-lime-400 hover:bg-lime-300 text-black font-bold text-xs rounded-xl shadow-sm shadow-lime-400/20 flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Click Sign-In as Vedant (Evaluator)</span>
          </button>

          <button
            onClick={handleGuest}
            className="w-full py-2 px-4 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-medium text-xs rounded-xl border border-white/10 flex items-center justify-center gap-2 transition-colors"
          >
            <span>Continue as Guest Researcher</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#12141f] px-3 text-[11px] font-mono text-slate-500 uppercase">
            Or custom profile
          </span>
        </div>

        {/* Custom Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Your Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Alex Morgan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. alex@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-lime-400 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-lime-400 text-xs"
            >
              <option value="evaluator">Internship Evaluator</option>
              <option value="intern">Intern / Developer</option>
              <option value="researcher">AI/ML Researcher</option>
              <option value="guest">Guest</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors shadow-sm shadow-violet-600/30 text-xs mt-2"
          >
            Save & Enter Workspace
          </button>
        </form>
      </div>
    </div>
  );
};
