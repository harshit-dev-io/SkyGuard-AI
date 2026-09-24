export type MapNavigationLevel = 'INDIA' | 'REGION' | 'DISTRICT' | 'STATION';

export type StationStatusType =
  | 'HEALTHY'
  | 'LOCAL_EXTREME'
  | 'SENSOR_FAULT'
  | 'CALIBRATION_DRIFT'
  | 'UNKNOWN_DUAL';

export interface RegionSummary {
  id: string;
  name: string;
  code: string;
  capital: string;
  center: [number, number];
  bounds: [[number, number], [number, number]];
  station_count: number;
  healthy: number;
  anomalies: number;
  faults: number;
  drift: number;
  unknown: number;
  district_count: number;
}

export interface DistrictSummary {
  id: string;
  name: string;
  region_id: string;
  region_name: string;
  center: [number, number];
  bounds: [[number, number], [number, number]];
  station_count: number;
  healthy: number;
  anomalies: number;
  faults: number;
  drift: number;
  unknown: number;
  elevation: number;
}

export interface StationTelemetryData {
  temperature: number;
  relative_humidity: number;
  atmospheric_pressure: number;
  dew_point: number;
  wind_speed: number;
  wind_direction: string;
  rainfall_rate: number;
  solar_radiation: number;
  timestamp: string;
}

export interface StationDetail {
  id: string;
  name: string;
  district_id: string;
  district_name: string;
  region_id: string;
  region_name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  status: StationStatusType;
  status_label: string;
  wsi: string;
  firmware_version: string;
  telemetry: StationTelemetryData;
  sensor_health: Record<string, string>;
  anomaly_attribution?: string;
  evidence_chain?: string[];
  confidence?: number;
}

export interface BreadcrumbItem {
  level: MapNavigationLevel;
  label: string;
  id?: string;
}
