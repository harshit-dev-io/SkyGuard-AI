export type UserRole = 'admin' | 'operator';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role?: UserRole;
}

export interface UserProfileResponse {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface StationBackendModel {
  station_id: string;
  name: string;
  wsi?: string | null;
  wsi_status?: string;
  sensor_type?: string;
  installation_date?: string;
  firmware_version?: string;
  latitude: number;
  longitude: number;
  elevation: number;
  terrain: string;
  climate_region: string;
  power_segment?: string;
  backhaul_id?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}


export interface StationHealthRULResponse {
  station_id: string;
  health_score: number;
  degradation_slope: number;
  remaining_useful_life_days: number;
  status: 'HEALTHY' | 'DEGRADED' | 'AT_RISK' | 'FAILED';
}

export interface SonntagGateResult {
  passed: boolean;
  t_raw: number;
  t_dew: number;
  rh_pct: number;
  e_sat: number;
  e_act: number;
}

export interface XAIExplainBundle {
  observation_id: string;
  station_id: string;
  timestamp: string;
  sonntag_gate: SonntagGateResult;
  range_gate_passed: boolean;
  rate_of_change_passed: boolean;
  frozen_rh_variance: number;
  tinyml_int8_residual: number;
  fourier_expected_residual: number;
  spatial_neighbors: Array<{
    neighbor_id: string;
    distance_km: number;
    elevation_delta_m: number;
    health_weight: number;
    observed_value: number;
  }>;
  ukf_derived_correction: number | null;
  calibrated_confidence: number;
  uncertainty_interval: number;
  raw_store_id: string;
}

export interface LoadSheddingStatusResponse {
  kafka_topic: string;
  consumer_lag_messages: number;
  load_shedding_active: boolean;
  throttled_tasks: Record<string, boolean>;
  degradation_hierarchy: string[];
}

export interface FusionTimeoutResponse {
  timeout_rate_pct: number;
  bounded_timer_seconds: number;
  evidence_incomplete_count: number;
}
