from typing import Any, Dict, List, Set
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config.database import get_db_session
from .feedback_guard import feedback_guard
from .models import CorrectionModel, ProvenanceModel
from .schemas import (
    CorrectionCandidateRequest,
    CorrectionResponse,
    GateEvaluationBreakdown,
    ProvenanceRecordResponse,
    RejectCorrectionRequest,
)
from .service import SelfHealingOrchestratorService

router = APIRouter(prefix="/corrections", tags=["Uncertainty-Aware Self-Healing & Provenance"])


@router.post(
    "/evaluate",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Evaluate 4-Gate Pipeline and Execute UKF Self-Healing",
)
async def evaluate_and_heal(
    candidate: CorrectionCandidateRequest,
    db: AsyncSession = Depends(get_db_session),
):
    """
    Submits a degraded observation to the Self-Healing Engine:
    1. Validates all 4 qualification gates.
    2. Computes the UKF state correction if gates pass.
    3. Persists the derived record and provenance block.
    4. Enforces the anti-hallucination quarantine guard.
    """
    correction, gate_results = await SelfHealingOrchestratorService.process_healing_request(
        db=db, candidate=candidate
    )

    if not correction:
        return {
            "status": "correction_rejected_by_gates",
            "observation_id": candidate.observation_id,
            "gate_results": gate_results,
            "honest_gap_preserved": True,
        }

    return {
        "status": "correction_applied",
        "correction": correction,
        "gate_results": gate_results,
    }


@router.get(
    "/observations/{observation_id}/correction",
    response_model=CorrectionResponse,
    summary="Fetch Derived Value and Gate Verification Breakdown",
)
async def get_observation_correction(
    observation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(CorrectionModel)
        .where(CorrectionModel.observation_id == observation_id)
        .order_by(desc(CorrectionModel.created_at))
    )
    res = await db.execute(stmt)
    record = res.scalars().first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No correction record registered for observation_id: {observation_id}",
        )
    return record


@router.get(
    "/observations/{observation_id}/provenance",
    response_model=ProvenanceRecordResponse,
    summary="Retrieve Immutable Provenance Audit Block",
)
async def get_observation_provenance(
    observation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
):
    stmt = (
        select(ProvenanceModel)
        .where(ProvenanceModel.observation_id == observation_id)
        .order_by(desc(ProvenanceModel.created_at))
    )
    res = await db.execute(stmt)
    record = res.scalars().first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No provenance payload found for observation_id: {observation_id}",
        )
    return record


@router.post(
    "/{correction_id}/reject",
    status_code=status.HTTP_200_OK,
    summary="Manual Operator Override: Reject Imputation and Void Correction",
)
async def reject_correction_override(
    correction_id: uuid.UUID,
    payload: RejectCorrectionRequest,
    db: AsyncSession = Depends(get_db_session),
):
    success = await SelfHealingOrchestratorService.reject_correction(
        db=db,
        correction_id=correction_id,
        operator_id=payload.operator_id,
        rejection_reason=payload.rejection_reason,
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Correction with id {correction_id} not found.",
        )
    return {
        "status": "correction_voided",
        "correction_id": correction_id,
        "rejected_by": payload.operator_id,
    }


@router.get(
    "/active-quarantine",
    response_model=List[str],
    summary="List Stations Under Active Quarantine by Feedback Guard",
)
async def list_quarantined_stations():
    quarantined = await feedback_guard.get_all_quarantined_stations()
    return sorted(list(quarantined))


@router.post(
    "/active-quarantine/{station_id}/release",
    status_code=status.HTTP_200_OK,
    summary="Manually Release Station from Quarantine",
)
async def release_station_from_quarantine(station_id: str):
    await feedback_guard.release_station(station_id)
    return {"status": "quarantine_released", "station_id": station_id}