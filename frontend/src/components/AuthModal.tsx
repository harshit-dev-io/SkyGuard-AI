import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, User, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-bark/60 dark:bg-black/75 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            className="relative w-full max-w-md bg-sheetWhite dark:bg-sheetWhite-dark border border-sage-mist dark:border-sage-dark rounded-cards p-8 z-10"
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-slate-muted hover:text-bark dark:hover:text-white transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Mode Tabs */}
            <div className="flex border-b border-sage-mist/60 dark:border-sage-dark pb-3 mb-6">
              <button
                onClick={() => { setMode('login'); setError(null); }}
                className={`text-[13px] font-bold uppercase tracking-[0.07em] pb-2 mr-6 border-b-2 transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'border-canopy dark:border-mint-pulse text-canopy dark:text-mint-pulse'
                    : 'border-transparent text-slate-muted hover:text-bark dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode('signup'); setError(null); }}
                className={`text-[13px] font-bold uppercase tracking-[0.07em] pb-2 border-b-2 transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'border-canopy dark:border-mint-pulse text-canopy dark:text-mint-pulse'
                    : 'border-transparent text-slate-muted hover:text-bark dark:hover:text-white'
                }`}
              >
                Register
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-inputs bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-[0.07em] text-slate dark:text-slate-dark mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="operator_12"
                      className="w-full pl-9 pr-3 py-2.5 bg-creamPaper dark:bg-canopy-dark/30 border border-pale-sage dark:border-sage-dark text-bark dark:text-white placeholder:text-slate-muted rounded-inputs text-xs focus:outline-none focus:border-canopy dark:focus:border-mint-pulse"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[12px] font-bold uppercase tracking-[0.07em] text-slate dark:text-slate-dark mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@skyguard.in"
                    className="w-full pl-9 pr-3 py-2.5 bg-creamPaper dark:bg-canopy-dark/30 border border-pale-sage dark:border-sage-dark text-bark dark:text-white placeholder:text-slate-muted rounded-inputs text-xs focus:outline-none focus:border-canopy dark:focus:border-mint-pulse"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold uppercase tracking-[0.07em] text-slate dark:text-slate-dark mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-creamPaper dark:bg-canopy-dark/30 border border-pale-sage dark:border-sage-dark text-bark dark:text-white placeholder:text-slate-muted rounded-inputs text-xs focus:outline-none focus:border-canopy dark:focus:border-mint-pulse"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-[0.07em] text-slate dark:text-slate-dark mb-1">
                    System Role
                  </label>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-slate-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'operator' | 'admin')}
                      className="w-full pl-9 pr-3 py-2.5 bg-creamPaper dark:bg-canopy-dark/30 border border-pale-sage dark:border-sage-dark text-bark dark:text-white rounded-inputs text-xs appearance-none focus:outline-none focus:border-canopy dark:focus:border-mint-pulse"
                    >
                      <option value="operator" className="bg-sheetWhite dark:bg-sheetWhite-dark text-bark dark:text-white">Field Operator</option>
                      <option value="admin" className="bg-sheetWhite dark:bg-sheetWhite-dark text-bark dark:text-white">System Administrator</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-3 bg-canopy dark:bg-mint-pulse text-white dark:text-bark hover:bg-canopy-dark dark:hover:bg-mint-hover text-[14px] font-medium rounded-buttons transition-all disabled:opacity-50 cursor-pointer shadow-none"
              >
                {loading ? 'Processing...' : mode === 'login' ? 'Sign In to Observatory' : 'Register Profile'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};