from datetime import datetime, timezone
import json
from pyflink.common import Types
from pyflink.datastream.functions import KeyedProcessFunction, RuntimeContext
from pyflink.datastream.state import MapStateDescriptor

from ..models import RawObservationEvent, SpatialEvidence
from .dynamic_weighting import DynamicSpatialWeighting
from .physical_reduction import MeteorologicalReductions
from .topology_cache import TopologyCacheClient


class SpatialConsensusEngine(KeyedProcessFunction):
    """
    Evaluates topological consensus across candidate neighbors:
    1. Normalizes topographic altitude (MSL pressure, lapse-rate temperature)[cite: 1, 2].
    2. Applies Bad-Neighbor Contamination Guards (excludes imputed nodes)[cite: 1, 2].
    3. Detects shared infrastructure correlation risks[cite: 1].
    """

    def open(self, runtime_context: RuntimeContext):
        # Global state keeping track of latest peer physical observations: key = neighbor_id
        self.peer_state = runtime_context.get_map_state(
            MapStateDescriptor("peer_spatial_state", Types.STRING(), Types.STRING())
        )
        self.topology_client = TopologyCacheClient()

    def process_element(self, raw_json_str: str, ctx: KeyedProcessFunction.Context):
        data = json.loads(raw_json_str)
        obs = RawObservationEvent.model_validate(data)

        # 1. Normalize Local Observation to Physical Datums
        norm_msl_press = MeteorologicalReductions.reduce_pressure_to_msl(
            obs.pressure, obs.elevation or 0.0, obs.temperature
        )

        # Broadcast update to peer spatial window state
        local_station_record = {
            "temperature": obs.temperature,
            "msl_pressure": norm_msl_press,
            "elevation": obs.elevation or 0.0,
            "health_state": "HEALTHY",
            "is_corrected": False,
            "power_segment": obs.power_segment,
            "backhaul_id": obs.backhaul_id,
            "timestamp": obs.timestamp.timestamp(),
        }
        self.peer_state.put(obs.station_id, json.dumps(local_station_record))

        # 2. Query Static Candidate Topology
        candidates = self.topology_client.get_candidate_neighbors(obs.station_id)

        weighted_temp_diff_sum = 0.0
        total_weight = 0.0
        healthy_count = 0
        neighbor_infras = []

        # 3. Dynamic Weighting & Physical Adjustment
        for cand in candidates:
            nbr_id = cand["station_id"]
            nbr_data_raw = self.peer_state.get(nbr_id)

            if not nbr_data_raw:
                continue

            nbr = json.loads(nbr_data_raw)
            # Check for stale observation (>15 minutes)
            if abs(obs.timestamp.timestamp() - nbr["timestamp"]) > 900:
                continue

            weight = DynamicSpatialWeighting.evaluate_neighbor_weight(
                health_state=nbr.get("health_state", "HEALTHY"),
                is_operating_under_correction=nbr.get("is_corrected", False),
            )

            if weight <= 0.0:
                continue  # Imputation guard: drop contaminated neighbor

            healthy_count += 1
            neighbor_infras.append({
                "power_segment": nbr.get("power_segment", ""),
                "backhaul_id": nbr.get("backhaul_id", ""),
            })

            # Physical Lapse Rate Adjustment
            adjusted_nbr_temp = MeteorologicalReductions.lapse_rate_temperature_adjustment(
                temp_c=nbr["temperature"],
                elevation_source_m=nbr["elevation"],
                elevation_target_m=obs.elevation or 0.0,
            )

            diff = abs(obs.temperature - adjusted_nbr_temp)
            weighted_temp_diff_sum += diff * weight
            total_weight += weight

        # 4. Compute Residual & Confidence
        spatial_residual = (weighted_temp_diff_sum / total_weight) if total_weight > 0.0 else 0.0
        neighbor_count = len(neighbor_infras)
        healthy_ratio = (healthy_count / len(candidates)) if candidates else 0.0

        infra_flag = DynamicSpatialWeighting.detect_infrastructure_correlation(
            target_infra={"power_segment": obs.power_segment or "", "backhaul_id": obs.backhaul_id or ""},
            neighbor_infras=neighbor_infras,
        )

        confidence = 0.95 if neighbor_count >= 3 and not infra_flag else 0.50

        evidence = SpatialEvidence(
            station_id=obs.station_id,
            observation_id=f"obs-{obs.station_id}-{obs.sequence}",
            spatial_residual=round(spatial_residual, 3),
            neighbor_count=neighbor_count,
            healthy_neighbor_ratio=round(healthy_ratio, 2),
            infrastructure_correlation_flag=infra_flag,
            confidence=round(confidence, 2),
            produced_at=datetime.now(timezone.utc).isoformat(),
        )

        yield evidence.model_dump_json()