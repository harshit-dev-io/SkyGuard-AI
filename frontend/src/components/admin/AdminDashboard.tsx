import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { FleetRegistryTable } from './FleetRegistryTable';
import { BackpressureMetrics } from './BackpressureMetrics';
import { Plus, RefreshCw, Sliders, Cpu } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { triggerTopologyRebuild, isRebuildingTopology } = useDashboard();

  return (
    <div className="max-w-[1520px] mx-auto px-6 py-8">
      {/* Admin Command Toolbar */}
      <div className="p-4 rounded-2xl border border-[#232936] bg-[#151921] shadow-cardDark flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#232936] text-cyan-400 font-bold uppercase">
            System Control Plane
          </span>
          <h1 className="font-serif text-xl font-bold text-white mt-1">
            Global Administration &amp; Engineering Operations
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <button className="flex items-center gap-2 px-3 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all">
            <Plus className="w-3.5 h-3.5" />
            Provision AWS
          </button>
          <button
            onClick={triggerTopologyRebuild}
            disabled={isRebuildingTopology}
            className="flex items-center gap-2 px-3 py-2 rounded border border-[#232936] bg-[#0D0F12] text-white hover:bg-[#1A202C] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRebuildingTopology ? 'animate-spin' : ''}`} />
            {isRebuildingTopology ? 'Recomputing KD-Mesh...' : 'Rebuild Topology'}
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded border border-[#232936] bg-[#0D0F12] text-white hover:bg-[#1A202C] transition-all">
            <Sliders className="w-3.5 h-3.5" />
            Retune UKF Q/R
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded border border-[#232936] bg-[#0D0F12] text-white hover:bg-[#1A202C] transition-all">
            <Cpu className="w-3.5 h-3.5" />
            Push TinyML INT8
          </button>
        </div>
      </div>

      {/* Metadata Matrix */}
      <FleetRegistryTable />

      {/* Streaming Backpressure & Load Shedding */}
      <BackpressureMetrics />
    </div>
  );
};