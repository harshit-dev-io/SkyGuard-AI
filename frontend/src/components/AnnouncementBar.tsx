import React from 'react';

export const AnnouncementBar: React.FC = () => {
  return (
    <aside className="w-full bg-canopy text-white py-2 px-4 text-center font-sans text-[13px] font-normal leading-[1.2] border-b border-canopy-dark/30 select-none">
      <div className="max-w-[1200px] mx-auto flex items-center justify-center gap-2 flex-wrap">
        <span className="w-2 h-2 rounded-full bg-mint-pulse inline-block animate-pulse shrink-0" />
        <span className="font-medium text-white/90">
          SIH 2026 — MoES PS 26073
        </span>
        <span className="text-white/40 hidden sm:inline">|</span>
        <span className="text-white/80">
          Autonomous Weather Station Quality Control &amp; Spatial Anomaly Detection Suite
        </span>
        <a
          href="#flow"
          className="text-white font-medium underline underline-offset-4 hover:text-mint-pulse transition-colors ml-1 inline-flex items-center gap-1"
        >
          View architecture &rarr;
        </a>
      </div>
    </aside>
  );
};