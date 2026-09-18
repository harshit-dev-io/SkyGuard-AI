import asyncio
import logging
from typing import List, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import get_db_session  # Uses backend async session generator
from .mqtt_client import EdgeTransportClient
from .schemas import (
    InjectEventRequest,
    InjectFaultRequest,
    SimulationConfig,
    StationCreate,
    StationRegistrationResult,
    StationResponse,
    StationUpdate,
)
from .models import StaticTopologyModel
from .services import EdgeStationService
from .simulator import VirtualStationInstance, simulator_fleet
from sqlalchemy import select

logger = logging.getLogger("skyguard.edge.router")
router = APIRouter(prefix="/edge", tags=["Edge Station Simulator"])

# Global transport reference for simulator runner
transport_client: Optional[EdgeTransportClient] = None
simulation_active = False
simulation_task: Optional[asyncio.Task] = None


@router.post(
    "/stations",
    response_model=StationRegistrationResult,
    status_code=status.HTTP_201_CREATED,
    summary="Register AWS Station & Provision Credentials",
)
async def register_station(
    payload: StationCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_session),
):
    existing = await EdgeStationService.get_station(db, payload.station_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Station with ID '{payload.station_id}' already registered[cite: 1].",
        )

    result = await EdgeStationService.create_station(db, payload)
    # Trigger background topology rebuild
    background_tasks.add_task(EdgeStationService.trigger_topology_rebuild, payload.station_id)
    return result


@router.get("/stations", response_model=List[StationResponse], summary="List Fleet Stations")
async def list_stations(
    climate_region: Optional[str] = Query(None),
    terrain: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(True),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db_session),
):
    return await EdgeStationService.list_stations(
        db,
        climate_region=climate_region,
        terrain=terrain,
        is_active=is_active,
        limit=limit,
        offset=offset,
    )


@router.get("/stations/{station_id}", response_model=StationResponse, summary="Get Station Details")
async def get_station(station_id: str, db: AsyncSession = Depends(get_db_session)):
    station = await EdgeStationService.get_station(db, station_id)
    if not station:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found.")
    return station


@router.patch("/stations/{station_id}", response_model=StationResponse, summary="Update Station Metadata")
async def update_station(
    station_id: str,
    payload: StationUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_session),
):
    updated = await EdgeStationService.update_station(db, station_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found.")

    if payload.latitude is not None or payload.longitude is not None:
        background_tasks.add_task(EdgeStationService.trigger_topology_rebuild, station_id)

    return updated


@router.delete("/stations/{station_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Decommission Station")
async def decommission_station(station_id: str, db: AsyncSession = Depends(get_db_session)):
    success = await EdgeStationService.soft_delete(db, station_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found.")
    return None


# --- SIMULATION CONTROL ENDPOINTS ---

async def _simulator_orchestration_loop(config: SimulationConfig):
    global simulation_active, transport_client
    logger.info(f"Simulator fleet engine started with {len(simulator_fleet.stations)} virtual nodes.")

    try:
        while simulation_active:
            tasks = []
            for station_id, station in list(simulator_fleet.stations.items()):
                payloads, publish_immediately = station.tick()
                if payloads and transport_client:
                    tasks.append(
                        transport_client.publish_payloads(
                            station_id=station_id,
                            payloads=payloads,
                            immediate=publish_immediately,
                        )
                    )

            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)

            await asyncio.sleep(config.sample_interval_seconds)
    except asyncio.CancelledError:
        logger.info("Simulator execution loop cancelled gracefully.")
    finally:
        if transport_client:
            await transport_client.close()
            transport_client = None


@router.post("/simulator/start", summary="Start Virtual Station Fleet Simulation")
async def start_simulation(
    config: SimulationConfig,
    db: AsyncSession = Depends(get_db_session),
):
    global simulation_active, simulation_task, transport_client

    if simulation_active:
        return {"status": "already_running", "node_count": len(simulator_fleet.stations)}

    # Ensure all active DB stations are loaded into fleet manager
    active_stations = await EdgeStationService.list_stations(db, is_active=True, limit=500)
    for s in active_stations:
        if s.station_id not in simulator_fleet.stations:
            simulator_fleet.register_station_instance(
                VirtualStationInstance(
                    station_id=s.station_id,
                    climate_region=s.climate_region,
                    elevation=s.elevation,
                    firmware_version=s.firmware_version,
                )
            )

    transport_client = EdgeTransportClient(config)
    await transport_client.initialize()

    simulation_active = True
    simulation_task = asyncio.create_task(_simulator_orchestration_loop(config))

    return {
        "status": "started",
        "active_nodes": len(simulator_fleet.stations),
        "tick_rate_seconds": config.sample_interval_seconds,
        "broker": f"{config.broker_host}:{config.broker_port}",
    }


@router.post("/simulator/stop", summary="Stop Virtual Fleet Simulation")
async def stop_simulation():
    global simulation_active, simulation_task
    if not simulation_active:
        return {"status": "not_running"}

    simulation_active = False
    if simulation_task:
        simulation_task.cancel()
        simulation_task = None

    return {"status": "stopped"}


@router.post("/simulator/{station_id}/inject-fault", summary="Inject Synthetic Fault")
async def inject_fault(station_id: str, request: InjectFaultRequest):
    station = simulator_fleet.get_station(station_id)
    if not station:
        raise HTTPException(
            status_code=404,
            detail=f"Station '{station_id}' is not loaded in the active simulation.",
        )

    station.inject_fault(request)
    return {
        "status": "fault_injected",
        "station_id": station_id,
        "fault_type": request.fault_type.value,
        "target_channel": request.target_channel,
        "duration_ticks": request.duration_ticks,
    }


@router.post("/simulator/{station_id}/inject-event", summary="Inject Real Local Extreme Event")
async def inject_event(station_id: str, request: InjectEventRequest):
    station = simulator_fleet.get_station(station_id)
    if not station:
        raise HTTPException(
            status_code=404,
            detail=f"Station '{station_id}' is not loaded in the active simulation.",
        )

    station.inject_event(request)
    return {
        "status": "event_injected",
        "station_id": station_id,
        "pressure_drop": request.pressure_drop_rate,
        "gust_speed": request.gust_speed,
        "duration_ticks": request.duration_ticks,
    }


@router.get("/stations/{station_id}/neighbors", summary="Get Precomputed Static Topology Candidates")
async def get_station_neighbors(station_id: str, db: AsyncSession = Depends(get_db_session)):
    stmt = (
        select(StaticTopologyModel)
        .where(StaticTopologyModel.station_id == station_id)
        .order_by(StaticTopologyModel.rank)
    )
    result = await db.execute(stmt)
    records = result.scalars().all()
    return [
        {
            "neighbor_id": r.neighbor_id,
            "distance_km": round(r.distance_m / 1000.0, 2),
            "elevation_delta_m": r.elevation_delta_m,
            "terrain_similarity": r.terrain_similarity,
            "rank": r.rank,
        }
        for r in records
    ]