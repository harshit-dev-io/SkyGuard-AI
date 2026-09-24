import logging
from typing import List, Tuple
from app.config.settings import settings
from .feedback_guard import feedback_guard
from .schemas import CorrectionCandidateRequest, GateEvaluationBreakdown

logger = logging.getLogger("skyguard.healing.gates")

class FourGateDecisionChecker:
    """
    Evaluates the 4 strict qualification gates prior to synthesizing any physical imputation.
    Architectural Guarantee: An honest missing gap is strictly superior to an imputed hallucination.
    If ANY single gate fails, correction is aborted immediately.
    """

    @classmethod
    async def evaluate_all(
        cls,
        candidate: CorrectionCandidateRequest,
        innovation: float,
        innovation_variance: float,
        chi2_metric: float,
        posterior_sigma: float,
    ) -> GateEvaluationBreakdown:
        rejections: List[str] = []

        # ---------------------------------------------------------------------
        # Gate 1: Confirmed Fault Check
        # ---------------------------------------------------------------------
        gate_1 = True
        fault_name = candidate.predicted_fault.upper()
        if fault_name not in settings.PERMITTED_FAULT_CLASSES:
            gate_1 = False
            rejections.append(
                f"Gate 1 Failed: Fault class '{fault_name}' is not an approved hardware fault "
                f"(Must be one of {settings.PERMITTED_FAULT_CLASSES}; cannot impute weather shocks or UNKNOWN)."
            )
        if candidate.calibrated_fault_probability < settings.MIN_CLASSIFICATION_PROBABILITY:
            gate_1 = False
            rejections.append(
                f"Gate 1 Failed: Calibrated confidence {candidate.calibrated_fault_probability:.3f} "
                f"is below mandatory threshold {settings.MIN_CLASSIFICATION_PROBABILITY:.2f}."
            )

        # ---------------------------------------------------------------------
        # Gate 2: State Estimate Trustworthiness (Innovation Chi-Square Test)
        # ---------------------------------------------------------------------
        gate_2 = True
        if chi2_metric > settings.CHI2_INNOVATION_ALPHA_THRESHOLD:
            gate_2 = False
            rejections.append(
                f"Gate 2 Failed: Innovation chi-square metric {chi2_metric:.3f} exceeds tolerance "
                f"{settings.CHI2_INNOVATION_ALPHA_THRESHOLD:.3f} (Degrees of freedom=1, alpha=0.01). "
                f"Physical dynamics divergent."
            )

        # ---------------------------------------------------------------------
        # Gate 3: Bounded Uncertainty Check
        # ---------------------------------------------------------------------
        gate_3 = True
        if posterior_sigma > settings.MAX_ALLOWABLE_POSTERIOR_SIGMA:
            gate_3 = False
            rejections.append(
                f"Gate 3 Failed: Posterior state sigma {posterior_sigma:.3f} exceeds max regional tolerance "
                f"{settings.MAX_ALLOWABLE_POSTERIOR_SIGMA:.3f}."
            )

        # ---------------------------------------------------------------------
        # Gate 4: Uncontaminated Neighbor Sources
        # ---------------------------------------------------------------------
        gate_4 = True
        quarantined_stations = await feedback_guard.get_all_quarantined_stations()

        clean_neighbors = [
            n for n in candidate.candidate_neighbors
            if n.is_clean
            and n.station_id not in quarantined_stations
            and n.distance_km <= settings.MAX_NEIGHBOR_DISTANCE_KM
        ]

        if len(clean_neighbors) < settings.MIN_REQUIRED_CLEAN_NEIGHBORS:
            gate_4 = False
            rejections.append(
                f"Gate 4 Failed: Only {len(clean_neighbors)} clean, un-quarantined neighbors found "
                f"within {settings.MAX_NEIGHBOR_DISTANCE_KM}km. Required >= {settings.MIN_REQUIRED_CLEAN_NEIGHBORS}."
            )

        all_passed = gate_1 and gate_2 and gate_3 and gate_4

        return GateEvaluationBreakdown(
            passed=all_passed,
            gate_1_confirmed_fault=gate_1,
            gate_2_state_trustworthiness=gate_2,
            gate_3_bounded_uncertainty=gate_3,
            gate_4_clean_neighbors=gate_4,
            rejection_reasons=rejections,
            innovation=round(innovation, 4),
            innovation_variance=round(innovation_variance, 4),
            chi2_metric=round(chi2_metric, 4),
            posterior_sigma=round(posterior_sigma, 4),
            qualified_neighbor_count=len(clean_neighbors),
        )