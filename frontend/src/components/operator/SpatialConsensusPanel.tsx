import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Box, GitFork, ShieldCheck, Compass, ShieldAlert } from 'lucide-react';

export const SpatialConsensusPanel: React.FC = () => {
  const { spatialConsensus, isLoadingStations } = useDashboard();

  if (isLoadingStations && !spatialConsensus) {
    return (
      <div className="space-y-4">
        <div className="p-6 rounded-cards border border-sage-mist dark:border-sage-dark bg-sheetWhite dark:bg-sheetWhite-dark animate-pulse h-64" />
        <div className="p-4 rounded-cards border border-sage-mist dark:border-sage-dark bg-sheetWhite dark:bg-sheetWhite-dark animate-pulse h-20" />
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
      <div className="p-6 rounded-cards border border-sage-mist dark:border-sage-dark bg-sheetWhite dark:bg-sheetWhite-dark transition-colors">
        <h3 className="text-base font-bold text-bark dark:text-bark-dark pb-3 border-b border-sage-mist/40 dark:border-sage-dark">
          Spatial Consensus Status
        </h3>

        <div className="space-y-4 mt-4">
          {/* Active Clusters */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-creamPaper dark:bg-field-dark text-canopy dark:text-mint-pulse flex items-center justify-center shrink-0">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-medium text-slate dark:text-slate-dark">
                Active H3 Clusters
              </span>
              <span className="text-sm font-semibold text-bark dark:text-bark-dark">
                {consensus.activeClusters} regions
              </span>
            </div>
          </div>

          {/* Candidate Topology */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-creamPaper dark:bg-field-dark text-canopy dark:text-mint-pulse flex items-center justify-center shrink-0">
              <GitFork className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-medium text-slate dark:text-slate-dark">
                Candidate Topology
              </span>
              <span className="text-sm font-semibold text-bark dark:text-bark-dark">
                {consensus.candidateTopology}
              </span>
            </div>
          </div>

          {/* Bad-Neighbor Guard */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-creamPaper dark:bg-field-dark text-canopy dark:text-mint-pulse flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-canopy dark:text-mint-pulse" />
            </div>
            <div>
              <span className="block text-xs font-medium text-slate dark:text-slate-dark">
                Bad-Neighbor Guard
              </span>
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <span className="text-canopy dark:text-mint-pulse">
                  {consensus.badNeighborGuard}
                </span>
                <span className="text-slate dark:text-slate-dark text-xs font-normal">
                  ({consensus.contaminatedCount} contaminated)
                </span>
              </div>
            </div>
          </div>

          {/* Microburst Detection */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-creamPaper dark:bg-field-dark text-canopy dark:text-mint-pulse flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-medium text-slate dark:text-slate-dark">
                Microburst Detection
              </span>
              <span className="text-sm font-semibold text-bark dark:text-bark-dark">
                {consensus.microburstDetection}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Alert Card: Critical Spatial Isolation */}
      <div className="p-4 rounded-cards border border-sage-mist/80 dark:border-sage-dark bg-creamPaper dark:bg-field-dark/50 relative overflow-hidden transition-colors">
        {/* Canopy / Mint pulse left accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-canopy dark:bg-mint-pulse" />

        <div className="flex items-center gap-2.5 pl-2">
          <div className="w-6 h-6 rounded-full bg-canopy dark:bg-mint-pulse text-sheetWhite dark:text-canopy-dark flex items-center justify-center shrink-0">
            <ShieldAlert className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold tracking-wider uppercase text-bark dark:text-bark-dark">
            Critical Spatial Isolation
          </span>
        </div>

        <div className="mt-2.5 pl-8">
          {consensus.criticalIsolations && consensus.criticalIsolations.length > 0 ? (
            consensus.criticalIsolations.map((item, index) => (
              <p key={index} className="text-xs text-slate dark:text-slate-dark leading-relaxed">
                {item.message}
              </p>
            ))
          ) : (
            <p className="text-xs text-slate dark:text-slate-dark italic">
              No critical spatial isolation detected in active pool
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpatialConsensusPanel;
