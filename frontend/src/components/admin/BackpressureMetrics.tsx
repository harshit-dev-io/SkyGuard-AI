import React from 'react';

export const BackpressureMetrics: React.FC = () => {
  return (
    <div className="mt-8 p-6 rounded-2xl border border-[#232936] bg-[#151921] shadow-cardDark">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#232936]">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#F8FAFC]">
            Streaming Substrate &amp; Backpressure Health
          </h2>
          <p className="text-[11px] font-mono text-[#94A3B8]">
            Flink Windowed Join timeouts and load-shedding hierarchy monitor
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
          PIPELINE: STEADY
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 rounded-xl border border-[#232936] bg-[#0D0F12]">
          <span className="text-[10px] font-mono uppercase text-[#94A3B8]">
            Kafka Consumer Lag
          </span>
          <div className="text-2xl font-serif font-bold text-white mt-1">142 msgs</div>
          <p className="text-[10px] font-mono text-emerald-400 mt-2">
            Nominal (&lt; 2,500 threshold)
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[#232936] bg-[#0D0F12]">
          <span className="text-[10px] font-mono uppercase text-[#94A3B8]">
            Flink Join Timeout Rate
          </span>
          <div className="text-2xl font-serif font-bold text-white mt-1">0.03%</div>
          <p className="text-[10px] font-mono text-emerald-400 mt-2">
            Bounded timeout: 2.0s · Soft degradation active
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[#232936] bg-[#0D0F12]">
          <span className="text-[10px] font-mono uppercase text-[#94A3B8]">
            WIS2 BUFR Dissemination
          </span>
          <div className="text-2xl font-serif font-bold text-white mt-1">1,240 obj/min</div>
          <p className="text-[10px] font-mono text-emerald-400 mt-2">
            WNM Notification topic active
          </p>
        </div>
      </div>

      {/* Backpressure Load-Shedding Hierarchy Visualizer */}
      <div className="mt-6 pt-4 border-t border-[#232936]">
        <span className="text-[10px] font-mono uppercase text-[#94A3B8] font-bold block mb-3">
          Runtime Load-Shedding Hierarchy Priority (Stage 1 to 4):
        </span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs font-mono">
          <div className="p-2.5 rounded border border-[#232936] bg-[#0D0F12] text-[#94A3B8]">
            <span className="text-[9px] block text-neutral-500">1. Pause First</span>
            Hist. QC Rewind
          </div>
          <div className="p-2.5 rounded border border-[#232936] bg-[#0D0F12] text-[#94A3B8]">
            <span className="text-[9px] block text-neutral-500">2. Pause Second</span>
            Daily RUL Estimation
          </div>
          <div className="p-2.5 rounded border border-[#232936] bg-[#0D0F12] text-[#94A3B8]">
            <span className="text-[9px] block text-neutral-500">3. Pause Third</span>
            Topology Rebuild
          </div>
          <div className="p-2.5 rounded border border-emerald-900 bg-emerald-950/40 text-emerald-400 font-bold">
            <span className="text-[9px] block text-emerald-500">4. Sacred Hot Path</span>
            Real-Time Physical QC
          </div>
        </div>
      </div>
    </div>
  );
};