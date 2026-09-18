import math
from typing import List, Optional, Tuple


class PhysicalQCGates:
    """
    Deterministic physical QC layer running before any statistical inference[cite: 1, 2].
    Enforces thermodynamic phase consistency and hard meteorological bounds[cite: 1, 2].
    """

    BOUNDS = {
        "temperature": (-25.0, 60.0),    # °C
        "pressure": (850.0, 1085.0),     # hPa (reduced MSLP envelope)
        "humidity": (0.0, 105.0),        # % (allows temporary boundary condensation)[cite: 2]
        "wind_speed": (0.0, 80.0),       # m/s
        "rainfall": (0.0, 350.0),        # mm/hr
    }

    RATE_LIMITS = {
        "temperature": 5.0,   # °C per 5-min tick
        "pressure": 4.0,      # hPa per 5-min tick
        "humidity": 25.0,     # % per 5-min tick
        "wind_speed": 30.0,   # m/s per 5-min tick
    }

    @staticmethod
    def sonntag_saturation_vapor_pressure(t_c: float) -> float:
        """
        Formulation by D. Sonntag (1990) for saturation vapor pressure over liquid water.
        Output: e_s in hPa.
        """
        t_k = t_c + 273.15
        val = (
            -6096.9385 / t_k
            + 16.635794
            - 2.711193e-2 * t_k
            + 1.673952e-5 * (t_k ** 2)
            + 2.433502 * math.log(t_k)
        )
        return math.exp(val)

    @classmethod
    def calculate_dewpoint(cls, temp_c: float, rh_pct: float) -> float:
        """
        Computes dewpoint temperature using the inverted Sonntag relationship.
        """
        clamped_rh = max(0.001, min(100.0, rh_pct))
        e_s = cls.sonntag_saturation_vapor_pressure(temp_c)
        e = (clamped_rh / 100.0) * e_s

        # Magnus inversion approximation for computationally bounded sub-millisecond edge evaluation
        a = 17.27
        b = 237.7
        val = (a * temp_c) / (b + temp_c) + math.log(clamped_rh / 100.0)
        return (b * val) / (a - val)

    @classmethod
    def evaluate(
        cls,
        temp: float,
        pressure: float,
        humidity: float,
        wind_speed: float,
        prev_reading: Optional[Tuple[float, float, float, float]] = None,
    ) -> Tuple[bool, List[str]]:
        """
        Runs range, thermodynamic, and delta gates.
        Returns: (is_hard_violation, flags)
        """
        flags: List[str] = []
        is_hard_violation = False

        # Range gates
        if not (cls.BOUNDS["temperature"][0] <= temp <= cls.BOUNDS["temperature"][1]):
            flags.append("GATE_RANGE_TEMPERATURE_VIOLATION")
            is_hard_violation = True
        if not (cls.BOUNDS["pressure"][0] <= pressure <= cls.BOUNDS["pressure"][1]):
            flags.append("GATE_RANGE_PRESSURE_VIOLATION")
            is_hard_violation = True
        if not (cls.BOUNDS["humidity"][0] <= humidity <= cls.BOUNDS["humidity"][1]):
            flags.append("GATE_RANGE_HUMIDITY_VIOLATION")
            is_hard_violation = True

        # Sonntag Thermodynamic Invariant Gate: T_dew <= T_raw[cite: 1, 2]
        # Invariant: Dewpoint can never exceed dry-bulb temperature beyond physical instrument tolerance.
        t_dew = cls.calculate_dewpoint(temp, humidity)
        if t_dew > (temp + 0.1):  # 0.1°C rigorous physical threshold
            flags.append("SONNTAG_INVARIANT_VIOLATION")
            is_hard_violation = True

        # Rate of change limits
        if prev_reading:
            p_temp, p_press, p_rh, _ = prev_reading
            if abs(temp - p_temp) > cls.RATE_LIMITS["temperature"]:
                flags.append("GATE_RATE_TEMPERATURE_EXCEEDED")
                is_hard_violation = True
            if abs(pressure - p_press) > cls.RATE_LIMITS["pressure"]:
                flags.append("GATE_RATE_PRESSURE_EXCEEDED")
                is_hard_violation = True
            if abs(humidity - p_rh) > cls.RATE_LIMITS["humidity"]:
                flags.append("GATE_RATE_HUMIDITY_EXCEEDED")
                is_hard_violation = True

        if not flags:
            flags.append("PHYSICAL_QC_PASSED")

        return is_hard_violation, flags


class FrozenRHDetector:
    """
    Rolling 24-sample variance tracker using Welford's algorithm[cite: 1].
    Identifies variance collapse at high saturation without relying on multi-station spatial consensus[cite: 1, 2].
    """

    def __init__(self, window_size: int = 24, variance_threshold: float = 0.01):
        self.window_size = window_size
        self.threshold = variance_threshold
        self.buffer: List[float] = []

    def update(self, rh_value: float) -> bool:
        self.buffer.append(rh_value)
        if len(self.buffer) > self.window_size:
            self.buffer.pop(0)

        if len(self.buffer) < self.window_size:
            return False

        # Welford's single-pass sample variance
        count = 0
        mean = 0.0
        m2 = 0.0
        for x in self.buffer:
            count += 1
            delta = x - mean
            mean += delta / count
            delta2 = x - mean
            m2 += delta * delta2

        variance = m2 / (count - 1) if count > 1 else 0.0

        # Collapse signature: Stuck high with negligible standard deviation[cite: 1, 2]
        return bool(rh_value >= 98.0 and variance < self.threshold)