from datetime import datetime
import math
from typing import Dict, Tuple

CLIMATE_HARMONICS: Dict[str, Dict[str, float]] = {
    "indo_gangetic": {
        "mean_temp": 26.5,
        "s1_amp": 5.8, "s1_phase": 0.65,
        "s2_amp": 1.4, "s2_phase": 0.20,
    },
    "monsoon_coastal": {
        "mean_temp": 28.0,
        "s1_amp": 2.2, "s1_phase": 0.85,
        "s2_amp": 0.7, "s2_phase": 0.15,
    },
    "arid_desert": {
        "mean_temp": 31.0,
        "s1_amp": 8.5, "s1_phase": 0.50,
        "s2_amp": 2.1, "s2_phase": 0.30,
    },
    "composite": {
        "mean_temp": 25.0,
        "s1_amp": 4.5, "s1_phase": 0.70,
        "s2_amp": 1.1, "s2_phase": 0.25,
    },
    "subtropical_humid": {
        "mean_temp": 22.0,
        "s1_amp": 4.0, "s1_phase": 0.60,
        "s2_amp": 1.0, "s2_phase": 0.20,
    },
}


class FourierHarmonicModel:
    """
    Computes diurnal S1 (24h) and semi-diurnal S2 (12h) periodic expectations[cite: 1, 2].
    Residuals represent probabilistic temporal divergence rather than definitive fault proofs[cite: 1, 2].
    """

    @staticmethod
    def calculate_expected_temperature(
        ts: datetime,
        climate_region: str,
        elevation_m: float = 0.0,
    ) -> Tuple[float, float]:
        """
        Calculates expected harmonic value and residual spread envelope.
        Output: (expected_temperature, expected_sigma)
        """
        params = CLIMATE_HARMONICS.get(climate_region, CLIMATE_HARMONICS["composite"])

        # Fractional day progression [0, 2pi]
        hour_fraction = ts.hour + (ts.minute / 60.0) + (ts.second / 3600.0)
        t_24 = 2.0 * math.pi * (hour_fraction / 24.0)
        t_12 = 4.0 * math.pi * (hour_fraction / 24.0)

        # Base temperature adjusted by environmental lapse rate (-6.5°C / 1000m)
        base_temp = params["mean_temp"] - (elevation_m / 1000.0) * 6.5

        # Fourier summation: S1 (24h) + S2 (12h)
        s1 = params["s1_amp"] * math.cos(t_24 - params["s1_phase"])
        s2 = params["s2_amp"] * math.cos(t_12 - params["s2_phase"])
        expected = base_temp + s1 + s2

        expected_sigma = 1.2 if climate_region == "monsoon_coastal" else 2.1
        return expected, expected_sigma