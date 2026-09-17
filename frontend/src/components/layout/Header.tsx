import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../context/DashboardContext';
import type { DashboardTab } from '../../context/DashboardContext';
import { ThemeToggle } from '../ThemeToggle';
import {
  Radio,
  Layers,
  MapPin,
  Sparkles,
  AlertTriangle,
  Server,
  LogOut,
  UserCheck,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { activeTab, setActiveTab } = useDashboard();

  const navItems: { id: DashboardTab; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
    { id: 'fleet', label: 'Fleet View', icon: Layers },
    { id: 'station', label: 'Station View', icon: MapPin },
    { id: 'explainability', label: 'Explainability', icon: Sparkles },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'manage_aws', label: 'Manage AWS', icon: Server, adminOnly: true },
  ];

  return (
    <header className="w-full border-b border-[#E5E3DC] dark:border-[#232936] bg-[#FAF8F5] dark:bg-[#0D0F12] transition-colors duration-200">
      <div className="max-w-[1520px] mx-auto px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded border border-[#E5E3DC] dark:border-[#232936] bg-white dark:bg-[#151921]">
            <Radio className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="font-mono text-xs font-bold tracking-[0.25em] uppercase text-[#18181B] dark:text-[#F8FAFC]">
            SKYGUARD<span className="text-emerald-600 dark:text-emerald-400">.AI</span>
          </span>
          <span className="hidden lg:inline-block text-[10px] font-mono px-2 py-0.5 rounded border border-[#E5E3DC] dark:border-[#232936] text-[#71717A] dark:text-[#94A3B8]">
            ROLE: {user?.role.toUpperCase()}
          </span>
        </div>

        {/* Section Navigation Icons */}
        <nav className="flex items-center gap-1.5 sm:gap-2">
          {navItems.map((item) => {
            if (item.adminOnly && user?.role !== 'admin') return null;
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-[#18181B] dark:bg-[#F8FAFC] text-white dark:text-[#0D0F12] font-bold shadow-sm'
                    : 'text-[#71717A] dark:text-[#94A3B8] hover:bg-neutral-200/60 dark:hover:bg-[#1C222C] hover:text-[#18181B] dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Section: Theme Toggle, User Badge, & Logout */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <ThemeToggle />

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#E5E3DC] dark:border-[#232936]">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-mono text-[#18181B] dark:text-[#F8FAFC] font-medium">
              {user?.username}
            </span>
          </div>

          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 rounded-lg border border-[#E5E3DC] dark:border-[#232936] text-[#71717A] dark:text-[#94A3B8] hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-900 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;