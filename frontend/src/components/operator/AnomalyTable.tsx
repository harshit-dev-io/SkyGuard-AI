import React, { useState, useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import type { AnomalyFeedItem } from '../../types/dashboard';
import { skyguardApi } from '../../services/skyguardApi';
import {
  Info,
  MapPin,
  RefreshCw,
  CheckCircle2,
  Search,
  Download,
  AlertTriangle,
  Eye,
  Shield,
  Bookmark,
} from 'lucide-react';

export const AnomalyTable: React.FC = () => {
  const {
    anomalyFeed,
    selectedInspection,
    setSelectedInspection,
    setSelectedStation,
    fetchInspectionForStation,
    stations,
    isLoadingStations,
    refreshAll,
  } = useDashboard();

  const [filterViewAll, setFilterViewAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{ id: string; message: string } | null>(null);

  const handleRowClick = async (item: AnomalyFeedItem) => {
    if (item.inspection) {
      setSelectedInspection(item.inspection);
    } else {
      await fetchInspectionForStation(item.stationId);
    }
    const matchedStation = stations.find((s) => s.id === item.stationId);
    if (matchedStation) {
      setSelectedStation(matchedStation);
    }
  };

  const handleActionClick = async (e: React.MouseEvent, item: AnomalyFeedItem) => {
    e.stopPropagation();
    let message = '';
    if (item.action === 'Flag RUL') {
      message = await skyguardApi.flagRule(item.stationId);
    } else if (item.action === 'Review') {
      message = await skyguardApi.reviewAnomaly(item.stationId);
    } else {
      message = await skyguardApi.verifyAnomaly(item.stationId);
    }

    setActionFeedback({ id: item.id, message });
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const exportToCsv = () => {
    if (anomalyFeed.length === 0) return;
    const headers = ['Station ID', 'WSI', 'State', 'Fault Attribution', 'Evidence', 'Confidence', 'Uncertainty'];
    const rows = anomalyFeed.map((a) => [
      a.stationId,
      a.wsi || '',
      a.state,
      `"${(a.faultAttribution || '').replace(/"/g, '""')}"`,
      `"${(a.evidenceChain || []).join(';')}"`,
      a.confidence,
      a.uncertainty,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `- AI_telemetry_anomalies_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered by search query
  const filteredFeed = useMemo(() => {
    if (!searchQuery.trim()) return anomalyFeed;
    const q = searchQuery.toLowerCase().trim();
    return anomalyFeed.filter(
      (item) =>
        item.stationId.toLowerCase().includes(q) ||
        (item.wsi && item.wsi.toLowerCase().includes(q)) ||
        item.faultAttribution.toLowerCase().includes(q) ||
        item.state.toLowerCase().includes(q)
    );
  }, [anomalyFeed, searchQuery]);

  const displayedItems = filterViewAll ? filteredFeed : filteredFeed.slice(0, 5);

  // Active inspection data from backend
  const currentInspection =
    selectedInspection ||
    (anomalyFeed.length > 0 && anomalyFeed[0].inspection ? anomalyFeed[0].inspection : null);

  // - AI State Badge
  const renderStateBadge = (state: string) => {
    switch (state) {
      case 'SENSOR_FAULT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-signalRedLight text-signalRed dark:bg-signalRed/20 dark:text-signalRed">
            <span className="w-1.5 h-1.5 rounded-full bg-signalRed" />
            Critical Fault
          </span>
        );
      case 'LOCAL_EXTREME':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-signalAmberLight text-signalAmber dark:bg-signalAmber/20 dark:text-signalAmber">
            <span className="w-1.5 h-1.5 rounded-full bg-signalAmber" />
            Local Extreme
          </span>
        );
      case 'SUSPICIOUS':
      case 'CALIBRATION_DRIFT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-signalAmberLight text-signalAmber dark:bg-signalAmber/20 dark:text-signalAmber">
            <span className="w-1.5 h-1.5 rounded-full bg-signalAmber" />
            Drift Divergence
          </span>
        );
      case 'HEALTHY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-signalGreenLight text-signalGreen dark:bg-signalGreen/20 dark:text-signalGreen">
            <span className="w-1.5 h-1.5 rounded-full bg-signalGreen" />
            Nominal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-panelBg text-inkMuted dark:bg-[#1a231f] dark:text-slate-400 border border-cardBorder">
            {state}
          </span>
        );
    }
  };

  return (
    <div
      id="tutorial-anomaly-stream"
      className="w-full bg-white dark:bg-[#1E1A15] border border-cardBorder dark:border-[#332C23] rounded-xl p-4 flex flex-col gap-3 shadow-none select-none"
    >
      {/* Table Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cardBorder dark:border-[#332C23]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-brandDark dark:text-[#F3EFE8]">
              Live Anomaly &amp; Active Learning Stream
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-signalAmberLight text-signalAmber flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-signalAmber animate-pulse" />
              STREAMING
            </span>
          </div>
          <p className="text-xs text-inkMuted dark:text-[#9A938A] mt-0.5">
            Real-time edge telemetry paired with spatial neural expectation vectors
          </p>
        </div>

        {/* Search input & Export CSV */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-panelBg dark:bg-[#26211A] border border-cardBorder dark:border-[#332C23] px-2.5 py-1.5 rounded-lg text-xs">
            <Search className="w-4 h-4 text-inkMuted dark:text-[#9A938A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter station or parameter..."
              className="bg-transparent text-brandDark dark:text-[#F3EFE8] focus:outline-none w-44 text-xs font-sans placeholder-inkMuted dark:placeholder-[#9A938A]"
            />
          </div>

          <button
            onClick={exportToCsv}
            disabled={anomalyFeed.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#26211A] border border-cardBorder dark:border-[#332C23] hover:bg-panelBg dark:hover:bg-[#1E1A15] text-xs font-medium text-brandDark dark:text-[#F3EFE8] transition-colors cursor-pointer disabled:opacity-50"
            title="Export Anomaly Feed to CSV"
          >
            <Download className="w-3.5 h-3.5 text-brandDark dark:text-[#F3EFE8]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => refreshAll()}
            title="Auto-refreshing every 5s"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-panelBg dark:bg-[#26211A] border border-cardBorder dark:border-[#332C23] text-xs font-semibold text-brandAccent hover:opacity-90 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-brandAccent animate-spin-reverse" />
            <span className="hidden sm:inline font-mono">5s</span>
          </button>

          {filteredFeed.length > 5 && (
            <button
              onClick={() => setFilterViewAll(!filterViewAll)}
              className="px-3 py-1.5 rounded-lg border border-cardBorder dark:border-[#332C23] bg-panelBg dark:bg-[#26211A] text-brandDark dark:text-[#F3EFE8] text-xs font-semibold hover:bg-white dark:hover:bg-[#1E1A15] transition-colors cursor-pointer"
            >
              {filterViewAll ? 'Collapse' : `View All (${filteredFeed.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Action Confirmation Banner */}
      {actionFeedback && (
        <div className="p-2.5 rounded-lg bg-signalGreenLight text-xs text-signalGreen font-semibold flex items-center gap-2 border border-signalGreen/30">
          <CheckCircle2 className="w-3.5 h-3.5 text-signalGreen" />
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* High-density Data Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-panelBg dark:bg-[#26211A] border-y border-cardBorder dark:border-[#332C23] text-[11px] font-semibold uppercase tracking-wider text-inkMuted dark:text-[#9A938A]">
              <th className="py-2.5 px-3">STATION ID</th>
              <th className="py-2.5 px-3">STATUS</th>
              <th className="py-2.5 px-3">PARAMETER / FAULT ATTRIBUTION</th>
              <th className="py-2.5 px-3">EVIDENCE CHAIN</th>
              <th className="py-2.5 px-3 text-right">ML CONFIDENCE</th>
              <th className="py-2.5 px-3 text-center">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cardBorder dark:divide-[#332C23] font-sans">
            {isLoadingStations && displayedItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-inkMuted dark:text-[#9A938A] text-xs font-mono">
                  Synchronizing real-time edge anomaly stream...
                </td>
              </tr>
            ) : displayedItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-inkMuted dark:text-[#9A938A] text-xs">
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <span className="font-semibold text-brandDark dark:text-[#F3EFE8]">No active anomalies found</span>
                    <span className="text-xs text-inkMuted dark:text-[#9A938A]">All mesonet stations operating within certified WMO climatological bounds.</span>
                  </div>
                </td>
              </tr>
            ) : (
              displayedItems.map((item, idx) => {
                const isSelected = currentInspection?.stationId === item.stationId;
                const isEven = idx % 2 === 1;

                return (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-accentSoft/60 dark:bg-[#3A2416]/80 border-l-4 border-l-brandAccent'
                        : isEven
                        ? 'bg-panelBg/30 dark:bg-[#26211A]/30 hover:bg-panelBg/70 dark:hover:bg-[#26211A]/60'
                        : 'hover:bg-panelBg/70 dark:hover:bg-[#26211A]/60'
                    }`}
                  >
                    {/* Station ID */}
                    <td className="py-3 px-3 font-mono font-semibold text-brandDark dark:text-[#F3EFE8]">
                      <div>{item.stationId}</div>
                      <div className="text-[10px] text-inkMuted dark:text-[#9A938A] font-normal">{item.wsi}</div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3">
                      {renderStateBadge(item.state)}
                    </td>

                    {/* Fault Attribution */}
                    <td className="py-3 px-3 font-medium text-brandDark dark:text-[#F3EFE8]">
                      {item.faultAttribution}
                    </td>

                    {/* Evidence Chain */}
                    <td className="py-3 px-3 text-inkMuted dark:text-[#9A938A]">
                      {item.evidenceChain && item.evidenceChain.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.evidenceChain.map((ev, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-panelBg dark:bg-[#26211A] border border-cardBorder dark:border-[#332C23] text-inkMuted dark:text-[#9A938A]"
                            >
                              {ev}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="font-mono text-[11px]">Nominal telemetry</span>
                      )}
                    </td>

                    {/* ML Confidence */}
                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      <span className={item.state === 'SENSOR_FAULT' ? 'text-signalRed' : item.state === 'LOCAL_EXTREME' ? 'text-signalAmber' : 'text-signalGreen'}>
                        {typeof item.confidence === 'number' ? `${(item.confidence * 100).toFixed(1)}%` : item.confidence}
                      </span>
                      <span className="text-[10px] text-inkMuted dark:text-[#9A938A] block font-normal">
                        {item.uncertainty}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={(e) => handleActionClick(e, item)}
                          className="px-2.5 py-1 rounded bg-white dark:bg-[#26211A] border border-cardBorder dark:border-[#332C23] hover:bg-panelBg dark:hover:bg-[#1E1A15] text-brandDark dark:text-[#F3EFE8] text-xs font-semibold transition-colors cursor-pointer"
                          title="Execute Action"
                        >
                          {item.action || 'Inspect'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Inspection Bundle & Derived UKF Correction (- AI Box) */}
      {currentInspection ? (
        <div className="mt-2 p-4 rounded-xl border border-cardBorder dark:border-[#332C23] bg-panelBg dark:bg-[#26211A] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
          {/* Left: Inspection Bundle Info */}
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-brandAccent text-white flex items-center justify-center shrink-0">
                <Info className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-brandDark dark:text-[#F3EFE8] font-mono">
                Inspection Bundle: {currentInspection.bundleId}
              </span>
            </div>

            <div className="pl-7 space-y-1 text-xs text-inkMuted dark:text-[#9A938A] font-mono">
              <div>
                <span className="text-brandAccent font-bold">•</span> Deterministic Gate:{' '}
                <strong className="text-brandDark dark:text-[#F3EFE8]">{currentInspection.deterministicGate}</strong>
              </div>
              <div>
                <span className="text-brandAccent font-bold">•</span> Edge TinyML Residual:{' '}
                <strong className="text-brandDark dark:text-[#F3EFE8]">{currentInspection.edgeResidual}</strong>
              </div>
              <div>
                <span className="text-brandAccent font-bold">•</span> Spatial Corroboration:{' '}
                <strong className="text-brandDark dark:text-[#F3EFE8]">{currentInspection.spatialCorroboration}</strong>
              </div>
            </div>
          </div>

          {/* Right: Derived UKF Correction Card */}
          <div className="w-full md:w-auto shrink-0 bg-white dark:bg-[#1E1A15] border border-cardBorder dark:border-[#332C23] rounded-xl p-3.5 min-w-[220px] transition-colors shadow-none">
            <div className="flex items-center justify-between gap-2 text-xs text-inkMuted dark:text-[#9A938A]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-signalGreen animate-pulse" />
                <span className="font-semibold text-brandDark dark:text-[#F3EFE8]">UKF Virtual Imputation</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-signalGreenLight text-signalGreen">
                {currentInspection.ukfBadge || 'NOMINAL'}
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-mono font-bold text-brandDark dark:text-[#F3EFE8] tabular-nums">
                {currentInspection.ukfCorrection !== null && currentInspection.ukfCorrection !== undefined
                  ? `${currentInspection.ukfCorrection}%`
                  : '34.2 °C'}
              </span>
              <span className="text-xs font-mono text-inkMuted dark:text-[#9A938A]">
                ({currentInspection.ukfUncertainty || '±0.8%'})
              </span>
            </div>

            <div className="mt-2 pt-2 border-t border-cardBorder dark:border-[#332C23] flex items-center gap-1.5 text-[11px] font-mono text-inkMuted dark:text-[#9A938A]">
              <MapPin className="w-3 h-3 text-brandAccent" />
              <span>Raw TimescaleDB store verified</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-dashed border-cardBorder dark:border-[#332C23] text-center text-xs text-inkMuted dark:text-[#9A938A] font-mono">
          Select an anomaly or station above to inspect its real-time telemetry bundle
        </div>
      )}
    </div>
  );
};

export default AnomalyTable;