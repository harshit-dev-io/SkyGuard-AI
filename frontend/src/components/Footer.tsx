import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-canopy text-white py-20 px-6 border-t border-canopy-dark/40 select-none">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-[14px]">
        {/* Brand & Mandate */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-mint-pulse inline-block" />
            <span className="text-[20px] font-medium tracking-tight text-white block">
              SkyGuard AI
            </span>
          </div>
          <p className="text-sage-pale text-[13px] leading-relaxed">
            Planetary observatory for autonomous weather station quality control and spatial anomaly detection.
          </p>
          <div className="pt-2 text-[12px] text-sage-mist">
            <span className="font-medium text-white/80 block">Ministry of Earth Sciences</span>
            <span>Problem Statement 26073 &middot; SIH 2026</span>
          </div>
        </div>

        {/* Platform Links */}
        <div>
          <h4 className="text-[13px] font-bold uppercase tracking-[0.07em] text-mint-pulse mb-4">
            Observatory Architecture
          </h4>
          <ul className="space-y-2.5 text-sage-tint text-[13px]">
            <li><a href="#network" className="hover:underline hover:text-white transition-colors">Sensor Mesh Topology</a></li>
            <li><a href="#flow" className="hover:underline hover:text-white transition-colors">4-Point Evidence Engines</a></li>
            <li><a href="#evidence" className="hover:underline hover:text-white transition-colors">Spatial Consensus (H3)</a></li>
            <li><a href="#guarantees" className="hover:underline hover:text-white transition-colors">Thermodynamic Invariants</a></li>
          </ul>
        </div>

        {/* Protocols & Standards */}
        <div>
          <h4 className="text-[13px] font-bold uppercase tracking-[0.07em] text-sage-mist mb-4">
            Standards &amp; Formats
          </h4>
          <ul className="space-y-2.5 text-sage-tint text-[13px]">
            <li><a href="#" className="hover:underline hover:text-white transition-colors">WMO WIGOS Standard</a></li>
            <li><a href="#" className="hover:underline hover:text-white transition-colors">BUFR / WIS 2.0 Ingest</a></li>
            <li><a href="#" className="hover:underline hover:text-white transition-colors">TinyML INT8 Arena Specs</a></li>
            <li><a href="#" className="hover:underline hover:text-white transition-colors">Cryptographic Audit Logs</a></li>
          </ul>
        </div>

        {/* Access & Institutional */}
        <div>
          <h4 className="text-[13px] font-bold uppercase tracking-[0.07em] text-sage-mist mb-4">
            Operations &amp; Security
          </h4>
          <ul className="space-y-2.5 text-sage-tint text-[13px]">
            <li><a href="#" className="hover:underline hover:text-white transition-colors">Operator Dashboard</a></li>
            <li><a href="#" className="hover:underline hover:text-white transition-colors">Admin Station Provisioning</a></li>
            <li><a href="#" className="hover:underline hover:text-white transition-colors">Telemetry API Specs</a></li>
            <li><a href="#" className="hover:underline hover:text-white transition-colors">Station Hardware Calibration</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-sage-mist">
        <p>&copy; 2026 SkyGuard AI System Architecture. Built for MoES India AWS Network.</p>
        <p className="text-[11px] tracking-wide uppercase text-sage-pale font-medium">
          Arcadia Forest Observatory Design System
        </p>
      </div>
    </footer>
  );
};