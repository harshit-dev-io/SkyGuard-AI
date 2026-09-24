import logging
from typing import List, Tuple
import numpy as np
from sklearn.model_selection import train_test_split

from ..models import FaultClass
from .fault_classifier import MultiClassFaultClassifier
from .feature_builder import EvidenceFeatureBuilder

logger = logging.getLogger("skyguard.classifier.train")
from app.config.settings import settings

def generate_synthetic_and_weak_training_data(
    n_samples: int = 4000,
) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """
    Generates synthetic physics fault injections + weak supervision samples
    mirroring Sonntag gate residuals, stuck RH, power sags, and CUSUM drifts.
    """
    dim = EvidenceFeatureBuilder.get_dimension()
    X = np.random.normal(loc=0.0, scale=0.5, size=(n_samples, dim)).astype(np.float32)
    y = np.zeros(n_samples, dtype=np.int32)
    climate_regions: List[str] = []

    regions = ["indo_gangetic", "monsoon_coastal", "arid_desert", "composite"]

    for i in range(n_samples):
        cr = regions[i % len(regions)]
        climate_regions.append(cr)
        target_class = i % len(FaultClass)
        y[i] = target_class

        # Synthesize characteristic physics signatures per class
        if target_class == 1:  # STUCK_SENSOR
            X[i, 9] = 0.0  # slope = 0
            X[i, 1] = 3.5  # high cusum
            X[i, 10] = 5.2 # high innovation
        elif target_class == 2:  # DRIFT
            X[i, 9] = 0.08 # persistent slope
            X[i, 1] = 2.8
        elif target_class == 7:  # COMMUNICATION_FAULT
            X[i, 12] = 1.0 # incomplete evidence
        elif target_class == 8:  # POWER_FAULT
            X[i, 6] = 1.0  # shared power segment correlation

    return X, y, climate_regions


def run_training_pipeline(version: str = "et-v1.0.0") -> dict:
    """Executes scheduled model training and fits isotonic calibration curves."""
    logger.info(f"Starting training run for version {version}...")
    X, y, climate_regions = generate_synthetic_and_weak_training_data()

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.25, stratify=y, random_state=42
    )

    classifier = MultiClassFaultClassifier(model_version=version)
    classifier.model.fit(X_train, y_train)
    classifier.is_trained = True

    # Multi-tier calibration fit on validation slice
    val_probas = classifier.model.predict_proba(X_val)
    val_regions = climate_regions[-len(X_val):]

    for class_idx, class_enum in enumerate(FaultClass):
        binary_gt = (y_val == class_idx).astype(np.float32)
        raw_class_scores = val_probas[:, class_idx]

        for region in set(val_regions):
            region_mask = np.array([r == region for r in val_regions])
            if np.sum(region_mask) >= 10:
                classifier.calibrator.fit_class_region(
                    fault_class=class_enum.value,
                    climate_region=region,
                    raw_scores=raw_class_scores[region_mask],
                    binary_ground_truth=binary_gt[region_mask],
                )

        # Global fallback curve for the class
        classifier.calibrator.fit_class_region(
            fault_class=class_enum.value,
            climate_region="composite",
            raw_scores=raw_class_scores,
            binary_ground_truth=binary_gt,
        )

    classifier.save(settings.MODEL_ARTIFACTS_DIR)
    logger.info(f"Model and calibrators saved to {settings.MODEL_ARTIFACTS_DIR}")

    train_score = float(classifier.model.score(X_train, y_train))
    val_score = float(classifier.model.score(X_val, y_val))

    return {
        "status": "success",
        "model_version": version,
        "train_accuracy": round(train_score, 4),
        "val_accuracy": round(val_score, 4),
        "total_samples": len(X),
    }


if __name__ == "__main__":
    run_training_pipeline()