import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, User, Shield, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'signup';
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, initialMode, onClose }) => {
  const { loginWithToken, enterDemoSandbox } = useAuth();
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
        // Upon successful account creation, attempt immediate login
        if (data.access_token) {
          await loginWithToken(data.access_token, data.refresh_token);
          onClose();
        } else {
          try {
            const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            });
            if (loginRes.ok) {
              const loginData = await loginRes.json();
              if (loginData.access_token) {
                await loginWithToken(loginData.access_token, loginData.refresh_token);
                onClose();
                return;
              }
            }
          } catch (loginErr) {
            console.warn('Auto-login after signup failed:', loginErr);
          }
          setMode('login');
        }
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
            className="relative w-full max-w-md bg-white dark:bg-[#1E1A15] border border-cardBorder dark:border-[#332C23] rounded-xl p-8 z-10 shadow-[0_12px_32px_-4px_rgba(27,26,24,0.18)]"
          >
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-inkMuted hover:text-brandDark dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Mode Tabs */}
            <div className="flex border-b border-cardBorder dark:border-[#332C23] pb-3 mb-6">
              <button
                onClick={() => { setMode('login'); setError(null); }}
                className={`text-[13px] font-semibold uppercase tracking-wider pb-2 mr-6 border-b-2 transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'border-brandAccent text-brandAccent'
                    : 'border-transparent text-inkMuted hover:text-brandDark dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode('signup'); setError(null); }}
                className={`text-[13px] font-semibold uppercase tracking-wider pb-2 border-b-2 transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'border-brandAccent text-brandAccent'
                    : 'border-transparent text-inkMuted hover:text-brandDark dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-signalRed text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-wider text-inkMuted dark:text-[#9A938A] mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-inkMuted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="operator_12"
                      className="w-full pl-9 pr-3 py-2 bg-panelBg dark:bg-[#26211A] border border-cardBorder dark:border-[#332C23] text-brandDark dark:text-white placeholder:text-inkMuted rounded-lg text-xs focus:outline-none focus:border-brandAccent"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-inkMuted dark:text-[#9A938A] mb-1">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-inkMuted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@noaa.gov or demo@skyguard.ai"
                    className="w-full pl-9 pr-3 py-2 bg-panelBg dark:bg-[#26211A] border border-cardBorder dark:border-[#332C23] text-brandDark dark:text-white placeholder:text-inkMuted rounded-lg text-xs focus:outline-none focus:border-brandAccent font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold uppercase tracking-wider text-inkMuted dark:text-[#9A938A] mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-inkMuted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-panelBg dark:bg-[#26211A] border border-cardBorder dark:border-[#332C23] text-brandDark dark:text-white placeholder:text-inkMuted rounded-lg text-xs focus:outline-none focus:border-brandAccent"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-wider text-inkMuted dark:text-[#9A938A] mb-1">
                    System Role
                  </label>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-inkMuted absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'operator' | 'admin')}
                      className="w-full pl-9 pr-3 py-2 bg-panelBg dark:bg-[#26211A] border border-cardBorder dark:border-[#332C23] text-brandDark dark:text-white rounded-lg text-xs appearance-none focus:outline-none focus:border-brandAccent cursor-pointer"
                    >
                      <option value="operator" className="bg-white dark:bg-[#1E1A15] text-brandDark dark:text-white">Field Operator</option>
                      <option value="admin" className="bg-white dark:bg-[#1E1A15] text-brandDark dark:text-white">System Administrator</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 mt-2 bg-brandAccent text-white hover:opacity-95 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {loading ? 'Processing...' : mode === 'login' ? 'Sign In to Observatory' : 'Create Free Account'}
              </button>

              {/* - AI Institutional Divider & Sandbox CTA */}
              <div className="relative my-3 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full h-[1px] bg-cardBorder dark:border-[#332C23]" />
                </div>
                <div className="relative bg-white dark:bg-[#1E1A15] px-3 text-[11px] font-mono text-inkMuted dark:text-[#9A938A] uppercase tracking-wider">
                  or
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  enterDemoSandbox();
                  onClose();
                }}
                className="w-full py-2.5 px-3 rounded-lg bg-accentSoft dark:bg-[#3A2416] hover:bg-brandAccent/15 text-accentText dark:text-[#FF9B60] text-xs font-semibold flex flex-col items-center justify-center transition-all cursor-pointer border border-accentSoftBorder dark:border-[#4A301E] shadow-sm"
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-4 h-4 text-brandAccent" />
                  <span>Try Demo Instead</span>
                </div>
                <span className="text-[11px] text-inkMuted dark:text-[#9A938A] mt-0.5 font-normal">
                  (Instant live 10-min sandbox session with guided interactive demo)
                </span>
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};