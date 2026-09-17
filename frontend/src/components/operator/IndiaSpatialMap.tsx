import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import type { StationGeoNode, StationStatus } from '../../types/dashboard';

export const IndiaSpatialMap: React.FC = () => {
  const { stations, selectedStation, setSelectedStation } = useDashboard();

  const getStatusColor = (status: StationStatus) => {
    switch (status) {
      case 'HEALTHY':
        return '#16A34A'; // Green
      case 'LOCAL_EXTREME':
        return '#2563EB'; // Blue
      case 'SENSOR_FAULT':
        return '#DC2626'; // Red
      case 'CALIBRATION_DRIFT':
        return '#F59E0B'; // Amber
      case 'UNKNOWN_DUAL':
        return '#64748B'; // Slate
    }
  };

  return (
    <div className="p-6 rounded-2xl border border-[#E5E3DC] dark:border-[#232936] bg-white dark:bg-[#151921] shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-[#18181B] dark:text-[#F8FAFC]">
            Geospatial Topology &amp; Sensor Health
          </h2>
          <p className="text-[11px] font-mono text-[#71717A] dark:text-[#94A3B8]">
            Interactive KD-Tree correlation mesh over national AWS network
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] font-mono uppercase">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
            <span className="text-[#71717A] dark:text-[#94A3B8]">Healthy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
            <span className="text-[#71717A] dark:text-[#94A3B8]">Extreme Event</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
            <span className="text-[#71717A] dark:text-[#94A3B8]">Fault</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
            <span className="text-[#71717A] dark:text-[#94A3B8]">Drift</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Map Canvas */}
        <div className="lg:col-span-8 relative flex items-center justify-center p-4 bg-[#FAF8F5] dark:bg-[#0D0F12] rounded-xl border border-[#E5E3DC] dark:border-[#232936] overflow-hidden">
          <svg viewBox="0 0 400 400" className="w-full max-w-[420px] h-auto select-none">
            {/* Minimalist Stylized Vector Outline of Indian Peninsula */}
            <path
              d="M170,70 L200,60 L220,85 L210,110 L250,115 L280,120 L350,135 L330,175 L280,185 L260,240 L220,290 L185,360 L160,320 L135,260 L125,210 L140,160 L130,130 L160,110 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-[#E5E3DC] dark:text-[#232936]"
            />

            {/* KD-Tree Mesh Connections */}
            {stations.map((st) =>
              st.neighbors.map((nId) => {
                const neighbor = stations.find((s) => s.id === nId);
                if (!neighbor) return null;
                return (
                  <line
                    key={`${st.id}-${neighbor.id}`}
                    x1={st.x}
                    y1={st.y}
                    x2={neighbor.x}
                    y2={neighbor.y}
                    stroke="currentColor"
                    strokeWidth="0.75"
                    strokeDasharray="3,3"
                    className="text-neutral-300 dark:text-neutral-700 pointer-events-none"
                  />
                );
              })
            )}

            {/* Station Pins */}
            {stations.map((st) => {
              const isSelected = selectedStation?.id === st.id;
              const color = getStatusColor(st.status);

              return (
                <g
                  key={st.id}
                  onClick={() => setSelectedStation(st)}
                  className="cursor-pointer group"
                >
                  {/* Halo Pulse for Extreme Event / Fault */}
                  {(st.status === 'LOCAL_EXTREME' || st.status === 'SENSOR_FAULT') && (
                    <circle
                      cx={st.x}
                      cy={st.y}
                      r={isSelected ? 14 : 9}
                      fill={color}
                      opacity="0.25"
                      className="animate-ping"
                    />
                  )}

                  {/* Outer ring */}
                  <circle
                    cx={st.x}
                    cy={st.y}
                    r={isSelected ? 8 : 5}
                    fill="white"
                    stroke={color}
                    strokeWidth={isSelected ? 3 : 2}
                  />

                  {/* Inner center */}
                  <circle cx={st.x} cy={st.y} r={isSelected ? 3.5 : 2} fill={color} />

                  {/* Station Tag */}
                  <text
                    x={st.x + 8}
                    y={st.y + 3}
                    className="text-[9px] font-mono fill-[#18181B] dark:fill-[#F8FAFC] opacity-80 group-hover:opacity-100 font-bold"
                  >
                    {st.id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Station Telemetry Strip */}
        <div className="lg:col-span-4 space-y-4">
          {selectedStation ? (
            <div className="p-4 rounded-xl border border-[#E5E3DC] dark:border-[#232936] bg-[#FAF8F5] dark:bg-[#0D0F12]">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E3DC] dark:border-[#232936]">
                <span className="font-mono text-xs font-bold text-[#18181B] dark:text-[#F8FAFC]">
                  {selectedStation.id}
                </span>
                <span
                  className="text-[9px] font-mono px-2 py-0.5 rounded text-white font-bold"
                  style={{ backgroundColor: getStatusColor(selectedStation.status) }}
                >
                  {selectedStation.status}
                </span>
              </div>

              <div className="mt-3 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-[#71717A] dark:text-[#94A3B8]">
                  <span>Site:</span>
                  <span className="text-[#18181B] dark:text-[#F8FAFC] font-semibold">{selectedStation.name}</span>
                </div>
                <div className="flex justify-between text-[#71717A] dark:text-[#94A3B8]">
                  <span>Elevation / Coord:</span>
                  <span className="text-[#18181B] dark:text-[#F8FAFC]">{selectedStation.elevation}m · {selectedStation.lat.toFixed(2)}N</span>
                </div>
                <div className="flex justify-between text-[#71717A] dark:text-[#94A3B8]">
                  <span>Relative Humidity:</span>
                  <span className={`font-bold ${selectedStation.rh > 98 ? 'text-rose-500' : 'text-[#18181B] dark:text-[#F8FAFC]'}`}>{selectedStation.rh}%</span>
                </div>
                <div className="flex justify-between text-[#71717A] dark:text-[#94A3B8]">
                  <span>Temperature / Dew Pt:</span>
                  <span className="text-[#18181B] dark:text-[#F8FAFC]">{selectedStation.temp}°C / {selectedStation.dewPoint}°C</span>
                </div>
                <div className="flex justify-between text-[#71717A] dark:text-[#94A3B8]">
                  <span>Barometric Pressure:</span>
                  <span className="text-[#18181B] dark:text-[#F8FAFC]">{selectedStation.pressure} hPa</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5E3DC] dark:border-[#232936]">
                <span className="text-[10px] font-mono uppercase text-[#71717A] dark:text-[#94A3B8] block mb-1">
                  Static Candidate Neighbors:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStation.neighbors.map((n) => (
                    <span
                      key={n}
                      className="text-[9px] font-mono px-2 py-0.5 rounded border border-[#E5E3DC] dark:border-[#232936] text-[#71717A] dark:text-[#94A3B8]"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs font-mono text-[#71717A]">Select a station pin to view telemetry.</p>
          )}
        </div>
      </div>
    </div>
  );
};