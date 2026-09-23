from datetime import datetime, timezone
import json
from pyflink.common import Types
from pyflink.datastream.functions import KeyedProcessFunction, RuntimeContext
from pyflink.datastream.state import ValueStateDescriptor

from ..models import RawObservationEvent, TemporalEvidence
from .adaptive_cusum import ClimateAdaptiveCUSUM
from .fourier_baseline import FourierHarmonicModel


class TemporalEvidenceEngine(KeyedProcessFunction):
    """
    Keyed on station_id:
    1. Computes harmonic expectation residual[cite: 1, 2].
    2. Runs climate-region adaptive CUSUM accumulation[cite: 1, 2].
    3. Validates edge TinyML residual divergence[cite: 1, 2].
    """

    def open(self, runtime_context: RuntimeContext):
        self.cusum_pos_state = runtime_context.get_state(
            ValueStateDescriptor("cusum_pos", Types.FLOAT())
        )
        self.cusum_neg_state = runtime_context.get_state(
            ValueStateDescriptor("cusum_neg", Types.FLOAT())
        )

    def process_element(self, raw_json_str: str, ctx: KeyedProcessFunction.Context):
        data = json.loads(raw_json_str)
        obs = RawObservationEvent.model_validate(data)

        # 1. Harmonic Baseline Residual
        expected_t, sigma = FourierHarmonicModel.calculate_expected_temperature(
            ts=obs.timestamp,
            climate_region=obs.climate_region or "composite",
            elevation_m=obs.elevation or 0.0,
        )
        harmonic_residual = obs.temperature - expected_t
        standardized_residual = abs(harmonic_residual) / max(0.5, sigma)

        # 2. Climate-Adaptive CUSUM Accumulation
        cusum_detector = ClimateAdaptiveCUSUM(obs.climate_region or "composite")
        pos_val = self.cusum_pos_state.value() or 0.0
        neg_val = self.cusum_neg_state.value() or 0.0

        new_pos, new_neg, cusum_score, _ = cusum_detector.update(
            residual=standardized_residual,
            pos_sum=pos_val,
            neg_sum=neg_val,
        )
        self.cusum_pos_state.update(new_pos)
        self.cusum_neg_state.update(new_neg)

        # 3. Residual Agreement: Central S1/S2 residual vs Edge TinyML residual
        # TinyML residual is |y - y_hat|. Significant divergence implies edge model drift.
        edge_res = obs.edge_residual
        residual_divergence = abs(standardized_residual - edge_res)
        edge_agreement_score = max(0.0, 1.0 - (residual_divergence / 3.0))

        confidence = max(0.1, min(0.99, 1.0 - (cusum_score * 0.5)))

        evidence = TemporalEvidence(
            station_id=obs.station_id,
            observation_id=f"obs-{obs.station_id}-{obs.sequence}",
            harmonic_residual=round(harmonic_residual, 3),
            cusum_score=round(cusum_score, 4),
            edge_agreement_score=round(edge_agreement_score, 4),
            confidence=round(confidence, 3),
            produced_at=datetime.now(timezone.utc).isoformat(),
        )

        yield evidence.model_dump_json()