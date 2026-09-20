import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Box, GitFork, ShieldCheck, Compass, ShieldAlert } from 'lucide-react';

export const SpatialConsensusPanel: React.FC = () => {
  const { spatialConsensus, isLoadingStations } = useDashboard();

  if (isLoadingStations && !spatialConsensus) {
    return (
      <div className="space-y-4">
        <div className="p-5 rounded-[24px] border border-[#e0e0e0] dark:border-[#282e3a] bg-white dark:bg-[#16191f] animate-pulse h-64" />
        <div className="p-4 rounded-[24px] border border-[#e0e0e0] dark:border-[#282e3a] bg-white dark:bg-[#16191f] animate-pulse h-20" />
      </div>
    );
  }

  const consensus = spatialConsensus || {
    activeClusters: 0,
    candidateTopology: 'KD-Tree (k=8)',
    badNeighborGuard: 'STANDBY',
    contaminatedCount: 0,
    microburstDetection: 'None Active',
    criticalIsolations: [],
  };

  return (
    <div className="space-y-4 flex flex-col justify-between h-full">
      {/* Top Card: Spatial Consensus Status */}
      <div className="p-5 rounded-[24px] border border-[#e0e0e0] dark:border-[#282e3a] bg-white dark:bg-[#16191f] transition-colors">
        <h3 className="text-base font-bold text-[#141414] dark:text-white pb-3 border-b border-[#f0f0f0] dark:border-[#282e3a]">
          Spatial Consensus Status
        </h3>

        <div className="space-y-3.5 mt-3.5">
          {/* Active Clusters */}
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-[9px] bg-[#f3f3f3] dark:bg-[#1c2028] text-[#141414] dark:text-white flex items-center justify-center shrink-0">
              <Box className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="block text-xs text-[#707070] dark:text-[#9e9e9e]">
                Active H3 Clusters
              </span>
              <span className="text-sm font-semibold text-[#141414] dark:text-white">
                {consensus.activeClusters} regions
              </span>
            </div>
          </div>

          {/* Candidate Topology */}
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-[9px] bg-[#f3f3f3] dark:bg-[#1c2028] text-[#141414] dark:text-white flex items-center justify-center shrink-0">
              <GitFork className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="block text-xs text-[#707070] dark:text-[#9e9e9e]">
                Candidate Topology
              </span>
              <span className="text-sm font-semibold text-[#141414] dark:text-white">
                {consensus.candidateTopology}
              </span>
            </div>
          </div>

          {/* Bad-Neighbor Guard */}
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-[9px] bg-[#f3f3f3] dark:bg-[#1c2028] text-[#141414] dark:text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0066ff]" />
            </div>
            <div>
              <span className="block text-xs text-[#707070] dark:text-[#9e9e9e]">
                Bad-Neighbor Guard
              </span>
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <span className="text-[#0066ff]">
                  {consensus.badNeighborGuard}
                </span>
                <span className="text-[#707070] dark:text-[#9e9e9e] text-xs font-normal">
                  ({consensus.contaminatedCount} contaminated)
                </span>
              </div>
            </div>
          </div>

          {/* Microburst Detection */}
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-[9px] bg-[#f3f3f3] dark:bg-[#1c2028] text-[#141414] dark:text-white flex items-center justify-center shrink-0">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="block text-xs text-[#707070] dark:text-[#9e9e9e]">
                Microburst Detection
              </span>
              <span className="text-sm font-semibold text-[#141414] dark:text-white">
                {consensus.microburstDetection}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Alert Card: Critical Spatial Isolation */}
      <div className="p-4 rounded-[24px] border border-[#e0e0e0] dark:border-[#282e3a] bg-[#f3f3f3] dark:bg-[#16191f] relative overflow-hidden transition-colors">
        {/* Subtle electric blue left accent */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#0066ff]" />

        <div className="flex items-center gap-2 pl-2">
          <div className="w-5 h-5 rounded-full bg-[#0066ff] text-white flex items-center justify-center shrink-0">
            <ShieldAlert className="w-3 h-3" />
          </div>
          <span className="text-xs font-bold tracking-wider uppercase text-[#141414] dark:text-white">
            CRITICAL SPATIAL ISOLATION
          </span>
        </div>

        <div className="mt-2 pl-8">
          {consensus.criticalIsolations && consensus.criticalIsolations.length > 0 ? (
            consensus.criticalIsolations.map((item, index) => (
              <p key={index} className="text-xs text-[#707070] dark:text-[#9e9e9e] leading-relaxed">
                {item.message}
              </p>
            ))
          ) : (
            <p className="text-xs text-[#707070] dark:text-[#9e9e9e] italic">
              No critical spatial isolation detected in active pool
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpatialConsensusPanel;
