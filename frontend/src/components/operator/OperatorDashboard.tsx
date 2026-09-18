import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { MetricCard } from '../shared/MetricCard';
import { IndiaSpatialMap } from './IndiaSpatialMap';
import { AnomalyTable } from './AnomalyTable';
import { ExplainabilityDrawer } from '../shared/ExplainabilityDrawer';

export const OperatorDashboard: React.FC = () => {
  const { stations, isLoadingStations } = useDashboard();

  const totalStations = stations.length;
  const activeStations = stations.filter((s) => s.status === 'HEALTHY').length;
  const degradedStations = stations.filter((s) => s.status === 'CALIBRATION_DRIFT').length;
  const extremeWeatherCount = stations.filter((s) => s.status === 'LOCAL_EXTREME').length;
  const faultCount = stations.filter((s) => s.status === 'SENSOR_FAULT').length;

  return (
    <div className="max-w-[1520px] mx-auto px-6 py-8">
      {/* Dynamic Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Stations Online"
          value={isLoadingStations ? '...' : totalStations.toString()}
          subtext={`${activeStations} active telemetry streams`}
          badge="NOMINAL"
        />
        <MetricCard
          label="Degraded / Drift"
          value={degradedStations.toString()}
          subtext="CUSUM threshold monitor"
          badge="MONITORING"
        />
        <MetricCard
          label="Extreme Weather"
          value={extremeWeatherCount.toString()}
          subtext="Active localized shocks"
          badge="CONFIRMED"
        />
        <MetricCard
          label="Confirmed Faults"
          value={faultCount.toString()}
          subtext="Sonntag physical violations"
          badge="ACTION REQ"
        />
      </div>

      <IndiaSpatialMap />
      <AnomalyTable />
      <ExplainabilityDrawer />
    </div>
  );
};