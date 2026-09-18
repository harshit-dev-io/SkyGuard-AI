import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardProvider, useDashboard } from './context/DashboardContext';

import { AnnouncementBar } from './components/layout/AnnouncementBar';
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

const DashboardRouter: React.FC = () => {
  const { user } = useAuth();
  const { activeTab } = useDashboard();

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#0D0F12] text-[#18181B] dark:text-[#F8FAFC] transition-colors duration-200">
      <AnnouncementBar />
      <Header />
      <main className="max-w-[1520px] mx-auto px-6 py-8">
        {/* Fleet View: Exactly identical for both Admin and Operator */}
        {activeTab === 'fleet' && <OperatorDashboard />}

        {activeTab === 'station' && (
          <div className="space-y-6">
            <h1 className="font-serif text-2xl font-bold text-[#18181B] dark:text-[#F8FAFC]">
              Geospatial Station Inspector
            </h1>
            <IndiaSpatialMap />
          </div>
        )}

        {activeTab === 'explainability' && (
          <div className="space-y-6">
            <h1 className="font-serif text-2xl font-bold text-[#18181B] dark:text-[#F8FAFC]">
              Evidence &amp; Decision Inspector
            </h1>
            <ExplainabilityDrawer />
            <AnomalyTable />
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <h1 className="font-serif text-2xl font-bold text-[#18181B] dark:text-[#F8FAFC]">
              Active Alerts &amp; Extreme Events
            </h1>
            <AnomalyTable />
          </div>
        )}

        {/* Exclusive Manage AWS Section for Admin */}
        {activeTab === 'manage_aws' && user?.role === 'admin' && <ManageAWS />}
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
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] dark:bg-[#0D0F12]">
        <div className="font-mono text-xs text-neutral-500 tracking-widest uppercase animate-pulse">
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
      <AnnouncementBar />
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
    <AuthProvider>
      <RootApp />
    </AuthProvider>
  );
}