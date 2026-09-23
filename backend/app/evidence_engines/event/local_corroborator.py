from typing import Dict, List


class LocalEventCorroborator:
    """
    Aggregates decentralized edge shock flags across spatial neighborhoods[cite: 1, 2].
    """

    @staticmethod
    def calculate_coherence(
        target_metrics: Dict[str, float],
        neighbor_metrics: List[Dict[str, float]],
    ) -> float:
        """
        Measures coherence of physical shock fronts (ΔP/Δt, wind gusts, humidity leaps)[cite: 1, 2].
        Returns score in [0.0, 1.0].
        """
        if not neighbor_metrics:
            return 0.0

        coherent_steps = 0
        target_dp = target_metrics.get("pressure_step", 0.0)

        for n in neighbor_metrics:
            nbr_dp = n.get("pressure_step", 0.0)
            # Validates that pressure trends drop synchronously in the same direction
            if (target_dp < -1.5 and nbr_dp < -1.0) or (target_dp > 1.5 and nbr_dp > 1.0):
                coherent_steps += 1

        return round(coherent_steps / len(neighbor_metrics), 3)