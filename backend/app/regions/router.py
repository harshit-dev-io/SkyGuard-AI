import json
import os
import math
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Path
from fastapi.responses import JSONResponse
from .schemas import RegionSummary, DistrictSummary, StationDetail, StationTelemetry
from .data import (
    INDIAN_REGIONS,
    AMBALA_STATIONS,
    normalize_region_id,
    get_districts_for_region,
    generate_stations_for_district,
)

router = APIRouter(tags=["Hierarchical Regions & Telemetry"])

GEOJSON_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "geojson")

@router.get("/regions", response_model=List[RegionSummary], summary="Get All 36 Indian States and UTs")
async def get_regions():
    return [RegionSummary(**r) for r in INDIAN_REGIONS]

@router.get("/regions/{region_id}/districts", response_model=List[DistrictSummary], summary="Get Real Districts for Any Indian State/UT")
async def get_region_districts(region_id: str = Path(..., description="Region ID slug or name")):
    districts = get_districts_for_region(region_id)
    if not districts:
        clean_id = normalize_region_id(region_id)
        parent = next((r for r in INDIAN_REGIONS if r["id"] == clean_id or normalize_region_id(r["name"]) == clean_id), None)
        if not parent:
            raise HTTPException(status_code=404, detail=f"Region '{region_id}' not found.")
        # Fallback if no specific district array is defined yet
        lat, lng = parent["center"]
        districts = [
            {
                "id": f"{parent['id']}_capital_dist",
                "name": f"{parent['capital']} Met",
                "region_id": parent["id"],
                "region_name": parent["name"],
                "center": [lat, lng],
                "bounds": [[lat - 0.2, lng - 0.2], [lat + 0.2, lng + 0.2]],
                "station_count": 14,
                "healthy": 12,
                "anomalies": 1,
                "faults": 1,
                "drift": 0,
                "unknown": 0,
                "elevation": 250,
            }
        ]
    return [DistrictSummary(**d) for d in districts]

@router.get("/regions/{region_id}/stations", response_model=List[StationDetail], summary="Get All AWS Stations in Any State")
async def get_region_stations(region_id: str = Path(..., description="Region ID slug or name")):
    districts = get_districts_for_region(region_id)
    clean_id = normalize_region_id(region_id)
    parent = next((r for r in INDIAN_REGIONS if r["id"] == clean_id or normalize_region_id(r["name"]) == clean_id), None)
    state_code = parent["code"] if parent else "IN"

    all_stations = []
    for dist in districts:
        st_list = generate_stations_for_district(dist, state_code=state_code)
        all_stations.extend(st_list)

    return [StationDetail(**s) for s in all_stations]

@router.get("/districts/{district_id}/stations", response_model=List[StationDetail], summary="Get AWS Stations for Any District in India")
async def get_district_stations(district_id: str = Path(..., description="District slug or name")):
    dist_clean = normalize_region_id(district_id)
    if dist_clean == "ambala":
        return [StationDetail(**s) for s in AMBALA_STATIONS]

    # Search for this district across all states
    for region in INDIAN_REGIONS:
        districts = get_districts_for_region(region["id"])
        matched = next((d for d in districts if d["id"] == dist_clean or normalize_region_id(d["name"]) == dist_clean), None)
        if matched:
            st_list = generate_stations_for_district(matched, state_code=region["code"])
            return [StationDetail(**s) for s in st_list]

    raise HTTPException(status_code=404, detail=f"District '{district_id}' not found.")

@router.get("/stations/{station_id}/telemetry", response_model=StationDetail, summary="Get Station Telemetry & Sensor Health")
async def get_station_telemetry(station_id: str = Path(..., description="Station ID, e.g. AWS-HR-AMB-01")):
    st_clean = station_id.upper()
    # Check Ambala stations first
    matched = next((s for s in AMBALA_STATIONS if s["id"].upper() == st_clean), None)
    if matched:
        return StationDetail(**matched)

    # Search across all generated stations in all regions
    for region in INDIAN_REGIONS:
        districts = get_districts_for_region(region["id"])
        for dist in districts:
            st_list = generate_stations_for_district(dist, state_code=region["code"])
            matched_st = next((s for s in st_list if s["id"].upper() == st_clean), None)
            if matched_st:
                return StationDetail(**matched_st)

    # Generic fallback node
    return StationDetail(
        id=station_id,
        name=f"AWS Station {station_id}",
        district_id="ambala",
        district_name="Ambala",
        region_id="haryana",
        region_name="Haryana",
        latitude=30.3782,
        longitude=76.7767,
        elevation=264,
        status="HEALTHY",
        status_label="Healthy",
        wsi=f"0-356-0-{station_id.replace('-', '')[:8]}",
        firmware_version="v2.4.1-sg",
        telemetry=StationTelemetry(
            temperature=28.5,
            relative_humidity=64.0,
            atmospheric_pressure=1008.5,
            dew_point=20.8,
            wind_speed=3.1,
            wind_direction="NW",
            rainfall_rate=0.0,
            solar_radiation=740.0,
            timestamp="2026-09-24T09:30:00Z",
        ),
        sensor_health={
            "temperature_sensor": "NOMINAL",
            "humidity_sensor": "NOMINAL",
            "barometer": "NOMINAL",
            "anemometer": "NOMINAL",
            "rain_gauge": "NOMINAL",
        },
        confidence=0.98,
    )

@router.get("/regions/india/geojson", summary="Get India States GeoJSON")
async def get_india_geojson():
    filepath = os.path.join(GEOJSON_DIR, "india.json")
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="India GeoJSON not found.")
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    return JSONResponse(content=data)


@router.get("/regions/{region_id}/geojson", summary="Get GeoJSON for State/Region Districts")
async def get_region_geojson(region_id: str):
    clean = normalize_region_id(region_id)
    # Check if a static file exists on disk
    for ext in [".json", ".geojson"]:
        filepath = os.path.join(GEOJSON_DIR, f"{clean}{ext}")
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
            return JSONResponse(content=data)

    # If no static file, synthesize GeoJSON features from the state's district registry
    districts = get_districts_for_region(clean)
    if not districts:
        raise HTTPException(status_code=404, detail=f"GeoJSON for '{region_id}' not found.")

    features = []
    for d in districts:
        lat, lng = d["center"]
        radius_lat = 0.16
        radius_lng = 0.16
        # Generate an 8-sided polygon representing the district boundary
        polygon_coords = []
        for i in range(8):
            angle = i * (2 * math.pi / 8)
            p_lat = round(lat + radius_lat * math.sin(angle), 5)
            p_lng = round(lng + radius_lng * math.cos(angle), 5)
            polygon_coords.append([p_lng, p_lat])
        polygon_coords.append(polygon_coords[0]) # close loop

        features.append({
            "type": "Feature",
            "properties": {
                "district": d["name"],
                "name": d["name"],
                "id": d["id"],
                "region_id": d["region_id"],
                "region_name": d["region_name"],
                "station_count": d["station_count"],
                "healthy": d["healthy"],
                "anomalies": d["anomalies"],
                "faults": d["faults"],
                "elevation": d["elevation"],
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [polygon_coords],
            },
        })

    geojson_data = {
        "type": "FeatureCollection",
        "features": features,
    }
    return JSONResponse(content=geojson_data)
