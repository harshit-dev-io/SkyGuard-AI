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

  // State badge renderer — Arcadia rounded stadium pill system
  const renderStateBadge = (state: string) => {
    switch (state) {
      case 'SENSOR_FAULT':
        return (
          <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            SENSOR_FAULT
          </span>
        );
      case 'LOCAL_EXTREME':
        return (
          <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            LOCAL_EXTREME
          </span>
        );
      case 'SUSPICIOUS':
      case 'CALIBRATION_DRIFT':
        return (
          <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30">
            {state}
          </span>
        );
      case 'HEALTHY':
        return (
          <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-mint-pulse/10 text-canopy dark:text-mint-pulse border border-mint-pulse/30">
            HEALTHY
          </span>
        );
      case 'UNKNOWN':
      default:
        return (
          <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-slate/10 text-slate dark:text-slate-dark border border-sage-mist dark:border-sage-dark">
            {state}
          </span>
        );
    }
  };

  return (
    <div className="rounded-cards border border-sage-mist dark:border-sage-dark bg-sheetWhite dark:bg-sheetWhite-dark overflow-hidden transition-colors">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-sage-mist/40 dark:border-sage-dark flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-bark dark:text-bark-dark">
            Live Anomaly &amp; Active Learning Feed
          </h3>
          <p className="text-xs text-slate dark:text-slate-dark mt-0.5">
            Real-time inference queue evaluated by edge gates, CUSUM, and spatial correlation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshAll()}
            title="Auto-refreshing every 5s"
            className="flex items-center gap-1.5 text-xs font-semibold text-canopy dark:text-mint-pulse hover:underline transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-canopy dark:text-mint-pulse" />
            <span>Auto-refresh: 5s</span>
          </button>

          {anomalyFeed.length > 4 && (
            <button
              onClick={() => setFilterViewAll(!filterViewAll)}
              className="px-3.5 py-1 rounded-full border border-sage-mist dark:border-sage-dark bg-creamPaper dark:bg-field-dark text-bark dark:text-bark-dark text-xs font-semibold hover:bg-sage-pale/40 dark:hover:bg-canopy-dark/40 transition-colors cursor-pointer"
            >
              {filterViewAll ? 'Collapse' : 'View All'}
            </button>
          )}
        </div>
      </div>

      {/* Action Confirmation Banner */}
      {actionFeedback && (
        <div className="px-6 py-2.5 bg-mint-pulse/10 border-b border-mint-pulse/30 text-xs text-canopy dark:text-mint-pulse font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-canopy dark:text-mint-pulse" />
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-sage-mist/40 dark:border-sage-dark text-xs font-semibold uppercase tracking-wider text-slate dark:text-slate-dark">
              <th className="py-3 px-5">STATION ID</th>
              <th className="py-3 px-3">STATE</th>
              <th className="py-3 px-3">FAULT ATTRIBUTION</th>
              <th className="py-3 px-3">EVIDENCE CHAIN</th>
              <th className="py-3 px-3">CONFIDENCE</th>
              <th className="py-3 px-5 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoadingStations && displayedItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate dark:text-slate-dark text-sm">
                  Loading real-time anomaly stream...
                </td>
              </tr>
            ) : displayedItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate dark:text-slate-dark text-sm">
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <span className="font-semibold text-bark dark:text-bark-dark">No active anomalies</span>
                    <span className="text-xs text-slate dark:text-slate-dark">No anomaly records are currently available from the backend.</span>
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
                    className={`cursor-pointer transition-colors border-b border-sage-mist/30 dark:border-sage-dark/40 ${
                      isSelected
                        ? 'bg-canopy/5 dark:bg-mint-pulse/10 border-l-4 border-l-canopy dark:border-l-mint-pulse'
                        : 'hover:bg-creamPaper/50 dark:hover:bg-field-dark/40'
                    }`}
                  >
                    {/* Station ID */}
                    <td className="py-3 px-5">
                      <span className="font-semibold text-sm text-bark dark:text-bark-dark">
                        {item.stationId}
                      </span>
                      <span className="block text-xs text-slate dark:text-slate-dark mt-0.5">
                        {item.wsi}
                      </span>
                    </td>

                    {/* State Badge */}
                    <td className="py-3 px-3">
                      {renderStateBadge(item.state)}
                    </td>

                    {/* Fault Attribution */}
                    <td className="py-3 px-3 font-semibold text-sm text-bark dark:text-bark-dark">
                      {item.faultAttribution}
                    </td>

                    {/* Evidence Chain */}
                    <td className="py-3 px-3 text-sm text-slate dark:text-slate-dark">
                      {item.evidenceChain && item.evidenceChain.length > 0
                        ? item.evidenceChain.join(' · ')
                        : 'Nominal telemetry'}
                    </td>

                    {/* Confidence */}
                    <td className="py-3 px-3 text-sm">
                      <span className="font-semibold text-bark dark:text-bark-dark">
                        {typeof item.confidence === 'number' ? item.confidence.toFixed(2) : item.confidence}
                      </span>
                      <span className="text-xs text-slate dark:text-slate-dark ml-1">
                        {item.uncertainty}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-5 text-right">
                      {(item.action === 'Verify' || item.action === 'Flag RUL') && (
                        <button
                          onClick={(e) => handleActionClick(e, item)}
                          className="px-3.5 py-1 rounded-full font-semibold text-xs text-sheetWhite bg-canopy dark:bg-mint-pulse dark:text-canopy-dark hover:bg-canopy/90 dark:hover:bg-mint-pulse/90 transition-colors cursor-pointer"
                        >
                          {item.action}
                        </button>
                      )}
                      {(item.action === 'Details' || item.action === 'Review' || !item.action) && (
                        <button
                          onClick={(e) => handleActionClick(e, item)}
                          className="px-3.5 py-1 rounded-full font-medium text-xs text-bark dark:text-bark-dark bg-creamPaper dark:bg-field-dark border border-sage-mist dark:border-sage-dark hover:bg-sage-pale/40 dark:hover:bg-canopy-dark/40 transition-colors cursor-pointer"
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
        <div className="m-4 p-5 rounded-cards border border-sage-mist/70 dark:border-sage-dark bg-creamPaper/50 dark:bg-field-dark/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
          {/* Left: Inspection Bundle Info */}
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-canopy dark:bg-mint-pulse text-sheetWhite dark:text-canopy-dark flex items-center justify-center shrink-0">
                <Info className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-bold text-bark dark:text-bark-dark">
                Inspection Bundle: {currentInspection.bundleId}
              </span>
            </div>

            <div className="pl-7 space-y-1 text-xs sm:text-sm text-slate dark:text-slate-dark">
              <div className="flex items-start gap-1.5">
                <span className="text-canopy dark:text-mint-pulse font-bold">•</span>
                <span>
                  Deterministic Gate:{' '}
                  <span className="text-bark dark:text-bark-dark font-semibold">
                    {currentInspection.deterministicGate}
                  </span>
                </span>
              </div>

              <div className="flex items-start gap-1.5">
                <span className="text-canopy dark:text-mint-pulse font-bold">•</span>
                <span>
                  Edge TinyML Residual:{' '}
                  <span className="text-bark dark:text-bark-dark font-semibold">
                    {currentInspection.edgeResidual}
                  </span>
                </span>
              </div>

              <div className="flex items-start gap-1.5">
                <span className="text-canopy dark:text-mint-pulse font-bold">•</span>
                <span>
                  Spatial Corroboration:{' '}
                  <span className="text-bark dark:text-bark-dark font-semibold">
                    {currentInspection.spatialCorroboration}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Derived UKF Correction Card */}
          <div className="w-full md:w-auto shrink-0 bg-sheetWhite dark:bg-sheetWhite-dark border border-sage-mist dark:border-sage-dark rounded-cards p-4 min-w-[210px] transition-colors">
            <div className="flex items-center gap-1.5 text-xs text-slate dark:text-slate-dark">
              <span className="w-2 h-2 rounded-full bg-mint-pulse shadow-[0_0_6px_rgba(15,255,135,0.6)]" />
              <span>Derived UKF Correction</span>
            </div>

            <div className="mt-1.5 flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-1">
                {currentInspection.ukfCorrection !== null && currentInspection.ukfCorrection !== undefined ? (
                  <>
                    <span className="text-2xl font-bold text-bark dark:text-bark-dark">
                      {currentInspection.ukfCorrection}%
                    </span>
                    <span className="text-xs text-slate dark:text-slate-dark">
                      ({currentInspection.ukfUncertainty || '±0.0%'})
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-medium text-slate dark:text-slate-dark">
                    UKF correction unavailable
                  </span>
                )}
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-canopy/10 text-canopy dark:bg-mint-pulse/20 dark:text-mint-pulse border border-canopy/20 dark:border-mint-pulse/30">
                {currentInspection.ukfBadge || 'NOMINAL'}
              </span>
            </div>

            <div className="mt-2 pt-2 border-t border-sage-mist/30 dark:border-sage-dark flex items-center gap-1.5 text-[11px] text-slate dark:text-slate-dark">
              <MapPin className="w-3 h-3 text-canopy dark:text-mint-pulse" />
              <span>Raw store intact (ID {currentInspection.rawStoreId})</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="m-4 p-4 rounded-cards border border-dashed border-sage-mist dark:border-sage-dark text-center text-xs text-slate dark:text-slate-dark">
          Select an anomaly or station above to inspect its real-time telemetry bundle
        </div>
      )}
    </div>
  );
};

export default AnomalyTable;