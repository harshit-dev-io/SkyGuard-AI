import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { StationGeoNode, AnomalyRecord, FleetRegistryItem, StationStatus } from '../types/dashboard';

export type DashboardTab = 'fleet' | 'station' | 'explainability' | 'alerts' | 'manage_aws';

interface DashboardContextType {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  stations: StationGeoNode[];
  selectedStation: StationGeoNode | null;
  setSelectedStation: (station: StationGeoNode | null) => void;
  anomalies: AnomalyRecord[];
  selectedAnomaly: AnomalyRecord | null;
  setSelectedAnomaly: (anomaly: AnomalyRecord | null) => void;
  fleetRegistry: FleetRegistryItem[];
  isLoadingStations: boolean;
  refreshStations: () => Promise<void>;
  addStation: (station: StationGeoNode) => void;
  triggerTopologyRebuild: () => Promise<void>;
  isRebuildingTopology: boolean;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('fleet');
  const [stations, setStations] = useState<StationGeoNode[]>([]);
  const [selectedStation, setSelectedStation] = useState<StationGeoNode | null>(null);
  const [fleetRegistry, setFleetRegistry] = useState<FleetRegistryItem[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyRecord[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyRecord | null>(null);
  const [isLoadingStations, setIsLoadingStations] = useState<boolean>(true);
  const [isRebuildingTopology, setIsRebuildingTopology] = useState<boolean>(false);

  // Helper: Projects (lat, lng) to the 0-400 SVG India projection viewbox
  const projectToSvg = (lat: number, lng: number): { x: number; y: number } => {
    // India bounding box roughly lat: 8°N - 38°N, lng: 68°E - 98°E
    const x = Math.round(((lng - 68) / (98 - 68)) * 260 + 70);
    const y = Math.round(((38 - lat) / (38 - 8)) * 280 + 50);
    return {
      x: Math.max(50, Math.min(350, x)),
      y: Math.max(50, Math.min(350, y)),
    };
  };

  const fetchStations = useCallback(async () => {
    try {
      setIsLoadingStations(true);
      const token = localStorage.getItem('sg_access_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://127.0.0.1:8000/api/v1/edge/stations?limit=500', {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stations: ${response.statusText}`);
      }

      const rawData = await response.json();

      // Transform backend records to Frontend StationGeoNodes
      const mappedStations: StationGeoNode[] = rawData.map((item: any) => {
        const { x, y } = projectToSvg(item.latitude, item.longitude);
        return {
          id: item.station_id,
          name: item.name,
          status: (item.is_active ? 'HEALTHY' : 'UNKNOWN_DUAL') as StationStatus,
          lat: item.latitude,
          lng: item.longitude,
          x,
          y,
          elevation: item.elevation,
          rh: 60.0,
          temp: 28.0,
          dewPoint: 19.5,
          pressure: 1010.0,
          neighbors: [],
        };
      });

      // Transform backend records to Fleet Registry Items
      const mappedRegistry: FleetRegistryItem[] = rawData.map((item: any) => ({
        stationId: item.station_id,
        wsi: item.wsi,
        wsiStatus: item.wsi_status,
        terrain: item.terrain,
        climateRegion: item.climate_region,
        powerSegment: item.power_segment,
        backhaulId: item.backhaul_id,
        firmwareVersion: item.firmware_version,
        tinyMlVersion: 'tinyml-v3.1-int8',
        dutyCycle: '3-Cycle (15m)',
        mtlsStatus: 'ACTIVE',
      }));

      setStations(mappedStations);
      setFleetRegistry(mappedRegistry);

      if (mappedStations.length > 0 && !selectedStation) {
        setSelectedStation(mappedStations[0]);
      }
    } catch (err) {
      console.error('Error fetching fleet stations from backend:', err);
    } finally {
      setIsLoadingStations(false);
    }
  }, [selectedStation]);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  const addStation = (station: StationGeoNode) => {
    setStations((prev) => [station, ...prev]);
    setSelectedStation(station);
  };

  const triggerTopologyRebuild = async () => {
    setIsRebuildingTopology(true);
    try {
      const token = localStorage.getItem('sg_access_token');
      await fetch('http://127.0.0.1:8000/api/v1/edge/simulator/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sample_interval_seconds: 5.0,
          batch_size: 3,
          broker_host: 'localhost',
          broker_port: 1883,
        }),
      });
    } catch (err) {
      console.error('Topology trigger error:', err);
    } finally {
      setIsRebuildingTopology(false);
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        activeTab,
        setActiveTab,
        stations,
        selectedStation,
        setSelectedStation,
        anomalies,
        selectedAnomaly,
        setSelectedAnomaly,
        fleetRegistry,
        isLoadingStations,
        refreshStations: fetchStations,
        addStation,
        triggerTopologyRebuild,
        isRebuildingTopology,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard must be used within DashboardProvider');
  return context;
};