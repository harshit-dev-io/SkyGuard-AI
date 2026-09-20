import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import type { StationGeoNode, StationStatus } from '../../types/dashboard';
import {
  Layers,
  Crosshair,
  Plus,
  Minus,
  RefreshCw,
} from 'lucide-react';

export const IndiaSpatialMap: React.FC = () => {
  const {
    stations,
    selectedStation,
    setSelectedStation,
    isLive,
    setIsLive,
    refreshAll,
    fetchInspectionForStation,
    setSelectedInspection,
    anomalyFeed,
  } = useDashboard();

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [mapLayer, setMapLayer] = useState<'satellite' | 'terrain'>('satellite');

  const getStatusColor = (status: StationStatus) => {
    switch (status) {
      case 'HEALTHY':
        return '#6ece9d'; // Mint signal
      case 'LOCAL_EXTREME':
        return '#ffda6e'; // Sunshine highlight
      case 'SENSOR_FAULT':
        return '#ef4444'; // Red fault signal
      case 'CALIBRATION_DRIFT':
        return '#f59e0b'; // Amber drift signal
      case 'UNKNOWN_DUAL':
      default:
        return '#707070'; // Graphite
    }
  };

  const getStatusLabel = (status: StationStatus) => {
    switch (status) {
      case 'HEALTHY': return 'Healthy';
      case 'LOCAL_EXTREME': return 'Extreme Event';
      case 'SENSOR_FAULT': return 'Fault';
      case 'CALIBRATION_DRIFT': return 'Drift';
      case 'UNKNOWN_DUAL': return 'Unknown';
      default: return 'Unknown';
    }
  };

  const handleStationClick = (st: StationGeoNode) => {
    setSelectedStation(st);
    const matched = anomalyFeed.find((a) => a.stationId === st.id);
    if (matched && matched.inspection) {
      setSelectedInspection(matched.inspection);
    } else {
      fetchInspectionForStation(st.id);
    }
  };

  // Dynamically calculate connections between adjacent stations
  const connections: [StationGeoNode, StationGeoNode][] = [];
  if (stations.length > 1) {
    for (let i = 0; i < stations.length; i++) {
      for (let j = i + 1; j < stations.length; j++) {
        const s1 = stations[i];
        const s2 = stations[j];
        // Connect if explicit neighbor or within reasonable distance
        const dx = s1.x - s2.x;
        const dy = s1.y - s2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          connections.push([s1, s2]);
        }
      }
    }
  }

  // Anomalous stations to render callouts dynamically
  const anomalousStations = stations.filter((s) => s.status !== 'HEALTHY');

  return (
    <div className="p-5 rounded-[24px] border border-[#e0e0e0] dark:border-[#282e3a] bg-white dark:bg-[#16191f] flex flex-col h-full transition-colors">
      {/* Card Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-[#f0f0f0] dark:border-[#282e3a]">
        <h3 className="text-base font-bold text-[#141414] dark:text-white">
          Spatial Telemetry Network (India AWS Fleet)
        </h3>

        <div className="flex items-center gap-2">
          {/* Live Indicator */}
          <button
            onClick={() => setIsLive(!isLive)}
            title="Toggle Live Polling"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-[#e0e0e0] dark:border-[#282e3a] bg-[#f3f3f3] dark:bg-[#1c2028] text-[#141414] dark:text-white cursor-pointer hover:bg-[#e0e0e0] dark:hover:bg-[#282e3a] transition-colors"
          >
            <span
              className={`w-2 h-2 rounded-full bg-[#0066ff] ${
                isLive ? 'animate-pulse' : 'opacity-40'
              }`}
            />
            <span>{isLive ? 'Live' : 'Paused'}</span>
          </button>

          {/* Refresh Rate Badge */}
          <button
            onClick={() => refreshAll()}
            title="Force Telemetry Sync"
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-medium text-[#707070] dark:text-[#9e9e9e] border border-[#e0e0e0] dark:border-[#282e3a] bg-[#f3f3f3] dark:bg-[#1c2028] hover:bg-[#e0e0e0] dark:hover:bg-[#282e3a] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-[#0066ff]" />
            <span>Refresh: 5s</span>
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full flex-1 min-h-[380px] lg:min-h-[440px] rounded-[16px] overflow-hidden bg-[#0A1118] border border-[#e0e0e0] dark:border-[#282e3a] flex items-center justify-center select-none">
        {/* Satellite / Ocean Background */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, #122332 0%, #0A141F 50%, #04080D 100%)',
          }}
        />

        {/* Topographic Relief */}
        <div
          className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 50% 40%, rgba(30, 80, 50, 0.45) 0%, rgba(15, 45, 60, 0.3) 50%, rgba(4, 12, 20, 0.9) 100%)',
          }}
        />

        {/* Ocean Labels */}
        <div className="absolute bottom-16 left-8 italic text-xs tracking-wider text-[#6ece9d]/30 pointer-events-none select-none">
          Arabian Sea
        </div>
        <div className="absolute bottom-16 right-16 italic text-xs tracking-wider text-[#6ece9d]/30 pointer-events-none select-none">
          Bay of Bengal
        </div>

        {/* Neighboring Country Labels */}
        <div className="absolute top-24 left-10 text-[10px] tracking-widest uppercase font-medium text-[#707070]/40 pointer-events-none select-none">
          PAKISTAN
        </div>
        <div className="absolute top-20 right-28 text-[10px] tracking-widest uppercase font-medium text-[#707070]/40 pointer-events-none select-none">
          BHUTAN
        </div>
        <div className="absolute top-36 right-20 text-[10px] tracking-widest uppercase font-medium text-[#707070]/40 pointer-events-none select-none">
          BANGLADESH
        </div>
        <div className="absolute top-44 right-6 text-[10px] tracking-widest uppercase font-medium text-[#707070]/40 pointer-events-none select-none">
          MYANMAR
        </div>

        {/* SVG Visualization Canvas */}
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full max-w-[560px] select-none transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* India Landmass Outline */}
          <path
            d="M 125,75 
               C 135,65 145,55 160,55 
               C 175,55 190,70 195,85 
               C 210,85 230,105 245,115 
               C 260,120 285,120 300,130 
               C 315,140 330,140 335,150 
               C 320,165 305,170 290,175 
               C 275,180 265,195 255,205 
               C 245,215 235,235 225,255 
               C 215,275 200,305 185,340 
               C 175,345 165,335 160,315 
               C 150,295 135,260 120,240 
               C 110,225 105,200 100,175 
               C 95,155 105,135 115,115 
               Z"
            fill="rgba(22, 52, 40, 0.55)"
            stroke="rgba(110, 206, 157, 0.35)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Northern Himalayan Ridge */}
          <path
            d="M 140,75 Q 210,85 290,130 Q 325,145 335,150"
            fill="none"
            stroke="rgba(180, 210, 190, 0.25)"
            strokeWidth="1.5"
            strokeDasharray="4,3"
          />

          {/* KD-Tree Mesh Connections */}
          {connections.map(([st1, st2]) => (
            <line
              key={`${st1.id}-${st2.id}`}
              x1={st1.x}
              y1={st1.y}
              x2={st2.x}
              y2={st2.y}
              stroke="rgba(110, 206, 157, 0.3)"
              strokeWidth="0.85"
              strokeDasharray="3,3"
              className="pointer-events-none"
            />
          ))}

          {/* Station Nodes */}
          {stations.map((st) => {
            const isSelected = selectedStation?.id === st.id;
            const color = getStatusColor(st.status);
            const isAnomaly = st.status !== 'HEALTHY';

            return (
              <g
                key={st.id}
                onClick={() => handleStationClick(st)}
                className="cursor-pointer group"
              >
                {/* Pulsing Halo for Anomalous / Selected */}
                {(isAnomaly || isSelected) && (
                  <circle
                    cx={st.x}
                    cy={st.y}
                    r={isSelected ? 10 : 7}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    className="animate-ping opacity-60"
                  />
                )}

                {/* Node */}
                <circle
                  cx={st.x}
                  cy={st.y}
                  r={isSelected ? 6 : 4}
                  fill={color}
                  stroke="#f8f5ed"
                  strokeWidth={isSelected ? 2 : 1}
                  className="transition-all duration-150"
                />
              </g>
            );
          })}

          {/* Dynamically rendered Callout Badges for Selected or Anomalous Stations */}
          {(selectedStation ? [selectedStation] : anomalousStations.slice(0, 2)).map((st) => {
            const isFault = st.status === 'SENSOR_FAULT';
            const label = getStatusLabel(st.status);

            return (
              <g
                key={`callout-${st.id}`}
                transform={`translate(${st.x - 29}, ${st.y - 36})`}
                onClick={() => handleStationClick(st)}
                className="cursor-pointer select-none"
              >
                <line x1="29" y1="24" x2="29" y2="34" stroke="#f8f5ed" strokeWidth="1" strokeDasharray="2,2" />
                <rect
                  x="0"
                  y="0"
                  width="58"
                  height="24"
                  rx="12"
                  fill="#f8f5ed"
                  stroke="#000000"
                  strokeWidth="1"
                />
                <text
                  x="29"
                  y="10"
                  fill="#000000"
                  fontSize="8"
                  fontWeight="600"
                  fontFamily="DM Sans, sans-serif"
                  textAnchor="middle"
                >
                  {st.id}
                </text>
                <text
                  x="29"
                  y="19"
                  fill={isFault ? '#ef4444' : '#707070'}
                  fontSize="7"
                  fontWeight="500"
                  fontFamily="DM Sans, sans-serif"
                  textAnchor="middle"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Top-Right Legend */}
        <div className="absolute top-4 right-4 bg-cream/95 dark:bg-[#161817]/95 backdrop-blur border border-ink/20 dark:border-cream/20 rounded-cards p-3 space-y-2 select-none shadow-none transition-colors">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#6ece9d]" />
            <span className="text-[11px] text-ink dark:text-cream">Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ffda6e]" />
            <span className="text-[11px] text-ink dark:text-cream">Extreme Event</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
            <span className="text-[11px] text-ink dark:text-cream">Fault</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
            <span className="text-[11px] text-ink dark:text-cream">Drift</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#707070]" />
            <span className="text-[11px] text-ink dark:text-cream">Unknown</span>
          </div>
        </div>

        {/* Bottom-Right Zoom & View Controls */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-cream/90 dark:bg-[#161817]/90 border border-ink/20 dark:border-cream/20 rounded-buttons p-1 select-none transition-colors">
          <button
            onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.2))}
            aria-label="Zoom In"
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-sunshine/30 text-ink dark:text-cream transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
            aria-label="Zoom Out"
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-sunshine/30 text-ink dark:text-cream transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            aria-label="Reset View"
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-sunshine/30 text-ink dark:text-cream transition-colors"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Selected Station Overlay Banner */}
        {selectedStation && (
          <div className="absolute bottom-4 left-4 bg-cream/95 dark:bg-[#161817]/95 border border-ink/20 dark:border-cream/20 rounded-cards px-4 py-2.5 flex items-center gap-3 select-none transition-colors">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getStatusColor(selectedStation.status) }}
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-ink dark:text-cream">
                {selectedStation.id} · {selectedStation.name}
              </span>
              <span className="text-[10px] text-graphite dark:text-darkMuted">
                {selectedStation.lat.toFixed(3)}°N, {selectedStation.lng.toFixed(3)}°E · Elev: {selectedStation.elevation}m
              </span>
            </div>
          </div>
        )}

        {/* Empty state overlay when no stations registered */}
        {stations.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
            <span className="text-xs text-cream tracking-wide">
              Awaiting geospatial station telemetry from backend...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndiaSpatialMap;