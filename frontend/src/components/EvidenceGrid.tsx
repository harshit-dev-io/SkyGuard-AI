import React from "react";
import { Clock, MapPin, Calendar, HeartPulse } from "lucide-react";

export const EvidenceGrid: React.FC = () => {
  const engines = [
    {
      id: "temporal",
      title: "Temporal",
      icon: Clock,
      description:
        "S1/S2 harmonic baselines and climate-adaptive CUSUM drift detection.",
    },
    {
      id: "spatial",
      title: "Spatial",
      icon: MapPin,
      description:
        "Static candidate topology via KD-tree/H3 with dynamic health weighting",
    },
    {
      id: "event",
      title: "Event",
      icon: Calendar,
      description:
        "Local extreme detector and 4-point regional fault discriminator",
    },
    {
      id: "health",
      title: "Health",
      icon: HeartPulse,
      description:
        "Unscented Kalman Filter state updates and repeated-median trend scoring",
    },
  ];

  return (
    <section className="py-16 px-6 max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-xs font-mono tracking-widest uppercase font-bold text-neutral-500 dark:text-neutral-400">
          Our Evidence Engines
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {engines.map((eng) => {
          const Icon = eng.icon;
          return (
            <div
              key={eng.id}
              className="p-6 rounded-2xl bg-surface-light dark:bg-surface-dark border border-borderMuted-light dark:border-borderMuted-dark shadow-card dark:shadow-cardDark text-center flex flex-col items-center hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
            >
              <div className="w-10 h-10 mb-4 rounded-full border border-borderMuted-light dark:border-borderMuted-dark flex items-center justify-center text-neutral-600 dark:text-neutral-300">
                <Icon className="w-5 h-5 stroke-[1.25]" />
              </div>
              <h3 className="text-xs font-mono font-bold tracking-widest uppercase text-ink-light dark:text-ink-dark">
                {eng.title}
              </h3>
              <p className="mt-2 text-[12px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                {eng.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};