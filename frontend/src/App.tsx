import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardProvider, useDashboard } from './context/DashboardContext';

import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PipelineFlow } from './components/PipelineFlow';
import { EvidenceGrid } from './components/EvidenceGrid';
import { GuaranteesStrip } from './components/GuaranteesStrip';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';

import { Header } from './components/layout/Header';
import { OperatorDashboard } from './components/operator/OperatorDashboard';
import { IndiaSpatialMap } from './components/operator/IndiaSpatialMap';
import { AnomalyTable } from './components/operator/AnomalyTable';
import { ExplainabilityDrawer } from './components/shared/ExplainabilityDrawer';
import { ManageAWS } from './components/admin/ManageAWS';
import { ProfileScreen } from './components/profile/ProfileScreen';
import { ShieldAlert } from 'lucide-react';

const DashboardRouter: React.FC = () => {
  const { user } = useAuth();
  const { activeTab, setActiveTab } = useDashboard();

  // Guard against non-admin trying to stay on admin-only tabs
  React.useEffect(() => {
    if (activeTab === 'manage_aws' && user?.role !== 'admin') {
      setActiveTab('fleet');
    }
  }, [activeTab, user?.role, setActiveTab]);

  return (
    <div className="min-h-screen bg-canvas dark:bg-[#0e1013] text-ink dark:text-[#f5f5f5] flex flex-col transition-colors duration-200">
      <Header />
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Fleet View: Accessible to both Admin and Operator */}
        {activeTab === 'fleet' && <OperatorDashboard />}

        {activeTab === 'station' && (
          <div className="space-y-6">
            <h1 className="text-[28px] font-medium text-ink dark:text-cream">
              Geospatial Station Inspector
            </h1>
            <IndiaSpatialMap />
          </div>
        )}

        {activeTab === 'explainability' && (
          <div className="space-y-6">
            <h1 className="text-[28px] font-medium text-ink dark:text-cream">
              Evidence &amp; Decision Inspector
            </h1>
            <ExplainabilityDrawer />
            <AnomalyTable />
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <h1 className="text-[28px] font-medium text-ink dark:text-cream">
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
            <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-8 text-center max-w-md mx-auto my-16 space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[#141414] dark:text-white">
                Administrator Privileges Required
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                AWS Station Provisioning, Hardware Calibration, and Fleet Simulation are restricted to System Administrators. Your current database role is <span className="font-semibold uppercase text-emerald-600 dark:text-emerald-400">{user?.role}</span>.
              </p>
              <button
                onClick={() => setActiveTab('fleet')}
                className="px-4 py-2 rounded-xl bg-[#141414] dark:bg-white text-white dark:text-[#141414] text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
              >
                Return to Fleet View
              </button>
            </div>
          )
        )}

        {/* User Profile & Settings Screen */}
        {activeTab === 'profile' && <ProfileScreen />}
      </main>
    </div>
  );
};

const RootApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [authModalState, setAuthModalState] = useState<{
    isOpen: boolean;
    mode: 'login' | 'signup';
  }>({
    isOpen: false,
    mode: 'login',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-light dark:bg-paper-dark transition-colors duration-200">
        <div className="text-sm text-neutral-500 dark:text-neutral-400 tracking-widest uppercase animate-pulse font-medium">
          Validating Security Session...
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <DashboardProvider>
        <DashboardRouter />
      </DashboardProvider>
    );
  }

  return (
    <div className="min-h-screen bg-paper-light dark:bg-paper-dark text-ink-light dark:text-ink-dark font-sans transition-colors duration-200">
      <Navbar onOpenAuth={(mode) => setAuthModalState({ isOpen: true, mode })} />

      <main>
        <Hero onRegisterClick={() => setAuthModalState({ isOpen: true, mode: 'signup' })} />
        <PipelineFlow />
        <EvidenceGrid />
        <GuaranteesStrip />
      </main>

      <Footer />

      <AuthModal
        isOpen={authModalState.isOpen}
        initialMode={authModalState.mode}
        onClose={() => setAuthModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
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