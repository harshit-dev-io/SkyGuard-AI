import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  CloudLightning,
  ShieldCheck,
  Radio,
  Share2,
  Cpu,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

interface SystemDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToStation?: () => void;
}

interface DemoStep {
  step: number;
  title: string;
  tagline: string;
  badge: string;
  badgeColor: string;
  description: string;
  formula?: string;
  details: { label: string; value: string; status?: string }[];
  highlight: string;
}

export const SystemDemoModal: React.FC<SystemDemoModalProps> = ({
  isOpen,
  onClose,
  onNavigateToStation,
}) => {
  const { setActiveTab } = useDashboard();
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simulatedAnomaly, setSimulatedAnomaly] = useState<boolean>(false);

  const demoSteps: DemoStep[] = [
    {
      step: 1,
      title: 'High-Throughput Ingestion & Schema Normalization',
      tagline: '1Hz Telemetry Ingestion from 5,000+ AWS Nodes across India',
      badge: 'INGESTION ENGINE',
      badgeColor: 'bg-sky-500/10 text-sky-500 border-sky-500/30',
      description:
        'AWS meteorological stations transmit continuous high-rate observations via MQTT and HTTP gateways. Ingestion pipelines ingest, de-duplicate sequence numbers, and parse microsecond timestamps into TimescaleDB hypertables without data loss.',
      formula: 'Obs_t = { station_id, seq_id, T_dry, RH, P_atm, W_dir, W_spd, Precip }',
      details: [
        { label: 'Throughput', value: '12,500 obs/sec', status: 'optimal' },
        { label: 'Ingestion Latency', value: '4.2 ms (p99)', status: 'optimal' },
        { label: 'Protocol', value: 'WIS2 MQTT / CoAP / HTTPS', status: 'standard' },
        { label: 'Hypertables', value: 'PostgreSQL + TimescaleDB', status: 'standard' },
      ],
      highlight:
        'Zero-loss streaming pipeline handles bursty backpressure during heavy monsoon events.',
    },
    {
      step: 2,
      title: 'Deterministic Physical Invariant Gating',
      tagline: 'Sub-2ms Zero-False-Positive Filtering via Atmospheric Thermodynamics',
      badge: 'THERMODYNAMIC GATE',
      badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
      description:
        'Before any data enters AI models, it is evaluated by strict physical laws of thermodynamics. The Sonntag (1990) equation guarantees that dewpoint temperature can never exceed dry-bulb temperature (2nd Law of Thermodynamics). Transducer bias is instantly flagged.',
      formula: 'T_dew = (243.12 * gamma) / (17.62 - gamma) <= T_drybulb + epsilon',
      details: [
        { label: 'Dry Bulb Temp (T)', value: simulatedAnomaly ? '29.4°C' : '31.2°C' },
        { label: 'Observed RH', value: simulatedAnomaly ? '99.4% (Spike)' : '62.5%' },
        {
          label: 'Dew Point (T_dew)',
          value: simulatedAnomaly ? '29.3°C' : '23.1°C',
          status: simulatedAnomaly ? 'critical' : 'nominal',
        },
        {
          label: 'Sonntag Gate Result',
          value: simulatedAnomaly ? 'TRIGGERED BIAS ALERT' : 'PASSED (Thermodynamically Valid)',
          status: simulatedAnomaly ? 'critical' : 'nominal',
        },
      ],
      highlight:
        'Physical equations act as mathematical guardrails, ensuring hardware faults never produce false extreme alerts.',
    },
    {
      step: 3,
      title: 'KD-Tree Spatial Mesonet Consensus',
      tagline: 'Multi-Station Corroboration Distinguishes Sensor Failures from Microbursts',
      badge: 'SPATIAL CONSENSUS',
      badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
      description:
        'To tell apart a real local cloudburst from an isolated rain gauge sensor jam, SkyGuard queries the 8 nearest stations using a KD-Tree spatial index. If neighbors corroborate the pressure drop, it is flagged as a genuine storm; if neighbors are stable, the sensor is quarantined.',
      formula: 'Consensus_Score = 1 - (1/k) * sum( |Z_target - Z_neighbor_i| / sigma_neighbor )',
      details: [
        { label: 'Mesonet Topology', value: 'KD-Tree (k=8 Nearest AWS)', status: 'standard' },
        {
          label: 'Spatial Agreement',
          value: simulatedAnomaly ? '87.5% Divergent (Single Node Flagged)' : '98.4% Coherent Mesh',
          status: simulatedAnomaly ? 'warning' : 'optimal',
        },
        {
          label: 'Action Taken',
          value: simulatedAnomaly ? 'Quarantined AWS-DL-001 (Isolated Fault)' : 'Consensus Approved',
          status: simulatedAnomaly ? 'warning' : 'optimal',
        },
        { label: 'Corroboration Window', value: '5-minute sliding sync', status: 'standard' },
      ],
      highlight:
        'Severe flash floods and cloudbursts are confirmed within 15 seconds without false alarms.',
    },
    {
      step: 4,
      title: 'Edge TinyML & UKF State Reconstruction',
      tagline: 'Self-Healing Reconstruction with Bounded Mathematical Uncertainty',
      badge: 'SELF-HEALING UKF',
      badgeColor: 'bg-orb-violet/10 text-orb-violet border-orb-violet/30',
      description:
        'When an AWS sensor suffers calibration drift or intermittent failure, the Unscented Kalman Filter (UKF) uses time-series state transitions and spatial mesonet covariance to impute clean synthetic observation values with guaranteed uncertainty bounds.',
      formula: 'x_{k|k} = x_{k|k-1} + K_k * (y_k - y_{hat})  [Uncertainty <= +/-0.8%]',
      details: [
        { label: 'State Estimator', value: 'Unscented Kalman Filter (UKF)' },
        { label: 'Reconstructed Value', value: 'RH: 64.2% (Derived)', status: 'optimal' },
        { label: 'Confidence Interval', value: '+/- 0.8%', status: 'optimal' },
        { label: 'Audit Flag', value: 'IMPUTED_DERIVED_RECORD', status: 'standard' },
      ],
      highlight:
        'Meteorological forecast models receive continuous unbroken data streams even when field hardware degrades.',
    },
    {
      step: 5,
      title: 'WIS2 / WMO BUFR Encoding & Global Dissemination',
      tagline: 'Publishing Certified Meteorological Products to Global WMO Networks',
      badge: 'WMO & WIS2 GLOBAL',
      badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
      description:
        'Cleansed, verified observations are compiled into standardized WMO BUFR binary products with authentic WMO Station Identifiers (WSI) and published to WIS2 Global Brokers for international numerical weather prediction (ECMWF, IMD, NOAA).',
      formula: 'Topic: origin/a/wis2/in-imd-delhi/data/core/weather/surface-based-obs/synop',
      details: [
        { label: 'Standard', value: 'WMO-No. 306 BUFR Edition 4', status: 'standard' },
        { label: 'WSI Authority', value: '0-356-0-INDIA-MET', status: 'standard' },
        { label: 'Message Broker', value: 'WIS2 Global Broker (MQTT v5)', status: 'optimal' },
        { label: 'Quality Stamp', value: 'QC-PASSED (Sonntag + Spatial Verified)', status: 'optimal' },
      ],
      highlight:
        'Full compliance with World Meteorological Organization (WMO) WIS2 2026 mandates.',
    },
  ];

  // Auto-play timer
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % demoSteps.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isOpen, isPlaying, demoSteps.length]);

  if (!isOpen) return null;

  const current = demoSteps[currentStepIndex];

  const handleNext = () => {
    setCurrentStepIndex((prev) => (prev + 1) % demoSteps.length);
  };

  const handlePrev = () => {
    setCurrentStepIndex((prev) => (prev - 1 + demoSteps.length) % demoSteps.length);
  };

  const handleJumpToStation = () => {
    onClose();
    setActiveTab('station');
    if (onNavigateToStation) {
      onNavigateToStation();
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-sheetWhite dark:bg-[#091511] border border-sage-mist/80 dark:border-mint-pulse/40 shadow-2xl text-bark dark:text-white overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sage-mist/60 dark:border-sage-dark/60 bg-creamPaper/60 dark:bg-[#07120e] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-canopy dark:bg-mint-pulse text-white dark:text-bark flex items-center justify-center shadow-sm">
              <CloudLightning className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-bark dark:text-white">
                  SkyGuard AI System Architecture &amp; Demo
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-canopy/10 dark:bg-mint-pulse/15 text-canopy dark:text-mint-pulse border border-canopy/20 dark:border-mint-pulse/30">
                  Live Walkthrough
                </span>
              </div>
              <p className="text-[11px] text-slate dark:text-slate-dark">
                Deterministic physical verification &amp; spatial consensus for AWS networks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sage-mist dark:border-sage-dark text-xs font-semibold hover:bg-creamPaper dark:hover:bg-canopy-dark/40 transition-colors cursor-pointer"
              title={isPlaying ? 'Pause Auto-Play' : 'Resume Auto-Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Auto-Play'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-sage-mist/30 dark:hover:bg-sage-dark/40 text-slate dark:text-slate-dark hover:text-bark dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Progress Stepper Bar */}
        <div className="px-6 py-3 border-b border-sage-mist/40 dark:border-sage-dark/40 bg-creamPaper/30 dark:bg-[#07120e]/60 flex items-center justify-between gap-1 overflow-x-auto shrink-0">
          {demoSteps.map((s, idx) => {
            const isActive = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;
            return (
              <button
                key={s.step}
                onClick={() => setCurrentStepIndex(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-canopy dark:bg-mint-pulse text-white dark:text-bark shadow-sm'
                    : isCompleted
                    ? 'text-canopy dark:text-mint-pulse hover:bg-creamPaper/80 dark:hover:bg-canopy-dark/30'
                    : 'text-slate dark:text-slate-dark hover:text-bark dark:hover:text-white'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    isActive
                      ? 'bg-white/20 dark:bg-bark/20 text-white dark:text-bark'
                      : isCompleted
                      ? 'bg-canopy/10 dark:bg-mint-pulse/20 text-canopy dark:text-mint-pulse'
                      : 'bg-sage-mist/40 dark:bg-sage-dark/40 text-slate'
                  }`}
                >
                  {s.step}
                </span>
                <span className="hidden md:inline">{s.title.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Step Tag & Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sage-mist/50 dark:border-sage-dark/40">
            <div>
              <span
                className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border mb-2 ${current.badgeColor}`}
              >
                {current.badge} · Step {current.step} of 5
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-bark dark:text-white">
                {current.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate dark:text-slate-dark mt-1 font-medium">
                {current.tagline}
              </p>
            </div>

            {/* Interactive simulation toggle on Steps 2 and 3 */}
            {(current.step === 2 || current.step === 3) && (
              <button
                onClick={() => setSimulatedAnomaly((a) => !a)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                  simulatedAnomaly
                    ? 'bg-rose-500 text-white border-rose-600 shadow-md animate-pulse'
                    : 'bg-creamPaper dark:bg-[#0f241c] text-bark dark:text-white border-sage-mist dark:border-mint-pulse/40 hover:border-canopy dark:hover:border-mint-pulse'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{simulatedAnomaly ? 'Reset Injected Fault' : 'Simulate Transducer Bias'}</span>
              </button>
            )}
          </div>

          {/* Description Paragraph */}
          <p className="text-xs sm:text-sm leading-relaxed text-bark/90 dark:text-bark-dark">
            {current.description}
          </p>

          {/* Formula Display Box */}
          {current.formula && (
            <div className="p-3.5 rounded-xl bg-creamPaper/80 dark:bg-[#0d1e18] border border-sage-mist/70 dark:border-sage-dark/60 font-mono text-xs text-canopy dark:text-mint-pulse overflow-x-auto">
              <span className="text-[10px] uppercase font-bold text-slate dark:text-slate-dark block mb-1">
                Governing Physical Invariant / Algorithmic Form
              </span>
              <code>{current.formula}</code>
            </div>
          )}

          {/* Live Data Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {current.details.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-creamPaper/50 dark:bg-[#0b1a14] border border-sage-mist/60 dark:border-sage-dark/40 flex flex-col justify-between"
              >
                <div className="text-[11px] text-slate dark:text-slate-dark uppercase font-semibold">
                  {item.label}
                </div>
                <div
                  className={`text-sm font-bold mt-1.5 ${
                    item.status === 'critical'
                      ? 'text-rose-500'
                      : item.status === 'warning'
                      ? 'text-amber-500'
                      : item.status === 'optimal'
                      ? 'text-emerald-500 dark:text-mint-pulse'
                      : 'text-bark dark:text-white'
                  }`}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Key Guarantee Strip */}
          <div className="p-4 rounded-xl bg-canopy/5 dark:bg-mint-pulse/10 border border-canopy/15 dark:border-mint-pulse/20 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-canopy dark:text-mint-pulse shrink-0" />
            <div className="text-xs text-bark dark:text-white font-medium">
              <strong className="text-canopy dark:text-mint-pulse">Observatory Guarantee: </strong>
              {current.highlight}
            </div>
          </div>
        </div>

        {/* Footer Navigation Controls */}
        <div className="px-6 py-4 border-t border-sage-mist/60 dark:border-sage-dark/60 bg-creamPaper/60 dark:bg-[#07120e] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-sage-mist dark:border-sage-dark text-xs font-semibold hover:bg-creamPaper dark:hover:bg-canopy-dark/40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-sage-mist dark:border-sage-dark text-xs font-semibold hover:bg-creamPaper dark:hover:bg-canopy-dark/40 transition-colors cursor-pointer"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleJumpToStation}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-canopy dark:bg-mint-pulse text-white dark:text-bark text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-md"
            >
              <span>Explore Live Station Inspector</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
