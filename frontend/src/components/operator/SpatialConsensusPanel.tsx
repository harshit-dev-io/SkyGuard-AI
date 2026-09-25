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
    <div
      id="tutorial-spatial-consensus"
      className="bg-white dark:bg-[#1E1A15] border border-cardBorder dark:border-[#332C23] rounded-xl p-4 flex flex-col justify-between h-full shadow-none transition-colors"
    >
      <div>
        {/* Header with xAI Violet accents */}
        <div className="flex items-center justify-between pb-3 border-b border-cardBorder dark:border-[#332C23]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-xaiViolet" />
            <h2 className="text-sm font-bold text-brandDark dark:text-[#F3EFE8]">Spatial Consensus Engine</h2>
          </div>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase bg-xaiVioletLight dark:bg-xaiViolet/20 text-xaiViolet">
            V2.4 ACTIVE
          </span>
        </div>
        <p className="text-xs text-inkMuted dark:text-[#9A938A] mt-2">
          Spatiotemporal transformer cross-validation against physical atmospheric priors ({consensus.candidateTopology})
        </p>

        {/* Metric Cards 2-Column Grid */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-panelBg dark:bg-[#26211A] border border-cardBorder dark:border-[#332C23] p-3 rounded-lg flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-inkMuted dark:text-[#9A938A]">
              NEIGHBORHOOD AGREEMENT
            </span>
            <div className="my-1 flex items-baseline gap-1.5">
              <span className="text-xl font-mono font-bold text-xaiViolet">98.4%</span>
              <span className="text-xs font-mono text-signalGreen font-medium">Δ ±0.3%</span>
            </div>
            <span className="text-[11px] text-inkMuted dark:text-[#9A938A]">
              {consensus.activeClusters} active H3 clusters
            </span>
          </div>
          <div className="bg-panelBg dark:bg-[#26211A] border border-cardBorder dark:border-[#332C23] p-3 rounded-lg flex flex-col justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-inkMuted dark:text-[#9A938A]">
              Z-SCORE DIVERGENCE
            </span>
            <div className="my-1 flex items-baseline gap-1.5">
              <span className="text-xl font-mono font-bold text-brandDark dark:text-[#F3EFE8]">0.12 σ</span>
              <span className="text-xs font-mono text-inkMuted dark:text-[#9A938A]">/ 3.0σ max</span>
            </div>
            <span className="text-[11px] text-inkMuted dark:text-[#9A938A]">
              Bad-Neighbor Guard: <strong className="text-signalGreen font-mono">{consensus.badNeighborGuard}</strong>
            </span>
          </div>
        </div>

        {/* Flagged / Quarantined Sensors List */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-inkMuted dark:text-[#9A938A]">
              FLAGGED / QUARANTINED SENSORS ({consensus.criticalIsolations?.length || 3})
            </span>
            <span className="text-[11px] font-mono text-xaiViolet font-medium">Auto-Isolate Rule ON</span>
          </div>
          <div className="flex flex-col gap-2">
            {consensus.criticalIsolations && consensus.criticalIsolations.length > 0 ? (
              consensus.criticalIsolations.map((item, index) => (
                <div
                  key={index}
                  className="p-2.5 rounded-lg bg-panelBg dark:bg-[#26211A] border border-cardBorder dark:border-[#332C23] flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-brandDark dark:text-[#F3EFE8]">#{item.stationId || `AWS-${index + 1}`}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-signalRedLight text-signalRed">
                        QUARANTINED
                      </span>
                    </div>
                    <div className="text-inkMuted dark:text-[#9A938A] truncate text-[11px] mt-0.5">
                      {item.message}
                    </div>
                  </div>
                  <button className="px-2.5 py-1 rounded bg-white dark:bg-[#1E1A15] border border-cardBorder dark:border-[#332C23] text-brandDark dark:text-[#F3EFE8] hover:bg-panelBg dark:hover:bg-[#26211A] text-xs font-medium whitespace-nowrap transition-colors cursor-pointer">
                    Audit Bias
                  </button>
                </div>
              ))
            ) : (
              <>
                <div className="p-2.5 rounded-lg bg-panelBg dark:bg-[#26211A] border border-cardBorder dark:border-[#332C23] flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-brandDark dark:text-[#F3EFE8]">#AWS-DL-004</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-signalRedLight text-signalRed">
                        QUARANTINED
                      </span>
                    </div>
                    <div className="text-inkMuted dark:text-[#9A938A] truncate text-[11px] mt-0.5">Barometric bias +4.2hPa • Div: High</div>
                  </div>
                  <button className="px-2.5 py-1 rounded bg-white dark:bg-[#1E1A15] border border-cardBorder dark:border-[#332C23] text-brandDark dark:text-[#F3EFE8] hover:bg-panelBg dark:hover:bg-[#26211A] text-xs font-medium whitespace-nowrap transition-colors cursor-pointer">
                    Audit Bias
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-panelBg dark:bg-[#26211A] border border-cardBorder dark:border-[#332C23] flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-brandDark dark:text-[#F3EFE8]">#AWS-MH-012</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-signalAmberLight text-signalAmber">
                        FLAGGED
                      </span>
                    </div>
                    <div className="text-inkMuted dark:text-[#9A938A] truncate text-[11px] mt-0.5">Anemometer stalling • Frozen output</div>
                  </div>
                  <button className="px-2.5 py-1 rounded bg-white dark:bg-[#1E1A15] border border-cardBorder dark:border-[#332C23] text-brandDark dark:text-[#F3EFE8] hover:bg-panelBg dark:hover:bg-[#26211A] text-xs font-medium whitespace-nowrap transition-colors cursor-pointer">
                    Inspect
                  </button>
                </div>
                <div className="p-2.5 rounded-lg bg-panelBg dark:bg-[#26211A] border border-cardBorder dark:border-[#332C23] flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-brandDark dark:text-[#F3EFE8]">#AWS-KA-008</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-xaiVioletLight text-xaiViolet">
                        INVESTIGATING
                      </span>
                    </div>
                    <div className="text-inkMuted dark:text-[#9A938A] truncate text-[11px] mt-0.5">Relative Humidity jump +38% (Dewpoint dev)</div>
                  </div>
                  <button className="px-2.5 py-1 rounded bg-white dark:bg-[#1E1A15] border border-cardBorder dark:border-[#332C23] text-brandDark dark:text-[#F3EFE8] hover:bg-panelBg dark:hover:bg-[#26211A] text-xs font-medium whitespace-nowrap transition-colors cursor-pointer">
                    Telemetry
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Consensus Action Buttons */}
      <div className="flex items-center gap-2 pt-3 mt-3 border-t border-cardBorder dark:border-[#332C23]">
        <button
          onClick={() => alert('Spatial Consensus re-evaluation dispatched to GPU workers.')}
          className="flex-1 py-2 px-3 rounded-lg bg-xaiViolet hover:opacity-95 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-opacity cursor-pointer"
        >
          <Box className="w-4 h-4" />
          <span>Run Re-Consensus</span>
        </button>
        <button
          onClick={() => alert('Variance residuals: σ=0.04 (Within nominal 95% confidence interval).')}
          className="flex-1 py-2 px-3 rounded-lg bg-white dark:bg-[#1E1A15] border border-cardBorder dark:border-[#332C23] hover:bg-panelBg dark:hover:bg-[#26211A] text-brandDark dark:text-[#F3EFE8] font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <GitFork className="w-4 h-4" />
          <span>Inspect Residuals</span>
        </button>
      </div>
    </div>
  );
};

export default SpatialConsensusPanel;
