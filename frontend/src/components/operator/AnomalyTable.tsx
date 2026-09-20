import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import type { AnomalyFeedItem } from '../../types/dashboard';
import { skyguardApi } from '../../services/skyguardApi';
import { Info, MapPin, RefreshCw, CheckCircle2 } from 'lucide-react';

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

  const displayedItems = filterViewAll ? anomalyFeed : anomalyFeed.slice(0, 4);

  // Active inspection data from backend
  const currentInspection =
    selectedInspection ||
    (anomalyFeed.length > 0 && anomalyFeed[0].inspection ? anomalyFeed[0].inspection : null);

  // State badge renderer — Mobbin stadium pill system
  const renderStateBadge = (state: string) => {
    switch (state) {
      case 'SENSOR_FAULT':
        return (
          <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-[#141414] dark:bg-white text-white dark:text-[#141414]">
            SENSOR_FAULT
          </span>
        );
      case 'LOCAL_EXTREME':
        return (
          <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-[#0066ff] text-white">
            LOCAL_EXTREME
          </span>
        );
      case 'SUSPICIOUS':
      case 'CALIBRATION_DRIFT':
        return (
          <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-[#f0f0f0] dark:bg-[#1c2028] text-[#141414] dark:text-white border border-[#e0e0e0] dark:border-[#282e3a]">
            {state}
          </span>
        );
      case 'UNKNOWN':
      default:
        return (
          <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-[#f3f3f3] dark:bg-[#16191f] text-[#707070] dark:text-[#9e9e9e] border border-[#e0e0e0] dark:border-[#282e3a]">
            {state}
          </span>
        );
    }
  };

  return (
    <div className="rounded-[24px] border border-[#e0e0e0] dark:border-[#282e3a] bg-white dark:bg-[#16191f] overflow-hidden transition-colors">
      {/* Table Header */}
      <div className="px-5 py-4 border-b border-[#f0f0f0] dark:border-[#282e3a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#141414] dark:text-white">
            Live Anomaly &amp; Active Learning Feed
          </h3>
          <p className="text-xs text-[#707070] dark:text-[#9e9e9e] mt-0.5">
            Real-time inference queue evaluated by edge gates, CUSUM, and spatial correlation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshAll()}
            title="Auto-refreshing every 5s"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#0066ff] hover:underline transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-[#0066ff]" />
            <span>Auto-refresh: 5s</span>
          </button>

          {anomalyFeed.length > 4 && (
            <button
              onClick={() => setFilterViewAll(!filterViewAll)}
              className="px-3.5 py-1 rounded-full border border-[#e0e0e0] dark:border-[#282e3a] bg-[#f3f3f3] dark:bg-[#1c2028] text-[#141414] dark:text-white text-xs font-semibold hover:bg-[#e0e0e0] dark:hover:bg-[#282e3a] transition-colors cursor-pointer"
            >
              {filterViewAll ? 'Collapse' : 'View All'}
            </button>
          )}
        </div>
      </div>

      {/* Action Confirmation Banner */}
      {actionFeedback && (
        <div className="px-5 py-2.5 bg-[#0066ff]/10 dark:bg-[#0066ff]/15 border-b border-[#0066ff]/20 text-xs text-[#0066ff] dark:text-[#3385ff] font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#0066ff]" />
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#f0f0f0] dark:border-[#282e3a] text-xs font-semibold uppercase text-[#707070] dark:text-[#9e9e9e]">
              <th className="py-3 px-4">STATION ID</th>
              <th className="py-3 px-3">STATE</th>
              <th className="py-3 px-3">FAULT ATTRIBUTION</th>
              <th className="py-3 px-3">EVIDENCE CHAIN</th>
              <th className="py-3 px-3">CONFIDENCE</th>
              <th className="py-3 px-4 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoadingStations && displayedItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-graphite dark:text-darkMuted text-sm">
                  Loading real-time anomaly stream...
                </td>
              </tr>
            ) : displayedItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-graphite dark:text-darkMuted text-sm">
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <span className="font-medium text-ink dark:text-cream">No active anomalies</span>
                    <span className="text-xs">No anomaly records are currently available from the backend.</span>
                  </div>
                </td>
              </tr>
            ) : (
              displayedItems.map((item) => {
                const isSelected = currentInspection?.stationId === item.stationId;

                return (
                  <tr
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className={`cursor-pointer transition-colors border-b border-[#f0f0f0] dark:border-[#282e3a]/40 ${
                      isSelected
                        ? 'bg-[#0066ff]/5 dark:bg-[#0066ff]/10 border-l-4 border-l-[#0066ff]'
                        : 'hover:bg-[#f3f3f3] dark:hover:bg-[#16191f]'
                    }`}
                  >
                    {/* Station ID */}
                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-sm text-[#141414] dark:text-white">
                        {item.stationId}
                      </span>
                      <span className="block text-xs text-[#707070] dark:text-[#9e9e9e] mt-0.5">
                        {item.wsi}
                      </span>
                    </td>

                    {/* State Badge */}
                    <td className="py-2.5 px-3">
                      {renderStateBadge(item.state)}
                    </td>

                    {/* Fault Attribution */}
                    <td className="py-2.5 px-3 font-semibold text-sm text-[#141414] dark:text-white">
                      {item.faultAttribution}
                    </td>

                    {/* Evidence Chain */}
                    <td className="py-2.5 px-3 text-sm text-[#707070] dark:text-[#9e9e9e]">
                      {item.evidenceChain && item.evidenceChain.length > 0
                        ? item.evidenceChain.join(' · ')
                        : 'Nominal telemetry'}
                    </td>

                    {/* Confidence */}
                    <td className="py-2.5 px-3 text-sm">
                      <span className="font-semibold text-[#141414] dark:text-white">
                        {typeof item.confidence === 'number' ? item.confidence.toFixed(2) : item.confidence}
                      </span>
                      <span className="text-xs text-[#707070] dark:text-[#9e9e9e] ml-1">
                        {item.uncertainty}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="py-2.5 px-4 text-right">
                      {(item.action === 'Verify' || item.action === 'Flag RUL') && (
                        <button
                          onClick={(e) => handleActionClick(e, item)}
                          className="px-3.5 py-1 rounded-full font-semibold text-xs text-white bg-[#141414] dark:bg-white dark:text-[#141414] hover:bg-[#262626] dark:hover:bg-[#e0e0e0] transition-colors cursor-pointer"
                        >
                          {item.action}
                        </button>
                      )}
                      {(item.action === 'Details' || item.action === 'Review' || !item.action) && (
                        <button
                          onClick={(e) => handleActionClick(e, item)}
                          className="px-3.5 py-1 rounded-full font-medium text-xs text-[#141414] dark:text-white bg-[#f3f3f3] dark:bg-[#1c2028] border border-[#e0e0e0] dark:border-[#282e3a] hover:bg-[#e0e0e0] dark:hover:bg-[#282e3a] transition-colors cursor-pointer"
                        >
                          {item.action || 'Details'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Inspection Bundle & Derived UKF Correction */}
      {currentInspection ? (
        <div className="m-4 p-5 rounded-[24px] border border-[#e0e0e0] dark:border-[#282e3a] bg-[#f3f3f3] dark:bg-[#121417] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
          {/* Left: Inspection Bundle Info */}
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#141414] dark:bg-white text-white dark:text-[#141414] flex items-center justify-center shrink-0">
                <Info className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-bold text-[#141414] dark:text-white">
                Inspection Bundle: {currentInspection.bundleId}
              </span>
            </div>

            <div className="pl-7 space-y-1 text-xs sm:text-sm text-[#707070] dark:text-[#9e9e9e]">
              <div className="flex items-start gap-1.5">
                <span className="text-[#707070] dark:text-[#9e9e9e]">•</span>
                <span>
                  Deterministic Gate:{' '}
                  <span className="text-[#141414] dark:text-white font-semibold">
                    {currentInspection.deterministicGate}
                  </span>
                </span>
              </div>

              <div className="flex items-start gap-1.5">
                <span className="text-[#707070] dark:text-[#9e9e9e]">•</span>
                <span>
                  Edge TinyML Residual:{' '}
                  <span className="text-[#141414] dark:text-white font-semibold">
                    {currentInspection.edgeResidual}
                  </span>
                </span>
              </div>

              <div className="flex items-start gap-1.5">
                <span className="text-[#707070] dark:text-[#9e9e9e]">•</span>
                <span>
                  Spatial Corroboration:{' '}
                  <span className="text-[#141414] dark:text-white font-semibold">
                    {currentInspection.spatialCorroboration}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Derived UKF Correction Card */}
          <div className="w-full md:w-auto shrink-0 bg-white dark:bg-[#16191f] border border-[#e0e0e0] dark:border-[#282e3a] rounded-[20px] p-4 min-w-[210px] transition-colors">
            <div className="flex items-center gap-1.5 text-xs text-[#707070] dark:text-[#9e9e9e]">
              <span className="w-2 h-2 rounded-full bg-[#0066ff]" />
              <span>Derived UKF Correction</span>
            </div>

            <div className="mt-1.5 flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-1">
                {currentInspection.ukfCorrection !== null && currentInspection.ukfCorrection !== undefined ? (
                  <>
                    <span className="text-2xl font-bold text-[#141414] dark:text-white">
                      {currentInspection.ukfCorrection}%
                    </span>
                    <span className="text-xs text-[#707070] dark:text-[#9e9e9e]">
                      ({currentInspection.ukfUncertainty || '±0.0%'})
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-medium text-[#707070] dark:text-[#9e9e9e]">
                    UKF correction unavailable
                  </span>
                )}
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#0066ff]/10 text-[#0066ff] dark:bg-[#0066ff]/20 dark:text-[#3385ff] border border-[#0066ff]/30">
                {currentInspection.ukfBadge || 'NOMINAL'}
              </span>
            </div>

            <div className="mt-2 pt-2 border-t border-[#f0f0f0] dark:border-[#282e3a] flex items-center gap-1 text-[11px] text-[#707070] dark:text-[#9e9e9e]">
              <MapPin className="w-3 h-3 text-[#141414] dark:text-white" />
              <span>Raw store intact (ID {currentInspection.rawStoreId})</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="m-4 p-4 rounded-[24px] border border-dashed border-[#e0e0e0] dark:border-[#282e3a] text-center text-xs text-[#707070] dark:text-[#9e9e9e]">
          Select an anomaly or station above to inspect its real-time telemetry bundle
        </div>
      )}
    </div>
  );
};

export default AnomalyTable;