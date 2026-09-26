import { MAP_ENDPOINTS } from '../config/api';
import type {
  RegionSummary,
  DistrictSummary,
  StationDetail,
  StationNearbyResponse,
  StandardizedStationReport,
} from '../types/map';

class MapApiService {
  private async fetchWithTimeout<T>(url: string, options: RequestInit = {}, timeoutMs = 12000): Promise<T> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    const token = typeof window !== 'undefined' ? localStorage.getItem('sg_access_token') : null;

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });

      clearTimeout(id);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err: any) {
      clearTimeout(id);
      throw err;
    }
  }

  /**
   * Fetch all regions from dynamic backend database
   * GET /api/v1/regions
   */
  async getRegions(): Promise<RegionSummary[]> {
    try {
      const data = await this.fetchWithTimeout<RegionSummary[]>(MAP_ENDPOINTS.GET_REGIONS);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('API getRegions failed:', err);
      throw err;
    }
  }

  /**
   * Fetch all administrative districts for a given region from dynamic database
   * GET /api/v1/regions/{regionId}/districts
   */
  async getDistricts(regionId: string): Promise<DistrictSummary[]> {
    try {
      const data = await this.fetchWithTimeout<DistrictSummary[]>(MAP_ENDPOINTS.GET_REGION_DISTRICTS(regionId));
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error(`API getDistricts for ${regionId} failed:`, err);
      throw err;
    }
  }

  /**
   * Fetch all AWS stations across all districts in a region from dynamic database
   * GET /api/v1/regions/{regionId}/stations
   */
  async getRegionStations(regionId: string): Promise<StationDetail[]> {
    try {
      const data = await this.fetchWithTimeout<StationDetail[]>(MAP_ENDPOINTS.GET_REGION_STATIONS(regionId));
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error(`API getRegionStations for ${regionId} failed:`, err);
      throw err;
    }
  }

  /**
   * Fetch AWS stations in a selected district from dynamic database
   * GET /api/v1/districts/{districtId}/stations
   */
  async getDistrictStations(districtId: string): Promise<StationDetail[]> {
    try {
      const data = await this.fetchWithTimeout<StationDetail[]>(MAP_ENDPOINTS.GET_DISTRICT_STATIONS(districtId));
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error(`API getDistrictStations for ${districtId} failed:`, err);
      throw err;
    }
  }

  /**
   * Fetch detailed telemetry and sensor health for a station from dynamic database
   * GET /api/v1/stations/{stationId}/telemetry
   */
  async getStationTelemetry(stationId: string): Promise<StationDetail | null> {
    try {
      return await this.fetchWithTimeout<StationDetail>(MAP_ENDPOINTS.GET_STATION_TELEMETRY(stationId));
    } catch (err) {
      console.warn(`API getStationTelemetry for ${stationId} failed:`, err);
      return null;
    }
  }

  /**
   * Fetch dynamic GeoJSON boundaries for India / all regions from dynamic backend
   * GET /api/v1/regions/india/geojson
   */
  async getIndiaGeoJson(): Promise<any> {
    try {
      return await this.fetchWithTimeout<any>(MAP_ENDPOINTS.GET_INDIA_GEOJSON);
    } catch (err) {
      console.error('Failed to load India GeoJSON from backend:', err);
      throw err;
    }
  }

  /**
   * Fetch dynamic GeoJSON boundaries for a specific region from dynamic backend
   * GET /api/v1/regions/{regionId}/geojson
   */
  async getRegionGeoJson(regionId: string): Promise<any> {
    try {
      return await this.fetchWithTimeout<any>(MAP_ENDPOINTS.GET_REGION_GEOJSON(regionId));
    } catch (err) {
      console.error(`Backend GeoJSON for region ${regionId} failed:`, err);
      throw err;
    }
  }

  /**
   * Fetch nearest neighbor AWS stations & spatial consensus delta
   * GET /api/v1/stations/{stationId}/nearby
   */
  async getStationNearby(stationId: string, limit: number = 6): Promise<StationNearbyResponse> {
    return await this.fetchWithTimeout<StationNearbyResponse>(MAP_ENDPOINTS.GET_STATION_NEARBY(stationId, limit));
  }

  /**
   * Fetch standardized WMO/IMD data quality & audit report for an AWS station
   * GET /api/v1/stations/{stationId}/report
   */
  async getStationReport(stationId: string): Promise<StandardizedStationReport> {
    return await this.fetchWithTimeout<StandardizedStationReport>(MAP_ENDPOINTS.GET_STATION_REPORT(stationId));
  }
}

export const mapApi = new MapApiService();
