import React from "react";
import { CheckCircle2, ShieldAlert, Cpu } from "lucide-react";

export const GuaranteesStrip: React.FC = () => {
  return (
    <section id="guarantees" className="py-20 px-6 max-w-[1200px] mx-auto border-t border-sage-mist/50 dark:border-sage-dark/60 select-none">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {/* Column 1 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-canopy dark:text-mint-pulse">
            <CheckCircle2 className="w-5 h-5 stroke-[1.5]" />
            <h3 className="text-[18px] font-medium text-bark dark:text-bark-dark">
              Raw Immutability
            </h3>
          </div>
          <p className="text-[14px] text-slate dark:text-slate-dark leading-relaxed">
            Raw telemetry is written once and cryptographically preserved. All QC flags,
            calibrations, and imputations exist as auditable, reproducible derived records.
          </p>
        </div>

        {/* Column 2 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-canopy dark:text-mint-pulse">
            <ShieldAlert className="w-5 h-5 stroke-[1.5]" />
            <h3 className="text-[18px] font-medium text-bark dark:text-bark-dark">
              Anomaly &ne; Sensor Fault
            </h3>
          </div>
          <p className="text-[14px] text-slate dark:text-slate-dark leading-relaxed">
            Extreme micro-climate phenomena (cloudbursts, inversions) are mathematically
            decoupled from hardware degradation through thermodynamic boundary invariants.
          </p>
        </div>

        {/* Column 3 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-canopy dark:text-mint-pulse">
            <Cpu className="w-5 h-5 stroke-[1.5]" />
            <h3 className="text-[18px] font-medium text-bark dark:text-bark-dark">
              WIS2 &amp; Edge Certified
            </h3>
          </div>
          <p className="text-[14px] text-slate dark:text-slate-dark leading-relaxed">
            Full compliance with WMO WIGOS identifiers and BUFR schema standards, with a
            duty-cycled INT8 TinyML edge runtime operating under strict 32KB RAM budgets.
          </p>
        </div>
      </div>
    </section>
  );
};