import React from 'react';

export const AnnouncementBar: React.FC = () => {
  return (
    <div className="w-full bg-[#121212] dark:bg-[#07080A] text-slate-300 border-b border-[#252830] py-1.5 px-4 text-center">
      <p className="text-[10px] font-mono tracking-widest uppercase font-medium">
        SIH 2026 — MoES PS 26073 <span className="text-slate-600 px-2">|</span> AUTONOMOUS WEATHER STATION QUALITY CONTROL &amp; ANOMALY DETECTION
      </p>
    </div>
  );
};

export default AnnouncementBar;