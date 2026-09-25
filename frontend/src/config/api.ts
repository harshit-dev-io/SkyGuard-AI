export const API_BASE_URL: string = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000/api/v1'
).replace(/\/+$/, '');

/**
 * Dedicated endpoint for Hierarchical Region-Wise AWS Map & Geospatial Telemetry.
 * Hits local FastAPI backend on port 8000 (with authentic 36-state fallback in mapApi.ts).
 */
export const MAP_API_BASE_URL: string = (
  import.meta.env.VITE_MAP_API_URL ||
  'http://127.0.0.1:8000/api/v1'
).replace(/\/+$/, '');

/**
 * Centralized API endpoints for SkyGuard Hierarchical Region-Wise AWS Map
 * as required by API specification.
 */
export const MAP_ENDPOINTS = {
  // Level 1: India / Regions
  GET_REGIONS: `${MAP_API_BASE_URL}/regions`,
  GET_REGION_BY_ID: (regionId: string) => `${MAP_API_BASE_URL}/regions/${regionId}`,

  // Level 2: Region / Districts & Region Stations
  GET_REGION_DISTRICTS: (regionId: string) => `${MAP_API_BASE_URL}/regions/${regionId}/districts`,
  GET_REGION_STATIONS: (regionId: string) => `${MAP_API_BASE_URL}/regions/${regionId}/stations`,
  GET_DISTRICT_BY_ID: (districtId: string) => `${MAP_API_BASE_URL}/districts/${districtId}`,

  // Level 3: District / AWS Stations
  GET_DISTRICT_STATIONS: (districtId: string) => `${MAP_API_BASE_URL}/districts/${districtId}/stations`,
  GET_STATION_TELEMETRY: (stationId: string) => `${MAP_API_BASE_URL}/stations/${stationId}/telemetry`,
  GET_STATION_NEARBY: (stationId: string, limit: number = 6) => `${MAP_API_BASE_URL}/stations/${stationId}/nearby?limit=${limit}`,
  GET_STATION_REPORT: (stationId: string) => `${MAP_API_BASE_URL}/stations/${stationId}/report`,

  // Geographic boundary GeoJSON
  GET_REGION_GEOJSON: (regionId: string) => `${MAP_API_BASE_URL}/regions/${regionId}/geojson`,
  GET_INDIA_GEOJSON: `${MAP_API_BASE_URL}/regions/india/geojson`,
};

/**
 * CARTO Basemap Configuration
 * Key stored securely in environment: VITE_CARTO_API_KEY
 * Tile URL constructed dynamically using CARTO rastertiles endpoint.
 */
export const CARTO_CONFIG = {
  API_KEY: import.meta.env.VITE_CARTO_API_KEY || '',
  STYLE: import.meta.env.VITE_CARTO_STYLE || 'dark_all',
  getTileUrl: (style?: string) => {
    const s = style || CARTO_CONFIG.STYLE;
    const key = CARTO_CONFIG.API_KEY;
    return `https://basemaps.cartocdn.com/rastertiles/${s}/{z}/{x}/{y}.png${key ? `?key=${key}` : ''}`;
  },
};

export default API_BASE_URL;
