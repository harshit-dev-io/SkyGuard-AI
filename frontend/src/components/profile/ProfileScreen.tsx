import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../context/DashboardContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Mail,
  KeyRound,
  Sun,
  Moon,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  Fingerprint,
  Check,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export const ProfileScreen: React.FC = () => {
  const { user, token, logout } = useAuth();
  const { setActiveTab } = useDashboard();
  const { theme, setTheme, isDark } = useTheme();

  // Change password form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Logout confirmation modal/toggle
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update password.');
      }

      setPasswordSuccess('Password successfully updated! Your session credentials remain secure.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'An error occurred while updating your password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Active Member';

  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e0e0e0] dark:border-[#282e3a] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#141414] dark:text-white">
            User Profile &amp; Settings
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Session Active
          </span>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full border border-[#E5E3DC] dark:border-[#232936] bg-white dark:bg-[#151921] text-[#71717A] dark:text-[#94A3B8]">
            UID: SG-{user?.id ? String(user.id).padStart(4, '0') : '0001'}
          </span>
        </div>
      </div>

      {/* User Hero Overview Card */}
      <div className="relative overflow-hidden rounded-2xl border border-[#E5E3DC] dark:border-[#232936] bg-gradient-to-br from-white via-[#FAF8F5] to-emerald-500/5 dark:from-[#151921] dark:via-[#11141A] dark:to-[#0D0F12] p-6 sm:p-8 shadow-sm">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-serif text-3xl font-bold shadow-lg shadow-emerald-500/20 border-2 border-white dark:border-[#232936]">
              {userInitial}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-[#151921] flex items-center justify-center text-white">
              <Check className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#18181B] dark:text-[#F8FAFC]">
                {user?.username || 'Authenticated Operator'}
              </h2>
              <span
                className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold border ${
                  user?.role === 'admin'
                    ? 'border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                    : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {user?.role} Privileges
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-mono text-[#71717A] dark:text-[#94A3B8]">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{user?.email}</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Member since {formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Button: Sign Out */}
          <div className="sm:self-center w-full sm:w-auto mt-2 sm:mt-0">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: User Information + Theme Settings + Change Password */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (5 cols): Identity Details & Theme Customization */}
        <div className="lg:col-span-5 space-y-8">
          {/* Identity & Account Specs */}
          <div className="rounded-2xl border border-[#E5E3DC] dark:border-[#232936] bg-white dark:bg-[#151921] p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 border-b border-[#E5E3DC] dark:border-[#232936] pb-3">
              <Fingerprint className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-mono text-xs uppercase tracking-wider font-bold text-[#18181B] dark:text-[#F8FAFC]">
                Account &amp; Security Specs
              </h3>
            </div>

            <div className="space-y-3.5 text-xs font-mono">
              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800/60">
                <span className="text-[#71717A] dark:text-[#94A3B8]">Email Address:</span>
                <span className="font-semibold text-[#18181B] dark:text-[#F8FAFC] truncate max-w-[200px]" title={user?.email}>
                  {user?.email}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800/60">
                <span className="text-[#71717A] dark:text-[#94A3B8]">Username:</span>
                <span className="font-semibold text-[#18181B] dark:text-[#F8FAFC]">
                  {user?.username}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800/60">
                <span className="text-[#71717A] dark:text-[#94A3B8]">Assigned Role:</span>
                <span
                  className={`uppercase font-bold text-[11px] px-2 py-0.5 rounded-full border ${
                    user?.role === 'admin'
                      ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/50'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
                  }`}
                >
                  {user?.role}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800/60">
                <span className="text-[#71717A] dark:text-[#94A3B8]">Account Status:</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active / Verified
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800/60">
                <span className="text-[#71717A] dark:text-[#94A3B8]">Encryption:</span>
                <span className="text-[#18181B] dark:text-[#F8FAFC]">PBKDF2-HMAC-SHA256</span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-[#71717A] dark:text-[#94A3B8]">Telemetry Scope:</span>
                <span className="text-[#18181B] dark:text-[#F8FAFC]">500+ AWS Stations</span>
              </div>
            </div>
          </div>

          {/* Role-Based Permissions Overview */}
          <div className="rounded-2xl border border-[#E5E3DC] dark:border-[#232936] bg-white dark:bg-[#151921] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E3DC] dark:border-[#232936] pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="font-mono text-xs uppercase tracking-wider font-bold text-[#18181B] dark:text-[#F8FAFC]">
                  Navigation &amp; Access Scope
                </h3>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold">
                RBAC
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/50">
                <span className="text-neutral-600 dark:text-neutral-400">Fleet Telemetry &amp; KPIs:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Granted</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/50">
                <span className="text-neutral-600 dark:text-neutral-400">Geospatial Station Map:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Granted</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/50">
                <span className="text-neutral-600 dark:text-neutral-400">Explainability &amp; Invariants:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Granted</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/50">
                <span className="text-neutral-600 dark:text-neutral-400">Manage AWS &amp; Simulator:</span>
                <span
                  className={
                    user?.role === 'admin'
                      ? 'text-purple-600 dark:text-purple-400 font-bold'
                      : 'text-neutral-400 dark:text-neutral-600 font-medium'
                  }
                >
                  {user?.role === 'admin' ? 'Admin Full Access' : 'Restricted (Admin Only)'}
                </span>
              </div>
            </div>
          </div>

          {/* Theme Change Section */}
          <div className="rounded-2xl border border-[#E5E3DC] dark:border-[#232936] bg-white dark:bg-[#151921] p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-[#E5E3DC] dark:border-[#232936] pb-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-mono text-xs uppercase tracking-wider font-bold text-[#18181B] dark:text-[#F8FAFC]">
                  Interface Theme
                </h3>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] dark:text-[#94A3B8]">
                {theme} Mode Active
              </span>
            </div>

            <p className="text-xs text-[#71717A] dark:text-[#94A3B8]">
              Select your preferred dashboard appearance for high-contrast geospatial observation and telemetry monitoring.
            </p>

            <div className="grid grid-cols-2 gap-3.5">
              {/* Light Mode Selector Card */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`relative flex flex-col items-start p-4 rounded-xl border transition-all text-left ${
                  !isDark
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                    : 'border-[#E5E3DC] dark:border-[#232936] bg-[#FAF8F5] dark:bg-[#0D0F12] opacity-75 hover:opacity-100 hover:border-neutral-400 dark:hover:border-neutral-600'
                }`}
              >
                {!isDark && (
                  <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                  <Sun className="w-4 h-4" />
                </div>
                <span className="font-mono text-xs font-bold text-[#18181B] dark:text-[#F8FAFC]">
                  Light Canvas
                </span>
                <span className="text-[11px] text-[#71717A] dark:text-[#94A3B8] mt-0.5">
                  Warm editorial paper theme
                </span>
              </button>

              {/* Dark Mode Selector Card */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`relative flex flex-col items-start p-4 rounded-xl border transition-all text-left ${
                  isDark
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                    : 'border-[#E5E3DC] dark:border-[#232936] bg-[#FAF8F5] dark:bg-[#0D0F12] opacity-75 hover:opacity-100 hover:border-neutral-400 dark:hover:border-neutral-600'
                }`}
              >
                {isDark && (
                  <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center mb-3">
                  <Moon className="w-4 h-4" />
                </div>
                <span className="font-mono text-xs font-bold text-[#18181B] dark:text-[#F8FAFC]">
                  Dark Terminal
                </span>
                <span className="text-[11px] text-[#71717A] dark:text-[#94A3B8] mt-0.5">
                  Low-light tactical operations
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Change Password & Session Termination */}
        <div className="lg:col-span-7 space-y-8">
          {/* Change Password Card */}
          <div className="rounded-2xl border border-[#E5E3DC] dark:border-[#232936] bg-white dark:bg-[#151921] p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-[#E5E3DC] dark:border-[#232936] pb-4">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-mono text-xs uppercase tracking-wider font-bold text-[#18181B] dark:text-[#F8FAFC]">
                  Change Password &amp; Credentials
                </h3>
              </div>
              <p className="text-xs text-[#71717A] dark:text-[#94A3B8] mt-1.5">
                Keep your operator credentials protected. Passwords are securely hashed with PBKDF2 salt iterations.
              </p>
            </div>

            {/* Success Notification */}
            {passwordSuccess && (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 flex items-start gap-3 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Password Updated</p>
                  <p className="mt-0.5">{passwordSuccess}</p>
                </div>
              </div>
            )}

            {/* Error Notification */}
            {passwordError && (
              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 flex items-start gap-3 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Credential Error</p>
                  <p className="mt-0.5">{passwordError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Current Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#71717A] dark:text-[#94A3B8]">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 pr-10 text-xs font-mono rounded-xl border border-[#E5E3DC] dark:border-[#232936] bg-[#FAF8F5] dark:bg-[#0D0F12] text-[#18181B] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#18181B] dark:hover:text-white"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#71717A] dark:text-[#94A3B8]">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-3.5 py-2.5 pr-10 text-xs font-mono rounded-xl border border-[#E5E3DC] dark:border-[#232936] bg-[#FAF8F5] dark:bg-[#0D0F12] text-[#18181B] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#18181B] dark:hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#71717A] dark:text-[#94A3B8]">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-3.5 py-2.5 pr-10 text-xs font-mono rounded-xl border border-[#E5E3DC] dark:border-[#232936] bg-[#FAF8F5] dark:bg-[#0D0F12] text-[#18181B] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#18181B] dark:hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirement Hint */}
              <div className="text-[11px] font-mono text-[#71717A] dark:text-[#94A3B8] flex items-center gap-2 pt-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    newPassword.length >= 8 ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-700'
                  }`}
                />
                <span>Minimum 8 alphanumeric characters required</span>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-mono uppercase tracking-wider font-bold bg-[#18181B] dark:bg-[#F8FAFC] text-white dark:text-[#0D0F12] hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                >
                  {passwordLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Updating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Session Termination & Logout Card */}
          <div className="rounded-2xl border border-rose-200 dark:border-rose-950 bg-rose-50/30 dark:bg-rose-950/10 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <h3 className="font-mono text-xs uppercase tracking-wider font-bold text-rose-700 dark:text-rose-400">
                Session Management &amp; Termination
              </h3>
            </div>
            <p className="text-xs text-[#71717A] dark:text-[#94A3B8]">
              Logging out will revoke your active JWT access tokens from browser storage and return you to the SkyGuard AI authentication portal.
            </p>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold border border-rose-300 dark:border-rose-800 bg-white dark:bg-[#151921] text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all shadow-sm flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out of Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#E5E3DC] dark:border-[#232936] bg-white dark:bg-[#151921] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h4 className="font-serif text-lg font-bold text-[#18181B] dark:text-[#F8FAFC]">
                Confirm Sign Out?
              </h4>
              <p className="text-xs text-[#71717A] dark:text-[#94A3B8]">
                Are you sure you want to end your active operator session for <strong>{user?.email}</strong>?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-mono uppercase tracking-wider border border-[#E5E3DC] dark:border-[#232936] text-[#71717A] dark:text-[#94A3B8] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-mono uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors shadow-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;
