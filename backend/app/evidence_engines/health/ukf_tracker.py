import numpy as np


class MeteorologicalUKF:
    """
    Unscented Kalman Filter (UKF) for non-linear atmospheric parameter tracking.
    Avoids manual Jacobian derivation over rapid thermodynamic state shifts.
    """

    def __init__(self, climate_region: str, initial_val: float):
        # State vector: x = [value, rate_of_change]
        self.x = np.array([initial_val, 0.0], dtype=np.float64)
        self.P = np.diag([1.0, 0.1])

        # Region-adaptive process and measurement noise seeds
        if climate_region == "monsoon_coastal":
            self.Q = np.diag([0.08, 0.02])
            self.R = 0.35
        elif climate_region == "arid_desert":
            self.Q = np.diag([0.25, 0.05])
            self.R = 0.85
        else:
            self.Q = np.diag([0.15, 0.03])
            self.R = 0.50

        # Van der Merwe scaled unscented transform parameters
        self.n = 2
        self.alpha = 1e-3
        self.beta = 2.0
        self.kappa = 0.0
        self.lambda_ = (self.alpha ** 2) * (self.n + self.kappa) - self.n

        self._compute_weights()

    def _compute_weights(self):
        w_m = np.full(2 * self.n + 1, 0.5 / (self.n + self.lambda_))
        w_c = np.full(2 * self.n + 1, 0.5 / (self.n + self.lambda_))
        w_m[0] = self.lambda_ / (self.n + self.lambda_)
        w_c[0] = self.lambda_ / (self.n + self.lambda_) + (1 - self.alpha ** 2 + self.beta)
        self.Wm = w_m
        self.Wc = w_c

    def _generate_sigma_points(self) -> np.ndarray:
        sigma = np.empty((2 * self.n + 1, self.n))
        sigma[0] = self.x
        U = np.linalg.cholesky((self.n + self.lambda_) * self.P)
        for i in range(self.n):
            sigma[i + 1] = self.x + U[i]
            sigma[self.n + i + 1] = self.x - U[i]
        return sigma

    def step(self, measurement: float) -> tuple[float, float]:
        """
        Executes Predict-Update cycle.
        Returns: (state_estimate, innovation)
        """
        # 1. Predict
        sigmas = self._generate_sigma_points()
        # State transition: x_{k} = x_{k-1} + dt * dx
        sigmas_f = np.empty_like(sigmas)
        for i, s in enumerate(sigmas):
            sigmas_f[i] = [s[0] + s[1], s[1]]

        x_pred = np.dot(self.Wm, sigmas_f)
        P_pred = np.zeros((self.n, self.n))
        for i in range(2 * self.n + 1):
            y = sigmas_f[i] - x_pred
            P_pred += self.Wc[i] * np.outer(y, y)
        P_pred += self.Q

        # 2. Update
        sigmas_h = sigmas_f[:, 0]  # Measurement function extracts direct physical value
        z_pred = float(np.dot(self.Wm, sigmas_h))

        # Innovation covariance
        S = self.R
        for i in range(2 * self.n + 1):
            diff = sigmas_h[i] - z_pred
            S += self.Wc[i] * (diff ** 2)

        # Cross-covariance
        Pxz = np.zeros(self.n)
        for i in range(2 * self.n + 1):
            Pxz += self.Wc[i] * (sigmas_f[i] - x_pred) * (sigmas_h[i] - z_pred)

        K = Pxz / S  # Kalman gain
        innovation = measurement - z_pred

        self.x = x_pred + K * innovation
        self.P = P_pred - np.outer(K, K) * S

        return float(self.x[0]), float(innovation)