import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { ShieldAlert, CheckCircle2, RotateCw } from 'lucide-react';

export const FleetRegistryTable: React.FC = () => {
  const { fleetRegistry } = useDashboard();

  return (
    <div className="rounded-2xl border border-[#232936] bg-[#151921] shadow-cardDark overflow-hidden mt-8">
      <div className="p-6 border-b border-[#232936] flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#F8FAFC]">
            AWS Fleet Lifecycle &amp; Metadata Matrix
          </h2>
          <p className="text-[11px] font-mono text-[#94A3B8]">
            WIGOS station mapping, duty-cycle states, and mTLS security bounds
          </p>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-[#0D0F12] border border-[#232936] text-[#94A3B8]">
          REGISTRY: ENFORCED
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#232936] bg-[#0D0F12] text-[10px] font-mono uppercase tracking-widest text-[#94A3B8]">
              <th className="py-3 px-6">Station ID</th>
              <th className="py-3 px-4">WIGOS Identifier (WSI)</th>
              <th className="py-3 px-4">Terrain / Region</th>
              <th className="py-3 px-4">Power &amp; Backhaul</th>
              <th className="py-3 px-4">Edge Runtime</th>
              <th className="py-3 px-6 text-right">mTLS Identity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#232936] text-xs font-mono">
            {fleetRegistry.map((item) => (
              <tr key={item.stationId} className="hover:bg-[#1A202C] transition-colors">
                <td className="py-4 px-6 font-bold text-white">{item.stationId}</td>
                <td className="py-4 px-4">
                  {item.wsiStatus === 'REGISTERED' ? (
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{item.wsi}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span className="font-bold">PENDING REGISTRATION (BLOCKED)</span>
                    </div>
                  )}
                </td>
                <td className="py-4 px-4 text-[#94A3B8]">
                  {item.terrain} · <span className="text-slate-300">{item.climateRegion}</span>
                </td>
                <td className="py-4 px-4 text-[#94A3B8]">
                  {item.powerSegment} · <span className="text-slate-300">{item.backhaulId}</span>
                </td>
                <td className="py-4 px-4 text-[#94A3B8]">
                  {item.tinyMlVersion} ({item.dutyCycle})
                </td>
                <td className="py-4 px-6 text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.mtlsStatus === 'ACTIVE'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950/60 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {item.mtlsStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};