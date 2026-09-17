import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import type { AnomalyRecord } from '../../types/dashboard';

export const AnomalyTable: React.FC = () => {
  const { anomalies, selectedAnomaly, setSelectedAnomaly } = useDashboard();

  return (
    <div className="mt-8 rounded-2xl border border-[#E5E3DC] dark:border-[#232936] bg-white dark:bg-[#151921] shadow-card overflow-hidden">
      <div className="p-6 border-b border-[#E5E3DC] dark:border-[#232936] flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#18181B] dark:text-[#F8FAFC]">
            Live Anomalies &amp; Active Learning Queue
          </h2>
          <p className="text-[11px] font-mono text-[#71717A] dark:text-[#94A3B8]">
            Ranked by Flink Fusion Engine with calibrated isotonic probabilities
          </p>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-[#FAF8F5] dark:bg-[#0D0F12] border border-[#E5E3DC] dark:border-[#232936] text-[#71717A] dark:text-[#94A3B8]">
          AUTO-INGESTION: ACTIVE
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E5E3DC] dark:border-[#232936] bg-[#FAF8F5] dark:bg-[#0D0F12] text-[10px] font-mono uppercase tracking-widest text-[#71717A] dark:text-[#94A3B8]">
              <th className="py-3 px-6">Station ID</th>
              <th className="py-3 px-4">State Classification</th>
              <th className="py-3 px-4">Fault Attribution</th>
              <th className="py-3 px-4">Calibrated Confidence</th>
              <th className="py-3 px-6 text-right">Verification Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E3DC] dark:divide-[#232936] text-xs font-mono">
            {anomalies.map((anm) => {
              const isSelected = selectedAnomaly?.id === anm.id;
              return (
                <tr
                  key={anm.id}
                  onClick={() => setSelectedAnomaly(anm)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#F4F1EA] dark:bg-[#1D222D]'
                      : 'hover:bg-[#FAF8F5] dark:hover:bg-[#12161D]'
                  }`}
                >
                  <td className="py-4 px-6 font-bold text-[#18181B] dark:text-[#F8FAFC]">
                    {anm.stationId}
                    <span className="block text-[10px] font-normal text-[#71717A] dark:text-[#94A3B8]">
                      {anm.timestamp}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        anm.state === 'SENSOR_FAULT'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                          : anm.state === 'LOCAL_EXTREME'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
                          : anm.state === 'CALIBRATION_DRIFT'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {anm.state}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-[#18181B] dark:text-[#F8FAFC]">{anm.faultAttribution}</td>
                  <td className="py-4 px-4 font-bold text-[#18181B] dark:text-[#F8FAFC]">
                    {anm.calibratedConfidence.toFixed(2)}
                    <span className="text-[10px] font-normal text-[#71717A] dark:text-[#94A3B8] ml-1">
                      (±{anm.uncertaintyBand.toFixed(2)})
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded border border-[#E5E3DC] dark:border-[#232936] bg-white dark:bg-[#151921] hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[#18181B] dark:text-[#F8FAFC]">
                      Inspect
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};