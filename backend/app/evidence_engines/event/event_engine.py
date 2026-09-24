from datetime import datetime, timezone
import json
from pyflink.common import Types
from pyflink.datastream.functions import KeyedProcessFunction, RuntimeContext
from pyflink.datastream.state import MapStateDescriptor, ValueStateDescriptor

from ..models import EventEvidence, RawObservationEvent
from .local_corroborator import LocalEventCorroborator
from .regional_discriminator import RegionalEventDiscriminator


class EventValidationEngine(KeyedProcessFunction):
    """
    Validates localized extreme weather shocks vs infrastructure failure[cite: 1, 2].
    Maintains a rolling 5-minute sliding state window across local clusters[cite: 1, 2].
    """

    def open(self, runtime_context: RuntimeContext):
        self.prev_pressure_state = runtime_context.get_state(
            ValueStateDescriptor("prev_pressure", Types.FLOAT())
        )
        self.recent_events_map = runtime_context.get_map_state(
            MapStateDescriptor("cluster_event_window", Types.STRING(), Types.STRING())
        )

    def process_element(self, raw_json_str: str, ctx: KeyedProcessFunction.Context):
        data = json.loads(raw_json_str)
        obs = RawObservationEvent.model_validate(data)

        # 1. Track Step Rate-of-Change (ΔP/Δt)
        prev_p = self.prev_pressure_state.value()
        p_step = (obs.pressure - prev_p) if prev_p is not None else 0.0
        self.prev_pressure_state.update(obs.pressure)

        # Record event telemetry in rolling cluster state
        event_record = {
            "station_id": obs.station_id,
            "fired": obs.local_event_flag,
            "pressure_step": p_step,
            "wind_speed": obs.wind_speed,
            "timestamp": obs.timestamp.timestamp(),
        }
        self.recent_events_map.put(obs.station_id, json.dumps(event_record))

        # 2. Corroborate across local window (T - 300s)
        corroborated_count = 0
        neighbor_metrics = []
        now_epoch = obs.timestamp.timestamp()

        for st_id in self.recent_events_map.keys():
            if st_id == obs.station_id:
                continue
            rec_str = self.recent_events_map.get(st_id)
            if not rec_str:
                continue
            rec = json.loads(rec_str)

            if (now_epoch - rec["timestamp"]) <= 300.0:
                if rec["fired"]:
                    corroborated_count += 1
                neighbor_metrics.append({"pressure_step": rec["pressure_step"]})

        # 3. Compute Spatial Signal Coherence
        coherence_score = LocalEventCorroborator.calculate_coherence(
            target_metrics={"pressure_step": p_step},
            neighbor_metrics=neighbor_metrics,
        )

        # 4. Execute 4-Clause Discriminator
        shares_infra = bool(obs.power_segment and "GRID" in obs.power_segment)
        event_state, hypotheses, confidence = RegionalEventDiscriminator.evaluate(
            local_event_fired=obs.local_event_flag,
            corroborated_neighbors_count=corroborated_count,
            signal_coherence=coherence_score,
            shares_correlated_infra=shares_infra,
            k_threshold=2,
        )

        evidence = EventEvidence(
            station_id=obs.station_id,
            observation_id=f"obs-{obs.station_id}-{obs.sequence}",
            event_state=event_state,
            corroborated_count=corroborated_count,
            signal_coherence_score=coherence_score,
            infra_conflict_flag=shares_infra,
            hypotheses=hypotheses,
            confidence=confidence,
            produced_at=datetime.now(timezone.utc).isoformat(),
        )

        yield evidence.model_dump_json()