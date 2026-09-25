import React, { useEffect, useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { api } from '../../lib/api';
import type { XAIExplainBundle } from '../../types/api';
import { ShieldCheck, ShieldAlert, ArrowRight, X, Cpu, GitFork, Thermometer, Database } from 'lucide-react';

export const ExplainabilityDrawer: React.FC = () => {
  const { selectedAnomaly, setSelectedAnomaly, selectedInspection } = useDashboard();
  const [explainBundle, setExplainBundle] = useState<XAIExplainBundle | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (selectedAnomaly?.id) {
      setLoading(true);
      api
        .getObservationExplain(selectedAnomaly.id)
        .then((data) => setExplainBundle(data))
        .catch(() => setExplainBundle(null))
        .finally(() => setLoading(false));
    }
  }, [selectedAnomaly?.id]);

  if (!selectedAnomaly) return null;

  const isSonntagPassed = explainBundle?.sonntag_gate?.passed ?? selectedAnomaly.sonntagGatePassed;
  const tRaw = explainBundle?.sonntag_gate?.t_raw ?? selectedAnomaly.tRaw;
  const tDew = explainBundle?.sonntag_gate?.t_dew ?? selectedAnomaly.tDew;
  const tinyMlResidual = explainBundle?.tinyml_int8_residual ?? selectedAnomaly.tinyMlResidual;
  const rawStoreId = explainBundle?.raw_store_id ?? selectedAnomaly.id;
  const ukfCorrection = explainBundle?.ukf_derived_correction ?? selectedAnomaly.ukfCorrection;

  return (
    <div className="mt-4 p-6 rounded-cards border border-sage-mist dark:border-sage-dark bg-sheetWhite dark:bg-sheetWhite-dark transition-colors shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-sage-mist/40 dark:border-sage-dark">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-0.5 rounded-full bg-canopy/10 dark:bg-mint-pulse/10 text-canopy dark:text-mint-pulse border border-canopy/20 dark:border-mint-pulse/30 font-bold uppercase tracking-wider">
              EXPLAINABILITY &amp; INVARIANT INSPECTOR (XAI)
            </span>
            <h2 className="text-sm font-bold text-bark dark:text-bark-dark">
              Station {selectedAnomaly.stationId} — Observation {selectedAnomaly.id}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate dark:text-slate-dark mt-1">
            Attribution: <span className="font-semibold text-bark dark:text-bark-dark">{selectedAnomaly.faultAttribution}</span> · Timestamp: {selectedAnomaly.timestamp}
          </p>
        </div>

        <button
          onClick={() => setSelectedAnomaly(null)}
          className="w-8 h-8 rounded-full bg-creamPaper dark:bg-field-dark text-slate hover:text-bark dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate animate-pulse">
          Fetching full thermodynamic &amp; UKF state bundle from backend...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          {/* Sonntag Gate Invariant */}
          <div className="p-4 rounded-cards border border-sage-mist/70 dark:border-sage-dark bg-creamPaper/50 dark:bg-field-dark/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-slate dark:text-slate-dark uppercase font-bold tracking-wider flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-canopy dark:text-mint-pulse" />
                Physical Sonntag Invariant
              </span>
              {isSonntagPassed ? (
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              )}
            </div>
            <div className="text-sm font-semibold text-bark dark:text-bark-dark mt-1.5">
              T_dew: {tDew.toFixed(1)}°C ≤ T_raw: {tRaw.toFixed(1)}°C
            </div>
            <span className={`text-xs mt-2 inline-block font-bold ${isSonntagPassed ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isSonntagPassed ? 'PASS (Thermodynamically Valid)' : 'FAIL (Invariant Breach Detected)'}
            </span>
          </div>

          {/* TinyML INT8 Residual */}
          <div className="p-4 rounded-cards border border-sage-mist/70 dark:border-sage-dark bg-creamPaper/50 dark:bg-field-dark/40">
            <div className="flex items-center gap-1 mb-1">
              <Cpu className="w-3.5 h-3.5 text-canopy dark:text-mint-pulse" />
              <span className="text-[11px] text-slate dark:text-slate-dark uppercase font-bold tracking-wider">
                TinyML INT8 Residual
              </span>
            </div>
            <div className="text-sm font-semibold text-bark dark:text-bark-dark mt-1.5">
              |y_hat - y| = {tinyMlResidual}σ
            </div>
            <p className="text-xs text-slate dark:text-slate-dark mt-2">
              Sub-32KB TinyML Arena · Monotonic residual verified
            </p>
          </div>

          {/* Spatial Topology Agreement */}
          <div className="p-4 rounded-cards border border-sage-mist/70 dark:border-sage-dark bg-creamPaper/50 dark:bg-field-dark/40">
            <div className="flex items-center gap-1 mb-1">
              <GitFork className="w-3.5 h-3.5 text-canopy dark:text-mint-pulse" />
              <span className="text-[11px] text-slate dark:text-slate-dark uppercase font-bold tracking-wider">
                KD-Tree Consensus
              </span>
            </div>
            <div className="text-sm font-semibold text-bark dark:text-bark-dark mt-1.5">
              Neighbor Weight: {selectedAnomaly.kdTreeConsensus} / 1.00
            </div>
            <p className="text-xs text-slate dark:text-slate-dark mt-2">
              Terrain &amp; Elevation Normalized Spatial Correlation
            </p>
          </div>

          {/* Correction Provenance Guard */}
          <div className="p-4 rounded-cards border border-sage-mist/70 dark:border-sage-dark bg-creamPaper/50 dark:bg-field-dark/40">
            <div className="flex items-center gap-1 mb-1">
              <Database className="w-3.5 h-3.5 text-canopy dark:text-mint-pulse" />
              <span className="text-[11px] text-slate dark:text-slate-dark uppercase font-bold tracking-wider">
                State &amp; Provenance Guard
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-sm font-semibold">
              <span className="text-slate line-through">{selectedAnomaly.rawReading}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate" />
              <span className="text-canopy dark:text-mint-pulse font-bold">
                {ukfCorrection !== null ? `${ukfCorrection} (UKF Imputed)` : 'UNTOUCHED RAW'}
              </span>
            </div>
            <p className="text-xs text-slate dark:text-slate-dark mt-2">
              Raw observation store immutable (ID: {rawStoreId})
            </p>
          </div>
        </div>
      )}

      {/* Evidence Log Chain */}
      <div className="mt-4 p-4 rounded-cards border border-sage-mist/70 dark:border-sage-dark bg-creamPaper/50 dark:bg-field-dark/40">
        <span className="text-xs text-slate dark:text-slate-dark uppercase font-bold tracking-wider block mb-2">
          Multi-Engine Evidence Chain:
        </span>
        <div className="flex flex-wrap gap-2">
          {selectedAnomaly.evidenceChain.map((ev, i) => (
            <span
              key={i}
              className="text-xs px-3 py-1 rounded-full bg-sheetWhite dark:bg-sheetWhite-dark border border-sage-mist dark:border-sage-dark text-bark dark:text-bark-dark font-semibold"
            >
              • {ev}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExplainabilityDrawer;
