from typing import List, Tuple
import numpy as np
from app.config.settings import settings




class UnscentedKalmanFilterImputer:
    """
    Unscented Kalman Filter (UKF) for scalar non-linear meteorological state updates.
    Implements deterministic sigma-point sampling (Julier-Uhlmann formulation)
    to project Gaussian distributions through spatial physics reductions.
    """

    def __init__(self):
        self.alpha = settings.UKF_ALPHA
        self.beta = settings.UKF_BETA
        self.kappa = settings.UKF_KAPPA
        self.q = settings.UKF_PROCESS_NOISE_Q
        self.r = settings.UKF_DEFAULT_MEASUREMENT_NOISE_R
        self.dim = 1  # 1-D scalar state estimate (temperature, pressure, or RH)

        # Compute scaling parameter lambda
        self.lambda_ = (self.alpha**2) * (self.dim + self.kappa) - self.dim

        # Calculate Sigma Point Weights
        self.wm_0 = self.lambda_ / (self.dim + self.lambda_)
        self.wc_0 = self.wm_0 + (1.0 - self.alpha**2 + self.beta)
        self.wi = 1.0 / (2.0 * (self.dim + self.lambda_))

        self.weights_m = np.array([self.wm_0, self.wi, self.wi], dtype=np.float64)
        self.weights_c = np.array([self.wc_0, self.wi, self.wi], dtype=np.float64)

    def _generate_sigma_points(self, mean: float, variance: float) -> np.ndarray:
        """Generates 2*n + 1 deterministic sigma points."""
        sigma = np.sqrt(max(variance, 1e-6))
        gamma = np.sqrt(self.dim + self.lambda_)
        sp0 = mean
        sp1 = mean + gamma * sigma
        sp2 = mean - gamma * sigma
        return np.array([sp0, sp1, sp2], dtype=np.float64)

    def compute_spatial_consensus_measurement(
        self,
        neighbor_measurements: List[float],
        neighbor_distances: List[float],
    ) -> Tuple[float, float]:
        """
        Inverse-Distance-Weighted (IDW) spatial consensus reduction.
        Returns:
            z_obs: Spatial consensus observation mean.
            r_obs: Empirical measurement error variance adjusted by spatial scatter.
        """
        if not neighbor_measurements:
            raise ValueError("Cannot perform UKF update without neighbor measurements.")

        weights = np.array([1.0 / max(d, 0.5) for d in neighbor_distances], dtype=np.float64)
        weights /= np.sum(weights)

        vals = np.array(neighbor_measurements, dtype=np.float64)
        z_obs = float(np.sum(weights * vals))

        # Measurement variance: combination of baseline sensor noise + spatial scatter
        dispersion = float(np.sum(weights * ((vals - z_obs) ** 2)))
        r_obs = max(self.r, dispersion)

        return z_obs, r_obs

    def solve(
        self,
        prior_mean: float,
        prior_variance: float,
        neighbor_measurements: List[float],
        neighbor_distances: List[float],
    ) -> Tuple[float, float, float, float, float]:
        """
        Executes complete UKF Prediction and Measurement Update Cycle.

        Returns:
            derived_state: Corrected posterior mean physical value.
            posterior_variance: Posterior estimation variance (uncertainty^2).
            innovation: Measurement residual (v = z - z_pred).
            innovation_variance: Innovation covariance (S).
            chi2_metric: Innovation squared normalized by variance (v^2 / S).
        """
        # 1. Time Update (Prediction Phase)
        # Meteorological persistence dynamic model: x_k = x_{k-1} + w
        x_pred = prior_mean
        p_pred = prior_variance + self.q

        # 2. Sigma Point Generation from Predicted Prior
        sigma_points = self._generate_sigma_points(x_pred, p_pred)

        # 3. Measurement Projection
        # Observation model h(x) is linear identity mapping to consensus space: h(x) = x
        z_sigmas = sigma_points

        # Predicted Measurement Mean
        z_pred = float(np.sum(self.weights_m * z_sigmas))

        # Spatial Observation
        z_obs, r_obs = self.compute_spatial_consensus_measurement(
            neighbor_measurements, neighbor_distances
        )

        # 4. Innovation Covariance (S)
        p_zz = float(np.sum(self.weights_c * ((z_sigmas - z_pred) ** 2))) + r_obs

        # Cross-Covariance (P_xz)
        p_xz = float(np.sum(self.weights_c * (sigma_points - x_pred) * (z_sigmas - z_pred)))

        # 5. Kalman Gain (K)
        kalman_gain = p_xz / max(p_zz, 1e-9)

        # 6. Innovation (v) and Chi-Square Metric
        innovation = z_obs - z_pred
        chi2_metric = (innovation**2) / max(p_zz, 1e-9)

        # 7. Posterior State Update
        derived_state = x_pred + kalman_gain * innovation
        posterior_variance = p_pred - (kalman_gain**2) * p_zz

        return (
            float(derived_state),
            float(max(posterior_variance, 1e-6)),
            float(innovation),
            float(p_zz),
            float(chi2_metric),
        )


ukf_imputer = UnscentedKalmanFilterImputer()