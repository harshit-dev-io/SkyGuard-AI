import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Users, AlertTriangle, CloudRain, AlertOctagon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const TopKPICards: React.FC = () => {
  const { kpiSummary, isLoadingStations } = useDashboard();

  if (isLoadingStations && !kpiSummary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-cardBorder dark:border-[#332C23] bg-white dark:bg-[#1E1A15] animate-pulse h-36 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-28 h-3 rounded bg-panelBg dark:bg-[#26211A]" />
              <div className="w-12 h-5 rounded-full bg-panelBg dark:bg-[#26211A]" />
            </div>
            <div className="w-36 h-7 rounded bg-panelBg dark:bg-[#26211A] my-2" />
            <div className="w-full h-4 rounded bg-panelBg dark:bg-[#26211A]" />
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full select-none">
      {/* Card 1: Stations Online (Yield) */}
      <div
        id="tutorial-kpi-yield"
        className="bg-white dark:bg-[#1E1A15] border border-cardBorder dark:border-[#332C23] rounded-xl p-4 flex flex-col justify-between transition-colors shadow-none"
      >
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-inkMuted dark:text-[#9A938A]">
            STATIONS ONLINE
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-signalGreenLight text-signalGreen">
            {summary.onlinePct}%
          </span>
        </div>
        <div className="my-2.5">
          <div className="text-2xl font-mono font-semibold tracking-tight text-brandDark dark:text-[#F3EFE8] tabular-nums">
            {summary.stationsOnline.toLocaleString()} / {summary.capacity.toLocaleString()}
          </div>
        </div>
        <div className="pt-2 border-t border-cardBorder/60 dark:border-[#332C23] flex items-center justify-between text-xs text-inkMuted dark:text-[#9A938A]">
          <span>{summary.onlinePct}% operational yield</span>
          <span className="text-signalGreen font-mono font-medium flex items-center gap-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" />
            {summary.trendOnline}
          </span>
        </div>
      </div>

      {/* Card 2: Calibration Drift */}
      <div
        id="tutorial-kpi-drift"
        className="bg-white dark:bg-[#1E1A15] border border-cardBorder dark:border-[#332C23] rounded-xl p-4 flex flex-col justify-between transition-colors shadow-none"
      >
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-inkMuted dark:text-[#9A938A]">
            CALIBRATION DRIFT
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-signalAmberLight text-signalAmber">
            Warning
          </span>
        </div>
        <div className="my-2.5">
          <div className="text-2xl font-mono font-semibold tracking-tight text-brandDark dark:text-[#F3EFE8] tabular-nums">
            {summary.degradedDrift} stations
          </div>
        </div>
        <div className="pt-2 border-t border-cardBorder/60 dark:border-[#332C23] flex items-center justify-between text-xs text-inkMuted dark:text-[#9A938A]">
          <span>Δ &gt; 1.8σ threshold</span>
          <span className="text-signalAmber font-mono font-medium flex items-center gap-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" />
            {summary.trendDegraded}
          </span>
        </div>
      </div>

      {/* Card 3: Extreme Weather Events */}
      <div
        id="tutorial-kpi-extreme"
        className="bg-white dark:bg-[#1E1A15] border border-cardBorder dark:border-[#332C23] rounded-xl p-4 flex flex-col justify-between transition-colors shadow-none"
      >
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-inkMuted dark:text-[#9A938A]">
            EXTREME WEATHER EVENTS
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-signalAmberLight text-signalAmber flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-signalAmber animate-ping" />
            Active Watch
          </span>
        </div>
        <div className="my-2.5">
          <div className="text-2xl font-mono font-semibold tracking-tight text-brandDark dark:text-[#F3EFE8] tabular-nums">
            {summary.extremeEvents} active
          </div>
        </div>
        <div className="pt-2 border-t border-cardBorder/60 dark:border-[#332C23] flex items-center justify-between text-xs text-inkMuted dark:text-[#9A938A]">
          <span>{summary.extremeType} alert</span>
          <span className="font-mono text-brandDark dark:text-[#F3EFE8] font-medium">
            {summary.trendExtreme}
          </span>
        </div>
      </div>

      {/* Card 4: Confirmed Sensor Faults */}
      <div
        id="tutorial-kpi-faults"
        className="bg-white dark:bg-[#1E1A15] border border-cardBorder dark:border-[#332C23] rounded-xl p-4 flex flex-col justify-between transition-colors shadow-none"
      >
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-inkMuted dark:text-[#9A938A]">
            CONFIRMED SENSOR FAULTS
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-signalRedLight text-signalRed flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-signalRed" />
            Critical
          </span>
        </div>
        <div className="my-2.5">
          <div className="text-2xl font-mono font-semibold tracking-tight text-brandDark dark:text-[#F3EFE8] tabular-nums">
            {summary.confirmedFaults} offline
          </div>
        </div>
        <div className="pt-2 border-t border-cardBorder/60 dark:border-[#332C23] flex items-center justify-between text-xs text-inkMuted dark:text-[#9A938A]">
          <span>Awaiting physical review</span>
          <span className="font-mono text-signalRed font-medium">
            {summary.faultBadge}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TopKPICards;
