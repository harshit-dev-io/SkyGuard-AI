import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import { useDashboard } from '../../context/DashboardContext';
import { useTheme } from '../../context/ThemeContext';
import { mapApi } from '../../services/mapApi';
import { CARTO_CONFIG } from '../../config/api';
import type {
  MapNavigationLevel,
  RegionSummary,
  DistrictSummary,
  StationDetail,
  BreadcrumbItem,
} from '../../types/map';
import type { StationGeoNode } from '../../types/dashboard';
import {
  ChevronRight,
  ArrowLeft,
  RotateCcw,
  RefreshCw,
  Plus,
  Minus,
  AlertTriangle,
  Radio,
  Wind,
  Droplets,
  Gauge,
  Thermometer,
  Layers,
  ChevronDown,
  X,
  Compass,
  Search,
  MapPin,
} from 'lucide-react';

export const IndiaSpatialMap: React.FC = () => {
  const {
    stations: globalStations,
    setSelectedStation,
    isLive,
    setIsLive,
    refreshAll,
    fetchInspectionForStation,
    setSelectedInspection,
    anomalyFeed,
  } = useDashboard();

  const { isDark } = useTheme();

  // Navigation State
  const [navLevel, setNavLevel] = useState<MapNavigationLevel>('INDIA');
  const [regions, setRegions] = useState<RegionSummary[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<RegionSummary | null>(null);
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictSummary | null>(null);
  const [regionStations, setRegionStations] = useState<StationDetail[]>([]);
  const [districtStations, setDistrictStations] = useState<StationDetail[]>([]);
  const [activeStationDetail, setActiveStationDetail] = useState<StationDetail | null>(null);

  // UI Dropdowns & Search
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showDistrictSelector, setShowDistrictSelector] = useState<boolean>(false);
  const [showStateSelector, setShowStateSelector] = useState<boolean>(false);
  const [stateSearchQuery, setStateSearchQuery] = useState<string>('');
  const [stateDropdownPosition, setStateDropdownPosition] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 320,
  });

  // Leaflet references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const statesGeoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const districtsGeoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const stationMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const neighborLinesLayerRef = useRef<L.LayerGroup | null>(null);
  const indiaGeoJsonDataRef = useRef<any>(null);
  const cachedRegionGeoJsonRef = useRef<Record<string, any>>({});
  const stateSelectorRef = useRef<HTMLDivElement>(null);
  const stateDropdownMenuRef = useRef<HTMLDivElement>(null);
  const districtSelectorRef = useRef<HTMLDivElement>(null);

  // Update State Dropdown Position for Portal Rendering
  const updateStateDropdownPosition = () => {
    if (stateSelectorRef.current) {
      const rect = stateSelectorRef.current.getBoundingClientRect();
      const dropdownWidth = 320;
      let left = rect.right - dropdownWidth;
      if (left < 10) left = 10;
      if (left + dropdownWidth > window.innerWidth - 10) {
        left = window.innerWidth - dropdownWidth - 10;
      }
      setStateDropdownPosition({
        top: rect.bottom + 8,
        left: Math.max(10, left),
        width: dropdownWidth,
      });
    }
  };

  useEffect(() => {
    if (showStateSelector) {
      updateStateDropdownPosition();
      window.addEventListener('resize', updateStateDropdownPosition);
      window.addEventListener('scroll', updateStateDropdownPosition, true);
      return () => {
        window.removeEventListener('resize', updateStateDropdownPosition);
        window.removeEventListener('scroll', updateStateDropdownPosition, true);
      };
    }
  }, [showStateSelector]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        stateSelectorRef.current &&
        !stateSelectorRef.current.contains(target) &&
        (!stateDropdownMenuRef.current || !stateDropdownMenuRef.current.contains(target))
      ) {
        setShowStateSelector(false);
      }
      if (
        districtSelectorRef.current &&
        !districtSelectorRef.current.contains(target)
      ) {
        setShowDistrictSelector(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowStateSelector(false);
        setShowDistrictSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Strict Status Colors for Halo & Node Rendering
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return '#16A34A'; // Green
      case 'LOCAL_EXTREME':
        return '#2563EB'; // Blue (Local Extreme / Cloudburst)
      case 'SENSOR_FAULT':
        return '#DC2626'; // Red (Hardware Fault)
      case 'CALIBRATION_DRIFT':
        return '#F59E0B'; // Amber (Drift)
      case 'UNKNOWN_DUAL':
      default:
        return '#64748B'; // Slate (Unknown / Dual-Hypothesis)
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'Healthy';
      case 'LOCAL_EXTREME':
        return 'Extreme Weather';
      case 'SENSOR_FAULT':
        return 'Sensor Fault';
      case 'CALIBRATION_DRIFT':
        return 'Calibration Drift';
      case 'UNKNOWN_DUAL':
      default:
        return 'Unknown / Dual';
    }
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { level: 'INDIA', label: 'India' },
    ...(selectedRegion
      ? [{ level: 'REGION' as MapNavigationLevel, label: selectedRegion.name, id: selectedRegion.id }]
      : []),
    ...(selectedDistrict
      ? [{ level: 'DISTRICT' as MapNavigationLevel, label: selectedDistrict.name, id: selectedDistrict.id }]
      : []),
    ...(activeStationDetail
      ? [{ level: 'STATION' as MapNavigationLevel, label: activeStationDetail.name, id: activeStationDetail.id }]
      : []),
  ];

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [22.8, 79.5],
      zoom: 4.6,
      minZoom: 3.5,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
      fadeAnimation: true,
      zoomAnimation: true,
    });

    const tileUrl = CARTO_CONFIG.getTileUrl(isDark ? 'dark_all' : 'voyager');
    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Layer groups for markers & topological neighbor hairlines
    const linesGroup = L.layerGroup().addTo(map);
    neighborLinesLayerRef.current = linesGroup;

    const stationGroup = L.layerGroup().addTo(map);
    stationMarkersLayerRef.current = stationGroup;

    mapInstanceRef.current = map;

    loadInitialData();

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (tileLayerRef.current) {
      const tileUrl = CARTO_CONFIG.getTileUrl(isDark ? 'dark_all' : 'voyager');
      tileLayerRef.current.setUrl(tileUrl);
    }
  }, [isDark]);

  const loadInitialData = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const [fetchedRegions, indiaGeoJson] = await Promise.all([
        mapApi.getRegions(),
        mapApi.getIndiaGeoJson(),
      ]);

      setRegions(fetchedRegions);
      indiaGeoJsonDataRef.current = indiaGeoJson;

      renderIndiaLevel(indiaGeoJson, fetchedRegions);
    } catch (err: any) {
      console.error('Error initializing map data:', err);
      setApiError('Unable to load geospatial telemetry data.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderIndiaLevel = (geoJsonData: any, regionSummaries: RegionSummary[]) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (districtsGeoJsonLayerRef.current) {
      map.removeLayer(districtsGeoJsonLayerRef.current);
      districtsGeoJsonLayerRef.current = null;
    }
    if (statesGeoJsonLayerRef.current) {
      map.removeLayer(statesGeoJsonLayerRef.current);
    }
    if (stationMarkersLayerRef.current) {
      stationMarkersLayerRef.current.clearLayers();
    }
    if (neighborLinesLayerRef.current) {
      neighborLinesLayerRef.current.clearLayers();
    }

    const stateLayer = L.geoJSON(geoJsonData, {
      style: (feature) => {
        const stateName = feature?.properties?.ST_NM || feature?.properties?.name || '';
        const isHaryana = stateName.toLowerCase().includes('haryana');
        return {
          fillColor: isHaryana ? '#175a49' : '#0c2621',
          fillOpacity: 0.38,
          color: '#0fff87',
          weight: 1.2,
          opacity: 0.85,
        };
      },
      onEachFeature: (feature, layer) => {
        const stateName = feature?.properties?.ST_NM || feature?.properties?.name || 'Region';
        const cleanName = stateName.toLowerCase().replace('&', 'and').replace(/[^a-z0-9]+/g, '_');
        const matchedRegion = regionSummaries.find(
          (r) =>
            r.name.toLowerCase() === stateName.toLowerCase() ||
            cleanName.includes(r.id) ||
            r.id.includes(cleanName) ||
            r.id === cleanName
        );

        const stCount = matchedRegion ? matchedRegion.station_count : 24;
        const healthy = matchedRegion ? matchedRegion.healthy : 21;
        const anom = matchedRegion ? matchedRegion.anomalies : 2;

        layer.bindTooltip(
          `
          <div style="font-family: inherit; font-size: 11px; padding: 2px;">
            <div style="font-weight: 700; color: #0fff87; margin-bottom: 2px; font-size: 12px;">${stateName}</div>
            <div style="color: #c2cec8;">AWS Fleet: <b style="color: #ffffff;">${stCount} stations</b></div>
            <div style="color: #c2cec8;">Nominal: <span style="color: #16a34a;">${healthy}</span> | Flagged: <span style="color: #f59e0b;">${anom}</span></div>
          </div>
          `,
          {
            className: 'skyguard-map-tooltip',
            sticky: true,
            direction: 'top',
            interactive: false,
          }
        );

        layer.on({
          mouseover: (e) => {
            const l = e.target;
            l.setStyle({
              weight: 2.5,
              color: '#0fff87',
              fillOpacity: 0.65,
              fillColor: '#104336',
            });
            l.bringToFront();
          },
          mouseout: (e) => {
            stateLayer.resetStyle(e.target);
          },
          click: (e) => {
            L.DomEvent.stopPropagation(e);
            const regionSlug = matchedRegion?.id || cleanName;
            drillDownToRegion(regionSlug, stateName, matchedRegion);
          },
        });
      },
    }).addTo(map);

    statesGeoJsonLayerRef.current = stateLayer;
    renderIndiaStations();

    map.flyToBounds(
      [
        [8.0, 68.0],
        [37.2, 97.5],
      ],
      { duration: 1.2, padding: [20, 20] }
    );
  };

  const renderIndiaStations = () => {
    if (!stationMarkersLayerRef.current) return;
    stationMarkersLayerRef.current.clearLayers();
    if (neighborLinesLayerRef.current) neighborLinesLayerRef.current.clearLayers();

    const displayed = globalStations.slice(0, 50);

    // Render spatial KD-tree neighbor hairlines between nearby stations
    for (let i = 0; i < displayed.length; i++) {
      for (let j = i + 1; j < displayed.length; j++) {
        const stA = displayed[i];
        const stB = displayed[j];
        const dist = Math.hypot(stA.lat - stB.lat, stA.lng - stB.lng);
        if (dist < 1.8) {
          const line = L.polyline(
            [
              [stA.lat, stA.lng],
              [stB.lat, stB.lng],
            ],
            {
              color: '#0fff87',
              weight: 0.8,
              opacity: 0.35,
              dashArray: '4, 4',
            }
          );
          neighborLinesLayerRef.current?.addLayer(line);
        }
      }
    }

    displayed.forEach((st) => {
      const color = getStatusColor(st.status);
      const isExtreme = st.status === 'LOCAL_EXTREME';
      const isFault = st.status === 'SENSOR_FAULT';

      const icon = L.divIcon({
        className: 'skyguard-station-marker',
        html: `
          <div style="position: relative; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;">
            ${
              isExtreme
                ? `<div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background: ${color}; opacity: 0.5; animation: sg-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
                : isFault
                ? `<div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${color}; opacity: 0.8; animation: sg-ping 2s infinite;"></div>`
                : ''
            }
            <div style="width: 10px; height: 10px; border-radius: 50%; background-color: ${color}; border: 1.5px solid #081310; box-shadow: 0 0 8px ${color};"></div>
          </div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([st.lat, st.lng], { icon });
      marker.bindTooltip(
        `
        <div style="font-family: inherit; font-size: 11px;">
          <div style="font-weight: 700; color: #ffffff;">${st.name}</div>
          <div style="color: #798281; font-size: 10px;">ID: ${st.id}</div>
          <div style="margin-top: 2px;">Status: <b style="color: ${color};">${getStatusLabel(st.status)}</b></div>
        </div>
        `,
        { className: 'skyguard-map-tooltip', direction: 'top' }
      );

      marker.on('click', () => {
        handleStationSelect(st as any);
      });

      stationMarkersLayerRef.current?.addLayer(marker);
    });
  };

  const drillDownToRegion = async (regionId: string, regionName: string, fallbackRegion?: RegionSummary) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const cleanId = regionId.toLowerCase().replace('&', 'and').replace(/[^a-z0-9]+/g, '_');
      const matched =
        fallbackRegion ||
        regions.find((r) => r.id === cleanId || r.id === regionId || r.name.toLowerCase() === regionName.toLowerCase()) || {
          id: cleanId,
          name: regionName,
          code: regionName.slice(0, 2).toUpperCase(),
          capital: 'State Capital',
          center: [22.5, 78.5] as [number, number],
          bounds: [
            [20.0, 75.0],
            [25.0, 82.0],
          ] as [[number, number], [number, number]],
          station_count: 180,
          healthy: 160,
          anomalies: 14,
          faults: 6,
          drift: 2,
          unknown: 0,
          district_count: 15,
        };

      setSelectedRegion(matched);
      setNavLevel('REGION');
      setSelectedDistrict(null);
      setActiveStationDetail(null);
      setShowStateSelector(false);

      const [districtList, stList, regionGeoJson] = await Promise.all([
        mapApi.getDistricts(matched.id),
        mapApi.getRegionStations(matched.id),
        cachedRegionGeoJsonRef.current[matched.id]
          ? Promise.resolve(cachedRegionGeoJsonRef.current[matched.id])
          : mapApi.getRegionGeoJson(matched.id),
      ]);

      if (regionGeoJson) {
        cachedRegionGeoJsonRef.current[matched.id] = regionGeoJson;
      }

      setDistricts(districtList);
      setRegionStations(stList);

      renderRegionLevel(matched, districtList, stList, regionGeoJson);
    } catch (err: any) {
      console.error('Error entering region view:', err);
      setApiError(`Failed to load districts for ${regionName}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderRegionLevel = (
    region: RegionSummary,
    districtList: DistrictSummary[],
    stList: StationDetail[],
    geoJsonData: any
  ) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (statesGeoJsonLayerRef.current) {
      map.removeLayer(statesGeoJsonLayerRef.current);
      statesGeoJsonLayerRef.current = null;
    }
    if (districtsGeoJsonLayerRef.current) {
      map.removeLayer(districtsGeoJsonLayerRef.current);
      districtsGeoJsonLayerRef.current = null;
    }
    if (stationMarkersLayerRef.current) {
      stationMarkersLayerRef.current.clearLayers();
    }
    if (neighborLinesLayerRef.current) {
      neighborLinesLayerRef.current.clearLayers();
    }

    if (geoJsonData) {
      const districtLayer = L.geoJSON(geoJsonData, {
        style: () => ({
          fillColor: '#0e2b25',
          fillOpacity: 0.35,
          color: '#10b981',
          weight: 1.4,
          opacity: 0.85,
          dashArray: '3, 3',
        }),
        onEachFeature: (feature, layer) => {
          const dName =
            feature?.properties?.district ||
            feature?.properties?.dtname ||
            feature?.properties?.NAME_2 ||
            feature?.properties?.name ||
            'District';

          const matched = districtList.find(
            (d) => d.name.toLowerCase() === dName.toLowerCase() || dName.toLowerCase().includes(d.id)
          );

          layer.bindTooltip(dName, {
            permanent: true,
            direction: 'center',
            className: 'skyguard-district-label',
          });

          layer.on({
            mouseover: (e) => {
              const l = e.target;
              l.setStyle({
                weight: 2.6,
                color: '#0fff87',
                fillOpacity: 0.65,
                fillColor: '#104336',
              });
              l.bringToFront();
            },
            mouseout: (e) => {
              districtLayer.resetStyle(e.target);
            },
            click: () => {
              const targetDistrict = matched || {
                id: dName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
                name: dName,
                region_id: region.id,
                region_name: region.name,
                center: region.center,
                bounds: region.bounds,
                station_count: 12,
                healthy: 10,
                anomalies: 1,
                faults: 1,
                drift: 0,
                unknown: 0,
                elevation: 250,
              };
              drillDownToDistrict(targetDistrict);
            },
          });
        },
      }).addTo(map);

      districtsGeoJsonLayerRef.current = districtLayer;
    }

    renderRegionStationMarkers(stList);
    map.flyToBounds(region.bounds, { duration: 1.2, padding: [30, 30] });
  };

  const renderRegionStationMarkers = (stations: StationDetail[]) => {
    if (!stationMarkersLayerRef.current) return;
    stationMarkersLayerRef.current.clearLayers();
    if (neighborLinesLayerRef.current) neighborLinesLayerRef.current.clearLayers();

    // Connect spatial neighbor candidate vectors
    for (let i = 0; i < stations.length; i++) {
      for (let j = i + 1; j < stations.length; j++) {
        const stA = stations[i];
        const stB = stations[j];
        const dist = Math.hypot(stA.latitude - stB.latitude, stA.longitude - stB.longitude);
        if (dist < 0.45) {
          const line = L.polyline(
            [
              [stA.latitude, stA.longitude],
              [stB.latitude, stB.longitude],
            ],
            {
              color: '#0fff87',
              weight: 0.8,
              opacity: 0.35,
              dashArray: '3, 3',
            }
          );
          neighborLinesLayerRef.current?.addLayer(line);
        }
      }
    }

    stations.forEach((st) => {
      const color = getStatusColor(st.status);
      const isExtreme = st.status === 'LOCAL_EXTREME';
      const isFault = st.status === 'SENSOR_FAULT';

      const icon = L.divIcon({
        className: 'skyguard-station-marker',
        html: `
          <div style="position: relative; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            ${
              isExtreme
                ? `<div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: ${color}; opacity: 0.5; animation: sg-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
                : isFault
                ? `<div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; border: 2px solid ${color}; opacity: 0.8; animation: sg-ping 2s infinite;"></div>`
                : ''
            }
            <div style="width: 10px; height: 10px; border-radius: 50%; background-color: ${color}; border: 1.5px solid #081310; box-shadow: 0 0 8px ${color};"></div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker([st.latitude, st.longitude], { icon });

      marker.bindTooltip(
        `
        <div style="font-family: inherit; font-size: 11px;">
          <div style="font-weight: 700; color: #ffffff;">${st.name}</div>
          <div style="color: #798281; font-size: 10px;">${st.district_name} · ${st.id}</div>
          <div style="margin-top: 2px; color: ${color}; font-weight: 600;">${st.status_label}</div>
        </div>
        `,
        { className: 'skyguard-map-tooltip', direction: 'top' }
      );

      marker.on('click', () => {
        handleStationSelect(st);
      });

      stationMarkersLayerRef.current?.addLayer(marker);
    });
  };

  const drillDownToDistrict = async (district: DistrictSummary) => {
    setIsLoading(true);
    setApiError(null);
    try {
      setSelectedDistrict(district);
      setNavLevel('DISTRICT');
      setActiveStationDetail(null);
      setShowDistrictSelector(false);

      const stations = await mapApi.getDistrictStations(district.id);
      setDistrictStations(stations);

      const map = mapInstanceRef.current;
      if (!map) return;

      renderDistrictStationMarkers(stations);
      map.flyTo(district.center, 10.5, { duration: 1.2 });
    } catch (err: any) {
      console.error('Error entering district view:', err);
      setApiError(`Failed to load stations for district ${district.name}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderDistrictStationMarkers = (stations: StationDetail[]) => {
    if (!stationMarkersLayerRef.current) return;
    stationMarkersLayerRef.current.clearLayers();

    stations.forEach((st) => {
      const color = getStatusColor(st.status);
      const isExtreme = st.status === 'LOCAL_EXTREME';
      const isFault = st.status === 'SENSOR_FAULT';
      const isSelected = activeStationDetail?.id === st.id;

      const markerHtml = `
        <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          ${
            isExtreme || isSelected
              ? `<div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: ${color}; opacity: 0.45; animation: sg-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
              : isFault
              ? `<div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; border: 2px dashed ${color}; opacity: 0.8; animation: sg-ping 2s infinite;"></div>`
              : ''
          }
          <div style="
            width: ${isSelected ? '14px' : '10px'};
            height: ${isSelected ? '14px' : '10px'};
            border-radius: 50%;
            background-color: ${color};
            border: 2px solid #081310;
            box-shadow: 0 0 10px ${color};
            transition: all 0.2s ease;
          "></div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'skyguard-station-marker',
        html: markerHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([st.latitude, st.longitude], { icon });

      marker.bindTooltip(
        `
        <div style="font-family: inherit; font-size: 11px; min-width: 170px;">
          <div style="font-weight: 700; color: #ffffff;">${st.name}</div>
          <div style="color: #798281; font-size: 10px; margin-bottom: 4px;">ID: ${st.id}</div>
          <div style="color: ${color}; font-weight: 600; margin-bottom: 4px;">${st.status_label}</div>
          <div style="background: rgba(16,67,54,0.35); border-radius: 4px; padding: 4px 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px;">
            <div>Temp: <b style="color: #ffffff;">${st.telemetry.temperature}°C</b></div>
            <div>RH: <b style="color: #ffffff;">${st.telemetry.relative_humidity}%</b></div>
            <div>Press: <b style="color: #ffffff;">${st.telemetry.atmospheric_pressure} hPa</b></div>
            <div>Dew: <b style="color: #ffffff;">${st.telemetry.dew_point}°C</b></div>
          </div>
        </div>
        `,
        { className: 'skyguard-map-tooltip', direction: 'top' }
      );

      marker.on('click', () => {
        handleStationSelect(st);
      });

      stationMarkersLayerRef.current?.addLayer(marker);
    });
  };

  const handleStationSelect = (st: StationDetail | StationGeoNode) => {
    let detail: StationDetail;
    if ('telemetry' in st) {
      detail = st as StationDetail;
    } else {
      detail = {
        id: st.id,
        name: st.name,
        district_id: selectedDistrict?.id || 'central',
        district_name: selectedDistrict?.name || 'Central Met',
        region_id: selectedRegion?.id || 'india',
        region_name: selectedRegion?.name || 'India',
        latitude: st.lat,
        longitude: st.lng,
        elevation: st.elevation,
        status: st.status as any,
        status_label: getStatusLabel(st.status),
        wsi: st.wsi || `0-356-0-${st.id}`,
        firmware_version: 'v2.4.1-sg',
        telemetry: {
          temperature: st.temp,
          relative_humidity: st.rh,
          atmospheric_pressure: st.pressure,
          dew_point: st.dewPoint,
          wind_speed: 3.2,
          wind_direction: 'NW',
          rainfall_rate: 0.0,
          solar_radiation: 740.0,
          timestamp: '2026-09-24T09:30:00Z',
        },
        sensor_health: {
          temperature_sensor: 'NOMINAL',
          humidity_sensor: 'NOMINAL',
          barometer: 'NOMINAL',
          anemometer: 'NOMINAL',
          rain_gauge: 'NOMINAL',
        },
      };
    }

    setActiveStationDetail(detail);
    setNavLevel('STATION');

    const geoNode: StationGeoNode = {
      id: detail.id,
      name: detail.name,
      status: detail.status as any,
      lat: detail.latitude,
      lng: detail.longitude,
      x: 200,
      y: 200,
      elevation: detail.elevation,
      rh: detail.telemetry.relative_humidity,
      temp: detail.telemetry.temperature,
      dewPoint: detail.telemetry.dew_point,
      pressure: detail.telemetry.atmospheric_pressure,
      neighbors: [],
      wsi: detail.wsi,
    };
    setSelectedStation(geoNode);

    const matchedAnomaly = anomalyFeed.find((a) => a.stationId === detail.id);
    if (matchedAnomaly && matchedAnomaly.inspection) {
      setSelectedInspection(matchedAnomaly.inspection);
    } else {
      fetchInspectionForStation(detail.id);
    }

    mapInstanceRef.current?.flyTo([detail.latitude, detail.longitude], 13.5, { duration: 1.0 });
  };

  const handleNavigateBack = () => {
    if (navLevel === 'STATION') {
      setActiveStationDetail(null);
      setNavLevel('DISTRICT');
      if (selectedDistrict) {
        mapInstanceRef.current?.flyTo(selectedDistrict.center, 10.5, { duration: 1.0 });
      }
    } else if (navLevel === 'DISTRICT') {
      setSelectedDistrict(null);
      setActiveStationDetail(null);
      setNavLevel('REGION');
      if (selectedRegion) {
        const cachedGeoJson = cachedRegionGeoJsonRef.current[selectedRegion.id];
        renderRegionLevel(selectedRegion, districts, regionStations, cachedGeoJson);
      }
    } else if (navLevel === 'REGION') {
      resetToIndia();
    }
  };

  const resetToIndia = () => {
    setSelectedRegion(null);
    setSelectedDistrict(null);
    setActiveStationDetail(null);
    setNavLevel('INDIA');
    setShowStateSelector(false);
    setShowDistrictSelector(false);
    if (indiaGeoJsonDataRef.current) {
      renderIndiaLevel(indiaGeoJsonDataRef.current, regions);
    }
  };

  const filteredRegions = regions.filter((r) =>
    r.name.toLowerCase().includes(stateSearchQuery.toLowerCase()) ||
    r.code.toLowerCase().includes(stateSearchQuery.toLowerCase())
  );

  return (
    <div
      id="tutorial-spatial-map"
      className="p-4 rounded-xl border border-cardBorder dark:border-[#332C23] bg-white dark:bg-[#1E1A15] flex flex-col justify-between h-full transition-colors relative z-10 overflow-visible shadow-none"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-cardBorder dark:border-[#332C23] relative z-50 overflow-visible">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-panelBg dark:bg-[#26211A] text-brandAccent border border-cardBorder dark:border-[#332C23]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-brandDark dark:text-[#F3EFE8]">
                Spatial Telemetry Network (India AWS Fleet)
              </h3>
              <span className="px-2 py-0.5 bg-panelBg dark:bg-[#26211A] border border-cardBorder dark:border-[#332C23] rounded text-[10px] font-mono text-inkMuted dark:text-[#9A938A]">
                1Hz Sync
              </span>
            </div>
            <p className="text-xs text-inkMuted dark:text-[#9A938A] mt-0.5">
              {navLevel === 'INDIA'
                ? 'National Fleet Overview (All 36 States & UTs)'
                : navLevel === 'REGION'
                  ? `${selectedRegion?.name} State Fleet (${districts.length} Districts)`
                  : `${selectedDistrict?.name} District Cluster (${districtStations.length} AWS Nodes)`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap relative z-50">
          <div className="relative z-50" ref={stateSelectorRef}>
            <button
              onClick={() => {
                setShowStateSelector(!showStateSelector);
                setShowDistrictSelector(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-cardBorder dark:border-[#332C23] bg-white dark:bg-[#26211A] text-brandDark dark:text-[#F3EFE8] hover:bg-panelBg dark:hover:bg-[#1E1A15] transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-brandAccent" />
              <span>{selectedRegion ? selectedRegion.name : 'Select State / UT'}</span>
              <ChevronDown className="w-3 h-3 text-inkMuted" />
            </button>

            {showStateSelector &&
              createPortal(
                <div
                  ref={stateDropdownMenuRef}
                  className="rounded-xl bg-white dark:bg-[#1E1A15] border border-cardBorder dark:border-[#332C23] shadow-elevation flex flex-col overflow-hidden"
                  style={{
                    position: 'fixed',
                    top: `${stateDropdownPosition.top}px`,
                    left: `${stateDropdownPosition.left}px`,
                    width: `${stateDropdownPosition.width}px`,
                    height: '310px',
                    maxHeight: '310px',
                    zIndex: 2147483647,
                    boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(225, 89, 12, 0.2)',
                  }}
                >
                  <div className="p-3 border-b border-cardBorder dark:border-[#332C23] bg-panelBg dark:bg-[#26211A] shrink-0">
                    <div className="relative flex items-center">
                      <Search className="w-4 h-4 text-inkMuted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search 36 States & UTs..."
                        value={stateSearchQuery}
                        onChange={(e) => setStateSearchQuery(e.target.value)}
                        autoFocus
                        className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-white dark:bg-[#1E1A15] border border-cardBorder dark:border-[#332C23] text-xs text-brandDark dark:text-[#F3EFE8] focus:outline-none focus:border-brandAccent"
                      />
                      {stateSearchQuery && (
                        <button
                          onClick={() => setStateSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-inkMuted hover:text-brandDark"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-2 skyguard-dropdown-scroll space-y-1 overflow-y-auto" style={{ height: '204px' }}>
                    {filteredRegions.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          drillDownToRegion(r.id, r.name, r);
                          setShowStateSelector(false);
                        }}
                        className={`w-full h-[40px] shrink-0 text-left px-3 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          selectedRegion?.id === r.id
                            ? 'bg-accentSoft dark:bg-[#3A2416] text-brandAccent font-bold'
                            : 'hover:bg-panelBg dark:hover:bg-[#26211A] text-brandDark dark:text-[#F3EFE8]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-panelBg dark:bg-[#26211A] border border-cardBorder dark:border-[#332C23] shrink-0">
                            {r.code}
                          </span>
                          <span className="truncate">{r.name}</span>
                        </div>
                        <span className="text-[11px] text-inkMuted dark:text-[#9A938A] shrink-0">
                          {r.station_count} AWS
                        </span>
                      </button>
                    ))}
                  </div>
                </div>,
                document.body
              )}
          </div>

          {navLevel !== 'INDIA' && (
            <button
              onClick={resetToIndia}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-cardBorder dark:border-[#332C23] bg-white dark:bg-[#26211A] text-brandDark dark:text-[#F3EFE8] hover:bg-panelBg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-brandAccent" />
              <span>Reset</span>
            </button>
          )}

          <button
            onClick={() => setIsLive(!isLive)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-cardBorder dark:border-[#332C23] bg-white dark:bg-[#26211A] text-brandDark dark:text-[#F3EFE8] cursor-pointer"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLive ? 'bg-signalGreen animate-pulse shadow-[0_0_8px_rgba(31,157,85,0.6)]' : 'bg-inkMuted/40'
              }`}
            />
            <span>{isLive ? 'Live' : 'Paused'}</span>
          </button>

          <button
            onClick={() => refreshAll()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-brandDark dark:text-[#F3EFE8] border border-cardBorder dark:border-[#332C23] bg-white dark:bg-[#26211A] hover:bg-panelBg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-brandDark dark:text-[#F3EFE8]" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-3 py-2 rounded-lg bg-panelBg dark:bg-[#26211A] border border-cardBorder dark:border-[#332C23] text-xs">
        <div className="flex items-center gap-1 text-inkMuted dark:text-[#9A938A] flex-wrap">
          {navLevel !== 'INDIA' && (
            <button
              onClick={handleNavigateBack}
              className="mr-2 flex items-center gap-1 font-semibold text-brandAccent hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.level + crumb.label}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-inkMuted/50" />}
                <span
                  className={`font-medium ${
                    isLast ? 'text-brandDark dark:text-white font-bold' : 'text-inkMuted dark:text-[#9A938A]'
                  }`}
                >
                  {crumb.label}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="relative w-full flex-1 min-h-[420px] rounded-lg overflow-hidden border border-cardBorder dark:border-[#332C23] bg-[#15130F] select-none">
        <div ref={mapContainerRef} className="w-full h-full min-h-[420px]" />

        <div className="absolute top-4 right-4 z-[400] flex flex-col gap-1">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-7 h-7 rounded-md bg-white/90 dark:bg-[#26211A]/90 hover:bg-white border border-cardBorder dark:border-[#332C23] text-brandDark dark:text-white flex items-center justify-center cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-7 h-7 rounded-md bg-white/90 dark:bg-[#26211A]/90 hover:bg-white border border-cardBorder dark:border-[#332C23] text-brandDark dark:text-white flex items-center justify-center cursor-pointer shadow-sm"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-[#15130F]/75 backdrop-blur-[2px] z-[500] flex flex-col items-center justify-center gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-brandAccent/20 animate-ping" />
              <Radio className="w-4 h-4 text-brandAccent animate-pulse" />
            </div>
            <span className="text-xs font-semibold text-brandAccent font-mono">
              Loading geospatial telemetry boundary stream...
            </span>
          </div>
        )}

        {activeStationDetail && (
          <div className="absolute top-4 left-4 z-[450] w-80 max-w-[calc(100%-2rem)] rounded-xl bg-white/95 dark:bg-[#1E1A15]/95 border border-cardBorder dark:border-[#332C23] p-4 text-brandDark dark:text-[#F3EFE8] text-xs backdrop-blur-md shadow-elevation">
            <div className="flex items-start justify-between gap-2 pb-2 mb-3 border-b border-cardBorder dark:border-[#332C23]">
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: getStatusColor(activeStationDetail.status) }}
                  />
                  <h4 className="font-bold text-sm text-brandDark dark:text-white">{activeStationDetail.name}</h4>
                </div>
                <div className="text-[11px] text-inkMuted dark:text-[#9A938A] font-mono">
                  {activeStationDetail.id} · {activeStationDetail.wsi}
                </div>
              </div>
              <button
                onClick={() => setActiveStationDetail(null)}
                className="p-1 text-inkMuted hover:text-brandDark dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2 bg-panelBg dark:bg-[#26211A] p-2.5 rounded-lg border border-cardBorder dark:border-[#332C23]">
              <div className="flex items-center gap-2">
                <Thermometer className="w-3.5 h-3.5 text-brandAccent" />
                <div>
                  <div className="text-[10px] text-inkMuted dark:text-[#9A938A]">Temperature</div>
                  <div className="font-bold text-brandDark dark:text-white text-xs font-mono">{activeStationDetail.telemetry.temperature}°C</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
                <div>
                  <div className="text-[10px] text-inkMuted dark:text-[#9A938A]">Rel. Humidity</div>
                  <div className="font-bold text-brandDark dark:text-white text-xs font-mono">{activeStationDetail.telemetry.relative_humidity}%</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Gauge className="w-3.5 h-3.5 text-signalAmber" />
                <div>
                  <div className="text-[10px] text-inkMuted dark:text-[#9A938A]">Pressure</div>
                  <div className="font-bold text-brandDark dark:text-white text-xs font-mono">{activeStationDetail.telemetry.atmospheric_pressure} hPa</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Wind className="w-3.5 h-3.5 text-signalGreen" />
                <div>
                  <div className="text-[10px] text-inkMuted dark:text-[#9A938A]">Wind / Gust</div>
                  <div className="font-bold text-brandDark dark:text-white text-xs font-mono">{activeStationDetail.telemetry.wind_speed} m/s</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
