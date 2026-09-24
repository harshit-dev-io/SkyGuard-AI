import React from "react";
import { Radio, Database, Cpu, CheckCircle2, ArrowRight } from "lucide-react";

export const PipelineFlow: React.FC = () => {
  return (
    <section id="flow" className="py-20 px-6 max-w-[1200px] mx-auto">
      <div className="text-center mb-12">
        <p className="text-canopy dark:text-mint-pulse text-[13px] font-bold uppercase tracking-[0.07em] mb-2">
          End-to-End Processing Architecture
        </p>
        <h2 className="text-ink dark:text-white text-[32px] sm:text-[36px] font-light leading-[1.15] tracking-[-0.02em]">
          Deterministic validation meets parallel inference.
        </h2>
      </div>

      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 relative">
        {/* Stage 1: Edge */}
        <div className="flex-1 w-full md:w-auto p-6 rounded-cards bg-sheetWhite dark:bg-sheetWhite-dark border border-sage-mist dark:border-sage-dark flex flex-col items-center text-center">
          <div className="w-10 h-10 mb-3 rounded-full bg-creamPaper dark:bg-canopy-dark/40 border border-sage-mist/70 dark:border-sage-dark flex items-center justify-center text-canopy dark:text-mint-pulse">
            <Radio className="w-5 h-5 stroke-[1.5]" />
          </div>
          <span className="text-[13px] font-bold tracking-[0.07em] uppercase text-slate dark:text-slate-dark">
            Stage 1
          </span>
          <h3 className="text-[15px] font-medium text-bark dark:text-bark-dark mt-1">
            Edge Node (INT8)
          </h3>
          <p className="text-[12px] text-slate-muted dark:text-slate-dark mt-1.5 leading-relaxed">
            Sub-32KB TinyML filtering on remote station hardware.
          </p>
        </div>

        <ArrowRight className="hidden md:block w-4 h-4 text-sage-mist dark:text-sage-dark shrink-0" />

        {/* Stage 2: Ingest */}
        <div className="flex-1 w-full md:w-auto p-6 rounded-cards bg-sheetWhite dark:bg-sheetWhite-dark border border-sage-mist dark:border-sage-dark flex flex-col items-center text-center">
          <div className="w-10 h-10 mb-3 rounded-full bg-creamPaper dark:bg-canopy-dark/40 border border-sage-mist/70 dark:border-sage-dark flex items-center justify-center text-canopy dark:text-mint-pulse">
            <Database className="w-5 h-5 stroke-[1.5]" />
          </div>
          <span className="text-[13px] font-bold tracking-[0.07em] uppercase text-slate dark:text-slate-dark">
            Stage 2
          </span>
          <h3 className="text-[15px] font-medium text-bark dark:text-bark-dark mt-1">
            Telemetry Ingest
          </h3>
          <p className="text-[12px] text-slate-muted dark:text-slate-dark mt-1.5 leading-relaxed">
            WIS2 &amp; WIGOS compliant message streaming and normalization.
          </p>
        </div>

        <ArrowRight className="hidden md:block w-4 h-4 text-sage-mist dark:text-sage-dark shrink-0" />

        {/* Stage 3: Parallel Engines (Featured Box) */}
        <div className="flex-[1.2] w-full md:w-auto p-6 rounded-cards bg-sheetWhite dark:bg-sheetWhite-dark border-2 border-canopy dark:border-mint-pulse flex flex-col items-center text-center relative">
          <div className="w-10 h-10 mb-2 rounded-full bg-canopy dark:bg-mint-pulse flex items-center justify-center text-white dark:text-bark">
            <Cpu className="w-5 h-5 stroke-[1.5]" />
          </div>
          <span className="text-[13px] font-bold tracking-[0.07em] uppercase text-canopy dark:text-mint-pulse">
            Stage 3
          </span>
          <h3 className="text-[15px] font-medium text-bark dark:text-bark-dark mt-0.5">
            4-Point Evidence Engines
          </h3>
          <p className="text-[12px] text-slate-muted dark:text-slate-dark mt-1 leading-relaxed">
            Temporal CUSUM, spatial consensus, UKF health, and extreme discrimination.
          </p>
        </div>

        <ArrowRight className="hidden md:block w-4 h-4 text-sage-mist dark:text-sage-dark shrink-0" />

        {/* Stage 4: Fusion & Self-Healing */}
        <div className="flex-1 w-full md:w-auto p-6 rounded-cards bg-sheetWhite dark:bg-sheetWhite-dark border border-sage-mist dark:border-sage-dark flex flex-col items-center text-center">
          <div className="w-10 h-10 mb-3 rounded-full bg-creamPaper dark:bg-canopy-dark/40 border border-sage-mist/70 dark:border-sage-dark flex items-center justify-center text-canopy dark:text-mint-pulse">
            <CheckCircle2 className="w-5 h-5 stroke-[1.5]" />
          </div>
          <span className="text-[13px] font-bold tracking-[0.07em] uppercase text-slate dark:text-slate-dark">
            Stage 4
          </span>
          <h3 className="text-[15px] font-medium text-bark dark:text-bark-dark mt-1">
            Self-Healing QC
          </h3>
          <p className="text-[12px] text-slate-muted dark:text-slate-dark mt-1.5 leading-relaxed">
            Automated imputation with immutable audit trails.
          </p>
        </div>
      </div>
    </section>
  );
};