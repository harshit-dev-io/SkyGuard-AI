import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { ShieldCheck, ShieldAlert, ArrowRight, X } from 'lucide-react';

export const ExplainabilityDrawer: React.FC = () => {
  const { selectedAnomaly, setSelectedAnomaly } = useDashboard();

  if (!selectedAnomaly) return null;

  return (
    <div className="mt-4 p-6 rounded-cards border border-sage-mist dark:border-sage-dark bg-sheetWhite dark:bg-sheetWhite-dark transition-colors">
      <div className="flex items-center justify-between pb-3 border-b border-sage-mist/40 dark:border-sage-dark">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-0.5 rounded-full bg-creamPaper dark:bg-field-dark text-bark dark:text-bark-dark border border-sage-mist dark:border-sage-dark font-semibold uppercase">
              XAI INSPECTOR
            </span>
            <h2 className="text-sm font-bold text-bark dark:text-bark-dark">
              Station {selectedAnomaly.stationId} — Case {selectedAnomaly.id}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate dark:text-slate-dark mt-1 font-normal">
            Attribution: <span className="font-semibold text-bark dark:text-bark-dark">{selectedAnomaly.faultAttribution}</span> · Timestamp: {selectedAnomaly.timestamp}
          </p>
        </div>

        <button
          onClick={() => setSelectedAnomaly(null)}
          className="w-7 h-7 rounded-full bg-creamPaper dark:bg-field-dark text-slate dark:text-slate-dark hover:text-bark dark:hover:text-bark-dark flex items-center justify-center cursor-pointer transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        {/* Sonntag Gate Invariant */}
        <div className="p-4 rounded-cards border border-sage-mist/70 dark:border-sage-dark bg-creamPaper/50 dark:bg-field-dark/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate dark:text-slate-dark uppercase font-semibold">
              Physical Sonntag Invariant
            </span>
            {selectedAnomaly.sonntagGatePassed ? (
              <ShieldCheck className="w-4 h-4 text-canopy dark:text-mint-pulse" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            )}
          </div>
          <div className="text-sm font-semibold text-bark dark:text-bark-dark mt-1">
            T_dew: {selectedAnomaly.tDew}°C ≤ T_raw: {selectedAnomaly.tRaw}°C
          </div>
          <span className={`text-xs mt-2 inline-block font-semibold ${selectedAnomaly.sonntagGatePassed ? 'text-canopy dark:text-mint-pulse' : 'text-rose-500'}`}>
            {selectedAnomaly.sonntagGatePassed ? 'PASS (Thermodynamic Valid)' : 'FAIL (Invariant Breach)'}
          </span>
        </div>

        {/* TinyML Residual */}
        <div className="p-4 rounded-cards border border-sage-mist/70 dark:border-sage-dark bg-creamPaper/50 dark:bg-field-dark/40">
          <span className="text-xs text-slate dark:text-slate-dark uppercase font-semibold">
            TinyML INT8 Residual
          </span>
          <div className="text-sm font-semibold text-bark dark:text-bark-dark mt-1">
            |y_hat - y| = {selectedAnomaly.tinyMlResidual}σ
          </div>
          <p className="text-xs text-slate dark:text-slate-dark mt-2">
            Edge Arena ≤32KB · Monotonic sequence verified
          </p>
        </div>

        {/* Spatial Topology Agreement */}
        <div className="p-4 rounded-cards border border-sage-mist/70 dark:border-sage-dark bg-creamPaper/50 dark:bg-field-dark/40">
          <span className="text-xs text-slate dark:text-slate-dark uppercase font-semibold">
            KD-Tree Consensus
          </span>
          <div className="text-sm font-semibold text-bark dark:text-bark-dark mt-1">
            Score: {selectedAnomaly.kdTreeConsensus} / 1.00
          </div>
          <p className="text-xs text-slate dark:text-slate-dark mt-2">
            Terrain &amp; Elevation Normalized Correlation
          </p>
        </div>

        {/* Correction Provenance Guard */}
        <div className="p-4 rounded-cards border border-sage-mist/70 dark:border-sage-dark bg-creamPaper/50 dark:bg-field-dark/40">
          <span className="text-xs text-slate dark:text-slate-dark uppercase font-semibold">
            State &amp; Provenance
          </span>
          <div className="flex items-center gap-2 mt-1 text-sm font-semibold">
            <span className="text-slate dark:text-slate-dark line-through">{selectedAnomaly.rawReading}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate dark:text-slate-dark" />
            <span className="text-canopy dark:text-mint-pulse">
              {selectedAnomaly.ukfCorrection !== null ? `${selectedAnomaly.ukfCorrection} (UKF)` : 'UNTOUCHED'}
            </span>
          </div>
          <p className="text-xs text-slate dark:text-slate-dark mt-2">
            Raw store immutable (ID: {selectedAnomaly.id})
          </p>
        </div>
      </div>

      <div className="mt-4 p-4 rounded-cards border border-sage-mist/70 dark:border-sage-dark bg-creamPaper/50 dark:bg-field-dark/40">
        <span className="text-xs text-slate dark:text-slate-dark uppercase font-semibold block mb-2">
          Evidence Log Chain:
        </span>
        <div className="flex flex-wrap gap-2">
          {selectedAnomaly.evidenceChain.map((ev, i) => (
            <span key={i} className="text-xs px-3 py-1 rounded-full bg-sheetWhite dark:bg-sheetWhite-dark border border-sage-mist dark:border-sage-dark text-bark dark:text-bark-dark font-medium">
              • {ev}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExplainabilityDrawer;