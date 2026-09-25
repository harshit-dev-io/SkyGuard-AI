import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { TopKPICards } from './TopKPICards';
import { IndiaSpatialMap } from './IndiaSpatialMap';
import { SpatialConsensusPanel } from './SpatialConsensusPanel';
import { AnomalyTable } from './AnomalyTable';
import { AlertCircle, RefreshCw, Layers } from 'lucide-react';

export const OperatorDashboard: React.FC = () => {
  const { telemetryError, refreshAll } = useDashboard();

  return (
    <div className="space-y-4 pb-8 select-none">
      {/* Page Sub-Header / Control Strip */}
      <div className="w-full bg-panelBg dark:bg-[#1E1A15] border border-cardBorder dark:border-[#332C23] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#26211A] border border-cardBorder dark:border-[#332C23] flex items-center justify-center text-brandDark dark:text-[#F3EFE8]">
            <Layers className="w-5 h-5 text-brandAccent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-brandDark dark:text-[#F3EFE8]">
                Global Fleet Telemetry &amp; Spatial Consensus
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-white dark:bg-[#26211A] border border-cardBorder dark:border-[#332C23] text-brandDark dark:text-[#F3EFE8]">
                L2 GRID MESH
              </span>
            </div>
            <p className="text-xs text-inkMuted dark:text-[#9A938A] mt-0.5">
              Real-time synchronized surface array across 14 synoptic operational quadrants (TimescaleDB 1Hz)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#26211A] border border-cardBorder dark:border-[#332C23] text-xs font-mono text-inkMuted dark:text-[#9A938A]">
            <span className="w-2 h-2 rounded-full bg-signalGreen" />
            <span>Consensus Sync: 1,000ms</span>
            <span className="text-cardBorder dark:text-[#332C23]">•</span>
            <span>Variance Floor: σ 0.04</span>
          </div>
          <button
            onClick={() => refreshAll()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brandAccent hover:opacity-95 text-white text-xs font-semibold tracking-wide transition-opacity cursor-pointer shadow-none"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Force Fleet Recalibration</span>
          </button>
        </div>
      </div>

      {/* Error Alert with Retry */}
      {telemetryError && (
        <div className="p-4 rounded-xl border border-cardBorder dark:border-[#332C23] bg-white dark:bg-[#1E1A15] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-signalAmber shrink-0" />
            <span className="text-xs sm:text-sm text-inkMuted dark:text-[#9A938A]">
              Telemetry Warning: {telemetryError}
            </span>
          </div>
          <button
            onClick={() => refreshAll()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brandDark dark:bg-white text-white dark:text-brandDark hover:opacity-90 font-semibold text-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Top 4 KPI Cards */}
      <TopKPICards />

      {/* Main Two-Column Layout: Map (Left 60%) + Spatial Consensus (Right 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full items-stretch">
        {/* Left: Spatial Telemetry Network Map (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <IndiaSpatialMap />
        </div>

        {/* Right: Spatial Consensus Status Panel & Critical Isolation (5 cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <SpatialConsensusPanel />
        </div>
      </div>

      {/* Bottom Large Table: Live Anomaly & Active Learning Feed */}
      <AnomalyTable />
    </div>
  );
};

export default OperatorDashboard;