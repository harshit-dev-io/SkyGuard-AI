import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Users, AlertTriangle, CloudRain, AlertOctagon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const TopKPICards: React.FC = () => {
  const { kpiSummary, isLoadingStations } = useDashboard();

  if (isLoadingStations && !kpiSummary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-6 rounded-cards border border-sage-mist/70 dark:border-sage-dark bg-sheetWhite dark:bg-sheetWhite-dark animate-pulse h-40"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-creamPaper dark:bg-canopy-dark/40" />
              <div className="w-28 h-3 rounded-full bg-creamPaper dark:bg-canopy-dark/40" />
            </div>
            <div className="w-24 h-8 rounded-full bg-creamPaper dark:bg-canopy-dark/40 mt-6" />
          </div>
        ))}
      </div>
    );
  }

  // Use real kpiSummary from backend
  const summary = kpiSummary || {
    stationsOnline: 0,
    capacity: 0,
    onlinePct: 0,
    trendOnline: 'No telemetry',
    degradedDrift: 0,
    degradedPct: 0,
    trendDegraded: 'No drift',
    extremeEvents: 0,
    extremeType: 'EVENT',
    trendExtreme: 'None',
    confirmedFaults: 0,
    faultBadge: 'STANDBY',
    trendFaults: '0 faults',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
      {/* Card 1: Stations Online (Mint Pulse active LED) */}
      <div className="p-6 rounded-cards border border-sage-mist dark:border-sage-dark bg-sheetWhite dark:bg-sheetWhite-dark flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-creamPaper dark:bg-canopy-dark/40 text-canopy dark:text-mint-pulse flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[13px] font-bold uppercase tracking-[0.07em] text-slate dark:text-slate-dark">
              Stations Online
            </span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-mint-pulse shrink-0 animate-pulse" title="Live Telemetry" />
        </div>

        <div className="my-2 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[32px] sm:text-[36px] font-medium text-bark dark:text-white leading-none">
              {summary.stationsOnline.toLocaleString()}
            </span>
            <span className="text-[13px] text-slate-muted dark:text-slate-dark font-normal">
              / {summary.capacity.toLocaleString()}
            </span>
          </div>

          <span className="px-2.5 py-1 rounded-pills text-[12px] font-medium bg-canopy/10 dark:bg-mint-pulse/10 text-canopy dark:text-mint-pulse border border-canopy/20 dark:border-mint-pulse/20">
            {summary.onlinePct}%
          </span>
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-[13px] text-canopy dark:text-mint-pulse font-medium">
          <ArrowUpRight className="w-4 h-4" />
          <span>{summary.trendOnline}</span>
        </div>
      </div>

      {/* Card 2: Degraded / Drift */}
      <div className="p-6 rounded-cards border border-sage-mist dark:border-sage-dark bg-sheetWhite dark:bg-sheetWhite-dark flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-creamPaper dark:bg-canopy-dark/40 text-canopy dark:text-mint-pulse flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-[13px] font-bold uppercase tracking-[0.07em] text-slate dark:text-slate-dark">
              Degraded / Drift
            </span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-sage-mist dark:bg-sage-dark shrink-0" />
        </div>

        <div className="my-2 flex items-baseline justify-between">
          <span className="text-[32px] sm:text-[36px] font-medium text-bark dark:text-white leading-none">
            {summary.degradedDrift}
          </span>

          <span className="px-2.5 py-1 rounded-pills text-[12px] font-medium bg-creamPaper dark:bg-canopy-dark/40 text-slate dark:text-slate-dark border border-sage-mist/60 dark:border-sage-dark">
            {summary.degradedPct}%
          </span>
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-[13px] text-slate dark:text-slate-dark font-medium">
          <ArrowUpRight className="w-4 h-4" />
          <span>{summary.trendDegraded}</span>
        </div>
      </div>

      {/* Card 3: Extreme Events (Orb Violet Accent) */}
      <div className="p-6 rounded-cards border border-sage-mist dark:border-sage-dark bg-sheetWhite dark:bg-sheetWhite-dark flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-orb-lavender/40 dark:bg-orb-violet/20 text-orb-violet flex items-center justify-center">
              <CloudRain className="w-4 h-4" />
            </div>
            <span className="text-[13px] font-bold uppercase tracking-[0.07em] text-slate dark:text-slate-dark">
              Extreme Events
            </span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-orb-violet shrink-0" />
        </div>

        <div className="my-2 flex items-baseline justify-between">
          <span className="text-[32px] sm:text-[36px] font-medium text-bark dark:text-white leading-none">
            {summary.extremeEvents}
          </span>

          <span className="px-2.5 py-1 rounded-pills text-[12px] font-semibold bg-orb-violet text-white uppercase tracking-wider">
            {summary.extremeType}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-[13px] text-orb-violet font-medium">
          <ArrowUpRight className="w-4 h-4" />
          <span>{summary.trendExtreme}</span>
        </div>
      </div>

      {/* Card 4: Confirmed Faults (Canopy Accent) */}
      <div className="p-6 rounded-cards border border-sage-mist dark:border-sage-dark bg-sheetWhite dark:bg-sheetWhite-dark flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-creamPaper dark:bg-canopy-dark/40 text-canopy dark:text-mint-pulse flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <span className="text-[13px] font-bold uppercase tracking-[0.07em] text-slate dark:text-slate-dark">
              Confirmed Faults
            </span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-canopy dark:bg-mint-pulse shrink-0" />
        </div>

        <div className="my-2 flex items-baseline justify-between">
          <span className="text-[32px] sm:text-[36px] font-medium text-bark dark:text-white leading-none">
            {String(summary.confirmedFaults).padStart(2, '0')}
          </span>

          <span className="px-2.5 py-1 rounded-pills text-[12px] font-medium bg-creamPaper dark:bg-canopy-dark/40 text-slate dark:text-slate-dark border border-sage-mist/60 dark:border-sage-dark uppercase">
            {summary.faultBadge}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-[13px] text-slate dark:text-slate-dark font-medium">
          <ArrowDownRight className="w-4 h-4" />
          <span>{summary.trendFaults}</span>
        </div>
      </div>
    </div>
  );
};

export default TopKPICards;
