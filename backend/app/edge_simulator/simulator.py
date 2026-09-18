from __future__ import annotations

import asyncio
import math
import random
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

from .physics import FrozenRHDetector, PhysicalQCGates
from .schemas import (
    ClimateRegion,
    EdgeTelemetryPayload,
    FaultType,
    InjectEventRequest,
    InjectFaultRequest,
)


class VirtualStationInstance:
    """
    Full emulation of an ESP32-S3 Automatic Weather Station node[cite: 1, 3].
    Maintains monotonic sequence persistence, RAM outage buffering,
    deterministic physical QC, and TinyML residual inference[cite: 1, 2].
    """

    def __init__(
        self,
        station_id: str,
        climate_region: ClimateRegion,
        elevation: float,
        firmware_version: str = "fw-1.4.2",
    ):
        self.station_id = station_id
        self.climate_region = climate_region
        self.elevation = elevation
        self.firmware_version = firmware_version
        self.sensor_id = f"SN-{station_id[-4:]}"

        # Monotonic sequence counter persisted in memory (NVS simulation)[cite: 1]
        self.sequence = 100000

        # Physical safety sub-engines
        self.frozen_rh_detector = FrozenRHDetector()
        self.previous_reading: Optional[Tuple[float, float, float, float]] = None

        # Fault and Extreme Event Injector states
        self.active_fault: Optional[InjectFaultRequest] = None
        self.fault_ticks_remaining: int = 0
        self.fault_accumulated_drift: float = 0.0

        self.active_event: Optional[InjectEventRequest] = None
        self.event_ticks_remaining: int = 0

        # RAM Buffer for low-power duty cycling[cite: 1, 3]
        self.ram_buffer: List[EdgeTelemetryPayload] = []

    def inject_fault(self, fault: InjectFaultRequest) -> None:
        self.active_fault = fault
        self.fault_ticks_remaining = fault.duration_ticks
        self.fault_accumulated_drift = 0.0

    def inject_event(self, event: InjectEventRequest) -> None:
        self.active_event = event
        self.event_ticks_remaining = event.duration_ticks

    def _generate_fourier_baseline(self, now: datetime) -> Dict[str, float]:
        """
        S1 (24h) and S2 (12h) Fourier harmonic weather synthesis[cite: 1, 2].
        Adjusted for elevation and climate region regimes[cite: 1, 2].
        """
        hour_fraction = now.hour + (now.minute / 60.0)
        theta_24 = 2.0 * math.pi * (hour_fraction / 24.0)
        theta_12 = 4.0 * math.pi * (hour_fraction / 24.0)

        # Baseline parameters by region
        base_t = 30.0 if self.climate_region == ClimateRegion.ARID_DESERT else 26.0
        base_rh = 40.0 if self.climate_region == ClimateRegion.ARID_DESERT else 75.0

        # Standard atmospheric lapse rate (-6.5°C per 1000m)
        temp_lapse = -(self.elevation / 1000.0) * 6.5
        base_t += temp_lapse

        # S1/S2 Diurnal Harmonics
        temperature = base_t - 4.5 * math.cos(theta_24 - 0.7) - 1.2 * math.cos(theta_12)
        humidity = base_rh + 18.0 * math.cos(theta_24 - 0.7) + 3.0 * math.cos(theta_12)
        pressure = 1013.25 * ((1.0 - (2.25577e-5 * self.elevation)) ** 5.25588)
        pressure += 1.5 * math.sin(theta_12)  # S2 atmospheric tide

        wind_speed = max(0.2, 3.5 + 2.0 * math.sin(theta_24) + random.gauss(0, 0.4))
        wind_dir = (180.0 + 45.0 * math.sin(theta_24)) % 360.0
        rainfall = 0.0

        return {
            "temperature": round(temperature + random.gauss(0, 0.15), 2),
            "pressure": round(pressure + random.gauss(0, 0.08), 2),
            "humidity": round(max(5.0, min(99.0, humidity + random.gauss(0, 0.3))), 2),
            "wind_speed": round(wind_speed, 2),
            "wind_direction": round(wind_dir, 1),
            "rainfall": round(rainfall, 2),
            "battery_voltage": round(random.uniform(3.88, 3.98), 2),
        }

    def _apply_injections(self, telemetry: Dict[str, float]) -> Tuple[Dict[str, float], bool]:
        """
        Applies synthetic extreme weather profiles or hardware fault mutations.
        """
        is_extreme_event = False

        # 1. Apply Extreme Weather Injection
        if self.active_event and self.event_ticks_remaining > 0:
            self.event_ticks_remaining -= 1
            is_extreme_event = True
            telemetry["pressure"] -= self.active_event.pressure_drop_rate
            telemetry["temperature"] -= 3.5  # Coherent convective cooling
            telemetry["humidity"] = min(100.0, telemetry["humidity"] + self.active_event.rh_spike)
            telemetry["wind_speed"] += self.active_event.gust_speed
            telemetry["rainfall"] += 28.0

        # 2. Apply Fault Injection
        if self.active_fault and self.fault_ticks_remaining > 0:
            self.fault_ticks_remaining -= 1
            ch = self.active_fault.target_channel
            mag = self.active_fault.magnitude
            ft = self.active_fault.fault_type

            if ft == FaultType.STUCK_SENSOR:
                telemetry[ch] = 99.8 if ch == "humidity" else 31.5
            elif ft == FaultType.DRIFT:
                self.fault_accumulated_drift += mag * 0.2
                telemetry[ch] += self.fault_accumulated_drift
            elif ft == FaultType.BIAS:
                telemetry[ch] += mag
            elif ft == FaultType.NOISE_INCREASE:
                telemetry[ch] += random.gauss(0, mag * 2.0)
            elif ft == FaultType.INTERMITTENT_FAILURE:
                if random.random() < 0.4:
                    telemetry[ch] = -999.0

        return telemetry, is_extreme_event

    def _check_local_extreme_event(
        self,
        current: Dict[str, float],
        previous: Optional[Tuple[float, float, float, float]],
    ) -> bool:
        """
        Local Extreme Weather Detector (Physics-Only, Stage 1.5)[cite: 1, 2].
        Validates multi-channel coherence independently of neighbor consensus[cite: 1, 2].
        """
        if not previous:
            return False

        p_temp, p_press, p_rh, p_wind = previous
        delta_p = current["pressure"] - p_press
        delta_t = current["temperature"] - p_temp
        delta_rh = current["humidity"] - p_rh
        delta_wind = current["wind_speed"] - p_wind

        # Microburst/frontal shock: Sharp ΔP with correlated thermal collapse and wind gust
        is_coherent_shock = (
            delta_p <= -2.0
            and delta_t <= -1.8
            and delta_rh >= 8.0
            and delta_wind >= 8.0
        )
        return is_coherent_shock or (current["rainfall"] > 20.0 and delta_p <= -1.5)

    def _compute_tinyml_residual(self, observed_temp: float) -> float:
        """
        Simulates INT8 TinyML temporal residual prediction (|y - y_hat|)[cite: 1, 2].
        Uses short-term expected value within a bounded <=32KB arena profile[cite: 1, 3].
        """
        predicted_temp = observed_temp + random.gauss(0, 0.09)
        return round(abs(observed_temp - predicted_temp), 3)

    def tick(self, now: Optional[datetime] = None) -> Tuple[List[EdgeTelemetryPayload], bool]:
        """
        Simulates one 5-minute MCU sampling cycle.
        Returns: (payloads_to_publish, publish_immediately)
        """
        ts = now or datetime.now(timezone.utc)
        self.sequence += 1

        raw_telemetry = self._generate_fourier_baseline(ts)
        reading, forced_extreme = self._apply_injections(raw_telemetry)

        # Evaluate Deterministic Physical QC Gates
        hard_violation, edge_flags = PhysicalQCGates.evaluate(
            reading["temperature"],
            reading["pressure"],
            reading["humidity"],
            reading["wind_speed"],
            self.previous_reading,
        )

        # Evaluate Frozen-RH Variance Collapse
        if self.frozen_rh_detector.update(reading["humidity"]):
            edge_flags.append("FROZEN_RH")
            hard_violation = True

        # Evaluate Local Extreme Weather Detection
        local_event = forced_extreme or self._check_local_extreme_event(reading, self.previous_reading)
        if local_event:
            edge_flags.append("LOCAL_EXTREME_EVENT_DETECTED")

        # TinyML Residual
        residual = self._compute_tinyml_residual(reading["temperature"])

        # Construct Edge Payload matching strict JSON schema[cite: 1, 2]
        payload = EdgeTelemetryPayload(
            station_id=self.station_id,
            sensor_id=self.sensor_id,
            timestamp=ts.isoformat(),
            sequence=self.sequence,
            temperature=reading["temperature"],
            pressure=reading["pressure"],
            humidity=reading["humidity"],
            wind_speed=reading["wind_speed"],
            wind_direction=reading["wind_direction"],
            rainfall=reading["rainfall"],
            edge_flags=edge_flags,
            edge_residual=residual,
            local_event_flag=local_event,
            model_version="tinyml-v3",
            firmware_version=self.firmware_version,
            battery_voltage=reading["battery_voltage"],
        )

        self.previous_reading = (
            reading["temperature"],
            reading["pressure"],
            reading["humidity"],
            reading["wind_speed"],
        )
        self.ram_buffer.append(payload)

        publish_immediately = hard_violation or local_event
        if publish_immediately or len(self.ram_buffer) >= 3:
            out_batch = list(self.ram_buffer)
            self.ram_buffer.clear()
            return out_batch, publish_immediately

        return [], False


class FleetSimulatorManager:
    """
    Fleet-wide asynchronous simulation runner.
    Coordinates concurrent event loops across all virtual AWS nodes.
    """

    def __init__(self) -> None:
        self.stations: Dict[str, VirtualStationInstance] = {}
        self.is_running: bool = False
        self._loop_task: Optional[asyncio.Task] = None

    def register_station_instance(self, station: VirtualStationInstance) -> None:
        self.stations[station.station_id] = station

    def remove_station_instance(self, station_id: str) -> None:
        self.stations.pop(station_id, None)

    def get_station(self, station_id: str) -> Optional[VirtualStationInstance]:
        return self.stations.get(station_id)


simulator_fleet = FleetSimulatorManager()