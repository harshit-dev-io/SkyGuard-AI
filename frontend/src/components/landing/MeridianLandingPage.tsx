import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Play,
  PlayCircle,
  Radio,
  Thermometer,
  Network,
  Wand2,
  CheckCircle2,
  Globe,
  ShieldCheck,
  Cable,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import skyguardLogo from '../../assets/skyguard-logo.png';

interface MeridianAILandingPageProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onOpenWalkthrough: () => void;
}

export const MeridianAILandingPage: React.FC<MeridianAILandingPageProps> = ({
  onOpenAuth,
  onOpenWalkthrough,
}) => {
  const { enterDemoSandbox } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-[#15130F] text-[#1B1A18] dark:text-[#F3EFE8] font-sans antialiased selection:bg-[#FDEDE1] selection:text-[#E1590C]">
      {/* 1. FIXED TOP HEADER */}
      <header className="fixed top-0 w-full z-50 bg-white/85 dark:bg-[#15130F]/85 backdrop-blur-xl border-b border-[#E9E5DF] dark:border-[#332C23] shadow-[0_1px_8px_rgba(0,0,0,0.03)] transition-colors">
        <div className="h-16 w-full px-6 flex items-center justify-between">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-[#1B1A18] dark:bg-[#26211A] flex items-center justify-center relative overflow-hidden border border-[#E9E5DF] dark:border-[#332C23]">
                <img
                  src={skyguardLogo}
                  alt="SkyGuard Logo"
                  className="w-full h-full object-cover p-1"
                  onError={(e) => {
                    (e.currentTarget as any).style.display = 'none';
                  }}
                />
              </div>
              <div className="flex items-baseline gap-1 text-[17px] font-bold tracking-tight text-[#1B1A18] dark:text-[#F3EFE8]">
                <span>SkyGuard</span>
                <span className="text-[#E1590C]">- AI</span>
              </div>
            </div>

            {/* Navigation Anchor Links */}
            <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#716C64] dark:text-[#9A938A]">
              <a
                href="#overview"
                className="text-[#1B1A18] dark:text-[#F3EFE8] font-semibold transition-colors"
              >
                Overview
              </a>
              <a
                href="#terminal"
                className="hover:text-[#1B1A18] dark:hover:text-[#F3EFE8] transition-colors"
              >
                Telemetry Grid
              </a>
              <a
                href="#pipeline"
                className="hover:text-[#1B1A18] dark:hover:text-[#F3EFE8] transition-colors"
              >
                Neural Models
              </a>
              <a
                href="#compliance"
                className="hover:text-[#1B1A18] dark:hover:text-[#F3EFE8] transition-colors"
              >
                Compliance &amp; Audit
              </a>
              <a
                href="#deployment"
                className="hover:text-[#1B1A18] dark:hover:text-[#F3EFE8] transition-colors"
              >
                Enterprise
              </a>
            </nav>
          </div>

          {/* Right Action Utilities */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              className="w-8 h-8 rounded-md flex items-center justify-center text-[#716C64] hover:text-[#1B1A18] dark:hover:text-white hover:bg-[#FAF9F7] dark:hover:bg-[#26211A] transition-colors cursor-pointer"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-[#E8A317]" />
              ) : (
                <Moon className="w-4 h-4 text-[#716C64]" />
              )}
            </button>

            {/* Watch Walkthrough */}
            <button
              onClick={onOpenWalkthrough}
              className="hidden sm:inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg bg-white dark:bg-[#1E1A15] border border-[#E9E5DF] dark:border-[#332C23] text-[#1B1A18] dark:text-[#F3EFE8] text-xs font-semibold hover:bg-[#FAF9F7] dark:hover:bg-[#26211A] transition-colors shadow-xs cursor-pointer"
            >
              Watch Walkthrough
            </button>

            {/* Get Demo Direct Sandbox Button */}
            <button
              onClick={enterDemoSandbox}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full bg-[#E1590C] hover:bg-[#C24A08] text-white text-xs font-semibold transition-all active:scale-95 shadow-[0_4px_16px_-2px_rgba(27,26,24,0.08)] cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Get Demo</span>
            </button>

            {/* Create Account CTA */}
            <button
              onClick={() => onOpenAuth('signup')}
              className="hidden md:inline-flex px-3 py-1.5 text-xs font-semibold text-[#E1590C] hover:underline transition-colors cursor-pointer"
            >
              Create Account
            </button>

            {/* Sign In CTA */}
            <button
              onClick={() => onOpenAuth('login')}
              className="px-3 py-1.5 text-xs font-medium text-[#716C64] dark:text-[#9A938A] hover:text-[#1B1A18] dark:hover:text-white transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* MAIN BODY CONTAINER */}
      <main className="w-full pt-16">
        {/* 2. INTERACTIVE TOP ACTION / QUICK STATUS UTILITY STRIP */}
        <div className="w-full bg-[#FAF9F7] dark:bg-[#1E1A15] border-b border-[#E9E5DF] dark:border-[#332C23] px-6 py-2 text-[#716C64] dark:text-[#9A938A] text-xs font-mono flex flex-wrap items-center justify-between gap-2 select-none">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-medium text-[#1F9D55]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1F9D55] animate-pulse" />
              SYNOPTIC RUN: CONTINUOUS 120Hz
            </span>
            <span className="hidden md:inline text-[#E9E5DF] dark:text-[#332C23]">/</span>
            <span className="hidden md:inline">MESONET_ID: #IN-AWS-CENTRAL-01</span>
          </div>
          <div className="flex items-center gap-3">
            <span>PHYSICAL ENGINE RESIDUAL: &lt; 0.003hPa</span>
            <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#26211A] border border-[#E9E5DF] dark:border-[#332C23] text-[#1B1A18] dark:text-[#F3EFE8] font-mono uppercase tracking-wider text-[10px] font-semibold">
              Deterministic Mode
            </span>
          </div>
        </div>

        {/* 3. HERO SECTION (INCREASED PROPORTIONS MATCHING STITCH SPEC) */}
        <section
          id="overview"
          className="w-full bg-white dark:bg-[#15130F] px-6 pt-16 pb-24 flex flex-col items-center text-center relative overflow-hidden"
        >
          {/* Ambient subtle background depth geometry */}
          <div className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-15 bg-[radial-gradient(#E1590C_1px,transparent_1px)] [background-size:24px_24px]" />

          {/* Version Tag Badge */}
          <div className="relative z-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF9F7] dark:bg-[#1E1A15] border border-[#E9E5DF] dark:border-[#332C23] mb-8 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#1F9D55] ring-2 ring-[#E8F7EE] dark:ring-[#1F9D55]/30" />
            <span className="font-mono text-xs font-medium tracking-wider text-[#1B1A18] dark:text-[#F3EFE8]">
              PHYSICAL VALIDATION ENGINE · V2.4
            </span>
            <span className="text-[#E9E5DF] dark:text-[#332C23] text-xs">|</span>
            <span className="font-sans text-xs text-[#E1590C] font-semibold">
              AIR-PRESSURE PASS 99.998%
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="relative z-10 max-w-5xl font-sans text-4xl sm:text-5xl md:text-6xl lg:text-[66px] font-bold tracking-tight text-[#1B1A18] dark:text-[#F3EFE8] leading-[1.08] mb-6">
            Deterministic Physical Validation for National Weather Sensor Meshes
          </h1>

          {/* Subtitle */}
          <p className="relative z-10 max-w-3xl font-sans text-base sm:text-lg md:text-xl text-[#716C64] dark:text-[#9A938A] leading-relaxed mb-10">
            High-frequency real-time edge telemetry validated against spatial consensus models and
            thermodynamic constraints. Eliminate spurious sensor drift before it enters climate
            forecasting pipelines.
          </p>

          {/* CTAs & Action Group */}
          <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 mb-4">
            <button
              onClick={enterDemoSandbox}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-[#E1590C] text-white font-sans text-sm sm:text-base font-semibold shadow-md hover:bg-[#C24A08] transition-all active:scale-98 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Get Demo</span>
            </button>
            <button
              onClick={onOpenWalkthrough}
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-white dark:bg-[#1E1A15] border border-[#E9E5DF] dark:border-[#332C23] text-[#1B1A18] dark:text-[#F3EFE8] font-sans text-sm sm:text-base font-medium shadow-xs hover:bg-[#FAF9F7] dark:hover:bg-[#26211A] transition-colors cursor-pointer"
            >
              <PlayCircle className="w-4 h-4 text-[#E1590C]" />
              <span>Watch Walkthrough (2 min)</span>
            </button>
          </div>

          {/* Micro Trust Indicator */}
          <p className="relative z-10 font-mono text-xs text-[#716C64] dark:text-[#9A938A] mb-12">
            Instant sandbox access · No credentials required · Seeded telemetry data
          </p>

          {/* Key Metrics Ribbon (4 Columns) */}
          <div className="relative z-10 w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-xl bg-[#FAF9F7] dark:bg-[#1E1A15] border border-[#E9E5DF] dark:border-[#332C23] shadow-xs">
            <div className="flex flex-col items-center justify-center p-3 border-r last:border-r-0 border-[#E9E5DF]/60 dark:border-[#332C23]">
              <span className="font-mono text-2xl sm:text-3xl font-bold text-[#1B1A18] dark:text-[#F3EFE8] tracking-tight">
                14
              </span>
              <span className="font-sans text-[11px] uppercase text-[#716C64] dark:text-[#9A938A] tracking-wider mt-1 font-semibold">
                Synoptic Quadrants
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 md:border-r border-[#E9E5DF]/60 dark:border-[#332C23]">
              <span className="font-mono text-2xl sm:text-3xl font-bold text-[#E1590C] tracking-tight">
                &lt; 12ms
              </span>
              <span className="font-sans text-[11px] uppercase text-[#716C64] dark:text-[#9A938A] tracking-wider mt-1 font-semibold">
                Consensus Latency
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 border-r last:border-r-0 border-[#E9E5DF]/60 dark:border-[#332C23]">
              <span className="font-mono text-2xl sm:text-3xl font-bold text-[#1F9D55] tracking-tight">
                99.98%
              </span>
              <span className="font-sans text-[11px] uppercase text-[#716C64] dark:text-[#9A938A] tracking-wider mt-1 font-semibold">
                Anomaly Precision
              </span>
            </div>
            <div className="flex flex-col items-center justify-center p-3">
              <span className="font-mono text-2xl sm:text-3xl font-bold text-[#1B1A18] dark:text-[#F3EFE8] tracking-tight">
                Zero
              </span>
              <span className="font-sans text-[11px] uppercase text-[#716C64] dark:text-[#9A938A] tracking-wider mt-1 font-semibold">
                Untracked Drift
              </span>
            </div>
          </div>
        </section>

        {/* 4. LIVE OPERATIONS TERMINAL MOCKUP COMPONENT */}
        <section id="terminal" className="w-full bg-[#FAF9F7] dark:bg-[#15130F] px-6 py-16 -mt-8">
          <div className="w-full max-w-7xl mx-auto rounded-xl bg-white dark:bg-[#1E1A15] border border-[#E9E5DF] dark:border-[#332C23] shadow-[0_12px_36px_-6px_rgba(27,26,24,0.08)] overflow-hidden">
            {/* Operational Header Bar */}
            <div className="px-5 py-3 bg-[#FAF9F7] dark:bg-[#26211A] flex flex-wrap items-center justify-between border-b border-[#E9E5DF] dark:border-[#332C23]">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#DC2626]" />
                  <span className="w-3 h-3 rounded-full bg-[#E8A317]" />
                  <span className="w-3 h-3 rounded-full bg-[#1F9D55]" />
                </div>
                <span className="ml-2 font-mono text-xs font-semibold text-[#1B1A18] dark:text-[#F3EFE8]">
                  REAL-TIME INGEST STREAM // STATION IMD-DL-DELHI-01 (NWS COMPATIBLE)
                </span>
              </div>
              <div className="flex items-center gap-4 font-mono text-xs">
                <span className="px-2 py-0.5 rounded bg-[#1F9D55]/10 text-[#1F9D55] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1F9D55] animate-pulse" />
                  FILTER ACTIVE
                </span>
                <span className="text-[#716C64] dark:text-[#9A938A]">
                  T = 2026-09-25T14:32:01.402Z
                </span>
              </div>
            </div>

            {/* Telemetry Visuals Split Grid (8 cols / 4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#E9E5DF] dark:divide-[#332C23]">
              {/* Live Waveform & Anomaly Detection Graph (8 cols) */}
              <div className="lg:col-span-8 p-6 flex flex-col justify-between space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-sans text-base sm:text-lg font-bold text-[#1B1A18] dark:text-[#F3EFE8]">
                      Barometric Lapse Residual vs. Isentropic Gradient
                    </h3>
                    <p className="font-sans text-xs text-[#716C64] dark:text-[#9A938A] mt-0.5">
                      Continuous physical plausibility cross-check against 16 surrounding station nodes
                    </p>
                  </div>
                  <span className="font-mono text-xs text-[#E1590C] font-semibold bg-[#FDEDE1] dark:bg-[#3A2416] px-2.5 py-1 rounded border border-[#FCD9C3] dark:border-[#4A301E] self-start sm:self-center">
                    ΔP: 0.12 hPa [STABLE]
                  </span>
                </div>

                {/* SVG Precision Telemetry Waveform */}
                <div className="w-full h-52 sm:h-64 relative bg-[#FAF9F7] dark:bg-[#15130F] rounded-lg p-3 flex flex-col justify-end overflow-hidden border border-[#E9E5DF] dark:border-[#332C23]">
                  <div className="absolute top-3 left-3 flex flex-wrap gap-4 text-[11px] font-mono text-[#716C64] dark:text-[#9A938A]">
                    <span>BOUNDS: [980.20 — 983.80 hPa]</span>
                    <span>SAMPLING: 120Hz</span>
                    <span className="text-[#1F9D55] font-medium">CONVERGENCE: RESIDUAL &lt; 0.04</span>
                  </div>

                  <svg
                    className="w-full h-44 overflow-visible text-[#E1590C]"
                    fill="none"
                    preserveAspectRatio="none"
                    viewBox="0 0 900 150"
                  >
                    {/* Upper Threshold Bound */}
                    <line
                      stroke="currentColor"
                      strokeDasharray="4 4"
                      strokeOpacity="0.25"
                      strokeWidth="1.5"
                      x1="0"
                      x2="900"
                      y1="25"
                      y2="25"
                    />
                    {/* Lower Threshold Bound */}
                    <line
                      stroke="currentColor"
                      strokeDasharray="4 4"
                      strokeOpacity="0.25"
                      strokeWidth="1.5"
                      x1="0"
                      x2="900"
                      y1="125"
                      y2="125"
                    />

                    {/* Spatial Neighbor Envelope (Confidence Shadow) */}
                    <polygon
                      fill="currentColor"
                      fillOpacity="0.08"
                      points="0,60 120,55 240,65 360,40 480,45 600,68 720,52 840,48 900,50 900,105 840,100 720,110 600,95 480,115 360,110 240,95 120,102 0,98"
                    />

                    {/* Station Actual Telemetry Line */}
                    <path
                      d="M 0 75 Q 60 70, 120 78 T 240 68 T 360 52 T 480 58 T 600 82 T 720 62 T 840 56 L 900 58"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="2.5"
                    />

                    {/* Quarantined Anomaly Spike Trace (Rejected Sensor Pulse) */}
                    <path
                      d="M 520 62 L 530 18 L 540 65"
                      stroke="#DC2626"
                      strokeDasharray="2 2"
                      strokeWidth="1.75"
                    />

                    {/* Anomaly Marker Flag */}
                    <circle cx="530" cy="18" fill="#DC2626" r="4" />
                    <text
                      className="font-mono text-[10px] font-bold"
                      fill="#DC2626"
                      x="540"
                      y="22"
                    >
                      SPURIOUS DRIFT ISOLATED (dt=8ms)
                    </text>
                  </svg>

                  <div className="flex justify-between items-center pt-2 font-mono text-[11px] text-[#716C64] dark:text-[#9A938A] border-t border-[#E9E5DF]/60 dark:border-[#332C23]">
                    <span>-60 SEC</span>
                    <span>-45 SEC</span>
                    <span>-30 SEC</span>
                    <span>-15 SEC</span>
                    <span className="text-[#E1590C] font-bold">T-0 (NOW)</span>
                  </div>
                </div>

                {/* Micro status counters (3 cards) */}
                <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-3 bg-[#FAF9F7] dark:bg-[#26211A] rounded-lg border border-[#E9E5DF] dark:border-[#332C23]">
                    <span className="text-[#716C64] dark:text-[#9A938A] block text-[11px]">
                      VANE VELOCITY
                    </span>
                    <span className="font-semibold text-[#1B1A18] dark:text-[#F3EFE8] text-sm mt-0.5 block">
                      14.28 m/s ±0.04
                    </span>
                  </div>
                  <div className="p-3 bg-[#FAF9F7] dark:bg-[#26211A] rounded-lg border border-[#E9E5DF] dark:border-[#332C23]">
                    <span className="text-[#716C64] dark:text-[#9A938A] block text-[11px]">
                      THERMAL LAPSE
                    </span>
                    <span className="font-semibold text-[#1B1A18] dark:text-[#F3EFE8] text-sm mt-0.5 block">
                      -6.49 K/km
                    </span>
                  </div>
                  <div className="p-3 bg-[#FAF9F7] dark:bg-[#26211A] rounded-lg border border-[#E9E5DF] dark:border-[#332C23]">
                    <span className="text-[#716C64] dark:text-[#9A938A] block text-[11px]">
                      QUARANTINE QUEUE
                    </span>
                    <span className="font-semibold text-[#1F9D55] text-sm mt-0.5 block">
                      0 Active Alerts
                    </span>
                  </div>
                </div>
              </div>

              {/* Physical Consensus Inspector Column (4 cols) */}
              <div className="lg:col-span-4 p-6 flex flex-col justify-between bg-[#FAF9F7]/50 dark:bg-[#1E1A15]">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#E9E5DF] dark:border-[#332C23]">
                    <span className="font-sans text-sm font-bold text-[#1B1A18] dark:text-[#F3EFE8]">
                      Physical Consensus Inspector
                    </span>
                    <span className="font-mono text-xs text-[#6D28D9] font-semibold">
                      xAI Ensemble
                    </span>
                  </div>

                  <div className="mt-5 space-y-4">
                    {/* Item 1 */}
                    <div className="p-3.5 rounded-lg bg-white dark:bg-[#26211A] border border-[#E9E5DF] dark:border-[#332C23] shadow-xs">
                      <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                        <span className="text-[#716C64] dark:text-[#9A938A]">
                          BAROMETRIC TRANSDUCER A
                        </span>
                        <span className="text-[#1F9D55] font-bold">STABLE</span>
                      </div>
                      <div className="w-full bg-[#FAF9F7] dark:bg-[#15130F] rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#1F9D55] h-1.5 rounded-full" style={{ width: '98%' }} />
                      </div>
                      <span className="text-[11px] font-sans text-[#716C64] dark:text-[#9A938A] mt-1.5 block">
                        Entropy score: 0.002 bit/sample
                      </span>
                    </div>

                    {/* Item 2 */}
                    <div className="p-3.5 rounded-lg bg-white dark:bg-[#26211A] border border-[#E9E5DF] dark:border-[#332C23] shadow-xs">
                      <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                        <span className="text-[#716C64] dark:text-[#9A938A]">
                          PYRANOMETER FLUX GRADIENT
                        </span>
                        <span className="text-[#1F9D55] font-bold">AGREED (16/16)</span>
                      </div>
                      <div className="w-full bg-[#FAF9F7] dark:bg-[#15130F] rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#1F9D55] h-1.5 rounded-full" style={{ width: '96%' }} />
                      </div>
                      <span className="text-[11px] font-sans text-[#716C64] dark:text-[#9A938A] mt-1.5 block">
                        Cross-azimuth solar elevation sync verified
                      </span>
                    </div>

                    {/* Item 3 */}
                    <div className="p-3.5 rounded-lg bg-white dark:bg-[#26211A] border border-[#E9E5DF] dark:border-[#332C23] shadow-xs">
                      <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                        <span className="text-[#716C64] dark:text-[#9A938A]">
                          SONIC ANEMOMETER AXIS-Z
                        </span>
                        <span className="text-[#6D28D9] font-bold">CORRELATED</span>
                      </div>
                      <div className="w-full bg-[#FAF9F7] dark:bg-[#15130F] rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#6D28D9] h-1.5 rounded-full" style={{ width: '94%' }} />
                      </div>
                      <span className="text-[11px] font-sans text-[#716C64] dark:text-[#9A938A] mt-1.5 block">
                        Kinematic boundary turbulence verified
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E9E5DF] dark:border-[#332C23] flex items-center justify-between text-xs font-mono">
                  <span className="text-[#716C64] dark:text-[#9A938A] font-medium">
                    DISPATCH CONSENSUS:
                  </span>
                  <span className="px-2.5 py-1 rounded bg-[#E8F7EE] dark:bg-[#1F9D55]/20 text-[#1F9D55] font-bold text-xs uppercase tracking-wider">
                    AUTHORITATIVE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. 5-STAGE DETERMINISTIC VERIFICATION ARCHITECTURE PIPELINE */}
        <section
          id="pipeline"
          className="w-full bg-white dark:bg-[#15130F] px-6 py-20 border-y border-[#E9E5DF] dark:border-[#332C23]"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
              <div>
                <span className="font-mono text-xs text-[#E1590C] uppercase font-bold tracking-widest block mb-1">
                  System Pipeline Flow
                </span>
                <h2 className="font-sans text-3xl sm:text-4xl font-bold tracking-tight text-[#1B1A18] dark:text-[#F3EFE8]">
                  Deterministic Verification Architecture
                </h2>
              </div>
              <p className="font-sans text-sm text-[#716C64] dark:text-[#9A938A] max-w-md">
                A continuous five-stage mathematical gate ensuring edge anomalies, sensor degradation,
                and non-physical values are neutralized at ingest.
              </p>
            </div>

            {/* 5-Stage Connected Pipeline Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Stage 1 */}
              <div className="group relative flex flex-col p-5 rounded-xl bg-[#FAF9F7] dark:bg-[#1E1A15] border border-[#E9E5DF] dark:border-[#332C23] hover:border-[#E1590C]/40 transition-all shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <span className="w-8 h-8 rounded-lg bg-white dark:bg-[#26211A] text-[#1B1A18] dark:text-[#F3EFE8] border border-[#E9E5DF] dark:border-[#332C23] flex items-center justify-center font-mono text-xs font-bold">
                    01
                  </span>
                  <Radio className="w-5 h-5 text-[#E1590C]" />
                </div>
                <h3 className="font-sans text-base font-bold text-[#1B1A18] dark:text-[#F3EFE8] mb-2">
                  Ingestion
                </h3>
                <p className="font-sans text-xs text-[#716C64] dark:text-[#9A938A] leading-relaxed mb-4">
                  120Hz continuous telemetry from multi-sensor AWS arrays, Pyranometers, Barometric
                  transducers, and 3D Sonic Anemometers.
                </p>
                <div className="mt-auto pt-2 font-mono text-xs text-[#E1590C] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E1590C]" />
                  120 Samples/sec
                </div>
              </div>

              {/* Stage 2 */}
              <div className="group relative flex flex-col p-5 rounded-xl bg-[#FAF9F7] dark:bg-[#1E1A15] border border-[#E9E5DF] dark:border-[#332C23] hover:border-[#E1590C]/40 transition-all shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <span className="w-8 h-8 rounded-lg bg-white dark:bg-[#26211A] text-[#1B1A18] dark:text-[#F3EFE8] border border-[#E9E5DF] dark:border-[#332C23] flex items-center justify-center font-mono text-xs font-bold">
                    02
                  </span>
                  <Thermometer className="w-5 h-5 text-[#E1590C]" />
                </div>
                <h3 className="font-sans text-base font-bold text-[#1B1A18] dark:text-[#F3EFE8] mb-2">
                  Physical Gate
                </h3>
                <p className="font-sans text-xs text-[#716C64] dark:text-[#9A938A] leading-relaxed mb-4">
                  First-principles thermodynamic equations and strict barometric lapse-rate boundary
                  checks discard non-physical discontinuities instantly.
                </p>
                <div className="mt-auto pt-2 font-mono text-xs text-[#E1590C] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E1590C]" />
                  1st Principles
                </div>
              </div>

              {/* Stage 3 */}
              <div className="group relative flex flex-col p-5 rounded-xl bg-[#FAF9F7] dark:bg-[#1E1A15] border border-[#E9E5DF] dark:border-[#332C23] hover:border-[#6D28D9]/40 transition-all shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <span className="w-8 h-8 rounded-lg bg-white dark:bg-[#26211A] text-[#1B1A18] dark:text-[#F3EFE8] border border-[#E9E5DF] dark:border-[#332C23] flex items-center justify-center font-mono text-xs font-bold">
                    03
                  </span>
                  <Network className="w-5 h-5 text-[#6D28D9]" />
                </div>
                <h3 className="font-sans text-base font-bold text-[#1B1A18] dark:text-[#F3EFE8] mb-2">
                  Spatial Consensus
                </h3>
                <p className="font-sans text-xs text-[#716C64] dark:text-[#9A938A] leading-relaxed mb-4">
                  Spatiotemporal transformer cross-validation against nearest 16 physical neighbor
                  stations confirms spatial atmospheric coherence.
                </p>
                <div className="mt-auto pt-2 font-mono text-xs text-[#6D28D9] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6D28D9]" />
                  16-Node Graph
                </div>
              </div>

              {/* Stage 4 */}
              <div className="group relative flex flex-col p-5 rounded-xl bg-[#FAF9F7] dark:bg-[#1E1A15] border border-[#E9E5DF] dark:border-[#332C23] hover:border-[#6D28D9]/40 transition-all shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <span className="w-8 h-8 rounded-lg bg-white dark:bg-[#26211A] text-[#1B1A18] dark:text-[#F3EFE8] border border-[#E9E5DF] dark:border-[#332C23] flex items-center justify-center font-mono text-xs font-bold">
                    04
                  </span>
                  <Wand2 className="w-5 h-5 text-[#6D28D9]" />
                </div>
                <h3 className="font-sans text-base font-bold text-[#1B1A18] dark:text-[#F3EFE8] mb-2">
                  State Reconstruction
                </h3>
                <p className="font-sans text-xs text-[#716C64] dark:text-[#9A938A] leading-relaxed mb-4">
                  Neural Bayesian expectation vectors calculate true uncorrupted state values and initiate
                  automated progressive sensor quarantine.
                </p>
                <div className="mt-auto pt-2 font-mono text-xs text-[#6D28D9] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6D28D9]" />
                  Bayesian Vector
                </div>
              </div>

              {/* Stage 5 */}
              <div className="group relative flex flex-col p-5 rounded-xl bg-[#FAF9F7] dark:bg-[#1E1A15] border border-[#E9E5DF] dark:border-[#332C23] hover:border-[#1F9D55]/40 transition-all shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <span className="w-8 h-8 rounded-lg bg-[#E1590C] text-white flex items-center justify-center font-mono text-xs font-bold">
                    05
                  </span>
                  <CheckCircle2 className="w-5 h-5 text-[#1F9D55]" />
                </div>
                <h3 className="font-sans text-base font-bold text-[#1B1A18] dark:text-[#F3EFE8] mb-2">
                  Global Publishing
                </h3>
                <p className="font-sans text-xs text-[#716C64] dark:text-[#9A938A] leading-relaxed mb-4">
                  Signed authoritative stream broadcast via deterministic gRPC to national grid
                  dispatchers and numerical weather prediction clusters.
                </p>
                <div className="mt-auto pt-2 font-mono text-xs text-[#1F9D55] font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1F9D55]" />
                  Signed Cryptographic Feed
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. AUTHORITY & REGULATORY ALIGNMENT (INSTITUTIONAL TRUST) */}
        <section id="compliance" className="w-full bg-[#FAF9F7] dark:bg-[#15130F] px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="font-mono text-xs text-[#716C64] dark:text-[#9A938A] uppercase font-semibold tracking-wider">
                Authority &amp; Regulatory Alignment
              </span>
              <h2 className="font-sans text-3xl sm:text-4xl font-bold tracking-tight text-[#1B1A18] dark:text-[#F3EFE8] mt-2 mb-3">
                Engineered for National Met Offices &amp; Synchronous Grid Interconnects
              </h2>
              <p className="font-sans text-sm text-[#716C64] dark:text-[#9A938A]">
                Strict alignment with international meteorological standards and audit-traceable sensor
                integrity verification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Trust Card 1 */}
              <div className="p-6 rounded-xl bg-white dark:bg-[#1E1A15] border border-[#E9E5DF] dark:border-[#332C23] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-[#FAF9F7] dark:bg-[#26211A] flex items-center justify-center text-[#E1590C] mb-4 border border-[#E9E5DF] dark:border-[#332C23]">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div className="font-mono text-xs text-[#E1590C] uppercase font-bold tracking-wider mb-1">
                    Standard 8-No. 8
                  </div>
                  <h3 className="font-sans text-lg font-bold text-[#1B1A18] dark:text-[#F3EFE8] mb-2">
                    WMO Standards Compliant
                  </h3>
                  <p className="font-sans text-xs text-[#716C64] dark:text-[#9A938A] leading-relaxed">
                    Fully compliant with World Meteorological Organization guidelines for automated
                    synoptic observations, exposure criteria, and instrumentation error budgets.
                  </p>
                </div>
                <div className="pt-5 border-t border-[#E9E5DF]/60 dark:border-[#332C23] mt-6 flex items-center justify-between text-xs font-mono text-[#716C64] dark:text-[#9A938A]">
                  <span>ANNEX 3 / TECH REG</span>
                  <span className="text-[#1F9D55] font-bold">100% PASS</span>
                </div>
              </div>

              {/* Trust Card 2 */}
              <div className="p-6 rounded-xl bg-white dark:bg-[#1E1A15] border border-[#E9E5DF] dark:border-[#332C23] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-[#FAF9F7] dark:bg-[#26211A] flex items-center justify-center text-[#6D28D9] mb-4 border border-[#E9E5DF] dark:border-[#332C23]">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="font-mono text-xs text-[#6D28D9] uppercase font-bold tracking-wider mb-1">
                    Metrological Traceability
                  </div>
                  <h3 className="font-sans text-lg font-bold text-[#1B1A18] dark:text-[#F3EFE8] mb-2">
                    ISO/IEC 17025 Ready
                  </h3>
                  <p className="font-sans text-xs text-[#716C64] dark:text-[#9A938A] leading-relaxed">
                    Provides immutable cryptographic audit logs for every sensor drift identification,
                    algorithmic adjustment, and calibration event needed for accreditation.
                  </p>
                </div>
                <div className="pt-5 border-t border-[#E9E5DF]/60 dark:border-[#332C23] mt-6 flex items-center justify-between text-xs font-mono text-[#716C64] dark:text-[#9A938A]">
                  <span>UNCERTAINTY BUDGET</span>
                  <span className="text-[#1F9D55] font-bold">CERTIFIED</span>
                </div>
              </div>

              {/* Trust Card 3 */}
              <div className="p-6 rounded-xl bg-white dark:bg-[#1E1A15] border border-[#E9E5DF] dark:border-[#332C23] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-lg bg-[#FAF9F7] dark:bg-[#26211A] flex items-center justify-center text-[#E1590C] mb-4 border border-[#E9E5DF] dark:border-[#332C23]">
                    <Cable className="w-6 h-6" />
                  </div>
                  <div className="font-mono text-xs text-[#E1590C] uppercase font-bold tracking-wider mb-1">
                    Federal Interconnect
                  </div>
                  <h3 className="font-sans text-lg font-bold text-[#1B1A18] dark:text-[#F3EFE8] mb-2">
                    NWS Protocol Compatible
                  </h3>
                  <p className="font-sans text-xs text-[#716C64] dark:text-[#9A938A] leading-relaxed">
                    Native protocol adapters for AWIPS-II, SHEF, BUFR, and CAP formats. Drop-in integration
                    with national forecast offices and IMD radar feeds without retooling ingest pipelines.
                  </p>
                </div>
                <div className="pt-5 border-t border-[#E9E5DF]/60 dark:border-[#332C23] mt-6 flex items-center justify-between text-xs font-mono text-[#716C64] dark:text-[#9A938A]">
                  <span>DISPATCH EMITTER</span>
                  <span className="text-[#1F9D55] font-bold">READY</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. PRE-FLIGHT TERMINAL CTA BANNER */}
        <section
          id="deployment"
          className="w-full bg-white dark:bg-[#15130F] px-6 py-16 border-t border-[#E9E5DF] dark:border-[#332C23]"
        >
          <div className="max-w-7xl mx-auto rounded-2xl bg-[#FAF9F7] dark:bg-[#1E1A15] border border-[#E9E5DF] dark:border-[#332C23] p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-xs">
            <div className="max-w-2xl">
              <span className="font-mono text-xs text-[#E1590C] font-bold uppercase tracking-wider block mb-1">
                Mission-Critical Deployment
              </span>
              <h2 className="font-sans text-2xl sm:text-3xl font-bold text-[#1B1A18] dark:text-[#F3EFE8] tracking-tight mb-2">
                Deploy physical telemetry validation across your regional sensor array in under 48 hours.
              </h2>
              <p className="font-sans text-xs sm:text-sm text-[#716C64] dark:text-[#9A938A]">
                Connect your existing AWS telemetry feeds or ingest raw MQTT/CoAP broker streams. Test
                against our historical severe atmospheric disturbance datasets.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0">
              <button
                onClick={enterDemoSandbox}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#E1590C] text-white font-sans text-sm font-semibold hover:bg-[#C24A08] transition-all active:scale-98 shadow-md cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Get Demo Access</span>
              </button>
              <button
                onClick={onOpenWalkthrough}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-white dark:bg-[#26211A] border border-[#E9E5DF] dark:border-[#332C23] text-[#1B1A18] dark:text-[#F3EFE8] font-sans text-sm font-medium hover:bg-[#FAF9F7] dark:hover:bg-[#15130F] transition-colors cursor-pointer"
              >
                <PlayCircle className="w-4 h-4 text-[#E1590C]" />
                <span>Watch Walkthrough Video</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 8. - AI FOOTER */}
      <footer className="w-full bg-[#FAF9F7] dark:bg-[#1E1A15] border-t border-[#E9E5DF] dark:border-[#332C23]">
        <div className="w-full px-6 py-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col gap-1">
              <span className="font-sans text-base font-bold text-[#1B1A18] dark:text-[#F3EFE8]">
                SkyGuard Climate Intelligence
              </span>
              <span className="font-sans text-xs text-[#716C64] dark:text-[#9A938A]">
                Mission-critical atmospheric prediction &amp; utility grade telemetry dispatch.
              </span>
            </div>
            <div className="flex items-center gap-6 text-xs text-[#716C64] dark:text-[#9A938A]">
              <a
                href="#overview"
                className="hover:text-[#1B1A18] dark:hover:text-white transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#compliance"
                className="hover:text-[#1B1A18] dark:hover:text-white transition-colors"
              >
                Security Protocols
              </a>
              <a
                href="#terminal"
                className="hover:text-[#1B1A18] dark:hover:text-white transition-colors"
              >
                System Status: 120Hz
              </a>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-[#E9E5DF]/60 dark:border-[#332C23] flex items-center justify-between text-[#716C64] dark:text-[#9A938A] font-mono text-xs">
            <p>© 2026 SkyGuard Systems Inc. Precision atmospheric telemetry.</p>
            <p className="text-[#1F9D55] font-semibold">NODE-SYNC: OK</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
