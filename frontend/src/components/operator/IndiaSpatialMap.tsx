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
  CheckCircle2,
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

  // Sync position on open, window resize, and window scroll
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

  // Click outside and Escape key to close State / District selectors
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

  // Status Colors Matching SkyGuard Dark & Light Theme
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return '#10b981'; // Mint Green
      case 'LOCAL_EXTREME':
        return '#f59e0b'; // Amber
      case 'SENSOR_FAULT':
        return '#ef4444'; // Red
      case 'CALIBRATION_DRIFT':
        return '#eab308'; // Yellow-Amber
      case 'UNKNOWN_DUAL':
      default:
        return '#8fa59e'; // Slate
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'Healthy';
      case 'LOCAL_EXTREME':
        return 'Extreme Event';
      case 'SENSOR_FAULT':
        return 'Fault';
      case 'CALIBRATION_DRIFT':
        return 'Drift';
      case 'UNKNOWN_DUAL':
      default:
        return 'Unknown';
    }
  };

  // Breadcrumbs array
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

    // Dynamic CARTO Raster Tile Basemap with environment API key
    const tileUrl = CARTO_CONFIG.getTileUrl(isDark ? 'dark_all' : 'voyager');
    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Layer groups
    const stationGroup = L.layerGroup().addTo(map);
    stationMarkersLayerRef.current = stationGroup;

    mapInstanceRef.current = map;

    // Load initial data
    loadInitialData();

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync Basemap tile theme when theme changes
  useEffect(() => {
    if (tileLayerRef.current) {
      const tileUrl = CARTO_CONFIG.getTileUrl(isDark ? 'dark_all' : 'voyager');
      tileLayerRef.current.setUrl(tileUrl);
    }
  }, [isDark]);

  // Fetch initial regions and India GeoJSON
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
      setApiError('Unable to load geospatial telemetry data. Using standard national registry.');
    } finally {
      setIsLoading(false);
    }
  };

  // Level 1: India Map with All 36 State/UT Boundaries & High-Level Stations
  const renderIndiaLevel = (geoJsonData: any, regionSummaries: RegionSummary[]) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous district layers and markers
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

    // Add India States GeoJSON
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

        // Tooltip on state hover
        layer.bindTooltip(
          `
          <div style="font-family: inherit; font-size: 11px; padding: 2px;">
            <div style="font-weight: 700; color: #0fff87; margin-bottom: 2px; font-size: 12px;">${stateName}</div>
            <div style="color: #c2cec8;">AWS Fleet: <b style="color: #ffffff;">${stCount} stations</b></div>
            <div style="color: #c2cec8;">Nominal: <span style="color: #10b981;">${healthy}</span> | Flagged: <span style="color: #f59e0b;">${anom}</span></div>
            <div style="color: #798281; font-size: 10px; margin-top: 3px; font-style: italic;">Click to inspect districts</div>
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

    // Render high-level station markers across India
    renderIndiaStations();

    // Fit to India national bounds
    map.flyToBounds(
      [
        [8.0, 68.0],
        [37.2, 97.5],
      ],
      { duration: 1.2, padding: [20, 20] }
    );
  };

  // Render high-level station nodes across India
  const renderIndiaStations = () => {
    if (!stationMarkersLayerRef.current) return;
    stationMarkersLayerRef.current.clearLayers();

    globalStations.slice(0, 50).forEach((st) => {
      const color = getStatusColor(st.status);
      const isAnomaly = st.status !== 'HEALTHY';

      const icon = L.divIcon({
        className: 'skyguard-station-marker',
        html: `
          <div style="position: relative; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center;">
            ${isAnomaly
            ? `<div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background: ${color}; opacity: 0.45; animation: sg-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
            : ''
          }
            <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${color}; border: 1.5px solid #081310; box-shadow: 0 0 7px ${color};"></div>
          </div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
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

  // Drill Down: Level 1 -> Level 2 (Any State/UT)
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

      // Concurrently fetch districts, region stations, and region GeoJSON
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

  // Render Level 2: Region with All District Boundaries & Station Markers
  const renderRegionLevel = (
    region: RegionSummary,
    districtList: DistrictSummary[],
    stList: StationDetail[],
    geoJsonData: any
  ) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear state layer and markers
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

    if (geoJsonData) {
      // Add Districts GeoJSON layer
      const districtLayer = L.geoJSON(geoJsonData, {
        style: (feature) => {
          const dName =
            feature?.properties?.district ||
            feature?.properties?.dtname ||
            feature?.properties?.NAME_2 ||
            feature?.properties?.name ||
            '';
          return {
            fillColor: '#0e2b25',
            fillOpacity: 0.35,
            color: '#10b981',
            weight: 1.4,
            opacity: 0.85,
            dashArray: '3, 3',
          };
        },
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

          const stCount = matched ? matched.station_count : 12;
          const healthy = matched ? matched.healthy : 10;
          const anom = matched ? matched.anomalies : 1;
          const faults = matched ? matched.faults : 1;

          // District name label
          layer.bindTooltip(dName, {
            permanent: true,
            direction: 'center',
            className: 'skyguard-district-label',
          });

          const hoverTooltipHtml = `
            <div style="font-family: inherit; font-size: 11px; min-width: 145px; padding: 2px;">
              <div style="font-weight: 700; color: #0fff87; font-size: 12px; border-bottom: 1px solid rgba(15,255,135,0.25); padding-bottom: 3px; margin-bottom: 4px;">District: ${dName}</div>
              <div style="color: #e2ebe8; display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span>AWS Stations:</span> <b style="color: #ffffff;">${stCount}</b>
              </div>
              <div style="color: #e2ebe8; display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span>Healthy:</span> <b style="color: #10b981;">${healthy}</b>
              </div>
              <div style="color: #e2ebe8; display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span>Anomalies:</span> <b style="color: #f59e0b;">${anom}</b>
              </div>
              <div style="color: #e2ebe8; display: flex; justify-content: space-between;">
                <span>Faults:</span> <b style="color: #ef4444;">${faults}</b>
              </div>
              <div style="color: #798281; font-size: 9px; margin-top: 5px; font-style: italic; text-align: center;">Click to drill down into district</div>
            </div>
          `;

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
              layer.setTooltipContent(hoverTooltipHtml);
            },
            mouseout: (e) => {
              districtLayer.resetStyle(e.target);
              layer.setTooltipContent(dName);
            },
            click: () => {
              const targetDistrict = matched || {
                id: dName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
                name: dName,
                region_id: region.id,
                region_name: region.name,
                center: region.center,
                bounds: region.bounds,
                station_count: stCount,
                healthy,
                anomalies: anom,
                faults,
                drift: 0,
                unknown: 0,
                elevation: 250,
              };
              const bounds = typeof (layer as any).getBounds === 'function' ? (layer as any).getBounds() : undefined;
              drillDownToDistrict(targetDistrict, bounds);
            },
          });
        },
      }).addTo(map);

      districtsGeoJsonLayerRef.current = districtLayer;
    }

    // Render AWS Station markers across the state
    renderRegionStationMarkers(stList);

    // Smoothly fly to Region bounds
    map.flyToBounds(region.bounds, { duration: 1.2, padding: [30, 30] });
  };

  // Render AWS Stations across Region (Level 2)
  const renderRegionStationMarkers = (stations: StationDetail[]) => {
    if (!stationMarkersLayerRef.current) return;
    stationMarkersLayerRef.current.clearLayers();

    stations.forEach((st) => {
      const color = getStatusColor(st.status);
      const isAnomaly = st.status !== 'HEALTHY';

      const icon = L.divIcon({
        className: 'skyguard-station-marker',
        html: `
          <div style="position: relative; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            ${isAnomaly
            ? `<div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background: ${color}; opacity: 0.45; animation: sg-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
            : ''
          }
            <div style="width: 9px; height: 9px; border-radius: 50%; background-color: ${color}; border: 1.5px solid #081310; box-shadow: 0 0 7px ${color};"></div>
          </div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([st.latitude, st.longitude], { icon });

      marker.bindTooltip(
        `
        <div style="font-family: inherit; font-size: 11px; min-width: 140px; padding: 2px;">
          <div style="font-weight: 700; color: #ffffff;">${st.name}</div>
          <div style="color: #798281; font-size: 10px;">${st.district_name} · ${st.id}</div>
          <div style="margin-top: 3px; display: flex; align-items: center; gap: 4px;">
            <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${color};"></span>
            <span style="color: ${color}; font-weight: 600;">${st.status_label}</span>
          </div>
          <div style="color: #0fff87; font-size: 9px; margin-top: 3px; font-style: italic;">Click to inspect station</div>
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

  // Drill Down: Level 2 -> Level 3 (District View)
  const drillDownToDistrict = async (district: DistrictSummary, bounds?: L.LatLngBounds) => {
    setIsLoading(true);
    setApiError(null);
    try {
      setSelectedDistrict(district);
      setNavLevel('DISTRICT');
      setActiveStationDetail(null);
      setShowDistrictSelector(false);

      // Fetch stations inside this district from API
      const stations = await mapApi.getDistrictStations(district.id);
      setDistrictStations(stations);

      const map = mapInstanceRef.current;
      if (!map) return;

      // Highlight selected district border and dim others
      if (districtsGeoJsonLayerRef.current) {
        districtsGeoJsonLayerRef.current.eachLayer((l: any) => {
          const name =
            l.feature?.properties?.district ||
            l.feature?.properties?.dtname ||
            l.feature?.properties?.NAME_2 ||
            l.feature?.properties?.name ||
            '';
          if (name.toLowerCase() === district.name.toLowerCase()) {
            l.setStyle({
              weight: 3.0,
              color: '#0fff87',
              fillOpacity: 0.5,
              fillColor: '#175a49',
              dashArray: undefined,
            });
            l.bringToFront();
          } else {
            l.setStyle({
              weight: 0.7,
              color: 'rgba(15, 255, 135, 0.2)',
              fillOpacity: 0.1,
              dashArray: '2, 2',
            });
          }
        });
      }

      // Add AWS Station markers inside this district
      renderDistrictStationMarkers(stations);

      // Zoom into district bounds smoothly
      if (bounds) {
        map.flyToBounds(bounds, { duration: 1.2, padding: [45, 45] });
      } else {
        map.flyTo(district.center, 10.5, { duration: 1.2 });
      }
    } catch (err: any) {
      console.error('Error entering district view:', err);
      setApiError(`Failed to load stations for district ${district.name}.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Render stations on District Level (Level 3)
  const renderDistrictStationMarkers = (stations: StationDetail[]) => {
    if (!stationMarkersLayerRef.current) return;
    stationMarkersLayerRef.current.clearLayers();

    stations.forEach((st) => {
      const color = getStatusColor(st.status);
      const isAnomaly = st.status !== 'HEALTHY';
      const isSelected = activeStationDetail?.id === st.id;

      const markerHtml = `
        <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          ${isAnomaly || isSelected
          ? `<div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: ${color}; opacity: 0.45; animation: sg-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
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

      // Live Telemetry Tooltip
      marker.bindTooltip(
        `
        <div style="font-family: inherit; font-size: 11px; min-width: 170px; padding: 2px;">
          <div style="font-weight: 700; color: #ffffff; font-size: 12px;">${st.name}</div>
          <div style="color: #798281; font-size: 10px; margin-bottom: 4px;">ID: ${st.id} | Elev: ${st.elevation}m</div>
          <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
            <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: ${color};"></span>
            <span style="color: ${color}; font-weight: 600;">${st.status_label}</span>
          </div>
          <div style="background: rgba(16,67,54,0.35); border-radius: 4px; padding: 4px 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px;">
            <div>Temp: <b style="color: #ffffff;">${st.telemetry.temperature}°C</b></div>
            <div>RH: <b style="color: #ffffff;">${st.telemetry.relative_humidity}%</b></div>
            <div>Press: <b style="color: #ffffff;">${st.telemetry.atmospheric_pressure} hPa</b></div>
            <div>Dew: <b style="color: #ffffff;">${st.telemetry.dew_point}°C</b></div>
          </div>
          <div style="color: #0fff87; font-size: 9px; margin-top: 4px; font-style: italic; text-align: center;">Click to view full telemetry</div>
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

  // Station Click: Level 3 -> Level 4 (Station Telemetry Detail & Global Context Sync)
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

    // Sync with global dashboard context
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

    // Zoom into station location smoothly
    mapInstanceRef.current?.flyTo([detail.latitude, detail.longitude], 13.5, { duration: 1.0 });
  };

  // Breadcrumb Back Navigation
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

  // Reset to Complete India Map
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

  // Custom Zoom Handlers
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const filteredRegions = regions.filter((r) =>
    r.name.toLowerCase().includes(stateSearchQuery.toLowerCase()) ||
    r.code.toLowerCase().includes(stateSearchQuery.toLowerCase())
  );

  return (
    <div className="p-6 rounded-cards border border-sage-mist dark:border-sage-dark bg-sheetWhite dark:bg-sheetWhite-dark flex flex-col h-full transition-colors relative z-10 overflow-visible">
      {/* Card Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 relative z-50 overflow-visible">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-canopy/10 dark:bg-mint-pulse/10 text-canopy dark:text-mint-pulse">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-bark dark:text-bark-dark">
              Spatial Telemetry Network (India AWS Fleet)
            </h3>
            <p className="text-xs text-slate dark:text-slate-dark">
              Hierarchical GIS Explorer ·{' '}
              {navLevel === 'INDIA'
                ? 'National Fleet Overview (All 36 States & UTs)'
                : navLevel === 'REGION'
                  ? `${selectedRegion?.name} State Fleet (${districts.length} Districts)`
                  : `${selectedDistrict?.name} District Cluster (${districtStations.length} AWS Nodes)`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap relative z-50">
          {/* State / UT Selector Dropdown */}
          <div className="relative z-50" ref={stateSelectorRef}>
            <button
              onClick={() => {
                setShowStateSelector(!showStateSelector);
                setShowDistrictSelector(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-sage-mist dark:border-sage-dark bg-creamPaper dark:bg-field-dark text-bark dark:text-bark-dark hover:border-mint-pulse/60 transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-mint-pulse" />
              <span>{selectedRegion ? selectedRegion.name : 'Select State / UT'}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showStateSelector &&
              createPortal(
                <div
                  ref={stateDropdownMenuRef}
                  className="rounded-cards bg-sheetWhite dark:bg-[#0c1f1a] border border-sage-mist dark:border-sage-dark shadow-2xl flex flex-col overflow-hidden"
                  style={{
                    position: 'fixed',
                    top: `${stateDropdownPosition.top}px`,
                    left: `${stateDropdownPosition.left}px`,
                    width: `${stateDropdownPosition.width}px`,
                    height: '310px',
                    maxHeight: '310px',
                    zIndex: 2147483647,
                    boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(15, 255, 135, 0.2)',
                  }}
                >
                  {/* Search Header */}
                  <div className="p-3 border-b border-sage-mist/60 dark:border-sage-dark bg-sheetWhite dark:bg-[#0c1f1a] shrink-0">
                    <div className="relative flex items-center">
                      <Search className="w-4 h-4 text-slate dark:text-slate-dark absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search 36 States & UTs..."
                        value={stateSearchQuery}
                        onChange={(e) => setStateSearchQuery(e.target.value)}
                        autoFocus
                        className="w-full pl-9 pr-8 py-2 rounded-buttons bg-creamPaper dark:bg-field-dark border border-sage-mist/80 dark:border-sage-dark text-xs text-bark dark:text-white placeholder:text-slate/70 dark:placeholder:text-slate-dark focus:outline-none focus:border-mint-pulse"
                      />
                      {stateSearchQuery ? (
                        <button
                          onClick={() => setStateSearchQuery('')}
                          title="Clear search"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate dark:text-slate-dark hover:text-bark dark:hover:text-white cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowStateSelector(false)}
                          title="Close dropdown"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate dark:text-slate-dark hover:text-bark dark:hover:text-white cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* State list with internal scroll - exactly 4 items visible at a time */}
                  <div
                    className="p-2 skyguard-dropdown-scroll space-y-1"
                    style={{
                      height: '204px',
                      maxHeight: '204px',
                      overflowY: 'auto',
                      overflowX: 'hidden',
                    }}
                  >
                    {filteredRegions.length > 0 ? (
                      filteredRegions.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            drillDownToRegion(r.id, r.name, r);
                            setShowStateSelector(false);
                          }}
                          className={`w-full h-[46px] shrink-0 text-left px-3 py-1.5 rounded-buttons flex items-center justify-between text-xs transition-colors cursor-pointer ${
                            selectedRegion?.id === r.id
                              ? 'bg-canopy/15 dark:bg-mint-pulse/20 text-canopy dark:text-mint-pulse font-bold'
                              : 'hover:bg-creamPaper dark:hover:bg-field-dark text-bark dark:text-bark-dark'
                          }`}
                          style={{ height: '46px' }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <span className="font-mono text-[10px] font-semibold text-slate dark:text-slate-dark uppercase px-1.5 py-0.5 rounded bg-creamPaper dark:bg-canopy-dark/60 border border-sage-mist/40 dark:border-sage-dark shrink-0">
                              {r.code}
                            </span>
                            <span className="truncate">{r.name}</span>
                          </div>
                          <span className="text-[11px] font-medium text-slate dark:text-slate-dark shrink-0">
                            {r.station_count} AWS
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs text-slate dark:text-slate-dark">
                        No matching State or UT found
                      </div>
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  <div className="px-3 py-2 bg-creamPaper/50 dark:bg-canopy-dark/30 border-t border-sage-mist/40 dark:border-sage-dark text-[10px] text-slate dark:text-slate-dark flex items-center justify-between shrink-0">
                    <span>{filteredRegions.length} of {regions.length} States &amp; UTs</span>
                    <button
                      onClick={() => setShowStateSelector(false)}
                      className="text-[10px] text-canopy dark:text-mint-pulse hover:underline font-medium cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>,
                document.body
              )}
          </div>

          {/* Reset to India Button */}
          {navLevel !== 'INDIA' && (
            <button
              onClick={resetToIndia}
              title="Reset view to National India Map"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-sage-mist dark:border-sage-dark bg-creamPaper dark:bg-field-dark text-bark dark:text-bark-dark hover:bg-sage-pale/40 dark:hover:bg-canopy-dark/40 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-canopy dark:text-mint-pulse" />
              <span>Reset</span>
            </button>
          )}

          {/* Live Indicator */}
          <button
            onClick={() => setIsLive(!isLive)}
            title="Toggle Live Polling"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-sage-mist dark:border-sage-dark bg-creamPaper dark:bg-field-dark text-bark dark:text-bark-dark cursor-pointer hover:bg-sage-pale/40 dark:hover:bg-canopy-dark/40 transition-colors"
          >
            <span
              className={`w-2 h-2 rounded-full ${isLive
                ? 'bg-mint-pulse animate-pulse shadow-[0_0_8px_rgba(15,255,135,0.6)]'
                : 'bg-slate/40'
                }`}
            />
            <span>{isLive ? 'Live' : 'Paused'}</span>
          </button>

          {/* Telemetry Refresh */}
          <button
            onClick={() => {
              refreshAll();
              if (selectedDistrict) {
                mapApi.getDistrictStations(selectedDistrict.id).then(setDistrictStations);
              }
            }}
            title="Force Telemetry Sync"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate dark:text-slate-dark border border-sage-mist dark:border-sage-dark bg-creamPaper dark:bg-field-dark hover:bg-sage-pale/40 dark:hover:bg-canopy-dark/40 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-canopy dark:text-mint-pulse" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Breadcrumb Navigation Bar & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-3 py-2 rounded-lg bg-creamPaper/70 dark:bg-[#071512] border border-sage-mist/40 dark:border-sage-dark/60 text-xs">
        {/* Breadcrumb Items */}
        <div className="flex items-center gap-1 text-slate dark:text-slate-dark flex-wrap">
          {navLevel !== 'INDIA' && (
            <button
              onClick={handleNavigateBack}
              className="mr-2 flex items-center gap-1 font-semibold text-canopy dark:text-mint-pulse hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.level + crumb.label}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-slate/50 dark:text-slate-dark/50" />}
                <button
                  onClick={() => {
                    if (crumb.level === 'INDIA') resetToIndia();
                    else if (crumb.level === 'REGION' && selectedRegion) {
                      setActiveStationDetail(null);
                      setSelectedDistrict(null);
                      setNavLevel('REGION');
                      const cachedGeoJson = cachedRegionGeoJsonRef.current[selectedRegion.id];
                      renderRegionLevel(selectedRegion, districts, regionStations, cachedGeoJson);
                    } else if (crumb.level === 'DISTRICT' && selectedDistrict) {
                      setActiveStationDetail(null);
                      setNavLevel('DISTRICT');
                    }
                  }}
                  className={`font-medium transition-colors ${isLast
                    ? 'text-bark dark:text-mint-pulse font-bold'
                    : 'text-slate dark:text-slate-dark hover:text-canopy dark:hover:text-white cursor-pointer'
                    }`}
                >
                  {crumb.label}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Quick District Switcher (in Region view) */}
        {navLevel === 'REGION' && districts.length > 0 && (
          <div className="relative">
            <button
              onClick={() => {
                setShowDistrictSelector(!showDistrictSelector);
                setShowStateSelector(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-sheetWhite dark:bg-field-dark border border-sage-mist dark:border-sage-dark text-bark dark:text-bark-dark text-[11px] font-semibold hover:border-mint-pulse/60 transition-colors cursor-pointer"
            >
              <Compass className="w-3 h-3 text-mint-pulse" />
              <span>Select District ({districts.length})</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showDistrictSelector && (
              <div className="absolute right-0 top-full mt-1 w-56 max-h-60 overflow-y-auto rounded-lg bg-sheetWhite dark:bg-[#0c1e19] border border-sage-mist dark:border-sage-dark shadow-2xl z-50 p-1.5 text-xs">
                <div className="px-2 py-1 text-[10px] font-bold text-slate dark:text-slate-dark uppercase tracking-wider">
                  {selectedRegion?.name} Districts
                </div>
                {districts.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setShowDistrictSelector(false);
                      drillDownToDistrict(d);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-canopy/10 dark:hover:bg-mint-pulse/10 text-bark dark:text-bark-dark flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>{d.name}</span>
                    <span className="text-[10px] text-slate dark:text-slate-dark">
                      {d.station_count} AWS
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* District Metrics Summary Pill */}
        {selectedDistrict && (
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-canopy/10 dark:bg-mint-pulse/10 text-canopy dark:text-mint-pulse font-bold">
              {selectedDistrict.station_count} Stations
            </span>
            <span className="text-emerald-500 font-semibold">{selectedDistrict.healthy} Healthy</span>
            {selectedDistrict.anomalies > 0 && (
              <span className="text-amber-500 font-semibold">{selectedDistrict.anomalies} Anomalies</span>
            )}
            {selectedDistrict.faults > 0 && (
              <span className="text-red-500 font-semibold">{selectedDistrict.faults} Faults</span>
            )}
          </div>
        )}
      </div>

      {/* Main Map Container */}
      <div className="relative w-full flex-1 min-h-[460px] lg:min-h-[520px] rounded-cards overflow-hidden border border-sage-mist/70 dark:border-sage-dark bg-[#081310] select-none">
        {/* Leaflet Map Div */}
        <div ref={mapContainerRef} className="w-full h-full min-h-[460px] lg:min-h-[520px]" />

        {/* Custom Zoom Controls */}
        <div className="absolute top-4 right-4 z-[400] flex flex-col gap-1">
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="w-8 h-8 rounded-lg bg-[#0e241e]/90 hover:bg-[#15382f] border border-sage-mist/40 dark:border-sage-dark text-white flex items-center justify-center shadow-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="w-8 h-8 rounded-lg bg-[#0e241e]/90 hover:bg-[#15382f] border border-sage-mist/40 dark:border-sage-dark text-white flex items-center justify-center shadow-lg transition-colors cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={resetToIndia}
            title="Fit to India"
            className="w-8 h-8 rounded-lg bg-[#0e241e]/90 hover:bg-[#15382f] border border-sage-mist/40 dark:border-sage-dark text-mint-pulse flex items-center justify-center shadow-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Loading Radar Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-[#081310]/75 backdrop-blur-[2px] z-[500] flex flex-col items-center justify-center gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-mint-pulse/20 animate-ping" />
              <div className="w-8 h-8 rounded-full border-2 border-t-mint-pulse border-r-transparent border-b-canopy border-l-transparent animate-spin" />
              <Radio className="w-4 h-4 text-mint-pulse animate-pulse" />
            </div>
            <span className="text-xs font-semibold text-mint-pulse tracking-wide">
              Loading geospatial boundary stream...
            </span>
          </div>
        )}

        {/* Error State Banner with Retry */}
        {apiError && (
          <div className="absolute top-4 left-4 right-16 z-[500] p-3 rounded-lg bg-red-950/90 border border-red-500/50 text-red-200 text-xs flex items-center justify-between shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{apiError}</span>
            </div>
            <button
              onClick={loadInitialData}
              className="px-3 py-1 rounded bg-red-800 hover:bg-red-700 text-white font-semibold text-[11px] transition-colors cursor-pointer shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Station Telemetry Flyout Drawer (when a station is selected) */}
        {activeStationDetail && (
          <div className="absolute top-4 left-4 z-[450] w-84 max-w-[calc(100%-2rem)] rounded-xl bg-[#091a15]/95 border border-mint-pulse/40 p-4 shadow-2xl backdrop-blur-md text-white text-xs animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="flex items-start justify-between gap-2 pb-2 mb-3 border-b border-sage-dark/60">
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: getStatusColor(activeStationDetail.status) }}
                  />
                  <h4 className="font-bold text-sm text-white">{activeStationDetail.name}</h4>
                </div>
                <div className="text-[11px] text-slate-dark font-mono">
                  {activeStationDetail.id} · {activeStationDetail.wsi}
                </div>
              </div>
              <button
                onClick={() => setActiveStationDetail(null)}
                className="p-1 rounded hover:bg-white/10 text-slate-dark hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Geographical & Status Badges */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `${getStatusColor(activeStationDetail.status)}20`,
                  color: getStatusColor(activeStationDetail.status),
                  border: `1px solid ${getStatusColor(activeStationDetail.status)}40`,
                }}
              >
                {activeStationDetail.status_label}
              </span>
              <span className="text-[11px] text-slate-dark">
                {activeStationDetail.district_name}, {activeStationDetail.region_name}
              </span>
              <span className="text-[11px] text-slate-dark">· Elev: {activeStationDetail.elevation}m</span>
            </div>

            {/* Real-time Telemetry Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3 bg-[#0e251e]/80 p-2.5 rounded-lg border border-sage-dark/40">
              <div className="flex items-center gap-2">
                <Thermometer className="w-3.5 h-3.5 text-mint-pulse" />
                <div>
                  <div className="text-[10px] text-slate-dark">Temperature</div>
                  <div className="font-bold text-white text-xs">
                    {activeStationDetail.telemetry.temperature}°C
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
                <div>
                  <div className="text-[10px] text-slate-dark">Rel. Humidity</div>
                  <div className="font-bold text-white text-xs">
                    {activeStationDetail.telemetry.relative_humidity}%
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                <div>
                  <div className="text-[10px] text-slate-dark">Pressure</div>
                  <div className="font-bold text-white text-xs">
                    {activeStationDetail.telemetry.atmospheric_pressure} hPa
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Wind className="w-3.5 h-3.5 text-emerald-400" />
                <div>
                  <div className="text-[10px] text-slate-dark">Wind / Gust</div>
                  <div className="font-bold text-white text-xs">
                    {activeStationDetail.telemetry.wind_speed} m/s ({activeStationDetail.telemetry.wind_direction})
                  </div>
                </div>
              </div>
            </div>

            {/* Anomaly Attribution if present */}
            {activeStationDetail.anomaly_attribution && (
              <div className="mb-3 p-2 rounded bg-amber-950/40 border border-amber-500/40 text-amber-200 text-[11px]">
                <div className="font-semibold mb-0.5 flex items-center gap-1 text-amber-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Attribution: {activeStationDetail.anomaly_attribution}</span>
                </div>
                {activeStationDetail.evidence_chain && activeStationDetail.evidence_chain.length > 0 && (
                  <ul className="list-disc list-inside text-[10px] text-amber-300/80 mt-1 space-y-0.5">
                    {activeStationDetail.evidence_chain.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Sensor Health Status */}
            <div className="border-t border-sage-dark/40 pt-2">
              <div className="text-[10px] font-bold text-slate-dark uppercase mb-1.5">Sensor Array Health</div>
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                {Object.entries(activeStationDetail.sensor_health).map(([sensor, health]) => (
                  <div key={sensor} className="flex items-center justify-between pr-1">
                    <span className="text-slate-dark capitalize">{sensor.replace('_', ' ')}:</span>
                    <span
                      className={`font-semibold ${health === 'NOMINAL'
                        ? 'text-emerald-400'
                        : health.includes('FAULT') || health.includes('BREACH')
                          ? 'text-red-400'
                          : 'text-amber-400'
                        }`}
                    >
                      {health}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};