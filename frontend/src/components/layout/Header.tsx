import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import type { DashboardTab } from '../../context/DashboardContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { CloudLightning, Sun, Moon, Shield, Activity } from 'lucide-react';

interface ProfileAvatarProps {
  onClick: () => void;
  isActive?: boolean;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ onClick, isActive }) => {
  const { user } = useAuth();

  // Extract up to 2 initials from username or email
  const getInitials = (): string => {
    if (!user) return 'OP';
    if (user.username) {
      const parts = user.username.trim().split(/[\s_-]+/);
      if (parts.length >= 2 && parts[0] && parts[1]) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return user.username.slice(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'OP';
  };

  const initials = getInitials();

  return (
    <button
      onClick={onClick}
      title={user ? `${user.username} (${user.role.toUpperCase()}) - View Profile` : 'User Profile'}
      aria-label="User profile settings"
      className={`relative w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs transition-all cursor-pointer select-none ${
        isActive
          ? 'ring-2 ring-[#0066ff] border-2 border-[#141414] dark:border-white bg-[#0066ff]/10 text-[#141414] dark:text-white'
          : 'border border-[#e0e0e0] dark:border-[#282e3a] bg-[#f3f3f3] dark:bg-[#16191f] text-[#141414] dark:text-white hover:bg-[#e0e0e0] dark:hover:bg-[#282e3a]'
      }`}
    >
      <span>{initials}</span>
      {/* Online indicator dot - Mobbin electric blue accent */}
      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#0066ff] border-2 border-white dark:border-[#0e1013]" />
    </button>
  );
};

export const Header: React.FC = () => {
  const { user } = useAuth();
  const { activeTab, setActiveTab, anomalyFeed } = useDashboard();
  const { theme, toggleTheme, isDark } = useTheme();

  // Active alerts count from anomaly feed
  const alertCount = anomalyFeed.filter(
    (a) => a.state === 'SENSOR_FAULT' || a.state === 'LOCAL_EXTREME' || a.state === 'SUSPICIOUS'
  ).length;

  // Role-based navigation items
  const navItems: { id: DashboardTab; label: string; hasBadge?: boolean }[] = [
    { id: 'fleet', label: 'Fleet View' },
    { id: 'station', label: 'Station View' },
    { id: 'explainability', label: 'Explainability' },
    { id: 'alerts', label: 'Alerts', hasBadge: true },
    ...(user?.role === 'admin'
      ? [{ id: 'manage_aws' as DashboardTab, label: 'Manage AWS' }]
      : []),
  ];

  return (
    <header className="w-full border-b border-[#e0e0e0] dark:border-[#282e3a] bg-white dark:bg-[#0e1013] transition-colors duration-200 sticky top-0 z-30 shadow-none">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Section 1: Brand & Subtitle (Left) */}
        <div
          onClick={() => setActiveTab('fleet')}
          className="flex items-center gap-3 cursor-pointer shrink-0"
        >
          {/* iOS-style 30% squircle icon tile */}
          <div className="flex items-center justify-center w-9 h-9 rounded-[11px] bg-[#141414] text-white dark:bg-white dark:text-[#141414] transition-colors shadow-xs">
            <CloudLightning className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-base font-semibold tracking-tight text-[#141414] dark:text-white">
                SkyGuard
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#707070] dark:text-[#9e9e9e]">
                AI
              </span>
            </div>
            <span className="text-[11px] text-[#707070] dark:text-[#9e9e9e] mt-0.5 hidden sm:inline font-normal">
              Weather Station Anomaly Detection
            </span>
          </div>
        </div>

        {/* Section 2: Center Navigation - Mobbin nav-pill */}
        <nav className="hidden md:flex items-center p-1 bg-[#f3f3f3] dark:bg-[#16191f] rounded-full border border-[#e0e0e0] dark:border-[#282e3a]">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-4 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 focus:outline-none cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-[#282e3a] text-[#141414] dark:text-white font-semibold shadow-xs'
                    : 'text-[#707070] dark:text-[#9e9e9e] hover:text-[#141414] dark:hover:text-white font-medium'
                }`}
              >
                <span>{item.label}</span>
                {item.hasBadge && alertCount > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold text-white bg-[#0066ff] rounded-full min-w-[18px] h-[18px]">
                    {alertCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Section 3: Header Actions & Profile Avatar (Right) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Role Indicator Badge */}
          {user && (
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider border select-none ${
                user.role === 'admin'
                  ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
              }`}
              title={`Role: ${user.role.toUpperCase()} (from backend)`}
            >
              {user.role === 'admin' ? (
                <Shield className="w-3 h-3 text-purple-600 dark:text-purple-400" />
              ) : (
                <Activity className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              )}
              <span>{user.role}</span>
            </div>
          )}

          {/* Quick theme icon toggle - Mobbin pill button */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            className="w-9 h-9 rounded-full border border-[#e0e0e0] dark:border-[#282e3a] bg-[#f3f3f3] dark:bg-[#16191f] text-[#141414] dark:text-white flex items-center justify-center hover:bg-[#e0e0e0] dark:hover:bg-[#282e3a] transition-colors cursor-pointer"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-[#0066ff]" />
            ) : (
              <Moon className="w-4 h-4 text-[#141414]" />
            )}
          </button>

          {/* Profile Avatar Button -> Navigates to Profile */}
          <ProfileAvatar
            onClick={() => setActiveTab('profile')}
            isActive={activeTab === 'profile'}
          />
        </div>
      </div>

      {/* Mobile Horizontal Navigation Strip */}
      <div className="md:hidden border-t border-[#e0e0e0] dark:border-[#282e3a] px-4 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-[#fafafa] dark:bg-[#111317]">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                isActive
                  ? 'bg-white dark:bg-[#282e3a] text-[#141414] dark:text-white font-semibold shadow-xs border border-[#e0e0e0] dark:border-[#384050]'
                  : 'text-[#707070] dark:text-[#9e9e9e]'
              }`}
            >
              <span>{item.label}</span>
              {item.hasBadge && alertCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#0066ff] text-white text-[9px] flex items-center justify-center font-bold">
                  {alertCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};

export default Header;