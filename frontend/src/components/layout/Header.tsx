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
          ? 'ring-2 ring-canopy dark:ring-mint-pulse border-2 border-canopy dark:border-white bg-canopy/10 dark:bg-mint-pulse/10 text-canopy dark:text-white'
          : 'border border-sage-mist dark:border-sage-dark bg-creamPaper dark:bg-canopy-dark/30 text-bark dark:text-bark-dark hover:border-canopy dark:hover:border-mint-pulse'
      }`}
    >
      <span>{initials}</span>
      {/* Online indicator dot - Arcadia Mint Pulse LED accent */}
      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-mint-pulse border-2 border-sheetWhite dark:border-sheetWhite-dark" />
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
    <header className="w-full h-[68px] min-h-[68px] border-b border-sage-mist/70 dark:border-sage-dark bg-sheetWhite dark:bg-sheetWhite-dark transition-colors duration-200 sticky top-0 z-40 select-none flex items-center">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
        {/* Section 1: Brand & Subtitle (Left) */}
        <div
          onClick={() => setActiveTab('fleet')}
          className="flex items-center gap-3 cursor-pointer shrink-0"
        >
          {/* Arcadia 8px radius authority badge */}
          <div className="flex items-center justify-center w-9 h-9 rounded-buttons bg-canopy text-white dark:bg-mint-pulse dark:text-bark transition-colors">
            <CloudLightning className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-base font-semibold tracking-tight text-canopy dark:text-white">
                SkyGuard
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate dark:text-slate-dark">
                AI
              </span>
            </div>
            <span className="text-[11px] text-slate dark:text-slate-dark mt-0.5 hidden sm:inline font-normal">
              Atmospheric &amp; AWS Observatory
            </span>
          </div>
        </div>

        {/* Section 2: Center Navigation - Arcadia nav-pill */}
        <nav className="hidden md:flex items-center p-1 bg-creamPaper dark:bg-canopy-dark/30 rounded-pills border border-sage-mist/60 dark:border-sage-dark">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-4 py-1.5 rounded-pills text-xs transition-all flex items-center gap-1.5 focus:outline-none cursor-pointer ${
                  isActive
                    ? 'bg-canopy dark:bg-mint-pulse text-white dark:text-bark font-semibold'
                    : 'text-slate dark:text-slate-dark hover:text-bark dark:hover:text-white font-medium'
                }`}
              >
                <span>{item.label}</span>
                {item.hasBadge && alertCount > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold text-white bg-orb-violet rounded-full min-w-[18px] h-[18px]">
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
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-pills text-[11px] font-bold uppercase tracking-[0.07em] border select-none ${
                user.role === 'admin'
                  ? 'bg-orb-violet/10 text-orb-violet border-orb-violet/30'
                  : 'bg-canopy/10 dark:bg-mint-pulse/10 text-canopy dark:text-mint-pulse border-canopy/30 dark:border-mint-pulse/30'
              }`}
              title={`Role: ${user.role.toUpperCase()} (from backend)`}
            >
              {user.role === 'admin' ? (
                <Shield className="w-3.5 h-3.5" />
              ) : (
                <Activity className="w-3.5 h-3.5" />
              )}
              <span>{user.role}</span>
            </div>
          )}

          {/* Quick theme icon toggle */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            className="w-9 h-9 rounded-full border border-sage-mist dark:border-sage-dark bg-creamPaper dark:bg-canopy-dark/30 text-bark dark:text-white flex items-center justify-center hover:border-canopy dark:hover:border-mint-pulse transition-colors cursor-pointer"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-mint-pulse" />
            ) : (
              <Moon className="w-4 h-4 text-canopy" />
            )}
          </button>

          {/* Profile Avatar Button -> Navigates to Profile */}
          <ProfileAvatar
            onClick={() => setActiveTab('profile')}
            isActive={activeTab === 'profile'}
          />
        </div>
      </div>
    </header>
  );
};