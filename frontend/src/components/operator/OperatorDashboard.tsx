import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { TopKPICards } from './TopKPICards';
import { IndiaSpatialMap } from './IndiaSpatialMap';
import { SpatialConsensusPanel } from './SpatialConsensusPanel';
import { AnomalyTable } from './AnomalyTable';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const OperatorDashboard: React.FC = () => {
  const { telemetryError, refreshAll } = useDashboard();

  return (
    <div className="space-y-6 pb-8">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#141414] dark:text-white">
          Fleet Telemetry &amp; Anomaly Stream
        </h1>
        <p className="text-sm text-[#707070] dark:text-[#9e9e9e] mt-1 font-normal">
          Real-time inference, spatial consensus &amp; thermodynamic validation across India AWS network
        </p>
      </div>

      {/* Error Alert with Retry — Mobbin card style */}
      {telemetryError && (
        <div className="p-4 rounded-[24px] border border-[#e0e0e0] dark:border-[#282e3a] bg-white dark:bg-[#16191f] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#0066ff] shrink-0" />
            <span className="text-xs sm:text-sm text-[#707070] dark:text-[#9e9e9e]">
              Telemetry Warning: {telemetryError}
            </span>
          </div>
          <button
            onClick={() => refreshAll()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#141414] dark:bg-white text-white dark:text-[#141414] hover:bg-[#262626] dark:hover:bg-[#e0e0e0] font-semibold text-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Top 4 KPI Cards */}
      <TopKPICards />

      {/* Main Two-Column Layout: Map (Left) + Spatial Consensus (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* Left: Spatial Telemetry Network Map (8 cols) */}
        <div className="lg:col-span-8 flex flex-col">
          <IndiaSpatialMap />
        </div>

        {/* Right: Spatial Consensus Status Panel & Critical Isolation (4 cols) */}
        <div className="lg:col-span-4 flex flex-col">
          <SpatialConsensusPanel />
        </div>
      </div>

      {/* Bottom Large Table: Live Anomaly & Active Learning Feed */}
      <AnomalyTable />
    </div>
  );
};

export default OperatorDashboard;