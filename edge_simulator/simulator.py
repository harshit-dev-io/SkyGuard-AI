import argparse
import math
import signal
import statistics
import sys
import time
from datetime import datetime, timezone
from enum import Enum, auto
from typing import Any, Dict, List, Optional, Tuple

try:
    from edge_simulator.mqtt_client import MQTTPublisher
except ModuleNotFoundError:
    from mqtt_client import MQTTPublisher


class AnomalyMode(Enum):
    NORMAL = auto()
    FROZEN_ADC = auto()
    SUPER_SATURATION = auto()
    THERMO_VIOLATION = auto()
    MICROBURST_SIM = auto()


# Bitmask definitions for QC
BITMASK_THERMO_INVARIANT = 1  # T_dew > T_ambient
BITMASK_PHYSICAL_LIMIT = 2     # Supersaturation e > 1.03 * e_s(T)
BITMASK_FROZEN_REGISTER = 4    # RH >= 98% and Var(RH) < 1e-4


def calculate_sonntag_e_s(temp_c: float) -> float:
    """
    Calculate saturation vapor pressure e_s (hPa) using Sonntag ITS-90 formulation over water.
    T_k: absolute temperature in Kelvin.
    """
    temp_k = temp_c + 273.15
    ln_es_pa = (
        -6096.9385 / temp_k
        + 21.2409642
        - 2.711193e-2 * temp_k
        + 1.673952e-5 * (temp_k ** 2)
        + 2.433502 * math.log(temp_k)
    )
    e_s_pa = math.exp(ln_es_pa)
    return e_s_pa / 100.0  # Convert Pa to hPa


def calculate_dew_point(temp_c: float, rh: float) -> float:
    """
    Calculate dew point temperature T_dew (°C) from dry bulb temp T (°C) and relative humidity RH (%).
    """
    if rh <= 0:
        return -999.0
    e_s = calculate_sonntag_e_s(temp_c)
    e = (rh / 100.0) * e_s
    
    low, high = -100.0, 100.0
    for _ in range(30):
        mid = (low + high) / 2.0
        if calculate_sonntag_e_s(mid) < e:
            low = mid
        else:
            high = mid
    return (low + high) / 2.0


class StationConfig:
    def __init__(
        self,
        station_id: str = "DELHI_AWS_04",
        urn_id: str = "urn:wmo:md:in-imd:station_delhi_04:data",
        longitude: float = 77.2090,
        latitude: float = 28.6139,
        elevation: float = 216.0,
    ) -> None:
        self.station_id = station_id
        self.urn_id = urn_id
        self.longitude = longitude
        self.latitude = latitude
        self.elevation = elevation


class RingBuffer:
    def __init__(self, capacity: int) -> None:
        self.capacity = capacity
        self.buffer: List[Dict[str, float]] = []

    def append(self, observation: Dict[str, float]) -> None:
        self.buffer.append(observation)
        if len(self.buffer) > self.capacity:
            self.buffer.pop(0)

    def get_rh_values(self) -> List[float]:
        return [obs["rh"] for obs in self.buffer]

    def get_cnn_tensor(self) -> List[List[float]]:
        recent = self.buffer[-10:]
        return [[obs["t"], obs["p"], obs["rh"]] for obs in recent]

    def __len__(self) -> int:
        return len(self.buffer)


