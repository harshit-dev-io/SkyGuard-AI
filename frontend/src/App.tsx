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

const DashboardRouter: React.FC = () => {
  const { user } = useAuth();
  const { activeTab } = useDashboard();

  return (
    <div className="min-h-screen bg-canvas dark:bg-[#0e1013] text-ink dark:text-[#f5f5f5] flex flex-col transition-colors duration-200">
      <Header />
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Fleet View: Exactly identical for both Admin and Operator */}
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
        {activeTab === 'manage_aws' && user?.role === 'admin' && <ManageAWS />}

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
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-sm text-graphite tracking-widest uppercase animate-pulse font-medium">
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
    <div className="min-h-screen bg-cream text-ink font-sans transition-colors duration-200">
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