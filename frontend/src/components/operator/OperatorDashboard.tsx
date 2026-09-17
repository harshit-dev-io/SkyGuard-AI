import React from 'react';
import { MetricCard } from '../shared/MetricCard';
import { IndiaSpatialMap } from './IndiaSpatialMap';
import { AnomalyTable } from './AnomalyTable';
import { ExplainabilityDrawer } from '../shared/ExplainabilityDrawer';

export const OperatorDashboard: React.FC = () => {
  return (
    <div className="max-w-[1520px] mx-auto px-6 py-8">
      {/* 4-KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Stations Online" value="4,912" subtext="98.2% normal operational fleet" badge="NOMINAL" />
        <MetricCard label="Degraded / Drift" value="64" subtext="1.2% CUSUM threshold exceeded" badge="MONITORING" />
        <MetricCard label="Extreme Weather" value="18" subtext="Active verified localized storms" badge="CONFIRMED" />
        <MetricCard label="Confirmed Faults" value="06" subtext="Sonntag physical invariant breach" badge="ACTION REQ" />
      </div>

      {/* Geospatial Map + Station Inspector */}
      <IndiaSpatialMap />

      {/* Live Anomaly Grid */}
      <AnomalyTable />

      {/* Slide-out Explainability Drawer */}
      <ExplainabilityDrawer />
    </div>
  );
};