class EdgeSimulator:
    def __init__(self, config: Optional[StationConfig] = None, publisher: Optional[MQTTPublisher] = None) -> None:
        self.config = config or StationConfig()
        self.ring_buffer = RingBuffer(capacity=12)
        self.step_counter = 0
        self.publisher = publisher or MQTTPublisher()
        self.running = False

    def generate_observation(self, mode: AnomalyMode = AnomalyMode.NORMAL) -> Dict[str, float]:
        t_base = 25.0 + 5.0 * math.sin(self.step_counter * 0.1)
        p_base = 1013.25 - 2.0 * math.cos(self.step_counter * 0.05)
        rh_base = 60.0 + 10.0 * math.cos(self.step_counter * 0.1)

        self.step_counter += 1

        if mode == AnomalyMode.FROZEN_ADC:
            return {"t": t_base, "p": p_base, "rh": 99.0}
        elif mode == AnomalyMode.SUPER_SATURATION:
            return {"t": t_base, "p": p_base, "rh": 105.0}
        elif mode == AnomalyMode.THERMO_VIOLATION:
            return {"t": t_base, "p": p_base, "rh": 110.0}
        elif mode == AnomalyMode.MICROBURST_SIM:
            return {"t": t_base - 8.0, "p": p_base + 12.0, "rh": 95.0}
        else:
            return {"t": round(t_base, 2), "p": round(p_base, 2), "rh": round(rh_base, 2)}

    def evaluate_qc(self, t: float, p: float, rh: float) -> Tuple[Dict[str, bool], int]:
        qc_flags = {
            "thermo_violation": False,
            "frozen_register": False,
            "physical_limit_exceeded": False,
        }
        bitmask = 0

        e_s = calculate_sonntag_e_s(t)
        e = (rh / 100.0) * e_s

        if e > 1.03 * e_s:
            qc_flags["physical_limit_exceeded"] = True
            bitmask |= BITMASK_PHYSICAL_LIMIT

        t_dew = calculate_dew_point(t, rh)
        if t_dew > t + 1e-4:
            qc_flags["thermo_violation"] = True
            bitmask |= BITMASK_THERMO_INVARIANT

        rh_window = self.ring_buffer.get_rh_values()
        if len(rh_window) >= 12:
            all_above_98 = all(val >= 98.0 for val in rh_window)
            var_rh = statistics.variance(rh_window) if len(rh_window) > 1 else 0.0
            if all_above_98 and var_rh < 1e-4:
                qc_flags["frozen_register"] = True
                bitmask |= BITMASK_FROZEN_REGISTER

        return qc_flags, bitmask

    def process_step(
        self, mode: AnomalyMode = AnomalyMode.NORMAL, timestamp: Optional[datetime] = None
    ) -> Dict[str, Any]:
        obs = self.generate_observation(mode)
        self.ring_buffer.append(obs)

        qc_flags, qc_bitmask = self.evaluate_qc(obs["t"], obs["p"], obs["rh"])

        z_scores = {
            "z_t": 0.0,
            "z_p": 0.0,
            "z_rh": 0.0,
        }

        dt_str = (
            timestamp or datetime.now(timezone.utc)
        ).strftime("%Y-%m-%dT%H:%M:%SZ")

        geojson_payload = {
            "id": self.config.urn_id,
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [
                    self.config.longitude,
                    self.config.latitude,
                    self.config.elevation,
                ],
            },
            "properties": {
                "station_id": self.config.station_id,
                "datetime": dt_str,
                "t": obs["t"],
                "p": obs["p"],
                "rh": obs["rh"],
                "z_scores": z_scores,
                "qc_flags": qc_flags,
                "qc_bitmask": qc_bitmask,
            },
        }

        return geojson_payload

    def run_loop(
        self,
        broker: str = "localhost",
        port: int = 1883,
        interval: float = 1.0,
        mode: AnomalyMode = AnomalyMode.NORMAL,
    ) -> None:
        """Connects to MQTT broker and continuously samples/publishes observations."""
        self.publisher.connect(host=broker, port=port)
        self.running = True

        def handle_signal(sig, frame):
            print("\nShutting down Edge Simulator...")
            self.running = False

        signal.signal(signal.SIGINT, handle_signal)
        signal.signal(signal.SIGTERM, handle_signal)

        print(f"Started Edge Simulator for station {self.config.station_id}. Publishing to {broker}:{port}...")

        try:
            while self.running:
                payload = self.process_step(mode=mode)
                self.publisher.publish_payload(self.config.station_id, payload)
                time.sleep(interval)
        finally:
            self.publisher.disconnect()
            print("Edge Simulator disconnected.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Edge Simulator for AWS WIS 2.0 MQTT telemetry.")
    parser.add_argument("--broker", type=str, default="localhost", help="MQTT Broker host (default: localhost)")
    parser.add_argument("--port", type=int, default=1883, help="MQTT Broker port (default: 1883)")
    parser.add_argument("--station-id", type=str, default="DELHI_AWS_04", help="Station ID (default: DELHI_AWS_04)")
    parser.add_argument("--interval", type=float, default=1.0, help="Sampling interval in seconds (default: 1.0)")
    parser.add_argument(
        "--anomaly-mode",
        type=str,
        default="NORMAL",
        choices=[mode.name for mode in AnomalyMode],
        help="Anomaly injection mode (default: NORMAL)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    mode = AnomalyMode[args.anomaly_mode]
    urn_id = f"urn:wmo:md:in-imd:station_{args.station_id.lower()}:data"
    
    config = StationConfig(
        station_id=args.station_id,
        urn_id=urn_id,
    )
    simulator = EdgeSimulator(config=config)
    simulator.run_loop(
        broker=args.broker,
        port=args.port,
        interval=args.interval,
        mode=mode,
    )


if __name__ == "__main__":
    main()
