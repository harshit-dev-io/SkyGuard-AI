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
    <div className="p-6 rounded-cards border border-sage-mist dark:border-sage-dark bg-sheetWhite dark:bg-sheetWhite-dark transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate dark:text-slate-dark uppercase font-semibold">
          {label}
        </span>
        {badge && (
          <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-canopy/20 dark:border-mint-pulse/30 bg-canopy/10 dark:bg-mint-pulse/20 text-canopy dark:text-mint-pulse font-bold">
            {badge}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-bark dark:text-bark-dark">
        {value}
      </div>
      <div className="text-xs text-slate dark:text-slate-dark mt-1 font-normal">
        {subtext}
      </div>
    </div>
  );
};