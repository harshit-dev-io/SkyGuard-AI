/**
 * SkyGuard - AI — Sandbox Demo Configuration
 * Public sandbox credentials and guided walkthrough missions
 */

export interface WalkthroughStep {
  step: number;
  targetId: string;
  title: string;
  subtitle: string;
  description: string;
  metricBadge: string;
  navTab?: 'fleet' | 'station' | 'explainability' | 'alerts' | 'manage_aws';
}

export const DEMO_CREDENTIALS = {
  email: 'luciddeveloper15@gmail.com',
  password: 'adminpass123',
  sessionDurationSeconds: 600, // 10 minutes
  user: {
    id: 999,
    email: 'luciddeveloper15@gmail.com',
    username: 'Elena Rostova',
    role: 'admin' as const,
    is_active: true,
    created_at: '2026-09-24T00:00:00Z',
  },
};

export const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    step: 1,
    targetId: 'tutorial-kpi-yield',
    title: 'Fleet Integrity',
    subtitle: 'Node Reporting & Health Metrics',
    description:
      'Fleet Integrity — Tracks 4,900+ active AWS nodes reporting via MQTT over TLS. Continuous 1Hz stream monitoring flags degraded nodes without human delay.',
    metricBadge: 'STATIONS ONLINE',
    navTab: 'fleet',
  },
  {
    step: 2,
    targetId: 'tutorial-spatial-map',
    title: 'Spatial Mesh',
    subtitle: 'Topological Neighborhood Correlation',
    description:
      'Spatial Mesh — Stations check physical consistency with 8 nearest neighbors using elevation-adjusted lapse rates. An isolated station anomaly is cross-checked against surrounding synoptic cells.',
    metricBadge: 'KD-TREE CONSENSUS',
    navTab: 'fleet',
  },
  {
    step: 3,
    targetId: 'tutorial-spatial-consensus',
    title: 'Deterministic Physics',
    subtitle: 'Thermodynamic Boundary Gating',
    description:
      'Deterministic Physics — Sonntag equations verify T_dew <= T_raw. Real extreme storms are distinguished from bad sensors with thermodynamic invariant bounds.',
    metricBadge: 'PHYSICS GATE',
    navTab: 'fleet',
  },
  {
    step: 4,
    targetId: 'tutorial-anomaly-stream',
    title: 'Audit & Self-Healing',
    subtitle: 'Calibrated Confidence & XAI Virtual Imputation',
    description:
      'Audit & Self-Healing — Derived UKF corrections are generated only when uncertainty is bounded, leaving the raw TimescaleDB store immutable and audit-compliant.',
    metricBadge: 'XAI ATTRIBUTION',
    navTab: 'fleet',
  },
];
