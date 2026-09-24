import os
import pickle
from typing import List, Tuple
import numpy as np
from sklearn.ensemble import ExtraTreesClassifier

from ..calibration.isotonic_calibrator import MultiTierConfidenceCalibrator
from ..models import ClassificationResult, FaultClass
from .feature_builder import EvidenceFeatureBuilder
from datetime import datetime


class MultiClassFaultClassifier:
    """
    10-Class Fault Classifier trained on synthetic + weak supervision labels.
    Enforces ANOMALY != FAULT by running solely on suspicious or conflicting states.
    """

    CLASS_LABELS: List[str] = [fc.value for fc in FaultClass]

    def __init__(self, model_version: str = "et-v1.0.0"):
        self.model_version = model_version
        self.model = ExtraTreesClassifier(
            n_estimators=100,
            max_depth=12,
            min_samples_split=4,
            class_weight="balanced",
            random_state=42,
        )
        self.calibrator = MultiTierConfidenceCalibrator(model_version=model_version)
        self.is_trained = False

    def predict(
        self,
        fused_bundle_dict: dict,
        climate_region: str = "composite",
    ) -> ClassificationResult:
        features = EvidenceFeatureBuilder.extract_features(fused_bundle_dict).reshape(1, -1)
        observation_id = fused_bundle_dict.get("observation_id", "UNKNOWN")
        station_id = fused_bundle_dict.get("station_id", "UNKNOWN")

        if not self.is_trained:
            # Cold-start fallback rule
            return ClassificationResult(
                station_id=station_id,
                observation_id=observation_id,
                predicted_fault=FaultClass.UNKNOWN_FAULT,
                raw_confidence=0.50,
                calibrated_probability=0.50,
                uncertainty_band=0.40,
                calibration_version=self.model_version,
                is_sparse_sample=True,
                produced_at=datetime.utcnow(),
            )

        probas = self.model.predict_proba(features)[0]
        top_idx = int(np.argmax(probas))
        raw_score = float(probas[top_idx])
        predicted_class_name = self.CLASS_LABELS[top_idx]

        calibrated_prob, uncertainty_band, is_sparse = self.calibrator.calibrate(
            fault_class=predicted_class_name,
            climate_region=climate_region,
            raw_score=raw_score,
        )

        return ClassificationResult(
            station_id=station_id,
            observation_id=observation_id,
            predicted_fault=FaultClass(predicted_class_name),
            raw_confidence=round(raw_score, 4),
            calibrated_probability=calibrated_prob,
            uncertainty_band=uncertainty_band,
            calibration_version=self.model_version,
            is_sparse_sample=is_sparse,
            produced_at=datetime.utcnow(),
        )

    def save(self, directory: str):
        os.makedirs(directory, exist_ok=True)
        model_path = os.path.join(directory, f"fault_model_{self.model_version}.pkl")
        calib_path = os.path.join(directory, f"calibrator_{self.model_version}.pkl")

        with open(model_path, "wb") as f:
            pickle.dump(self.model, f)
        self.calibrator.save(calib_path)

    @classmethod
    def load(cls, directory: str, version: str) -> "MultiClassFaultClassifier":
        inst = cls(model_version=version)
        model_path = os.path.join(directory, f"fault_model_{version}.pkl")
        calib_path = os.path.join(directory, f"calibrator_{version}.pkl")

        if os.path.exists(model_path) and os.path.exists(calib_path):
            with open(model_path, "rb") as f:
                inst.model = pickle.load(f)
            inst.calibrator = MultiTierConfidenceCalibrator.load(calib_path)
            inst.is_trained = True
        return inst