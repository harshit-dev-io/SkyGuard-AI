import React from "react";
import { motion } from "framer-motion";

interface HeroProps {
  onRegisterClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onRegisterClick }) => {
  return (
    <section className="relative w-full overflow-hidden pt-20 pb-24 px-6 border-b border-sage-mist/50 dark:border-sage-dark/60 bg-creamPaper dark:bg-creamPaper-dark">
      {/* Signature Arcadia Dawn Light Gradient Wash */}
      <div
        className="absolute inset-0 pointer-events-none opacity-80 dark:opacity-20"
        style={{
          background: "linear-gradient(212.12deg, #afc4bf 14.83%, #e8e7f5 52.99%, #f1eee9 79.47%)",
        }}
      />

      <div className="relative z-10 max-w-[1200px] mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Eyebrow Label: 13px DM Sans weight 700 uppercase 0.07em tracking */}
          <p className="text-canopy dark:text-mint-pulse text-[13px] font-bold uppercase tracking-[0.07em] mb-4">
            Atmospheric &amp; Weather Hazard Intelligence
          </p>

          {/* Display Headline: 56px DM Sans weight 300 Light in Ink with -0.02em tracking */}
          <h1 className="text-ink dark:text-white text-[44px] sm:text-[54px] lg:text-[56px] font-light leading-[1.1] tracking-[-0.02em] max-w-[880px] mx-auto mb-6">
            The planetary observatory for actionable AWS anomaly detection &amp; self-healing QC.
          </h1>

          {/* Sub-headline: 18px DM Sans weight 400 in Slate */}
          <p className="text-slate dark:text-slate-dark text-[17px] sm:text-[18px] font-normal leading-[1.5] max-w-[660px] mx-auto mb-10">
            Deterministic physical thermodynamics, TinyML temporal residuals, spatial consensus fusion, and automated imputation across India&apos;s surface meteorological network.
          </p>

          {/* CTAs: High-attention Mint Pulse LED button + Solid Canopy primary CTA */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={onRegisterClick}
              className="bg-mint-pulse text-bark text-[14px] font-medium px-7 py-3.5 rounded-buttons hover:bg-mint-hover transition-all cursor-pointer shadow-none"
            >
              Launch Live Telemetry
            </button>
            <a
              href="#flow"
              className="bg-canopy text-white text-[14px] font-medium px-7 py-3.5 rounded-buttons hover:bg-canopy-dark transition-colors cursor-pointer"
            >
              Explore Pipeline
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};