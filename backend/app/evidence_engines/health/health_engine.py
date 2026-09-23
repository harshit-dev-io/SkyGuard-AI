from datetime import datetime, timezone
import json
import numpy as np
from pyflink.common import Types
from pyflink.datastream.functions import KeyedProcessFunction, RuntimeContext
from pyflink.datastream.state import ListStateDescriptor, ValueStateDescriptor

from ..models import HealthEvidence, RawObservationEvent
from .repeated_median import StreamingRepeatedMedianEstimator
from .ukf_tracker import MeteorologicalUKF


class SensorHealthEngine(KeyedProcessFunction):
    """
    Keyed by station_id:
    1. Runs the Streaming Repeated-Median blocked trend estimator (0.5 breakdown point)[cite: 1].
    2. Updates the Unscented Kalman Filter non-linear physical state tracker[cite: 1].
    3. Emits sensor degradation metrics and health classifications.
    """

    def open(self, runtime_context: RuntimeContext):
        # Accumulator for current block of 60 observations
        self.current_block_state = runtime_context.get_list_state(
            ListStateDescriptor("current_block_samples", Types.FLOAT())
        )
        # Block-level slope history: retained up to 48 blocks (10 days)
        self.block_slopes_state = runtime_context.get_list_state(
            ListStateDescriptor("block_slopes", Types.FLOAT())
        )
        self.block_residuals_state = runtime_context.get_list_state(
            ListStateDescriptor("block_residuals", Types.FLOAT())
        )
        # Serialized UKF state tuple: (x0, x1, P00, P01, P10, P11)
        self.ukf_params_state = runtime_context.get_state(
            ValueStateDescriptor("ukf_serialized", Types.STRING())
        )

    def process_element(self, raw_json_str: str, ctx: KeyedProcessFunction.Context):
        data = json.loads(raw_json_str)
        obs = RawObservationEvent.model_validate(data)

        # 1. Unscented Kalman Filter State Tracking
        ukf = MeteorologicalUKF(
            climate_region=obs.climate_region or "composite",
            initial_val=obs.temperature,
        )
        saved_ukf = self.ukf_params_state.value()
        if saved_ukf:
            p = json.loads(saved_ukf)
            ukf.x = np.array(p["x"], dtype=np.float64)
            ukf.P = np.array(p["P"], dtype=np.float64)

        state_est, innovation = ukf.step(obs.temperature)
        self.ukf_params_state.update(
            json.dumps({"x": ukf.x.tolist(), "P": ukf.P.tolist()})
        )

        # 2. Blocked Repeated Median Degradation Estimation
        current_samples = list(self.current_block_state.get() or [])
        current_samples.append(obs.temperature)

        block_slopes = list(self.block_slopes_state.get() or [])
        block_res = list(self.block_residuals_state.get() or [])
        degradation_slope = 0.0

        if len(current_samples) >= StreamingRepeatedMedianEstimator.BLOCK_SIZE:
            arr = np.array(current_samples, dtype=np.float64)
            block_m = StreamingRepeatedMedianEstimator.calculate_block_slope(arr)
            block_spread = float(np.std(arr - np.median(arr)))

            block_slopes.append(block_m)
            block_res.append(block_spread)

            # Keep window bounded to 48 blocks (10 days @ 5-min intervals)
            if len(block_slopes) > 48:
                block_slopes.pop(0)
                block_res.pop(0)

            self.block_slopes_state.update(block_slopes)
            self.block_residuals_state.update(block_res)
            self.current_block_state.clear()
        else:
            self.current_block_state.update(current_samples)

        if block_slopes:
            degradation_slope = StreamingRepeatedMedianEstimator.combine_blocks(
                block_slopes=block_slopes,
                block_residuals=block_res,
            )

        # 3. Categorize Sensor State
        abs_slope = abs(degradation_slope)
        if abs_slope > 0.045 or abs(innovation) > 4.5:
            health_state = "DEGRADED"
            confidence = 0.88
        elif abs_slope > 0.020:
            health_state = "AT_RISK"
            confidence = 0.75
        else:
            health_state = "HEALTHY"
            confidence = 0.95

        evidence = HealthEvidence(
            station_id=obs.station_id,
            observation_id=f"obs-{obs.station_id}-{obs.sequence}",
            sensor_id=obs.sensor_id,
            degradation_slope=round(float(degradation_slope), 5),
            ukf_state_estimate=round(float(state_est), 3),
            ukf_innovation=round(float(innovation), 3),
            health_state=health_state,
            confidence=round(confidence, 2),
            produced_at=datetime.now(timezone.utc).isoformat(),
        )

        yield evidence.model_dump_json()