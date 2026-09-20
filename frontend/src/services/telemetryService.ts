import { skyguardApi } from './skyguardApi';
import type {
  FleetKPISummary,
  SpatialConsensusStatus,
  AnomalyFeedItem,
  InspectionBundle,
  StationGeoNode,
} from '../types/dashboard';

class TelemetryServiceAdapter {
  async fetchStations(): Promise<StationGeoNode[]> {
    return await skyguardApi.getStations();
  }

  async getFleetSummary(): Promise<FleetKPISummary> {
    return await skyguardApi.getFleetSummary();
  }

  async getSpatialConsensus(): Promise<SpatialConsensusStatus> {
    return await skyguardApi.getSpatialConsensus();
  }

  async getAnomalies(): Promise<AnomalyFeedItem[]> {
    return await skyguardApi.getAnomalies();
  }

  async getInspection(stationId: string): Promise<InspectionBundle> {
    return await skyguardApi.getInspection(stationId);
  }

  async triggerAction(
    stationId: string,
    action: 'verify' | 'flag-rul' | 'review'
  ): Promise<string> {
    if (action === 'verify') return await skyguardApi.verifyAnomaly(stationId);
    if (action === 'flag-rul') return await skyguardApi.flagRule(stationId);
    return await skyguardApi.reviewAnomaly(stationId);
  }
}

export const telemetryService = new TelemetryServiceAdapter();
export default telemetryService;
