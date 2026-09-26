from datetime import datetime, timezone
import json
import logging
from typing import Dict, List, Optional
import uuid
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from .celery_app import celery_app
from app.config.settings import settings
 
from .load_shedder import TaskThrottleCoordinator

logger = logging.getLogger("skyguard.jobs.rewind")

engine = create_engine(settings.DATABASE_SYNC_URL, pool_pre_ping=True)


class RetrospectiveQCEngine:
    """
    Re-evaluates historical observations against newly discovered calibration offsets
    and spatial biases. Guarantees byte-identity of the raw observation store.
    All corrections are persisted exclusively to 'qc_revisions'.
    """

    @classmethod
    def re_evaluate_payload(
        cls,
        payload: dict,
        bias_offset: float,
        sonntag_saturation_p_hpa: float,
    ) -> tuple[bool, List[str], dict]:
        """
        Applies revised physical validation limits on historical data chunks.
        Returns:
            revision_required: bool
            new_qc_flags: List[str]
            revised_values: dict
        """
        temp = float(payload.get("temperature", 20.0))
        press = float(payload.get("pressure", 1013.25))
        rh = float(payload.get("humidity", 50.0))
        prev_flags = payload.get("edge_flags", [])

        # Apply continuous bias correction
        calibrated_temp = temp - bias_offset

        new_flags = list(prev_flags)
        revision_required = False

        # Physical limit cross-check with revised parameters
        if calibrated_temp < -40.0 or calibrated_temp > 60.0:
            if "REVISED_PHYSICAL_RANGE_FAIL" not in new_flags:
                new_flags.append("REVISED_PHYSICAL_RANGE_FAIL")
                revision_required = True

        # Check vapor pressure saturation
        if rh > 100.0:
            if "REVISED_HUMIDITY_SATURATION_CLAMP" not in new_flags:
                new_flags.append("REVISED_HUMIDITY_SATURATION_CLAMP")
                revision_required = True

        if abs(bias_offset) > 0.01:
            revision_required = True
            if "HISTORICAL_BIAS_REMOVED" not in new_flags:
                new_flags.append("HISTORICAL_BIAS_REMOVED")

        revised_data = {
            "temperature_original": temp,
            "temperature_calibrated": round(calibrated_temp, 3),
            "bias_removed": bias_offset,
        }
        return revision_required, new_flags, revised_data


@celery_app.task(name="app.background_jobs.historical_rewind.execute_historical_qc_rewind", bind=True)
def execute_historical_qc_rewind(
    self,
    station_id: str,
    start_time_iso: str,
    end_time_iso: str,
    bias_offset: float = 0.0,
    reason: str = "Routine retrospective model sweep",
    operator_id: Optional[str] = None,
):
    """
    Chunk-wise retrospective rewind task streaming through TimescaleDB chunks.
    Ensures zero mutation of raw_observations rows.
    """
    if TaskThrottleCoordinator.is_task_paused("historical_rewind"):
        logger.warning(f"LOAD SHEDDING: QC rewind for {station_id} throttled due to consumer lag.")
        return {"status": "throttled", "reason": "load_shedding"}

    start_dt = datetime.fromisoformat(start_time_iso)
    end_dt = datetime.fromisoformat(end_time_iso)
    job_uuid = self.request.id or str(uuid.uuid4())
    logger.info(f"Starting Historical QC Rewind [{job_uuid}] for station {station_id} ({start_dt} to {end_dt})")

    total_scanned = 0
    total_revised = 0
    now_utc = datetime.now(timezone.utc)

    with Session(engine) as session:
        cursor_query = text("""
            SELECT observation_id, timestamp, payload
            FROM raw_observations
            WHERE station_id = :st_id
              AND timestamp >= :start_t
              AND timestamp <= :end_t
            ORDER BY timestamp ASC
        """)

        result_proxy = session.execute(cursor_query, {
            "st_id": station_id,
            "start_t": start_dt,
            "end_t": end_dt,
        })

        while True:
            chunk = result_proxy.fetchmany(settings.REWIND_BATCH_CHUNK_SIZE)
            if not chunk:
                break

            for row in chunk:
                total_scanned += 1
                obs_id = row.observation_id
                payload = row.payload

                needs_rev, new_flags, details = RetrospectiveQCEngine.re_evaluate_payload(
                    payload=payload,
                    bias_offset=bias_offset,
                    sonntag_saturation_p_hpa=1013.25,
                )

                if needs_rev:
                    prev_flags = payload.get("edge_flags", [])
                    rev_id = uuid.uuid4()

                    insert_rev = text("""
                        INSERT INTO qc_revisions (
                            revision_id, observation_id, previous_qc_flags,
                            new_qc_flags, revised_values, reason,
                            model_version, operator_id, created_at
                        ) VALUES (
                            :rev_id, :obs_id, :prev_flags,
                            :new_flags, :details, :reason,
                            :model_v, :op_id, :created_at
                        )
                    """)
                    session.execute(insert_rev, {
                        "rev_id": rev_id,
                        "obs_id": obs_id,
                        "prev_flags": json.dumps(prev_flags),
                        "new_flags": json.dumps(new_flags),
                        "details": json.dumps(details),
                        "reason": reason,
                        "model_v": "rewind-v2.1",
                        "op_id": operator_id,
                        "created_at": now_utc,
                    })
                    total_revised += 1

            session.commit()

    logger.info(f"QC Rewind [{job_uuid}] Complete: {total_scanned} scanned, {total_revised} revisions generated.")
    return {
        "job_id": job_uuid,
        "station_id": station_id,
        "scanned_observations": total_scanned,
        "revised_records": total_revised,
        "status": "completed",
    }