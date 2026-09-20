import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { ShieldCheck, ShieldAlert, ArrowRight, X } from 'lucide-react';

export const ExplainabilityDrawer: React.FC = () => {
  const { selectedAnomaly, setSelectedAnomaly } = useDashboard();

  if (!selectedAnomaly) return null;

  return (
    <div className="mt-4 p-5 rounded-[24px] border border-[#e0e0e0] dark:border-[#282e3a] bg-white dark:bg-[#16191f] transition-colors">
      <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0] dark:border-[#282e3a]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-0.5 rounded-full bg-[#f3f3f3] dark:bg-[#1c2028] text-[#141414] dark:text-white border border-[#e0e0e0] dark:border-[#282e3a] font-semibold uppercase">
              XAI INSPECTOR
            </span>
            <h2 className="text-sm font-bold text-[#141414] dark:text-white">
              Station {selectedAnomaly.stationId} — Case {selectedAnomaly.id}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#707070] dark:text-[#9e9e9e] mt-1 font-normal">
            Attribution: <span className="font-semibold text-[#141414] dark:text-white">{selectedAnomaly.faultAttribution}</span> · Timestamp: {selectedAnomaly.timestamp}
          </p>
        </div>

        <button
          onClick={() => setSelectedAnomaly(null)}
          className="w-7 h-7 rounded-full bg-[#f3f3f3] dark:bg-[#1c2028] text-[#707070] dark:text-[#9e9e9e] hover:text-[#141414] dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        {/* Sonntag Gate Invariant */}
        <div className="p-4 rounded-[18px] border border-[#e0e0e0] dark:border-[#282e3a] bg-[#f3f3f3]/50 dark:bg-[#121417]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#707070] dark:text-[#9e9e9e] uppercase font-semibold">
              Physical Sonntag Invariant
            </span>
            {selectedAnomaly.sonntagGatePassed ? (
              <ShieldCheck className="w-4 h-4 text-[#0066ff]" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-[#141414] dark:text-white" />
            )}
          </div>
          <div className="text-sm font-semibold text-[#141414] dark:text-white mt-1">
            T_dew: {selectedAnomaly.tDew}°C ≤ T_raw: {selectedAnomaly.tRaw}°C
          </div>
          <span className={`text-xs mt-2 inline-block font-semibold ${selectedAnomaly.sonntagGatePassed ? 'text-[#0066ff]' : 'text-[#141414] dark:text-white'}`}>
            {selectedAnomaly.sonntagGatePassed ? 'PASS (Thermodynamic Valid)' : 'FAIL (Invariant Breach)'}
          </span>
        </div>

        {/* TinyML Residual */}
        <div className="p-4 rounded-[18px] border border-[#e0e0e0] dark:border-[#282e3a] bg-[#f3f3f3]/50 dark:bg-[#121417]">
          <span className="text-xs text-[#707070] dark:text-[#9e9e9e] uppercase font-semibold">
            TinyML INT8 Residual
          </span>
          <div className="text-sm font-semibold text-[#141414] dark:text-white mt-1">
            |y_hat - y| = {selectedAnomaly.tinyMlResidual}σ
          </div>
          <p className="text-xs text-[#707070] dark:text-[#9e9e9e] mt-2">
            Edge Arena ≤32KB · Monotonic sequence verified
          </p>
        </div>

        {/* Spatial Topology Agreement */}
        <div className="p-4 rounded-[18px] border border-[#e0e0e0] dark:border-[#282e3a] bg-[#f3f3f3]/50 dark:bg-[#121417]">
          <span className="text-xs text-[#707070] dark:text-[#9e9e9e] uppercase font-semibold">
            KD-Tree Consensus
          </span>
          <div className="text-sm font-semibold text-[#141414] dark:text-white mt-1">
            Score: {selectedAnomaly.kdTreeConsensus} / 1.00
          </div>
          <p className="text-xs text-[#707070] dark:text-[#9e9e9e] mt-2">
            Terrain &amp; Elevation Normalized Correlation
          </p>
        </div>

        {/* Correction Provenance Guard */}
        <div className="p-4 rounded-[18px] border border-[#e0e0e0] dark:border-[#282e3a] bg-[#f3f3f3]/50 dark:bg-[#121417]">
          <span className="text-xs text-[#707070] dark:text-[#9e9e9e] uppercase font-semibold">
            State &amp; Provenance
          </span>
          <div className="flex items-center gap-2 mt-1 text-sm font-semibold">
            <span className="text-[#707070] dark:text-[#9e9e9e] line-through">{selectedAnomaly.rawReading}</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#707070] dark:text-[#9e9e9e]" />
            <span className="text-[#0066ff]">
              {selectedAnomaly.ukfCorrection !== null ? `${selectedAnomaly.ukfCorrection} (UKF)` : 'UNTOUCHED'}
            </span>
          </div>
          <p className="text-xs text-[#707070] dark:text-[#9e9e9e] mt-2">
            Raw store immutable (ID: {selectedAnomaly.id})
          </p>
        </div>
      </div>

      <div className="mt-4 p-4 rounded-[18px] border border-[#e0e0e0] dark:border-[#282e3a] bg-[#f3f3f3]/50 dark:bg-[#121417]">
        <span className="text-xs text-[#707070] dark:text-[#9e9e9e] uppercase font-semibold block mb-2">
          Evidence Log Chain:
        </span>
        <div className="flex flex-wrap gap-2">
          {selectedAnomaly.evidenceChain.map((ev, i) => (
            <span key={i} className="text-xs px-3 py-1 rounded-full bg-white dark:bg-[#16191f] border border-[#e0e0e0] dark:border-[#282e3a] text-[#141414] dark:text-white font-medium">
              • {ev}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExplainabilityDrawer;