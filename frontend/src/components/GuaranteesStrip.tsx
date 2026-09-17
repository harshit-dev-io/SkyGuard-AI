import React from "react";
import { CheckCircle2, ShieldAlert, Cpu } from "lucide-react";

export const GuaranteesStrip: React.FC = () => {
  return (
    <section className="py-16 px-6 max-w-5xl mx-auto border-t border-borderMuted-light dark:border-borderMuted-dark">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {/* Column 1 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
            <CheckCircle2 className="w-4 h-4 stroke-[1.5]" />
            <h2 className="font-serif text-lg font-bold text-ink-light dark:text-ink-dark">
              Raw Immutability
            </h2>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
            Sensor observations are written once and never mutated. Corrections,
            calibrations, and flags are stored as auditable derived records.
          </p>
        </div>

        {/* Column 2 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
            <ShieldAlert className="w-4 h-4 stroke-[1.5]" />
            <h2 className="font-serif text-lg font-bold text-ink-light dark:text-ink-dark">
              Anomaly ≠ Fault
            </h2>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
            Extreme localized weather is decoupled from sensor defects. Thermodynamic
            invariants run before any probabilistic ML classifier.
          </p>
        </div>

        {/* Column 3 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
            <Cpu className="w-4 h-4 stroke-[1.5]" />
            <h2 className="font-serif text-lg font-bold text-ink-light dark:text-ink-dark">
              WIS2 &amp; Edge Ready
            </h2>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
            Compliant with WMO WIGOS identifiers and BUFR templates, with a
            duty-cycled INT8 TinyML edge runtime under 32KB arena constraints.
          </p>
        </div>
      </div>
    </section>
  );
};