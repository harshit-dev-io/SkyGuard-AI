import os
import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Path, Response, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db_session
from app.wis2_adapter.bufr_encoder import WMOBUFR4Encoder
from app.wis2_adapter.models import (
    WIS2DisseminationLogModel,
    WIS2PendingBufferModel,
    WIS2WSIMappingModel,
)
from app.wis2_adapter.schemas import WSIMappingRequest, WSIMappingResponse
from app.wis2_adapter.storage import CanonicalBUFRStorage
from app.wis2_adapter.wnm_publisher import WIS2NotificationPublisher
from app.wis2_adapter.wsi_registry import WSIRegistryGate

router = APIRouter(prefix="/wis2", tags=["WIS2 / WMO Dissemination Subsystem"])


@router.post("/wsi/register", response_model=WSIMappingResponse, status_code=status.HTTP_201_CREATED)
async def register_wsi_mapping(
    payload: WSIMappingRequest,
    db: AsyncSession = Depends(get_db_session),
):
    mapping = await WSIRegistryGate.register_wsi(db, payload.station_id, payload.wsi)
    if not mapping:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid WIGOS Station Identifier format.",
        )
    return mapping


@router.get("/wsi/{station_id}", response_model=WSIMappingResponse)
async def get_wsi_mapping(
    station_id: str,
    db: AsyncSession = Depends(get_db_session),
):
    mapping = await WSIRegistryGate.get_wsi_for_station(db, station_id)
    if not mapping:
        raise HTTPException(status_code=404, detail=f"No WSI mapping found for station '{station_id}'.")
    return mapping


@router.get("/pending", summary="List Observations Pending Dissemination Quarantine")
async def list_pending_buffer(
    limit: int = 50,
    db: AsyncSession = Depends(get_db_session),
):
    stmt = select(WIS2PendingBufferModel).order_by(WIS2PendingBufferModel.created_at.desc()).limit(limit)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.get("/data/{object_id}", summary="Canonical BUFR Object Fetch Endpoint")
async def download_bufr_object(object_id: str = Path(..., description="Canonical BUFR Object Identifier")):
    filepath = CanonicalBUFRStorage.get_object_path(object_id)
    if not filepath or not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail=f"Requested BUFR object '{object_id}' not found.")

    return FileResponse(
        path=filepath,
        media_type="application/x-bufr",
        filename=f"{object_id}.bufr",
    )
