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
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-bark dark:text-bark-dark">
          Fleet Telemetry &amp; Anomaly Stream
        </h1>
        <p className="text-sm text-slate dark:text-slate-dark mt-1 font-normal">
          Real-time inference, spatial consensus &amp; thermodynamic validation across India AWS network
        </p>
      </div>

      {/* Error Alert with Retry */}
      {telemetryError && (
        <div className="p-4 rounded-cards border border-sage-mist dark:border-sage-dark bg-sheetWhite dark:bg-sheetWhite-dark flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-canopy dark:text-mint-pulse shrink-0" />
            <span className="text-xs sm:text-sm text-slate dark:text-slate-dark">
              Telemetry Warning: {telemetryError}
            </span>
          </div>
          <button
            onClick={() => refreshAll()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-canopy dark:bg-mint-pulse text-sheetWhite dark:text-canopy-dark hover:bg-canopy/90 dark:hover:bg-mint-pulse/90 font-semibold text-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Top 4 KPI Cards */}
      <TopKPICards />

      {/* Main Two-Column Layout: Map (Left) + Spatial Consensus (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
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