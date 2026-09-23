import math


class MeteorologicalReductions:
    """
    Standard atmospheric physical normalizations.
    Enforces topographic parity prior to calculating spatial distance metrics[cite: 1, 2].
    """

    @staticmethod
    def reduce_pressure_to_msl(
        station_pressure_hpa: float,
        elevation_m: float,
        temperature_c: float,
    ) -> float:
        """
        Reduces absolute surface station pressure to Mean Sea Level (MSL)
        using the hypsometric formulation.
        """
        if elevation_m <= 0.0:
            return station_pressure_hpa

        # Virtual average column temperature in Kelvin
        t_mean_k = (temperature_c + 273.15) + (elevation_m * 0.0065 / 2.0)
        # Barometric height equation exponent
        exponent = (0.034163 * elevation_m) / t_mean_k
        return station_pressure_hpa * math.exp(exponent)

    @staticmethod
    def lapse_rate_temperature_adjustment(
        temp_c: float,
        elevation_source_m: float,
        elevation_target_m: float,
        lapse_rate_per_km: float = 6.5,
    ) -> float:
        """
        Adjusts temperature between two topographic heights using
        the standard environmental lapse rate (0.0065 °C/m).
        """
        dz_meters = elevation_target_m - elevation_source_m
        return temp_c - (dz_meters / 1000.0) * lapse_rate_per_km