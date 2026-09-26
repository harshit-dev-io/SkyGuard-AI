import React, { useState, useEffect, useRef } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  CheckCircle2,
  Volume2,
  VolumeX,
  Target,
  Trophy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';

export interface TutorialMission {
  id: string;
  stepNumber: number;
  title: string;
  badge: string;
  badgeColor: string;
  targetId: string;
  targetTab: 'fleet' | 'station' | 'explainability' | 'alerts' | 'manage_aws';
  shortObjective: string;
  metricConcept: string;
  whatItMeans: string;
  whyItMatters: string;
  howSkyGuardSolvesIt: string;
  actionPrompt: string;
  statCallout?: {
    label: string;
    value: string;
    subtext: string;
  };
}

const MISSIONS: TutorialMission[] = [
  {
    id: 'mission-yield',
    stepNumber: 1,
    title: 'Fleet Operational Yield & Ingestion',
    badge: 'OPERATIONAL YIELD: 99.7%',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    targetId: 'tutorial-kpi-yield',
    targetTab: 'fleet',
    shortObjective: 'Inspect the live fleet uptime & 1Hz ingestion pipeline across the national AWS array.',
    metricConcept: 'Operational Yield (%) = (Active Stations Reporting Valid Telemetry / Total Fleet Capacity) × 100',
    whatItMeans:
      'Operational Yield tracks the percentage of Automated Weather Stations streaming synchronized, uncorrupted observations within the active synoptic window (e.g. 1,428 out of 1,432 stations online).',
    whyItMatters:
      'National meteorological services (IMD, NOAA, ECMWF) require >95% continuous yield for Numerical Weather Prediction (NWP) assimilation. If yield drops below 90%, cyclone tracking models and monsoon rainfall projections lose spatial resolution.',
    howSkyGuardSolvesIt:
      'SkyGuard ingests 1Hz high-frequency sensor streams through TimescaleDB hypertables with sub-14ms spatial indexing, ensuring zero packet drops and immediate failover detection.',
    actionPrompt: 'Examine the first KPI card on your screen. Notice the +2 past 24h operational trend.',
    statCallout: {
      label: 'SYNOPTIC YIELD',
      value: '99.72%',
      subtext: '1,428 / 1,432 stations streaming',
    },
  },
  {
    id: 'mission-drift',
    stepNumber: 2,
    title: 'Calibration Drift & CUSUM Residuals',
    badge: 'DRIFT THRESHOLD: Δ > 1.8σ',
    badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    targetId: 'tutorial-kpi-drift',
    targetTab: 'fleet',
    shortObjective: 'Detect silent sensor degradation before it corrupts weather forecasts.',
    metricConcept: 'Cumulative Sum (CUSUM) Residual: S_t = max(0, S_{t-1} + (X_t - μ - k)) > 1.8σ',
    whatItMeans:
      'Calibration Drift represents slow, chronic degradation of physical transducers—such as salt film accumulation on hygrometers or diaphragm fatigue in barometers—causing readings to slowly diverge from physical truth.',
    whyItMatters:
      'Unlike a sudden power failure which is obvious, drift is silent and insidious. A barometric drift of just +3.5 hPa can misclassify a severe cyclone as a mild depression, delaying emergency civil evacuations.',
    howSkyGuardSolvesIt:
      'SkyGuard runs real-time edge CUSUM residual tracking. When a sensor drifts beyond 1.8 standard deviations (σ), it is flagged for maintenance and dynamically corrected via Unscented Kalman Filtering (UKF).',
    actionPrompt: 'Look at the Calibration Drift card. 14 stations are currently under early drift surveillance.',
    statCallout: {
      label: 'SURVEILLANCE POOL',
      value: '14 Nodes',
      subtext: 'Harmonic CUSUM drift flagged',
    },
  },
  {
    id: 'mission-consensus',
    stepNumber: 3,
    title: 'Spatial Consensus Engine (xAI)',
    badge: 'KD-TREE MESH: k=8 NEIGHBORS',
    badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    targetId: 'tutorial-spatial-consensus',
    targetTab: 'fleet',
    shortObjective: 'Differentiate genuine severe microbursts from rogue sensor malfunctions.',
    metricConcept: 'Spatial Neighborhood Agreement = Covariance(Node_i, Neighbors_{1..8})',
    whatItMeans:
      'The Spatial Consensus Engine validates every sensor observation against its 8 nearest geographical neighbors in a high-dimensional KD-Tree mesh.',
    whyItMatters:
      'If Station A suddenly registers 48°C while surrounding stations report 32°C, is it a severe localized heatburst or an overheated thermistor? Isolated sensors cannot tell on their own.',
    howSkyGuardSolvesIt:
      'If adjacent stations corroborate the temperature gradient, SkyGuard confirms an Extreme Meteorological Event. If neighbors disagree and Z-score exceeds 2.5σ, SkyGuard isolates the rogue sensor to prevent bad data from polluting the grid.',
    actionPrompt: 'Examine the Spatial Consensus panel on the right. Note the Flagged / Quarantined sensors.',
    statCallout: {
      label: 'MESH AGREEMENT',
      value: '98.4%',
      subtext: 'Z-score stability: 0.12σ',
    },
  },
  {
    id: 'mission-inspector',
    stepNumber: 4,
    title: 'Deep Station Inspector & Search',
    badge: 'AWS NODE INSPECTION',
    badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    targetId: 'tutorial-station-search',
    targetTab: 'station',
    shortObjective: 'Navigate to individual stations to explore live thermistor, hygrometer, and barometer telemetry.',
    metricConcept: 'High-frequency telemetry stream: Temperature, RH, Pressure, Dewpoint, Wind, Rain',
    whatItMeans:
      'The Station Inspector provides deep-dive telemetry on any AWS node in India. Operators can query by Station ID, WSI code, or micro-climate region.',
    whyItMatters:
      'Observatory teams need granular access to raw physical measurements, sensor serial numbers, elevation offsets, and hardware health statuses for maintenance dispatching.',
    howSkyGuardSolvesIt:
      'Provides a high-density, low-latency station inspector connected live to TimescaleDB, rendering 6 simultaneous atmospheric parameters and spatial neighbor vectors on an interactive Leaflet CARTO map.',
    actionPrompt: 'Click "Take Me to Station View" below, or search for AWS-DL-001 in the search bar.',
    statCallout: {
      label: 'ACTIVE MESH',
      value: '24 Nodes',
      subtext: 'Select node to inspect telemetry',
    },
  },
  {
    id: 'mission-sonntag',
    stepNumber: 5,
    title: 'Thermodynamic Sonntag Invariant',
    badge: 'PHYSICAL LAW: T_dew ≤ T_dry',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    targetId: 'tutorial-sonntag-badge',
    targetTab: 'station',
    shortObjective: 'Understand how thermodynamic physical laws eliminate false alarms in sub-2 milliseconds.',
    metricConcept: 'Sonntag Formula (1990): e_s(T) = 6.112 * exp(17.62 * T / (243.12 + T)) ⇒ T_dew ≤ T_dry',
    whatItMeans:
      'The Sonntag formulation governs saturation vapor pressure over water. By the 2nd Law of Thermodynamics, ambient dewpoint temperature (T_dew) can NEVER exceed dry-bulb temperature (T_dry).',
    whyItMatters:
      'A faulty capacitive hygrometer that reports 105% relative humidity would produce an impossible dewpoint higher than ambient temperature. Most legacy systems accept this bad data or trigger false alarms.',
    howSkyGuardSolvesIt:
      'SkyGuard embeds this deterministic thermodynamic boundary directly into edge inference. Any telemetry violating T_dew ≤ T is rejected in <2ms with 100% mathematical certainty—ZERO false positives!',
    actionPrompt: 'Check the "Deterministic Physical Invariants Check" panel. Verify the Sonntag condition is PASS.',
    statCallout: {
      label: 'GATE LATENCY',
      value: '< 1.8 ms',
      subtext: 'Zero false positive physical gate',
    },
  },
  {
    id: 'mission-wmo',
    stepNumber: 6,
    title: 'WMO-No. 8 Standardized AWS Report',
    badge: 'WMO-No. 8 / WIS2 CERTIFIED',
    badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    targetId: 'tutorial-wmo-report-btn',
    targetTab: 'station',
    shortObjective: 'Generate a certified, cryptographically stamped meteorological compliance dossier.',
    metricConcept: 'WMO-No. 8 Annex 1B & WIS2 Algorithmic Quality Assurance Standard',
    whatItMeans:
      'Official meteorological compliance document certifying station calibration, sensor health, remaining useful life (RUL), and physical invariant adherence.',
    whyItMatters:
      'For aviation safety, insurance claims, and international WIS2 data exchange, meteorological data must be audited and cryptographically verifiable with zero ambiguity.',
    howSkyGuardSolvesIt:
      'With one click, SkyGuard generates a complete WMO-compliant dossier featuring SHA-256 verification hashes, sensor breakdown matrices, and print-ready PDF formatting.',
    actionPrompt: 'Click the "Standardized AWS Report" button on your screen to view the live certified audit dossier!',
    statCallout: {
      label: 'AUDIT STANDARD',
      value: 'WMO-No. 8',
      subtext: 'SHA-256 cryptographic verification',
    },
  },
];

interface InteractiveTutorialCoachProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InteractiveTutorialCoach: React.FC<InteractiveTutorialCoachProps> = ({
  isOpen,
  onClose,
}) => {
  const { activeTab, setActiveTab } = useDashboard();
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  const activeMission = MISSIONS[currentStepIndex];

  // Synthesize pleasant game-like audio cues using Web Audio API
  const playChime = (type: 'next' | 'complete' | 'nav') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'next') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880.0, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } else if (type === 'complete') {
        // Multi-tone victory fanfare
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const o = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          o.connect(g);
          g.connect(audioCtx.destination);
          o.type = 'triangle';
          o.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.1);
          g.gain.setValueAtTime(0.15, audioCtx.currentTime + idx * 0.1);
          g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.1 + 0.3);
          o.start(audioCtx.currentTime + idx * 0.1);
          o.stop(audioCtx.currentTime + idx * 0.1 + 0.35);
        });
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      }
    } catch {
      // AudioContext not allowed or unsupported
    }
  };

  // Find target element coordinates and update highlight box
  const updateTargetPosition = () => {
    if (!activeMission) return;
    const el = document.getElementById(activeMission.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setHighlightRect(rect);
    } else {
      setHighlightRect(null);
    }
  };

  // Handle Tab sync & scrolling
  useEffect(() => {
    if (!isOpen || isComplete) return;

    // If mission belongs to another tab, prompt or switch
    if (activeMission.targetTab !== activeTab) {
      setActiveTab(activeMission.targetTab);
    }

    // Delay slightly to allow DOM to render
    const timeout = setTimeout(() => {
      updateTargetPosition();
      const el = document.getElementById(activeMission.targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 250);

    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition, true);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition, true);
    };
  }, [isOpen, currentStepIndex, activeTab, isComplete]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < MISSIONS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      playChime('next');
    } else {
      setIsComplete(true);
      playChime('complete');
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      playChime('nav');
    }
  };

  const handleNavigateToTarget = () => {
    if (activeTab !== activeMission.targetTab) {
      setActiveTab(activeMission.targetTab);
    }
    setTimeout(() => {
      const el = document.getElementById(activeMission.targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        updateTargetPosition();
      }
    }, 150);
  };

  const progressPct = Math.round(((currentStepIndex + 1) / MISSIONS.length) * 100);

  // Minimized Pill HUD
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-[9999] animate-bounce select-none">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-brandAccent text-white shadow-2xl border-2 border-white hover:opacity-95 transition-all cursor-pointer font-bold text-xs"
        >
          <Compass className="w-4 h-4 animate-spin text-white" />
          <span>Resume Guided Demo ({currentStepIndex + 1}/{MISSIONS.length})</span>
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Completion Screen
  if (isComplete) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
        <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#121c18] border-2 border-brandAccent p-8 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-brandAccent/10 text-brandAccent flex items-center justify-center mx-auto ring-8 ring-brandAccent/20">
            <Trophy className="w-8 h-8 text-brandAccent" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-accentSoft text-accentText border border-accentSoftBorder">
              Mission Accomplished
            </span>
            <h2 className="text-2xl font-bold text-brandDark dark:text-white mt-3">
              Certified Meteorological Systems Operator
            </h2>
            <p className="text-xs text-inkMuted dark:text-slate-300 mt-2 leading-relaxed max-w-md mx-auto">
              You have mastered the SkyGuard - AI operational architecture: 1Hz TimescaleDB telemetry yield,
              CUSUM sensor drift isolation (Δ &gt; 1.8σ), KD-Tree spatial consensus (k=8), the thermodynamic Sonntag boundary (T_dew ≤ T), and WMO-No. 8 compliance dossiers.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-panelBg dark:bg-[#0c1612] border border-cardBorder text-left space-y-2 text-xs">
            <div className="flex items-center justify-between text-brandDark dark:text-white font-semibold">
              <span>Observation Certification</span>
              <span className="text-signalGreen font-mono font-bold">100% VERIFIED</span>
            </div>
            <div className="flex items-center justify-between text-inkMuted">
              <span>False Positive Rejection</span>
              <span className="font-mono text-brandDark dark:text-white">&lt; 1.8ms (Zero Leaks)</span>
            </div>
            <div className="flex items-center justify-between text-inkMuted">
              <span>Standard Regulatory Alignment</span>
              <span className="font-mono text-brandDark dark:text-white">WMO WIS2 &amp; WMO-No. 8</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setCurrentStepIndex(0);
                setIsComplete(false);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-cardBorder hover:bg-panelBg text-xs font-semibold text-brandDark dark:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replay Tutorial</span>
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg bg-brandAccent text-white text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-opacity cursor-pointer shadow-sm"
            >
              Enter Live Console
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 1. Dynamic Element Highlight Frame (Pulsing Spotlight on the active target) */}
      {highlightRect && (
        <div
          style={{
            position: 'fixed',
            top: highlightRect.top - 6,
            left: highlightRect.left - 6,
            width: highlightRect.width + 12,
            height: highlightRect.height + 12,
            pointerEvents: 'none',
            zIndex: 9990,
          }}
          className="rounded-2xl border-[3px] border-brandAccent shadow-[0_0_24px_rgba(225,89,12,0.65)] transition-all duration-300 animate-pulse"
        >
          {/* Target Corner Pins */}
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-brandAccent rounded-sm" />
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-brandAccent rounded-sm" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-brandAccent rounded-sm" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-brandAccent rounded-sm" />

          {/* Floating Target Pin Label */}
          <div className="absolute -top-8 left-2 bg-brandAccent text-white font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-md flex items-center gap-1">
            <Target className="w-3 h-3" />
            <span>Target: {activeMission.title}</span>
          </div>
        </div>
      )}

      {/* 2. Floating Game HUD Coach Card (Docked at bottom-right or bottom-center) */}
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[9995] w-full max-w-[480px] p-2 select-none animate-in slide-in-from-bottom-5 duration-200">
        <div className="rounded-2xl bg-white dark:bg-[#14201b] border-2 border-brandAccent shadow-[0_16px_40px_rgba(27,26,24,0.18)] overflow-hidden flex flex-col text-brandDark dark:text-white">
          {/* Top Mission Stepper Strip */}
          <div className="px-5 py-3 bg-panelBg dark:bg-[#0c1612] border-b border-cardBorder flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-brandAccent text-white flex items-center justify-center font-bold text-xs">
                {activeMission.stepNumber}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono uppercase tracking-wider text-inkMuted dark:text-slate-400 font-bold">
                  Guided Mission {activeMission.stepNumber} of {MISSIONS.length}
                </span>
                <span className="text-xs font-bold tracking-tight text-brandDark dark:text-white">
                  {activeMission.title}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1 rounded text-inkMuted hover:text-brandDark dark:hover:text-white transition-colors"
                title={soundEnabled ? 'Mute Audio Effects' : 'Enable Audio Effects'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-brandAccent" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 rounded text-inkMuted hover:text-brandDark dark:hover:text-white transition-colors"
                title="Minimize Coach to Badge"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded text-inkMuted hover:text-signalRed transition-colors"
                title="Exit Demo Tour"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-cardBorder/60 dark:bg-cardBorder/20">
            <div
              className="h-full bg-brandAccent transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Body Content */}
          <div className="p-5 space-y-4 max-h-[62vh] overflow-y-auto">
            {/* Mission Badge & Stat Callout */}
            <div className="flex items-center justify-between gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider border ${activeMission.badgeColor}`}>
                {activeMission.badge}
              </span>
              <button
                onClick={handleNavigateToTarget}
                className="text-[11px] font-semibold text-brandAccent hover:underline flex items-center gap-1"
              >
                <span>Spotlight Target</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Scientific Concept Formula / Statement */}
            <div className="p-2.5 rounded-lg bg-panelBg dark:bg-[#0c1612] border border-cardBorder text-[11px] font-mono text-inkMuted dark:text-slate-300">
              <strong className="text-brandDark dark:text-white block mb-0.5 uppercase tracking-wide">
                Governing Invariant:
              </strong>
              {activeMission.metricConcept}
            </div>

            {/* Plain English Explanation */}
            <div className="space-y-2 text-xs leading-relaxed">
              <div>
                <h4 className="font-bold text-brandDark dark:text-white flex items-center gap-1 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brandAccent" />
                  What Does This Metric Mean?
                </h4>
                <p className="text-inkMuted dark:text-slate-300 pl-2.5">
                  {activeMission.whatItMeans}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-brandDark dark:text-white flex items-center gap-1 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-signalAmber" />
                  Why It Matters in Real Life
                </h4>
                <p className="text-inkMuted dark:text-slate-300 pl-2.5">
                  {activeMission.whyItMatters}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-brandDark dark:text-white flex items-center gap-1 mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-signalGreen" />
                  How SkyGuard - AI Solves It
                </h4>
                <p className="text-inkMuted dark:text-slate-300 pl-2.5">
                  {activeMission.howSkyGuardSolvesIt}
                </p>
              </div>
            </div>

            {/* Action Prompt */}
            <div className="p-3 rounded-xl bg-accentSoft border border-accentSoftBorder text-xs text-accentText font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brandAccent shrink-0" />
              <span>{activeMission.actionPrompt}</span>
            </div>
          </div>

          {/* Stepper Footer Controls */}
          <div className="px-5 py-3.5 bg-panelBg dark:bg-[#0c1612] border-t border-cardBorder flex items-center justify-between gap-3">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-cardBorder hover:bg-white text-xs font-semibold text-brandDark dark:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <div className="text-[11px] font-mono text-inkMuted">
              Step {currentStepIndex + 1} of {MISSIONS.length}
            </div>

            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-brandAccent hover:opacity-95 text-white text-xs font-bold uppercase tracking-wider transition-opacity cursor-pointer shadow-sm"
            >
              <span>{currentStepIndex === MISSIONS.length - 1 ? 'Finish Mission' : 'Next Metric'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default InteractiveTutorialCoach;
