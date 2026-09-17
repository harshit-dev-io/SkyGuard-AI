import React from "react";
import { Radio, Database, Cpu, Share2, ArrowRight } from "lucide-react";

export const PipelineFlow: React.FC = () => {
  return (
    <section id="flow" className="py-12 px-6 max-w-5xl mx-auto">
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 relative">
        {/* Stage 1: Edge */}
        <div className="flex-1 w-full md:w-auto p-6 rounded-2xl bg-surface-light dark:bg-surface-dark border border-borderMuted-light dark:border-borderMuted-dark shadow-card dark:shadow-cardDark flex flex-col items-center text-center">
          <div className="w-10 h-10 mb-3 rounded-full border border-borderMuted-light dark:border-borderMuted-dark flex items-center justify-center text-neutral-700 dark:text-neutral-300">
            <Radio className="w-5 h-5 stroke-[1.5]" />
          </div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400">
            Stage 1
          </span>
          <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-ink-light dark:text-ink-dark mt-1">
            Edge Node
          </h2>
        </div>

        <ArrowRight className="hidden md:block w-4 h-4 text-neutral-400 shrink-0" />

        {/* Stage 2: Ingest */}
        <div className="flex-1 w-full md:w-auto p-6 rounded-2xl bg-surface-light dark:bg-surface-dark border border-borderMuted-light dark:border-borderMuted-dark shadow-card dark:shadow-cardDark flex flex-col items-center text-center">
          <div className="w-10 h-10 mb-3 rounded-full border border-borderMuted-light dark:border-borderMuted-dark flex items-center justify-center text-neutral-700 dark:text-neutral-300">
            <Database className="w-5 h-5 stroke-[1.5]" />
          </div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400">
            Stage 2
          </span>
          <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-ink-light dark:text-ink-dark mt-1">
            Ingestion
          </h2>
        </div>

        <ArrowRight className="hidden md:block w-4 h-4 text-neutral-400 shrink-0" />

        {/* Stage 3: Parallel Engines (Featured Box) */}
        <div className="flex-[1.4] w-full md:w-auto p-6 rounded-2xl bg-surface-light dark:bg-surface-dark border border-borderMuted-light dark:border-borderMuted-dark shadow-card dark:shadow-cardDark flex flex-col items-center text-center relative overflow-hidden">
          <div className="w-10 h-10 mb-2 rounded-full border border-borderMuted-light dark:border-borderMuted-dark flex items-center justify-center text-neutral-700 dark:text-neutral-300">
            <Cpu className="w-5 h-5 stroke-[1.5]" />
          </div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400">
            Stage 3
          </span>
          <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-ink-light dark:text-ink-dark mt-0.5">
            Parallel Engines
          </h2>
          <div className="mt-3 text-neutral-400 dark:text-neutral-500">
            <Share2 className="w-4 h-4 mx-auto stroke-[1.5]" />
          </div>
        </div>

        <ArrowRight className="hidden md:block w-4 h-4 text-neutral-400 shrink-0" />

        {/* Stage 4-8: Fusion & QC */}
        <div className="flex-1 w-full md:w-auto p-6 rounded-2xl bg-surface-light dark:bg-surface-dark border border-borderMuted-light dark:border-borderMuted-dark shadow-card dark:shadow-cardDark flex flex-col items-center text-center">
          <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 mb-1">
            Stage 4–8
          </span>
          <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-ink-light dark:text-ink-dark">
            Fusion &amp; QC
          </h2>
        </div>
      </div>
    </section>
  );
};