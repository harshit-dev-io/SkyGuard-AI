import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { ShieldCheck, ShieldAlert, GitCommit, ArrowRight, X } from 'lucide-react';

export const ExplainabilityDrawer: React.FC = () => {
  const { selectedAnomaly, setSelectedAnomaly } = useDashboard();

  if (!selectedAnomaly) return null;

  return (
    <div className="mt-6 p-6 rounded-2xl border border-[#E5E3DC] dark:border-[#232936] bg-[#FDFBF7] dark:bg-[#12161D] transition-all">
      <div className="flex items-center justify-between pb-4 border-b border-[#E5E3DC] dark:border-[#232936]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E5E3DC] dark:bg-[#232936] text-[#18181B] dark:text-[#F8FAFC] font-bold">
              XAI INSPECTOR
            </span>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#18181B] dark:text-[#F8FAFC]">
              Station {selectedAnomaly.stationId} — Case {selectedAnomaly.id}
            </h2>
          </div>
          <p className="text-[11px] font-mono text-[#71717A] dark:text-[#94A3B8] mt-1">
            Attribution: <span className="font-semibold">{selectedAnomaly.faultAttribution}</span> · Timestamp: {selectedAnomaly.timestamp}
          </p>
        </div>

        <button
          onClick={() => setSelectedAnomaly(null)}
          className="p-1 rounded text-[#71717A] hover:text-[#18181B] dark:hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        {/* Sonntag Gate Invariant */}
        <div className="p-4 rounded-xl border border-[#E5E3DC] dark:border-[#232936] bg-white dark:bg-[#151921]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase text-[#71717A] dark:text-[#94A3B8]">
              Physical Sonntag Invariant
            </span>
            {selectedAnomaly.sonntagGatePassed ? (
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            )}
          </div>
          <div className="font-mono text-xs font-bold text-[#18181B] dark:text-[#F8FAFC] mt-1">
            T_dew: {selectedAnomaly.tDew}°C ≤ T_raw: {selectedAnomaly.tRaw}°C
          </div>
          <span className={`text-[10px] font-mono mt-2 inline-block ${selectedAnomaly.sonntagGatePassed ? 'text-emerald-600' : 'text-rose-500 font-bold'}`}>
            {selectedAnomaly.sonntagGatePassed ? 'PASS (Thermodynamic Valid)' : 'FAIL (Invariant Breach)'}
          </span>
        </div>

        {/* TinyML Residual */}
        <div className="p-4 rounded-xl border border-[#E5E3DC] dark:border-[#232936] bg-white dark:bg-[#151921]">
          <span className="text-[10px] font-mono uppercase text-[#71717A] dark:text-[#94A3B8]">
            TinyML INT8 Residual
          </span>
          <div className="font-mono text-xs font-bold text-[#18181B] dark:text-[#F8FAFC] mt-1">
            |y_hat - y| = {selectedAnomaly.tinyMlResidual}σ
          </div>
          <p className="text-[10px] font-mono text-[#71717A] dark:text-[#94A3B8] mt-2">
            Edge Arena ≤32KB · Monotonic sequence verified
          </p>
        </div>

        {/* Spatial Topology Agreement */}
        <div className="p-4 rounded-xl border border-[#E5E3DC] dark:border-[#232936] bg-white dark:bg-[#151921]">
          <span className="text-[10px] font-mono uppercase text-[#71717A] dark:text-[#94A3B8]">
            KD-Tree Consensus
          </span>
          <div className="font-mono text-xs font-bold text-[#18181B] dark:text-[#F8FAFC] mt-1">
            Score: {selectedAnomaly.kdTreeConsensus} / 1.00
          </div>
          <p className="text-[10px] font-mono text-[#71717A] dark:text-[#94A3B8] mt-2">
            Terrain &amp; Elevation Normalized Correlation
          </p>
        </div>

        {/* Correction Provenance Guard */}
        <div className="p-4 rounded-xl border border-[#E5E3DC] dark:border-[#232936] bg-white dark:bg-[#151921]">
          <span className="text-[10px] font-mono uppercase text-[#71717A] dark:text-[#94A3B8]">
            State &amp; Provenance
          </span>
          <div className="flex items-center gap-2 mt-1 text-xs font-mono font-bold">
            <span className="text-neutral-500 line-through">{selectedAnomaly.rawReading}</span>
            <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-emerald-600 dark:text-emerald-400">
              {selectedAnomaly.ukfCorrection !== null ? `${selectedAnomaly.ukfCorrection} (UKF)` : 'UNTOUCHED'}
            </span>
          </div>
          <p className="text-[10px] font-mono text-[#71717A] dark:text-[#94A3B8] mt-2">
            Raw store immutable (ID: {selectedAnomaly.id})
          </p>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-lg border border-[#E5E3DC] dark:border-[#232936] bg-white/60 dark:bg-[#151921]/60">
        <span className="text-[10px] font-mono uppercase text-[#71717A] dark:text-[#94A3B8] font-bold block mb-1">
          Evidence Log Chain:
        </span>
        <div className="flex flex-wrap gap-2">
          {selectedAnomaly.evidenceChain.map((ev, i) => (
            <span key={i} className="text-[11px] font-mono px-2 py-1 rounded bg-[#FAF8F5] dark:bg-[#0D0F12] border border-[#E5E3DC] dark:border-[#232936] text-[#18181B] dark:text-[#F8FAFC]">
              • {ev}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};