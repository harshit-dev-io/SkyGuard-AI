import React, { useState, useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import type { DashboardTab } from '../../context/DashboardContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  Sun,
  Moon,
  Shield,
  Activity,
  Sparkles,
  Info,
  Compass,
  Bell,
} from 'lucide-react';
import { SystemDemoModal } from '../shared/SystemDemoModal';
import operatorAvatar from '../../assets/operator-avatar.png';
import skyguardLogo from '../../assets/skyguard-logo.png';

interface ProfileAvatarProps {
  onClick: () => void;
  isActive?: boolean;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ onClick, isActive }) => {
  const { user } = useAuth();

  return (
    <button
      onClick={onClick}
      title={user ? `${user.username} (${user.role.toUpperCase()}) - View Profile` : 'User Profile'}
      aria-label="User profile settings"
      className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer select-none ml-1 ${
        isActive ? 'ring-2 ring-brandAccent ring-offset-2' : ''
      }`}
    >
      <img
        src={operatorAvatar}
        alt="Operator Profile"
        className="w-8 h-8 rounded-full object-cover border border-cardBorder shadow-xs"
      />
      {/* Online indicator dot - - AI Signal Green LED */}
      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-signalGreen border-2 border-white dark:border-[#1B1A18]" />
    </button>
  );
};

interface HeaderProps {
  onOpenAuth?: (mode: 'login' | 'signup') => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth }) => {
  const { user, isDemoSession, exitDemoSandbox } = useAuth();
  const {
    activeTab,
    setActiveTab,
    anomalyFeed,
    setIsTutorialOpen,
  } = useDashboard();
  const { toggleTheme, isDark } = useTheme();
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);

  // Active alerts count from anomaly feed
  const alertCount = anomalyFeed.filter(
    (a) => a.state === 'SENSOR_FAULT' || a.state === 'LOCAL_EXTREME' || a.state === 'SUSPICIOUS'
  ).length;

  // Role-based navigation items
  const navItems: { id: DashboardTab; label: string; elementId?: string; hasBadge?: boolean }[] = [
    { id: 'fleet', label: 'Fleet' },
    { id: 'station', label: 'Station', elementId: 'tutorial-nav-station' },
    { id: 'explainability', label: 'Explainability' },
    { id: 'alerts', label: 'Alerts', hasBadge: true },
    ...(user?.role === 'admin'
      ? [{ id: 'manage_aws' as DashboardTab, label: 'Manage AWS' }]
      : []),
  ];

  return (
    <>
      <header className="w-full h-16 bg-white dark:bg-[#1E1A15] border-b border-cardBorder dark:border-[#332C23] px-6 flex items-center justify-between z-40 sticky top-0 transition-colors select-none">
        {/* Left Section: Brand & - AI Navigation */}
        <div className="flex items-center gap-8">
          {/* Brand Logo & Title */}
          <div
            onClick={() => setActiveTab('fleet')}
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-brandDark dark:bg-[#26211A] flex items-center justify-center relative overflow-hidden border border-cardBorder dark:border-[#332C23]">
              <img
                src={skyguardLogo}
                alt="SkyGuard Logo"
                className="w-full h-full object-cover p-1"
                onError={(e) => {
                  (e.currentTarget as any).style.display = 'none';
                }}
              />
            </div>
            <div className="flex items-baseline gap-1 text-[17px] font-bold tracking-tight text-brandDark dark:text-[#F3EFE8]">
              <span>SkyGuard</span>
              <span className="text-brandAccent">- AI</span>
            </div>
          </div>

          {/* - AI Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={item.elementId}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3.5 py-5 text-sm tracking-normal transition-all flex items-center gap-1.5 focus:outline-none cursor-pointer border-b-2 font-medium ${
                    isActive
                      ? 'font-semibold text-brandAccent border-brandAccent'
                      : 'border-transparent text-inkMuted dark:text-[#9A938A] hover:text-brandDark dark:hover:text-[#F3EFE8]'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.hasBadge && alertCount > 0 && (
                    <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-mono font-bold text-white bg-signalAmber rounded-full min-w-[16px] h-[16px]">
                      {alertCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Utilities, Role, Bell & Profile */}
        <div className="flex items-center gap-3">

          {/* Notification bell */}
          <button
            onClick={() => setActiveTab('alerts')}
            className="relative w-8 h-8 rounded-md flex items-center justify-center text-inkMuted hover:text-brandDark dark:hover:text-[#F3EFE8] hover:bg-panelBg dark:hover:bg-[#26211A] transition-colors cursor-pointer"
            title="Notifications & Alerts"
          >
            <Bell className="w-4 h-4" />
            {alertCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-signalRed ring-2 ring-white dark:ring-[#1E1A15]" />
            )}
          </button>

          {/* Role Badges */}
          {user && (
            <span
              className={`hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase font-mono ${
                user.role === 'admin'
                  ? 'bg-xaiVioletLight dark:bg-xaiViolet/20 text-xaiViolet'
                  : 'bg-panelBg dark:bg-[#26211A] text-inkMuted dark:text-[#9A938A] border border-cardBorder dark:border-[#332C23]'
              }`}
            >
              {user.role.toUpperCase()}
            </span>
          )}

          {/* Quick theme icon toggle */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            className="w-8 h-8 rounded-md flex items-center justify-center text-inkMuted hover:text-brandDark dark:hover:text-[#F3EFE8] hover:bg-panelBg dark:hover:bg-[#26211A] transition-colors cursor-pointer"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-signalAmber" />
            ) : (
              <Moon className="w-4 h-4 text-inkMuted" />
            )}
          </button>

          {/* Profile Avatar with Signal Green Dot */}
          <ProfileAvatar
            onClick={() => setActiveTab('profile')}
            isActive={activeTab === 'profile'}
          />
        </div>
      </header>

      {/* Sandbox Live Mode Banner (Exact - AI specification from code.html) */}
      {isDemoSession && (
        <div className="w-full bg-accentSoft dark:bg-[#3A2416] border-b border-accentSoftBorder dark:border-[#4A301E] py-3 px-6 flex items-center justify-between text-xs text-accentText dark:text-[#FF9B60] select-none">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-brandAccent shrink-0" />
            <span className="font-medium">
              You're in Live Sandbox Mode — data resets each session
            </span>
          </div>
          <div className="flex items-center gap-5">
            <button
              onClick={() => setIsTutorialOpen(true)}
              className="flex items-center gap-1.5 font-semibold text-brandAccent hover:underline cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Interactive Tutorial</span>
            </button>
            <button
              onClick={exitDemoSandbox}
              className="font-medium hover:underline text-accentText dark:text-[#FF9B60] cursor-pointer"
            >
              Exit Demo
            </button>
            <button
              onClick={() => onOpenAuth?.('signup')}
              className="font-semibold px-2.5 py-1 rounded bg-white dark:bg-[#1E1A15] border border-accentSoftBorder dark:border-[#4A301E] text-brandAccent hover:bg-accentSoft dark:hover:bg-[#26211A] transition-colors cursor-pointer"
            >
              Create Free Account
            </button>
          </div>
        </div>
      )}

      {/* Secondary System Demo Architectural Modal (Available from navbar / settings) */}
      <SystemDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </>
  );
};

export default Header;