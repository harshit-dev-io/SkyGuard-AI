from datetime import datetime, timezone
import json
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import desc, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from app.config.database import get_db_session
from .consumer import pipeline_worker
from app.ingestion_pipeline.models import (
    DeadLetterObservationModel,
    RawObservationModel
)
from .legacy_adapter import LegacyMeteorologicalAdapter
from .redis_client import redis_buffer
from .schemas import (
    DataSource,
    DeadLetterRecordResponse,
    EdgeTelemetryPayload,
    IngestionConfirmation,
    LegacyRawDataRequest,
)

router = APIRouter(prefix="/ingest", tags=["Ingestion Substrate"])

@router.post(
    "/observation",
    response_model=IngestionConfirmation,
    status_code=status.HTTP_201_CREATED,
    summary="HTTP Fallback Single Telemetry Ingestion",
)
async def ingest_single_observation(
    payload: EdgeTelemetryPayload,
    request: Request,
):
    """
    Fallback HTTP entrypoint when edge cannot reach MQTT/EMQX broker.
    Applies identical validation, dedup, and TimescaleDB raw persistence.
    """
    source_ip = request.client.host if request.client else "127.0.0.1"
    raw_bytes = payload.model_dump_json().encode("utf-8")

    obs_id = await pipeline_worker.process_raw_message(
        message_bytes=raw_bytes,
        source_ip=source_ip,
        data_source=DataSource.HTTP_FALLBACK,
    )

    if not obs_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Duplicate telemetry observation rejected by deduplication filter.",
        )

    return IngestionConfirmation(
        status="persisted_raw",
        observation_id=obs_id,
        station_id=payload.station_id,
        sequence=payload.sequence,
        data_source=DataSource.HTTP_FALLBACK,
        clock_suspect=False,
        late_arrival=False,
        buffered_in_dejitter=True,
    )


@router.post(
    "/batch",
    response_model=List[IngestionConfirmation],
    status_code=status.HTTP_201_CREATED,
    summary="Batch Replay / Edge Outage Buffer Ingestion",
)
async def ingest_batch_observations(
    payloads: List[EdgeTelemetryPayload],
    request: Request,
):
    """
    Processes RAM-buffered batches delivered after edge backhaul restoration.
    """
    source_ip = request.client.host if request.client else "127.0.0.1"
    results: List[IngestionConfirmation] = []

    for item in payloads:
        raw_bytes = item.model_dump_json().encode("utf-8")
        obs_id = await pipeline_worker.process_raw_message(
            message_bytes=raw_bytes,
            source_ip=source_ip,
            data_source=DataSource.HTTP_FALLBACK,
        )
        if obs_id:
            results.append(
                IngestionConfirmation(
                    status="persisted_raw",
                    observation_id=obs_id,
                    station_id=item.station_id,
                    sequence=item.sequence,
                    data_source=DataSource.HTTP_FALLBACK,
                    clock_suspect=False,
                    late_arrival=True,  # Backlog items default to late arrival
                    buffered_in_dejitter=True,
                )
            )

    return results


@router.post(
    "/legacy",
    response_model=IngestionConfirmation,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest Legacy Station Stream (ASCII/SYNOP)",
)
async def ingest_legacy_feed(
    request_data: LegacyRawDataRequest,
    request: Request,
):
    source_ip = request.client.host if request.client else "127.0.0.1"

    try:
        normalized = LegacyMeteorologicalAdapter.parse(
            raw_record=request_data.raw_record,
            data_format=request_data.data_format,
            station_id_override=request_data.station_id,
            recorded_at_override=request_data.recorded_at,
        )
    except Exception as parse_err:
        await pipeline_worker.quarantine_dead_letter(
            raw_payload=request_data.raw_record,
            error_reason=f"Legacy Parser Failure: {parse_err}",
            source_ip=source_ip,
        )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unable to parse legacy stream: {parse_err}",
        )

    raw_bytes = normalized.model_dump_json().encode("utf-8")
    obs_id = await pipeline_worker.process_raw_message(
        message_bytes=raw_bytes,
        source_ip=source_ip,
        data_source=DataSource.LEGACY_ADAPTER,
    )

    if not obs_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Duplicate record generated from legacy feed; skipped.",
        )

    return IngestionConfirmation(
        status="persisted_raw",
        observation_id=obs_id,
        station_id=normalized.station_id,
        sequence=normalized.sequence,
        data_source=DataSource.LEGACY_ADAPTER,
        clock_suspect=False,
        late_arrival=False,
        buffered_in_dejitter=True,
    )


@router.get("/health", summary="Pipeline Health & Connectivity Probe")
async def health_check():
    """Liveness probe reporting Redis ping status and Kafka daemon state."""
    redis_healthy = False
    try:
        if redis_buffer.client:
            redis_healthy = bool(await redis_buffer.client.ping())
    except Exception:
        redis_healthy = False

    return {
        "status": "healthy" if redis_healthy else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "kafka_consumer_running": pipeline_worker.is_running,
        "redis_connected": redis_healthy,
        "buffer_window_seconds": settings.DEJITTER_WINDOW_SECONDS,
    }


@router.get(
    "/deadletter",
    response_model=List[DeadLetterRecordResponse],
    summary="Inspect Quarantined Dead-Letter Records",
)
async def list_dead_letters(
    replayed: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db_session),
):
    query = select(DeadLetterObservationModel)
    if replayed is not None:
        query = query.where(DeadLetterObservationModel.replayed == replayed)
    query = query.order_by(desc(DeadLetterObservationModel.quarantined_at)).limit(limit).offset(offset)

    result = await db.execute(query)
    return result.scalars().all()


@router.post(
    "/deadletter/{dlq_id}/replay",
    response_model=IngestionConfirmation,
    summary="Replay Quarantined DLQ Record",
)
async def replay_dead_letter(
    dlq_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
):
    stmt = select(DeadLetterObservationModel).where(DeadLetterObservationModel.id == dlq_id)
    res = await db.execute(stmt)
    dlq_record = res.scalar_one_or_none()

    if not dlq_record:
        raise HTTPException(status_code=404, detail="Quarantined message not found.")
    if dlq_record.replayed:
        raise HTTPException(status_code=400, detail="Message already marked as replayed.")

    raw_bytes = dlq_record.raw_payload.encode("utf-8")
    obs_id = await pipeline_worker.process_raw_message(
        message_bytes=raw_bytes,
        source_ip=dlq_record.source_ip or "REPLAY_DISPATCHER",
        data_source=DataSource.HTTP_FALLBACK,
    )

    if not obs_id:
        raise HTTPException(
            status_code=422,
            detail="Payload still fails validation or is already present in dedup index.",
        )

    # Flag record as resolved
    await db.execute(

        data_source=DataSource.HTTP_FALLBACK,
        clock_suspect=False,
        late_arrival=True,
        buffered_in_dejitter=False,
    )