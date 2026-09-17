import React, { createContext, useContext, useState } from 'react';
import type { StationGeoNode, AnomalyRecord, FleetRegistryItem } from '../types/dashboard';

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
  triggerTopologyRebuild: () => void;
  isRebuildingTopology: boolean;
}

const INITIAL_STATIONS: StationGeoNode[] = [
  { id: 'AWS-104', name: 'Delhi NCR Palam', status: 'SENSOR_FAULT', lat: 28.6139, lng: 77.209, x: 185, y: 145, elevation: 216, rh: 99.4, temp: 34.2, dewPoint: 34.5, pressure: 1005.1, neighbors: ['AWS-088', 'AWS-219'] },
  { id: 'AWS-042', name: 'Mumbai Colaba', status: 'LOCAL_EXTREME', lat: 18.922, lng: 72.834, x: 140, y: 245, elevation: 11, rh: 94.1, temp: 24.1, dewPoint: 23.8, pressure: 994.2, neighbors: ['AWS-112', 'AWS-401'] },
  { id: 'AWS-219', name: 'Varanasi Central', status: 'CALIBRATION_DRIFT', lat: 25.3176, lng: 82.9739, x: 235, y: 175, elevation: 81, rh: 62.1, temp: 31.8, dewPoint: 22.0, pressure: 1008.2, neighbors: ['AWS-104', 'AWS-311'] },
  { id: 'AWS-311', name: 'Bhubaneswar Coastal', status: 'UNKNOWN_DUAL', lat: 20.2961, lng: 85.8245, x: 255, y: 225, elevation: 45, rh: 88.0, temp: 29.5, dewPoint: 27.1, pressure: 1001.2, neighbors: ['AWS-219', 'AWS-088'] },
  { id: 'AWS-088', name: 'Jaipur Sanganer', status: 'HEALTHY', lat: 26.9124, lng: 75.7873, x: 165, y: 165, elevation: 431, rh: 45.0, temp: 36.2, dewPoint: 18.2, pressure: 1010.5, neighbors: ['AWS-104', 'AWS-042'] },
  { id: 'AWS-112', name: 'Bengaluru Peenya', status: 'HEALTHY', lat: 12.9716, lng: 77.5946, x: 185, y: 315, elevation: 920, rh: 68.2, temp: 24.8, dewPoint: 17.5, pressure: 915.2, neighbors: ['AWS-042', 'AWS-401'] },
];

const INITIAL_ANOMALIES: AnomalyRecord[] = [
  {
    id: 'ANM-9021',
    stationId: 'AWS-104',
    timestamp: '10:45:00 UTC',
    state: 'SENSOR_FAULT',
    faultAttribution: 'STUCK_RH_INVARIANT_BREACH',
    evidenceChain: ['Sonntag Gate: T_dew (34.5°C) > T_raw (34.2°C)', 'Variance(RH) = 0.001 across 40m', 'Neighbor agreement = 0.12 (Rejected)'],
    calibratedConfidence: 0.96,
    uncertaintyBand: 0.02,
    sonntagGatePassed: false,
    tDew: 34.5,
    tRaw: 34.2,
    tinyMlResidual: 4.82,
    kdTreeConsensus: 0.12,
    rawReading: 99.4,
    ukfCorrection: 61.2,
  },
  {
    id: 'ANM-9022',
    stationId: 'AWS-042',
    timestamp: '10:48:12 UTC',
    state: 'LOCAL_EXTREME',
    faultAttribution: 'COHERENT_MICROBURST_FRONT',
    evidenceChain: ['ΔP/Δt = -4.2hPa/10m (Coherent with ΔT/Δt)', 'Local Event Detector: Confirmed Physical Shock', 'No shared infra failure detected'],
    calibratedConfidence: 0.98,
    uncertaintyBand: 0.01,
    sonntagGatePassed: true,
    tDew: 23.8,
    tRaw: 24.1,
    tinyMlResidual: 5.12,
    kdTreeConsensus: 0.44,
    rawReading: 994.2,
    ukfCorrection: null,
  },
];

const INITIAL_FLEET: FleetRegistryItem[] = [
  { stationId: 'AWS-104', wsi: '0-20000-0-10400', wsiStatus: 'REGISTERED', terrain: 'Urban Basin', climateRegion: 'Composite', powerSegment: 'GRID-DEL-NORTH', backhaulId: 'BH-DEL-4G-01', firmwareVersion: 'v1.4.2', tinyMlVersion: 'tinyml-v3.1-int8', dutyCycle: '3-Cycle (15m)', mtlsStatus: 'ACTIVE' },
  { stationId: 'AWS-042', wsi: '0-20000-0-04200', wsiStatus: 'REGISTERED', terrain: 'Coastal Lowland', climateRegion: 'Monsoon Coastal', powerSegment: 'SOLAR-ISLAND-02', backhaulId: 'BH-MUM-SAT-02', firmwareVersion: 'v1.4.2', tinyMlVersion: 'tinyml-v3.1-int8', dutyCycle: 'Event-Bypass (Immediate)', mtlsStatus: 'ACTIVE' },
];

const DashboardContext = createContext<DashboardContextType | null>(null);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('fleet');
  const [stations] = useState<StationGeoNode[]>(INITIAL_STATIONS);
  const [selectedStation, setSelectedStation] = useState<StationGeoNode | null>(INITIAL_STATIONS[0]);
  const [anomalies] = useState<AnomalyRecord[]>(INITIAL_ANOMALIES);
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyRecord | null>(INITIAL_ANOMALIES[0]);
  const [fleetRegistry] = useState<FleetRegistryItem[]>(INITIAL_FLEET);
  const [isRebuildingTopology, setIsRebuildingTopology] = useState(false);

  const triggerTopologyRebuild = () => {
    setIsRebuildingTopology(true);
    setTimeout(() => setIsRebuildingTopology(false), 2400);
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