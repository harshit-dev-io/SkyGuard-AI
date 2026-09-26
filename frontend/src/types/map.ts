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

export interface NearbyStationItem {
  station_id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  distance_km: number;
  status: StationStatusType;
  status_label: string;
  wsi?: string;
  temperature?: number;
  relative_humidity?: number;
  atmospheric_pressure?: number;
  temperature_delta?: number;
  humidity_delta?: number;
  pressure_delta?: number;
  spatial_correlation: number;
}

export interface StationNearbyResponse {
  target_station_id: string;
  target_station_name: string;
  target_latitude: number;
  target_longitude: number;
  target_telemetry?: StationTelemetryData;
  neighbor_count: number;
  neighbors: NearbyStationItem[];
  consensus_status: string;
  spatial_consistency_score: number;
  anomaly_isolation_flag: boolean;
}

export interface InvariantCheckResult {
  name: string;
  formula: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  observed_value: string;
  expected_range: string;
  detail: string;
}

export interface StandardizedStationReport {
  report_id: string;
  generated_at: string;
  compliance_standard: string;
  station_id: string;
  station_name: string;
  wsi: string;
  climate_region: string;
  terrain: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  elevation_meters: number;
  firmware_version: string;
  uptime_percentage: number;
  current_status: string;
  telemetry_snapshot?: StationTelemetryData;
  physical_invariants: InvariantCheckResult[];
  sensor_health_matrix: Record<string, string>;
  overall_health_score: number;
  remaining_useful_life_days: number;
  spatial_consensus_summary: {
    mesonet_topology: string;
    cross_validation_score: number;
    nearest_neighbor_radius_km: number;
    spatial_agreement: string;
  };
  quality_flag: string;
  certifying_authority: string;
}

