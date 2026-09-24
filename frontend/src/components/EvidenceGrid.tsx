import React from "react";
import { Clock, MapPin, Calendar, HeartPulse } from "lucide-react";

export const EvidenceGrid: React.FC = () => {
  const engines = [
    {
      id: "temporal",
      title: "Temporal Residuals",
      icon: Clock,
      tag: "CUSUM / S1-S2",
      description:
        "Harmonic diurnal baselines with climate-adaptive CUSUM drift detection for sensor calibration degradation.",
    },
    {
      id: "spatial",
      title: "Spatial Consensus",
      icon: MapPin,
      tag: "KD-Tree / H3",
      description:
        "Dynamic candidate topology via spatial KD-Tree and H3 hex indexing weighted by station health scores.",
    },
    {
      id: "event",
      title: "Extreme Events",
      icon: Calendar,
      tag: "Thermodynamics",
      description:
        "Local extreme detector and 4-point regional fault discriminator to decouple true climate events from sensor breakdown.",
    },
    {
      id: "health",
      title: "Health & Kalman",
      icon: HeartPulse,
      tag: "UKF State",
      description:
        "Unscented Kalman Filter state updates and repeated-median trend scoring for proactive hardware maintenance.",
    },
  ];

  return (
    <section id="evidence" className="py-20 px-6 max-w-[1200px] mx-auto">
      <div className="text-center mb-12">
        <p className="text-canopy dark:text-mint-pulse text-[13px] font-bold uppercase tracking-[0.07em] mb-2">
          Observatory Evidence Engines
        </p>
        <h2 className="text-ink dark:text-white text-[32px] sm:text-[36px] font-light leading-[1.15] tracking-[-0.02em]">
          Multi-dimensional consensus for undeniable confidence.
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {engines.map((eng) => {
          const Icon = eng.icon;
          return (
            <div
              key={eng.id}
              className="p-6 rounded-cards bg-sheetWhite dark:bg-sheetWhite-dark border border-sage-mist dark:border-sage-dark flex flex-col justify-between hover:border-canopy dark:hover:border-mint-pulse transition-colors"
            >
              <div>
                <div className="w-10 h-10 mb-5 rounded-full bg-creamPaper dark:bg-canopy-dark/40 border border-sage-mist/70 dark:border-sage-dark flex items-center justify-center text-canopy dark:text-mint-pulse">
                  <Icon className="w-5 h-5 stroke-[1.5]" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.07em] text-slate dark:text-slate-dark block mb-1">
                  {eng.tag}
                </span>
                <h3 className="text-[17px] font-medium text-bark dark:text-bark-dark mb-2">
                  {eng.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-slate dark:text-slate-dark">
                  {eng.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};