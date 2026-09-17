import React from "react";
import { motion } from "framer-motion";

interface HeroProps {
  onRegisterClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onRegisterClick }) => {
  return (
    <section className="pt-20 pb-12 px-6 max-w-4xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.08] tracking-tight text-ink-light dark:text-ink-dark max-w-3xl mx-auto">
          AWS Anomaly Detection, <br />
          Fault Classification &amp; <br />
          Self-Healing QC.
        </h1>

        <p className="mt-6 text-sm md:text-base text-neutral-600 dark:text-neutral-400 font-sans max-w-xl mx-auto leading-relaxed">
          Deterministic physical QC, TinyML temporal residuals, spatial evidence fusion,
          and automated correction for Automatic Weather Stations.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <a
            href="#flow"
            className="px-6 py-2.5 text-xs font-mono uppercase tracking-widest bg-ink-light dark:bg-ink-dark text-surface-light dark:text-surface-dark rounded hover:opacity-90 transition-all"
          >
            Explore System
          </a>
          <button
            onClick={onRegisterClick}
            className="px-6 py-2.5 text-xs font-mono uppercase tracking-widest border border-borderMuted-light dark:border-borderMuted-dark text-ink-light dark:text-ink-dark hover:bg-neutral-100 dark:hover:bg-neutral-800/80 rounded transition-all"
          >
            Register Station
          </button>
        </div>
      </motion.div>
    </section>
  );
};