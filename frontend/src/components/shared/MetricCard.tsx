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
    <div className="p-5 rounded-[24px] border border-[#e0e0e0] dark:border-[#282e3a] bg-white dark:bg-[#16191f] transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-[#707070] dark:text-[#9e9e9e] uppercase font-semibold">
          {label}
        </span>
        {badge && (
          <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-[#0066ff]/30 bg-[#0066ff]/10 text-[#0066ff] font-bold">
            {badge}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-[#141414] dark:text-white">
        {value}
      </div>
      <div className="text-xs text-[#707070] dark:text-[#9e9e9e] mt-1 font-normal">
        {subtext}
      </div>
    </div>
  );
};