export type StationStatus =
  | 'HEALTHY'
  | 'LOCAL_EXTREME'
  | 'SENSOR_FAULT'
  | 'CALIBRATION_DRIFT'
  | 'UNKNOWN_DUAL';

export interface StationGeoNode {
  id: string;
  name: string;
  status: StationStatus;
  lat: number;
  lng: number;
  x: number;
  y: number;
  elevation: number;
  rh: number;
  temp: number;
  dewPoint: number;
  pressure: number;
  neighbors: string[];
  wsi?: string;
  anomalyType?: string;
}

export interface FleetKPISummary {
  stationsOnline: number;
  capacity: number;
  onlinePct: number;
  trendOnline: string;
  degradedDrift: number;
  degradedPct: number;
  trendDegraded: string;
  extremeEvents: number;
  extremeType: string;
  trendExtreme: string;
  confirmedFaults: number;
  faultBadge: string;
  trendFaults: string;
}

export interface CriticalIsolationAlert {
  stationId: string;
  message: string;
  severity: 'CRITICAL' | 'WARNING';
  timestamp?: string;
}

export interface SpatialConsensusStatus {
  activeClusters: number;
  candidateTopology: string;
  badNeighborGuard: string;
  contaminatedCount: number;
  microburstDetection: string;
  criticalIsolations: CriticalIsolationAlert[];
}

export interface InspectionBundle {
  stationId: string;
  bundleId: string;
  deterministicGate: string;
  edgeResidual: string;
  spatialCorroboration: string;
  ukfCorrection: number | null;
  ukfUncertainty: string;
  ukfBadge: string;
  rawStoreId: string;
}

export interface AnomalyFeedItem {
  id: string;
  stationId: string;
  wsi: string;
  state: 'SENSOR_FAULT' | 'LOCAL_EXTREME' | 'SUSPICIOUS' | 'UNKNOWN';
  faultAttribution: string;
  evidenceChain: string[];
  confidence: number;
  uncertainty: string;
  action: 'Verify' | 'Details' | 'Flag RUL' | 'Review';
  inspection?: InspectionBundle;
}

export interface AnomalyRecord {
  id: string;
  stationId: string;
  timestamp: string;
  state: StationStatus;
  faultAttribution: string;
  evidenceChain: string[];
  calibratedConfidence: number;
  uncertaintyBand: number;
  sonntagGatePassed: boolean;
  tDew: number;
  tRaw: number;
  tinyMlResidual: number;
  kdTreeConsensus: number;
  rawReading: number;
  ukfCorrection: number | null;
}

export interface FleetRegistryItem {
  stationId: string;
  wsi: string | null;
  wsiStatus: 'REGISTERED' | 'PENDING_REGISTRATION';
  terrain: string;
  climateRegion: string;
  powerSegment: string;
  backhaulId: string;
  firmwareVersion: string;
  tinyMlVersion: string;
  dutyCycle: string;
  mtlsStatus: 'ACTIVE' | 'ROTATING' | 'REVOKED';
}