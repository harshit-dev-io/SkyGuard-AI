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