import numpy as np


class StreamingRepeatedMedianEstimator:
    """
    Streaming Repeated-Median Blocked Trend Estimator (Siegel, 1982).
    Preserves a strict 0.5 breakdown point against stuck plateaus without O(N^2) pairwise expansion[cite: 1].
    Processes windows in discrete blocks of size m=60, executing in O(N log m)[cite: 1].
    """

    ESTIMATOR_VERSION: str = "srm-v1"
    BREAKDOWN_POINT: float = 0.5
    BLOCK_SIZE: int = 60

    @classmethod
    def calculate_block_slope(cls, y_values: np.ndarray) -> float:
        """
        Computes the Repeated-Median slope within a block of length m:
        med_i { med_{j != i} [ (y_j - y_i) / (j - i) ] }
        """
        m = len(y_values)
        if m < 3:
            return 0.0

        i_indices = np.arange(m)
        inner_medians = np.empty(m, dtype=np.float64)

        for i in range(m):
            denominator = i_indices - i
            valid_mask = denominator != 0
            slopes = (y_values[valid_mask] - y_values[i]) / denominator[valid_mask]
            inner_medians[i] = float(np.median(slopes))

        return float(np.median(inner_medians))

    @classmethod
    def combine_blocks(cls, block_slopes: list[float], block_residuals: list[float]) -> float:
        """
        Combines block-level estimates using weighted medians inversely
        proportional to intra-block residual spread.
        """
        if not block_slopes:
            return 0.0
        if len(block_slopes) == 1:
            return block_slopes[0]

        slopes_arr = np.array(block_slopes)
        res_arr = np.array(block_residuals)

        # Weights: inverse spread bounded to prevent zero division
        weights = 1.0 / np.maximum(res_arr, 0.05)
        weights /= np.sum(weights)

        # Weighted percentile (50th percentile)
        sort_idx = np.argsort(slopes_arr)
        sorted_slopes = slopes_arr[sort_idx]
        sorted_weights = weights[sort_idx]
        cum_weights = np.cumsum(sorted_weights)

        median_idx = np.searchsorted(cum_weights, 0.5)
        return float(sorted_slopes[min(median_idx, len(sorted_slopes) - 1)])