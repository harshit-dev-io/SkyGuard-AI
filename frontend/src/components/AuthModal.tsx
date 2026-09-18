import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, User, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'signup';
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, initialMode, onClose }) => {
  const { loginWithToken } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'operator' | 'admin'>('operator');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setMode(initialMode);
    setError(null);
  }, [initialMode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = mode === 'login'
      ? `${API_BASE_URL}/auth/login`
      : `${API_BASE_URL}/auth/signup`;

    const payload = mode === 'login'
      ? { email, password }
      : { email, password, username, role };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      if (mode === 'login') {
        await loginWithToken(data.access_token, data.refresh_token);
        onClose();
      } else {
        // Switch to login tab upon successful registration
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            className="relative w-full max-w-md bg-surface-light dark:bg-surface-dark border border-borderMuted-light dark:border-borderMuted-dark rounded-2xl shadow-2xl p-8 z-10"
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-neutral-400 hover:text-ink-light dark:hover:text-ink-dark transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex border-b border-borderMuted-light dark:border-borderMuted-dark pb-3 mb-6">
              <button
                onClick={() => { setMode('login'); setError(null); }}
                className={`text-xs font-mono uppercase tracking-widest pb-2 mr-6 border-b-2 transition-all ${
                  mode === 'login'
                    ? 'border-ink-light dark:border-ink-dark text-ink-light dark:text-ink-dark font-bold'
                    : 'border-transparent text-neutral-400'
                }`}
              >
                Log In
              </button>
              <button
                onClick={() => { setMode('signup'); setError(null); }}
                className={`text-xs font-mono uppercase tracking-widest pb-2 border-b-2 transition-all ${
                  mode === 'signup'
                    ? 'border-ink-light dark:border-ink-dark text-ink-light dark:text-ink-dark font-bold'
                    : 'border-transparent text-neutral-400'
                }`}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-500 mb-1">Username</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="operator_12"
                      className="w-full pl-9 pr-3 py-2 bg-paper-light dark:bg-paper-dark border border-borderMuted-light dark:border-borderMuted-dark rounded text-xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-500 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@skyguard.in"
                    className="w-full pl-9 pr-3 py-2 bg-paper-light dark:bg-paper-dark border border-borderMuted-light dark:border-borderMuted-dark rounded text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-500 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-paper-light dark:bg-paper-dark border border-borderMuted-light dark:border-borderMuted-dark rounded text-xs"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-500 mb-1">System Role</label>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'operator' | 'admin')}
                      className="w-full pl-9 pr-3 py-2 bg-paper-light dark:bg-paper-dark border border-borderMuted-light dark:border-borderMuted-dark rounded text-xs appearance-none"
                    >
                      <option value="operator">Field Operator</option>
                      <option value="admin">System Administrator</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 bg-ink-light dark:bg-ink-dark text-surface-light dark:text-surface-dark font-mono text-xs uppercase tracking-widest rounded disabled:opacity-50"
              >
                {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Register Profile'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};