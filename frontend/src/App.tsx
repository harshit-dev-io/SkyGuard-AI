import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardProvider, useDashboard } from './context/DashboardContext';

import { ThemeProvider } from './context/ThemeContext';
import { MeridianAILandingPage } from './components/landing/MeridianLandingPage';
import { AuthModal } from './components/AuthModal';

import { Header } from './components/layout/Header';
import { OperatorDashboard } from './components/operator/OperatorDashboard';
import { StationInspectorView } from './components/operator/StationInspectorView';
import { AnomalyTable } from './components/operator/AnomalyTable';
import { ExplainabilityDrawer } from './components/shared/ExplainabilityDrawer';
import { ManageAWS } from './components/admin/ManageAWS';
import { ProfileScreen } from './components/profile/ProfileScreen';
import { SystemDemoModal } from './components/shared/SystemDemoModal';
import { InteractiveWalkthrough } from './components/demo/InteractiveWalkthrough';
import { WalkthroughVideoModal } from './components/demo/WalkthroughVideoModal';
import { ShieldAlert } from 'lucide-react';

interface DashboardRouterProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

const DashboardRouter: React.FC<DashboardRouterProps> = ({ onOpenAuth }) => {
  const { user, isDemoSession } = useAuth();
  const { activeTab, setActiveTab, isTutorialOpen, setIsTutorialOpen } = useDashboard();

  // Guard against non-admin trying to stay on admin-only tabs
  React.useEffect(() => {
    if (activeTab === 'manage_aws' && user?.role !== 'admin') {
      setActiveTab('fleet');
    }
  }, [activeTab, user?.role, setActiveTab]);

  // Launch the game-like interactive spotlight walkthrough upon entering demo
  React.useEffect(() => {
    if (isDemoSession) {
      setIsTutorialOpen(true);
    }
  }, [isDemoSession, setIsTutorialOpen]);

  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-[#15130F] text-[#1B1A18] dark:text-[#F3EFE8] flex flex-col transition-colors duration-200">
      <Header onOpenAuth={onOpenAuth} />
      <main className="w-full flex-1 px-3 sm:px-4 lg:px-6 py-5">
        {/* Fleet View: Accessible to both Admin and Operator */}
        {activeTab === 'fleet' && <OperatorDashboard />}

        {activeTab === 'station' && <StationInspectorView />}

        {activeTab === 'explainability' && (
          <div className="space-y-6">
            <h1 className="text-[28px] font-medium text-bark dark:text-white">
              Evidence &amp; Decision Inspector
            </h1>
            <ExplainabilityDrawer />
            <AnomalyTable />
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <h1 className="text-[28px] font-medium text-bark dark:text-white">
              Active Alerts &amp; Extreme Events
            </h1>
            <AnomalyTable />
          </div>
        )}

        {/* Exclusive Manage AWS Section for Admin */}
        {activeTab === 'manage_aws' && (
          user?.role === 'admin' ? (
            <ManageAWS />
          ) : (
            <div className="rounded-cards border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-8 text-center max-w-md mx-auto my-16 space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-bark dark:text-white">
                Administrator Privileges Required
              </h2>
              <p className="text-xs text-slate dark:text-slate-dark leading-relaxed">
                AWS Station Provisioning, Hardware Calibration, and Fleet Simulation are restricted to System Administrators. Your current database role is <span className="font-semibold uppercase text-canopy dark:text-mint-pulse">{user?.role}</span>.
              </p>
              <button
                onClick={() => setActiveTab('fleet')}
                className="px-4 py-2 rounded-buttons bg-canopy dark:bg-white text-white dark:text-bark text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
              >
                Return to Fleet View
              </button>
            </div>
          )
        )}

        {/* User Profile & Settings Screen */}
        {activeTab === 'profile' && <ProfileScreen />}
      </main>

      {/* Interactive Walkthrough Coach (discreet floating assistant) */}
      <InteractiveWalkthrough
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
    </div>
  );
};

const RootApp: React.FC = () => {
  const { user, isLoading, enterDemoSandbox } = useAuth();
  const [authModalState, setAuthModalState] = useState<{
    isOpen: boolean;
    mode: 'login' | 'signup';
  }>({
    isOpen: false,
    mode: 'login',
  });

  const [isVideoWalkthroughOpen, setIsVideoWalkthroughOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#15130F] transition-colors duration-200">
        <div className="text-xs font-mono text-[#716C64] dark:text-[#9A938A] tracking-widest uppercase animate-pulse font-medium">
          Validating Observatory Security Session...
        </div>
      </div>
    );
  }

  // Wrap everything inside DashboardProvider so context is always available globally
  return (
    <DashboardProvider>
      {user ? (
        <DashboardRouter
          onOpenAuth={(mode) => setAuthModalState({ isOpen: true, mode })}
        />
      ) : (
        <div className="min-h-screen bg-white dark:bg-[#15130F] text-[#1B1A18] dark:text-[#F3EFE8] font-sans transition-colors duration-200">
          <MeridianAILandingPage
            onOpenAuth={(mode) => setAuthModalState({ isOpen: true, mode })}
            onOpenWalkthrough={() => setIsVideoWalkthroughOpen(true)}
          />
        </div>
      )}

      {/* Global Auth Modal: Accessible both from Landing and from Live Demo banner */}
      <AuthModal
        isOpen={authModalState.isOpen}
        initialMode={authModalState.mode}
        onClose={() => setAuthModalState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Global Video Walkthrough Modal with YouTube embedding */}
      <WalkthroughVideoModal
        isOpen={isVideoWalkthroughOpen}
        onClose={() => setIsVideoWalkthroughOpen(false)}
        onLaunchDemo={enterDemoSandbox}
      />
    </DashboardProvider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootApp />
      </AuthProvider>
    </ThemeProvider>
  );
}