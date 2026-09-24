from typing import Any, Dict, List
import numpy as np


class ReliabilityMetrics:
    """
    Computes Expected Calibration Error (ECE) and builds calibration curve data.
    """

    @staticmethod
    def calculate_ece(
        probabilities: np.ndarray,
        ground_truth: np.ndarray,
        num_bins: int = 10,
    ) -> tuple[float, List[Dict[str, Any]]]:
        """
        ECE = sum_b (|B_m| / N) * |acc(B_m) - conf(B_m)|
        """
        bins = np.linspace(0.0, 1.0, num_bins + 1)
        bin_indices = np.digitize(probabilities, bins) - 1

        n_samples = len(probabilities)
        ece = 0.0
        curve_data = []

        for b in range(num_bins):
            mask = bin_indices == b
            bin_size = np.sum(mask)

            if bin_size > 0:
                acc = float(np.mean(ground_truth[mask]))
                conf = float(np.mean(probabilities[mask]))
                ece += (bin_size / n_samples) * abs(acc - conf)

                curve_data.append({
                    "bin": b,
                    "range": [round(bins[b], 2), round(bins[b + 1], 2)],
                    "confidence": round(conf, 4),
                    "accuracy": round(acc, 4),
                    "sample_count": int(bin_size),
                })

        return round(float(ece), 4), curve_data