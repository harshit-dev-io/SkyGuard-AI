from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


class GateEvaluationBreakdown(BaseModel):
    passed: bool
    gate_1_confirmed_fault: bool
    gate_2_state_trustworthiness: bool
    gate_3_bounded_uncertainty: bool
    gate_4_clean_neighbors: bool
    rejection_reasons: List[str] = Field(default_factory=list)
    innovation: float
    innovation_variance: float
    chi2_metric: float
    posterior_sigma: float
    qualified_neighbor_count: int


class NeighborObservationPayload(BaseModel):
    station_id: str
    temperature: float
    pressure: float
    humidity: float
    distance_km: float
    is_clean: bool = True


class CorrectionCandidateRequest(BaseModel):
    observation_id: uuid.UUID
    station_id: str
    sensor_id: str
    parameter_target: str = "temperature"
    raw_value: float
    predicted_fault: str
    calibrated_fault_probability: float
    climate_region: str = "composite"
    prior_state_mean: float
    prior_state_variance: float
    candidate_neighbors: List[NeighborObservationPayload]
    evidence_incomplete: bool = False
    validation_volume: int = 1200
    calibration_version: str = "iso-v1.0.0"


class CorrectionResponse(BaseModel):
    correction_id: uuid.UUID
    observation_id: uuid.UUID
    station_id: str
    sensor_id: str
    parameter_target: str
    derived_value: float
    raw_value: float
    uncertainty: float
    method: str
    model_version: str
    rejected: bool
    source_neighbors: List[str]
    gate_results: GateEvaluationBreakdown
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProvenanceBlockSchema(BaseModel):
    source_observation_id: str
    derived_value: float
    method: str = "ukf_correction"
    model_version: str
    estimator_version: str
    confidence: float
    confidence_calibration: Dict[str, Any]
    uncertainty: float
    source_neighbors: List[str]
    evidence_incomplete: bool
    created_at: str


class ProvenanceRecordResponse(BaseModel):
    provenance_id: uuid.UUID
    correction_id: uuid.UUID
    observation_id: uuid.UUID
    provenance_payload: ProvenanceBlockSchema
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RejectCorrectionRequest(BaseModel):
    operator_id: str = Field(..., min_length=2, max_length=64)
    rejection_reason: str = Field(..., min_length=5, max_length=1000)