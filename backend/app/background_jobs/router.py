from datetime import datetime
from typing import Any, Dict, Optional
from celery.result import AsyncResult
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from .celery_app import celery_app
from .load_shedder import KafkaLagProbe, TaskThrottleCoordinator

router = APIRouter(prefix="/maintenance", tags=["Background Maintenance Jobs"])


class HistoricalRewindRequest(BaseModel):
    station_id: str = Field(..., min_length=2, max_length=32)
    start_time: datetime
    end_time: datetime
    bias_offset: float = Field(0.0, description="Temperature offset to subtract from historical observations")
    reason: str = Field("Manual retrospective audit", min_length=3, max_length=255)
    operator_id: Optional[str] = Field(None, max_length=64)


@router.post("/topology/rebuild", status_code=status.HTTP_202_ACCEPTED)
async def trigger_topology_rebuild():
    """Manually dispatch static spatial graph re-indexing (PostGIS / H3 / KD-Tree)."""
    task = celery_app.send_task("app.background_jobs.topology_worker.rebuild_static_topology_graph")
    return {
        "message": "Topology rebuild job dispatched successfully",
        "task_id": task.id,
        "status": "QUEUED",
    }


@router.post("/qc/rewind", status_code=status.HTTP_202_ACCEPTED)
async def trigger_qc_rewind(payload: HistoricalRewindRequest):
    """
    Dispatch bounded historical QC rewind & continuous de-biasing runner.
    Guarantees raw observation store immutability; revisions write to 'qc_revisions'.
    """
    if payload.end_time <= payload.start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_time must be strictly greater than start_time.",
        )

    task = celery_app.send_task(
        "app.background_jobs.historical_rewind.execute_historical_qc_rewind",
        kwargs={
            "station_id": payload.station_id,
            "start_time_iso": payload.start_time.isoformat(),
            "end_time_iso": payload.end_time.isoformat(),
            "bias_offset": payload.bias_offset,
            "reason": payload.reason,
            "operator_id": payload.operator_id,
        },
    )
    return {
        "message": "Historical QC rewind job dispatched",
        "task_id": task.id,
        "station_id": payload.station_id,
        "status": "QUEUED",
    }


@router.get("/qc/rewind/{job_id}", response_model=Dict[str, Any])
async def get_rewind_job_status(job_id: str):
    """Poll execution state and diff revision summary of an asynchronous rewind job."""
    res = AsyncResult(job_id, app=celery_app)
    response_data = {
        "job_id": job_id,
        "state": res.state,
    }
    if res.ready():
        if res.successful():
            response_data["result"] = res.result
        else:
            response_data["error"] = str(res.result)
    return response_data


@router.post("/calibration/refit", status_code=status.HTTP_202_ACCEPTED)
async def trigger_calibration_refit():
    """Manually invoke rolling adaptive UKF Q/R tuning and active-learning isotonic refitting."""
    task = celery_app.send_task("app.background_jobs.calibration_refit.execute_rolling_calibration_refit")
    return {
        "message": "Adaptive calibration refit job dispatched",
        "task_id": task.id,
        "status": "QUEUED",
    }


@router.get("/load-shedding/status", response_model=Dict[str, Any])
async def get_load_shedding_status():
    """Returns Kafka consumer lag and priority throttle states across background jobs."""
    current_lag = KafkaLagProbe.get_consumer_lag()
    task_states = TaskThrottleCoordinator.get_all_states()
    is_shedding = any(task_states.values())

    return {
        "kafka_topic": "observations.raw",
        "consumer_lag_messages": current_lag,
        "load_shedding_active": is_shedding,
        "throttled_tasks": task_states,
        "degradation_hierarchy": [
            "1. Historical QC Rewind (First shed)",
            "2. Daily RUL & Health Scoring",
            "3. Static Topology Rebuild",
            "Real-Time QC & Microburst Detectors (NEVER shed)",
        ],
    }