import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import type { StationGeoNode, StationStatus } from '../../types/dashboard';
import { 
  Plus, 
  Search, 
  Edit3, 
  Radio, 
  Save, 
  X,
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export const ManageAWS: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const { stations, refreshStations, selectedStation, setSelectedStation } = useDashboard();

  // Unified Registration Form State
  const [formData, setFormData] = useState({
    station_id: '',
    name: '',
    wsi: '',
    sensor_type: 'Vaisala_WXT530',
    latitude: '',
    longitude: '',
    elevation: '',
    terrain: 'plain',
    climate_region: 'indo_gangetic',
    power_segment: 'GRID-ALPHA-01',
    backhaul_id: 'BH-4G-PRIMARY',
  });

  // Edit Form State (synced with selectedStation)
  const [editForm, setEditForm] = useState<Partial<StationGeoNode>>({});

  const handleSelectStation = (st: StationGeoNode) => {
    setSelectedStation(st);
    setEditForm({
      name: st.name,
      elevation: st.elevation,
      lat: st.lat,
      lng: st.lng,
    });
    setIsEditing(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const lat = Number(formData.latitude);
    const lng = Number(formData.longitude);
    const elev = Number(formData.elevation);

    if (isNaN(lat) || isNaN(lng) || isNaN(elev)) {
      alert('Latitude, Longitude, and Elevation must be valid numbers.');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Latitude must be between -90 and 90; Longitude between -180 and 180.');
      return;
    }

    const payload = {
      station_id: formData.station_id.trim(),
      name: formData.name.trim(),
      wsi: formData.wsi.trim() !== '' ? formData.wsi.trim() : null,
      sensor_type: formData.sensor_type.trim() || 'Vaisala_WXT530',
      installation_date: new Date().toISOString(),
      firmware_version: 'fw-1.4.2',
      latitude: lat,
      longitude: lng,
      elevation: elev,
      terrain: formData.terrain,
      climate_region: formData.climate_region,
      power_segment: formData.power_segment.trim() || 'GRID-ALPHA-01',
      backhaul_id: formData.backhaul_id.trim() || 'BH-4G-PRIMARY',
    };

    try {
      const response = await fetch(`${API_BASE_URL}/edge/stations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('sg_access_token') || ''}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMsg = 'Failed to register station';
        if (Array.isArray(errorData.detail)) {
          errorMsg = errorData.detail
            .map((err: any) => `${err.loc.slice(1).join('.')}: ${err.msg}`)
            .join('\n');
        } else if (typeof errorData.detail === 'string') {
          errorMsg = errorData.detail;
        }
        throw new Error(errorMsg);
      }

      alert(`Station ${formData.station_id} registered and persisted!`);
      setShowRegisterForm(false);

      if (refreshStations) {
        await refreshStations();
      }

      setFormData({
        station_id: '',
        name: '',
        wsi: '',
        sensor_type: 'Vaisala_WXT530',
        latitude: '',
        longitude: '',
        elevation: '',
        terrain: 'plain',
        climate_region: 'indo_gangetic',
        power_segment: 'GRID-ALPHA-01',
        backhaul_id: 'BH-4G-PRIMARY',
      });
    } catch (err: any) {
      alert(`Registration Error:\n${err.message}`);
    }
  };

  const handleSaveEdit = () => {
    if (!selectedStation) return;
    alert(`Updated metadata for ${selectedStation.id}`);
    setIsEditing(false);
  };

  const filteredStations = stations.filter(
    (s) =>
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* SECTION 1: HEADER & REGISTER AWS TRIGGER */}
      <div className="p-6 rounded-2xl border border-[#E5E3DC] dark:border-[#232936] bg-white dark:bg-[#151921] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold uppercase">
            AWS Lifecycle Management
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#18181B] dark:text-[#F8FAFC] mt-1">
            Manage Weather Station Network
          </h2>
          <p className="text-xs font-mono text-[#71717A] dark:text-[#94A3B8] mt-1">
            Register new AWS hardware, update geospatial coordinates, and inspect deployed telemetry rigs.
          </p>
        </div>

        <button
          onClick={() => setShowRegisterForm(!showRegisterForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#18181B] dark:bg-[#F8FAFC] text-white dark:text-[#0D0F12] font-mono text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all shrink-0"
        >
          {showRegisterForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showRegisterForm ? 'Close Registration' : '+ Register New AWS'}
        </button>
      </div>

      {/* COLLAPSIBLE REGISTRATION FORM */}
      {showRegisterForm && (
        <form
          onSubmit={handleRegisterSubmit}
          className="p-6 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-[#FBFDFB] dark:bg-[#11171B] shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-emerald-100 dark:border-emerald-900/40">
            <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-mono text-xs font-bold uppercase text-[#18181B] dark:text-white">
              Provision New Station Node
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <label className="block text-[10px] text-neutral-500 uppercase mb-1">Station ID *</label>
              <input
                type="text"
                required
                placeholder="AWS010"
                value={formData.station_id}
                onChange={(e) => setFormData({ ...formData, station_id: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-[#151921] border border-[#E5E3DC] dark:border-[#232936] rounded"
              />
            </div>
            <div>
              <label className="block text-[10px] text-neutral-500 uppercase mb-1">Station Site Name *</label>
              <input
                type="text"
                required
                placeholder="Ambala Agro Observational Site"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-[#151921] border border-[#E5E3DC] dark:border-[#232936] rounded"
              />
            </div>
            <div>
              <label className="block text-[10px] text-neutral-500 uppercase mb-1">WIGOS Identifier (WSI)</label>
              <input
                type="text"
                placeholder="0-356-0-10000"
                value={formData.wsi}
                onChange={(e) => setFormData({ ...formData, wsi: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-[#151921] border border-[#E5E3DC] dark:border-[#232936] rounded"
              />
            </div>
            <div>
              <label className="block text-[10px] text-neutral-500 uppercase mb-1">Latitude (°N) *</label>
              <input
                type="number"
                step="any"
                required
                placeholder="30.3782"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-[#151921] border border-[#E5E3DC] dark:border-[#232936] rounded"
              />
            </div>
            <div>
              <label className="block text-[10px] text-neutral-500 uppercase mb-1">Longitude (°E) *</label>
              <input
                type="number"
                step="any"
                required
                placeholder="76.7767"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-[#151921] border border-[#E5E3DC] dark:border-[#232936] rounded"
              />
            </div>
            <div>
              <label className="block text-[10px] text-neutral-500 uppercase mb-1">Elevation (m) *</label>
              <input
                type="number"
                step="any"
                required
                placeholder="264"
                value={formData.elevation}
                onChange={(e) => setFormData({ ...formData, elevation: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-[#151921] border border-[#E5E3DC] dark:border-[#232936] rounded"
              />
            </div>
            <div>
              <label className="block text-[10px] text-neutral-500 uppercase mb-1">Terrain Classification *</label>
              <select
                value={formData.terrain}
                onChange={(e) => setFormData({ ...formData, terrain: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-[#151921] border border-[#E5E3DC] dark:border-[#232936] rounded"
              >
                <option value="plain">Plain</option>
                <option value="coastal">Coastal</option>
                <option value="mountain">Mountain</option>
                <option value="urban">Urban</option>
                <option value="alluvial">Alluvial</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-neutral-500 uppercase mb-1">Climate Region *</label>
              <select
                value={formData.climate_region}
                onChange={(e) => setFormData({ ...formData, climate_region: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-[#151921] border border-[#E5E3DC] dark:border-[#232936] rounded"
              >
                <option value="indo_gangetic">Indo-Gangetic</option>
                <option value="monsoon_coastal">Monsoon Coastal</option>
                <option value="arid_desert">Arid Desert</option>
                <option value="composite">Composite</option>
                <option value="subtropical_humid">Subtropical Humid</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-neutral-500 uppercase mb-1">Power Segment *</label>
              <input
                type="text"
                required
                value={formData.power_segment}
                onChange={(e) => setFormData({ ...formData, power_segment: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-[#151921] border border-[#E5E3DC] dark:border-[#232936] rounded"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setShowRegisterForm(false)}
              className="px-4 py-2 text-xs font-mono border border-[#E5E3DC] dark:border-[#232936] rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded"
            >
              Save &amp; Generate Credentials
            </button>
          </div>
        </form>
      )}

      {/* SECTION 2: LIST OF ALL AWS STATIONS */}
      <div className="p-6 rounded-2xl border border-[#E5E3DC] dark:border-[#232936] bg-white dark:bg-[#151921] shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E3DC] dark:border-[#232936]">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#18181B] dark:text-[#F8FAFC]">
              Registered Stations Fleet ({filteredStations.length})
            </h3>
            <p className="text-[11px] font-mono text-[#71717A] dark:text-[#94A3B8]">
              Select a station row to view and update its lifecycle parameters below.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID or site..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs font-mono rounded border border-[#E5E3DC] dark:border-[#232936] bg-[#FAF8F5] dark:bg-[#0D0F12] text-[#18181B] dark:text-[#F8FAFC]"
            />
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-[#E5E3DC] dark:border-[#232936] bg-[#FAF8F5] dark:bg-[#0D0F12] text-[10px] uppercase text-[#71717A] dark:text-[#94A3B8]">
                <th className="py-3 px-4">Station ID</th>
                <th className="py-3 px-4">Site Name</th>
                <th className="py-3 px-4">Coordinates</th>
                <th className="py-3 px-4">Elevation</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E3DC] dark:divide-[#232936]">
              {filteredStations.map((st) => {
                const isSelected = selectedStation?.id === st.id;
                return (
                  <tr
                    key={st.id}
                    onClick={() => handleSelectStation(st)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-neutral-100 dark:bg-[#1C222C] font-semibold'
                        : 'hover:bg-[#FAF8F5] dark:hover:bg-[#151921]/60'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-[#18181B] dark:text-white">
                      {st.id}
                    </td>
                    <td className="py-3.5 px-4 text-[#71717A] dark:text-[#94A3B8]">
                      {st.name}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-500">
                      {st.lat.toFixed(2)}°N, {st.lng.toFixed(2)}°E
                    </td>
                    <td className="py-3.5 px-4">{st.elevation} m</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-[#E5E3DC] dark:border-[#232936]">
                        {st.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectStation(st);
                          setIsEditing(true);
                        }}
                        className="p-1 rounded text-[#71717A] hover:text-[#18181B] dark:hover:text-white mr-2"
                        title="Edit Station"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: BOTTOM SELECTED STATION DETAILS & EDIT FORM */}
      {selectedStation ? (
        <div className="p-6 rounded-2xl border border-[#E5E3DC] dark:border-[#232936] bg-[#FDFBF7] dark:bg-[#12161D] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E3DC] dark:border-[#232936]">
            <div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E5E3DC] dark:bg-[#232936] text-[#18181B] dark:text-white font-bold">
                SELECTED STATION DETAIL
              </span>
              <h3 className="font-serif text-xl font-bold text-[#18181B] dark:text-[#F8FAFC] mt-1">
                {selectedStation.name} ({selectedStation.id})
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded border border-[#E5E3DC] dark:border-[#232936] bg-white dark:bg-[#151921] hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Station
                </button>
              ) : (
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl border border-[#E5E3DC] dark:border-[#232936] bg-white dark:bg-[#151921]">
              <span className="text-[10px] text-neutral-500 uppercase block mb-1">Site Location</span>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-1 border rounded bg-transparent font-bold"
                />
              ) : (
                <span className="font-bold text-[#18181B] dark:text-white">{selectedStation.name}</span>
              )}
            </div>

            <div className="p-4 rounded-xl border border-[#E5E3DC] dark:border-[#232936] bg-white dark:bg-[#151921]">
              <span className="text-[10px] text-neutral-500 uppercase block mb-1">Latitude &amp; Longitude</span>
              {isEditing ? (
                <div className="flex gap-1">
                  <input
                    type="number"
                    step="any"
                    value={editForm.lat || ''}
                    onChange={(e) => setEditForm({ ...editForm, lat: parseFloat(e.target.value) })}
                    className="w-1/2 p-1 border rounded bg-transparent"
                  />
                  <input
                    type="number"
                    step="any"
                    value={editForm.lng || ''}
                    onChange={(e) => setEditForm({ ...editForm, lng: parseFloat(e.target.value) })}
                    className="w-1/2 p-1 border rounded bg-transparent"
                  />
                </div>
              ) : (
                <span className="font-bold text-[#18181B] dark:text-white">
                  {selectedStation.lat.toFixed(4)}°N, {selectedStation.lng.toFixed(4)}°E
                </span>
              )}
            </div>

            <div className="p-4 rounded-xl border border-[#E5E3DC] dark:border-[#232936] bg-white dark:bg-[#151921]">
              <span className="text-[10px] text-neutral-500 uppercase block mb-1">Elevation (MSL)</span>
              {isEditing ? (
                <input
                  type="number"
                  value={editForm.elevation || ''}
                  onChange={(e) => setEditForm({ ...editForm, elevation: parseFloat(e.target.value) })}
                  className="w-full p-1 border rounded bg-transparent font-bold"
                />
              ) : (
                <span className="font-bold text-[#18181B] dark:text-white">{selectedStation.elevation} meters</span>
              )}
            </div>

            <div className="p-4 rounded-xl border border-[#E5E3DC] dark:border-[#232936] bg-white dark:bg-[#151921]">
              <span className="text-[10px] text-neutral-500 uppercase block mb-1">Live Status</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedStation.status}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center border border-dashed border-[#E5E3DC] dark:border-[#232936] rounded-2xl text-xs font-mono text-[#71717A]">
          Select an AWS node above to inspect or edit details.
        </div>
      )}
    </div>
  );
};