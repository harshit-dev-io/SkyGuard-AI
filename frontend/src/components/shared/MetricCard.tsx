import React from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  subtext: string;
  accentColor?: string;
  badge?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  badge,
}) => {
  return (
    <div className="p-4 rounded-xl border border-[#E5E3DC] dark:border-[#232936] bg-white dark:bg-[#151921] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_25px_-2px_rgba(0,0,0,0.4)] transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#71717A] dark:text-[#94A3B8]">
          {label}
        </span>
        {badge && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[#E5E3DC] dark:border-[#232936] text-[#71717A] dark:text-[#94A3B8]">
            {badge}
          </span>
        )}
      </div>
      <div className="text-2xl font-serif font-bold text-[#18181B] dark:text-[#F8FAFC]">
        {value}
      </div>
      <div className="text-[11px] font-mono text-[#71717A] dark:text-[#94A3B8] mt-1">
        {subtext}
      </div>
    </div>
  );
};