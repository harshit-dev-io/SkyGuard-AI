import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  StationGeoNode,
  AnomalyRecord,
  FleetRegistryItem,
  FleetKPISummary,
  SpatialConsensusStatus,
  AnomalyFeedItem,
  InspectionBundle,
} from '../types/dashboard';
import { skyguardApi } from '../services/skyguardApi';
import { api } from '../lib/api';

export type DashboardTab = 'fleet' | 'station' | 'explainability' | 'alerts' | 'manage_aws' | 'profile';


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

  // Live Telemetry & Consensus State
  kpiSummary: FleetKPISummary | null;
  spatialConsensus: SpatialConsensusStatus | null;
  anomalyFeed: AnomalyFeedItem[];
  selectedInspection: InspectionBundle | null;
  setSelectedInspection: (bundle: InspectionBundle | null) => void;
  fetchInspectionForStation: (stationId: string) => Promise<void>;
  isLive: boolean;
  setIsLive: (live: boolean) => void;
  refreshAll: () => Promise<void>;
  telemetryError: string | null;
  isTutorialOpen: boolean;
  setIsTutorialOpen: (open: boolean) => void;
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

  // Real-time Telemetry state
  const [kpiSummary, setKpiSummary] = useState<FleetKPISummary | null>(null);
  const [spatialConsensus, setSpatialConsensus] = useState<SpatialConsensusStatus | null>(null);
  const [anomalyFeed, setAnomalyFeed] = useState<AnomalyFeedItem[]>([]);
  const [selectedInspection, setSelectedInspection] = useState<InspectionBundle | null>(null);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [telemetryError, setTelemetryError] = useState<string | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);

  const fetchInspectionForStation = useCallback(async (stationId: string) => {
    try {
      const bundle = await skyguardApi.getInspection(stationId);
      setSelectedInspection(bundle);
    } catch (err) {
      console.error(`Error fetching inspection for ${stationId}:`, err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      setTelemetryError(null);

      // Fetch telemetry resources from centralized service with resilience
      const [stationNodes, summary, consensus, feed, rawStations] = await Promise.all([
        skyguardApi.getStations().catch(() => []),
        skyguardApi.getFleetSummary().catch(() => null),
        skyguardApi.getSpatialConsensus().catch(() => null),
        skyguardApi.getAnomalies().catch(() => []),
        api.getStations().catch(() => []),
      ]);

      setStations(stationNodes);
      setKpiSummary(summary);
      setSpatialConsensus(consensus);
      setAnomalyFeed(feed);

      const registryItems: FleetRegistryItem[] = (rawStations || []).map((s) => ({
        stationId: s.station_id,
        wsi: s.wsi || null,
        wsiStatus: (s.wsi ? 'REGISTERED' : 'PENDING_REGISTRATION') as 'REGISTERED' | 'PENDING_REGISTRATION',
        terrain: s.terrain || 'Plain',
        climateRegion: s.climate_region || 'Composite',
        powerSegment: s.power_segment || 'GRID-ALPHA-01',
        backhaulId: s.backhaul_id || 'BH-4G-PRIMARY',
        firmwareVersion: s.firmware_version || 'fw-1.4.2',
        tinyMlVersion: 'TinyML v3.1',
        dutyCycle: 'Continuous 1Hz',
        mtlsStatus: 'ACTIVE',
      }));
      setFleetRegistry(registryItems);


      // Select first station if none selected yet
      if (!selectedStation && stationNodes.length > 0) {
        setSelectedStation(stationNodes[0]);
      }

      // Automatically select default inspection if none selected
      if (!selectedInspection) {
        if (feed.length > 0 && feed[0].inspection) {
          setSelectedInspection(feed[0].inspection);
        } else if (stationNodes.length > 0) {
          fetchInspectionForStation(stationNodes[0].id);
        }
      }

      // Populate legacy anomaly records for backward compatibility
      const legacyRecords: AnomalyRecord[] = feed.map((item) => ({
        id: item.id,
        stationId: item.stationId,
        timestamp: 'Just now',
        state: item.state as any,
        faultAttribution: item.faultAttribution,
        evidenceChain: item.evidenceChain,
        calibratedConfidence: item.confidence,
        uncertaintyBand: parseFloat(item.uncertainty.replace(/[^0-9.]/g, '')) || 0.02,
        sonntagGatePassed: item.state !== 'SENSOR_FAULT',
        tDew: 31.2,
        tRaw: 29.1,
        tinyMlResidual: 3.41,
        kdTreeConsensus: 0.88,
        rawReading: 99.8,
        ukfCorrection: item.inspection?.ukfCorrection || null,
      }));
      setAnomalies(legacyRecords);
    } catch (err: any) {
      console.error('Error refreshing telemetry dashboard:', err);
      setTelemetryError(err.message || 'Unable to load fleet telemetry.');
    } finally {
      setIsLoadingStations(false);
    }
  }, [selectedStation, selectedInspection, fetchInspectionForStation]);

  // Initial load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Real-time 5-second polling loop when live is active
  useEffect(() => {
    if (!isLive) return;

    const intervalId = setInterval(() => {
      refreshAll();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [isLive, refreshAll]);

  const addStation = (station: StationGeoNode) => {
    setStations((prev) => [station, ...prev]);
    setSelectedStation(station);
  };

  const triggerTopologyRebuild = async () => {
    setIsRebuildingTopology(true);
    try {
      await refreshAll();
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
        refreshStations: refreshAll,
        addStation,
        triggerTopologyRebuild,
        isRebuildingTopology,
        kpiSummary,
        spatialConsensus,
        anomalyFeed,
        selectedInspection,
        setSelectedInspection,
        fetchInspectionForStation,
        isLive,
        setIsLive,
        refreshAll,
        telemetryError,
        isTutorialOpen,
        setIsTutorialOpen,
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