import React from "react";
import { motion } from "framer-motion";

export const NetworkDiagram: React.FC = () => {
  const nodes = [
    {
      id: "edge",
      label: "Edge Sensors",
      orbColor: "bg-canopy",
      ringColor: "ring-sage-pale dark:ring-sage-dark",
      metric: "1,420 Nodes",
    },
    {
      id: "spatial",
      label: "Spatial Consensus",
      orbColor: "bg-orb-violet",
      ringColor: "ring-orb-lavender dark:ring-orb-violet/30",
      metric: "KD-Tree / H3",
    },
    {
      id: "fusion",
      label: "Real-time Telemetry Hub",
      orbColor: "bg-mint-pulse",
      ringColor: "ring-[#e8f0ec] dark:ring-mint-pulse/20",
      metric: "Zero Latency",
      featured: true,
    },
    {
      id: "qc",
      label: "Thermodynamic QC",
      orbColor: "bg-canopy",
      ringColor: "ring-sage-pale dark:ring-sage-dark",
      metric: "WMO Standards",
    },
    {
      id: "repair",
      label: "Self-Healing Imputation",
      orbColor: "bg-orb-violet",
      ringColor: "ring-orb-lavender dark:ring-orb-violet/30",
      metric: "Derived Flags",
    },
  ];

  return (
    <section id="network" className="w-full bg-creamPaper dark:bg-creamPaper-dark py-24 px-6 text-center border-b border-sage-mist/40 dark:border-sage-dark/40 overflow-hidden select-none">
      <div className="max-w-[1200px] mx-auto">
        {/* Eyebrow in Orb Violet */}
        <p className="text-orb-violet text-[13px] font-bold uppercase tracking-[0.07em] mb-3">
          Observatory Mesh Architecture
        </p>

        {/* 48px DM Sans weight 300 headline in Ink with -0.02em tracking */}
        <h2 className="text-ink dark:text-white text-[32px] sm:text-[44px] md:text-[48px] font-light leading-[1.15] tracking-[-0.02em] max-w-[760px] mx-auto mb-16">
          Distributed telemetry intelligence, connected in open space.
        </h2>

        {/* Floating Diagram Canvas */}
        <div className="relative w-full max-w-[1000px] mx-auto min-h-[280px] flex items-center justify-around flex-wrap gap-8 py-8">
          {/* Thin 1px Dotted Sage Mist Connector Line */}
          <div className="hidden lg:block absolute inset-x-12 top-1/2 -translate-y-1/2 border-t border-dotted border-sage-mist dark:border-sage-dark z-0" />

          {nodes.map((node, index) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative z-10 flex flex-col items-center gap-3 group"
            >
              {/* 3D-Style Orb with soft ring glow */}
              <div
                className={`relative rounded-full ${node.orbColor} ${
                  node.featured ? "w-14 h-14 ring-8" : "w-11 h-11 ring-6"
                } ${node.ringColor} transition-transform duration-300 group-hover:scale-110 flex items-center justify-center`}
              >
                {node.featured && (
                  <span className="w-2.5 h-2.5 rounded-full bg-sheetWhite animate-ping opacity-75" />
                )}
              </div>

              {/* White Pill Label: DM Sans 13px weight 700 uppercase 0.07em in Bark */}
              <span className="bg-sheetWhite dark:bg-sheetWhite-dark text-bark dark:text-bark-dark text-[13px] font-bold uppercase tracking-[0.07em] px-3.5 py-1 rounded-pills border border-sage-mist/70 dark:border-sage-dark transition-colors">
                {node.label}
              </span>

              {/* Metric caption */}
              <span className="text-[12px] font-normal text-slate-muted dark:text-slate-dark">
                {node.metric}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
