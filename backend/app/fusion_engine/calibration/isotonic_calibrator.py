import os
import pickle
from typing import Dict, Optional, Tuple
import numpy as np
from sklearn.isotonic import IsotonicRegression
from ..models import FaultClass

from app.config.settings import settings

class MultiTierConfidenceCalibrator:
    """
    Per-Class & Per-Climate-Region Isotonic Regression Calibrator.
    Eliminates non-sigmoid score saturation (e.g. frozen plateaus vs. slow drift)
    and produces wide uncertainty bands for sparse-sample classes.
    """

    def __init__(self, model_version: str = "iso-v1"):
        self.model_version = model_version
        # Map: (fault_class, climate_region) -> IsotonicRegression
        self.calibrators: Dict[Tuple[str, str], IsotonicRegression] = {}
        # Class frequency records for sparse sample evaluation
        self.class_counts: Dict[str, int] = {fc.value: 0 for fc in FaultClass}

    def fit_class_region(
        self,
        fault_class: str,
        climate_region: str,
        raw_scores: np.ndarray,
        binary_ground_truth: np.ndarray,
    ):
        """Fits isotonic regression on validation slice."""
        if len(raw_scores) < 10:
            return

        iso = IsotonicRegression(out_of_bounds="clip", y_min=0.01, y_max=0.99)
        iso.fit(raw_scores, binary_ground_truth)
        self.calibrators[(fault_class, climate_region)] = iso
        self.class_counts[fault_class] = self.class_counts.get(fault_class, 0) + len(raw_scores)

    def calibrate(
        self,
        fault_class: str,
        climate_region: str,
        raw_score: float,
    ) -> Tuple[float, float, bool]:
        """
        Calibrates raw model probability.
        Returns:
            calibrated_prob: Calibrated point estimate.
            uncertainty_band: ± bound.
            is_sparse: True if class validation data was limited.
        """
        key = (fault_class, climate_region)
        default_key = (fault_class, "composite")

        iso = self.calibrators.get(key) or self.calibrators.get(default_key)
        total_samples = self.class_counts.get(fault_class, 0)
        is_sparse = total_samples < settings.SPARSE_CLASS_SAMPLE_THRESHOLD

        if iso is not None:
            calibrated = float(iso.predict([raw_score])[0])
        else:
            # Linear fallback with damping
            calibrated = float(np.clip(raw_score, 0.05, 0.95))

        # Dynamic uncertainty band calculation (conformal interval proxy)
        if is_sparse or fault_class in (
            FaultClass.ENVIRONMENTAL_CONTAMINATION.value,
            FaultClass.UNKNOWN_FAULT.value,
        ):
            # Sparse validation: emit wide uncertainty interval (e.g., 0.52 ± 0.35)
            uncertainty_band = 0.35
        else:
            # Sufficient validation: tight envelope
            uncertainty_band = round(max(0.04, (1.0 - calibrated) * 0.15), 3)

        return round(calibrated, 4), uncertainty_band, is_sparse

    def save(self, filepath: str):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, "wb") as f:
            pickle.dump(self, f)

    @classmethod
    def load(cls, filepath: str) -> "MultiTierConfidenceCalibrator":
        with open(filepath, "rb") as f:
            return pickle.load(f)