import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Users, AlertTriangle, CloudRain, AlertOctagon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const TopKPICards: React.FC = () => {
  const { kpiSummary, isLoadingStations } = useDashboard();

  if (isLoadingStations && !kpiSummary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-[24px] border border-[#e0e0e0] dark:border-[#282e3a] bg-white dark:bg-[#16191f] animate-pulse h-36"
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#f0f0f0] dark:bg-[#1c2028]" />
              <div className="w-28 h-3 rounded-full bg-[#f0f0f0] dark:bg-[#1c2028]" />
            </div>
            <div className="w-20 h-7 rounded-full bg-[#f0f0f0] dark:bg-[#1c2028] mt-5" />
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4.5">
      {/* Card 1: Stations Online */}
      <div className="p-5 rounded-[24px] border border-[#e0e0e0] dark:border-[#282e3a] bg-white dark:bg-[#16191f] transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#f3f3f3] dark:bg-[#1c2028] text-[#141414] dark:text-white flex items-center justify-center">
            <Users className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#707070] dark:text-[#9e9e9e]">
            STATIONS ONLINE
          </span>
          <span className="w-2 h-2 rounded-full bg-[#0066ff] ml-auto" />
        </div>

        <div className="mt-2.5 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold text-[#141414] dark:text-white">
              {summary.stationsOnline.toLocaleString()}
            </span>
            <span className="text-xs text-[#707070] dark:text-[#9e9e9e]">
              / {summary.capacity.toLocaleString()}
            </span>
          </div>

          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0066ff]/10 text-[#0066ff] dark:bg-[#0066ff]/20 dark:text-[#3385ff] border border-[#0066ff]/30">
            {summary.onlinePct}%
          </span>
        </div>

        <div className="mt-2 flex items-center gap-1 text-xs text-[#707070] dark:text-[#9e9e9e] font-medium">
          <ArrowUpRight className="w-3.5 h-3.5 text-[#0066ff]" />
          <span>{summary.trendOnline}</span>
        </div>
      </div>

      {/* Card 2: Degraded / Drift */}
      <div className="p-5 rounded-[24px] border border-[#e0e0e0] dark:border-[#282e3a] bg-white dark:bg-[#16191f] transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#f3f3f3] dark:bg-[#1c2028] text-[#141414] dark:text-white flex items-center justify-center">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#707070] dark:text-[#9e9e9e]">
            DEGRADED / DRIFT
          </span>
        </div>

        <div className="mt-2.5 flex items-baseline justify-between">
          <span className="text-2xl font-semibold text-[#141414] dark:text-white">
            {summary.degradedDrift}
          </span>

          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f0f0f0] dark:bg-[#1c2028] text-[#141414] dark:text-white border border-[#e0e0e0] dark:border-[#282e3a]">
            {summary.degradedPct}%
          </span>
        </div>

        <div className="mt-2 flex items-center gap-1 text-xs text-[#707070] dark:text-[#9e9e9e] font-medium">
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>{summary.trendDegraded}</span>
        </div>
      </div>

      {/* Card 3: Extreme Events */}
      <div className="p-5 rounded-[24px] border border-[#e0e0e0] dark:border-[#282e3a] bg-white dark:bg-[#16191f] transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#f3f3f3] dark:bg-[#1c2028] text-[#141414] dark:text-white flex items-center justify-center">
            <CloudRain className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#707070] dark:text-[#9e9e9e]">
            EXTREME EVENTS
          </span>
        </div>

        <div className="mt-2.5 flex items-baseline justify-between">
          <span className="text-2xl font-semibold text-[#141414] dark:text-white">
            {summary.extremeEvents}
          </span>

          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#141414] text-white dark:bg-white dark:text-[#141414] uppercase">
            {summary.extremeType}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-1 text-xs text-[#707070] dark:text-[#9e9e9e] font-medium">
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>{summary.trendExtreme}</span>
        </div>
      </div>

      {/* Card 4: Confirmed Faults */}
      <div className="p-5 rounded-[24px] border border-[#e0e0e0] dark:border-[#282e3a] bg-white dark:bg-[#16191f] transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#f3f3f3] dark:bg-[#1c2028] text-[#141414] dark:text-white flex items-center justify-center">
            <AlertOctagon className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#707070] dark:text-[#9e9e9e]">
            CONFIRMED FAULTS
          </span>
        </div>

        <div className="mt-2.5 flex items-baseline justify-between">
          <span className="text-2xl font-semibold text-[#141414] dark:text-white">
            {String(summary.confirmedFaults).padStart(2, '0')}
          </span>

          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f3f3f3] dark:bg-[#16191f] text-[#707070] dark:text-[#9e9e9e] border border-[#e0e0e0] dark:border-[#282e3a] uppercase">
            {summary.faultBadge}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-1 text-xs text-[#707070] dark:text-[#9e9e9e] font-medium">
          <ArrowDownRight className="w-3.5 h-3.5" />
          <span>{summary.trendFaults}</span>
        </div>
      </div>
    </div>
  );
};

export default TopKPICards;
