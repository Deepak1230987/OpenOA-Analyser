"""
Sample Data Generator
=====================
Creates realistic synthetic wind-turbine SCADA data for testing
and demo purposes.

The generated data mimics a 2 MW onshore turbine with:
  - Weibull-distributed wind speeds (shape=2, scale=8 → mean ≈ 7 m/s)
  - A cubic power curve between cut-in (3 m/s) and rated (12 m/s)
  - Cut-out shutdown above 25 m/s
  - Simulated downtime events (availability loss)
  - Realistic diurnal and seasonal patterns
  - Random sensor noise and occasional missing values (2%)

Column naming
-------------
Output uses user-friendly names (``timestamp``, ``wind_speed``,
``power``, ``wind_direction``, ``ambient_temperature``) which the
validation service maps to OpenOA's IEC-standard names
(``WTUR_W``, ``WMET_HorWdSpd``, etc.) when needed.
"""

import pandas as pd
import numpy as np


def generate_sample_scada(
    rows: int = 720,
    rated_power_kw: float = 2000.0,
    seed: int = 42,
) -> pd.DataFrame:
    """
    Generate *rows* hourly SCADA records.

    Parameters
    ----------
    rows : int
        Number of hourly records (default 720 ≈ 30 days).
    rated_power_kw : float
        Nameplate capacity of the turbine in kW.
    seed : int
        Random seed for reproducibility.

    Returns
    -------
    pd.DataFrame
        Columns: timestamp, wind_speed, power, wind_direction,
        ambient_temperature, turbine_status, pitch_angle,
        relative_wind_direction.
    """
    rng = np.random.default_rng(seed)

    # ── Timestamps (hourly) ─────────────────────────────────────────
    start = pd.Timestamp("2025-01-01 00:00:00")
    timestamps = pd.date_range(start, periods=rows, freq="h")

    # ── Wind speed (Weibull distribution) ───────────────────────────
    # shape=2, scale=8 → mean ≈ 7.1 m/s, typical onshore site
    wind_speed = rng.weibull(2.0, size=rows) * 8.0

    # Add a gentle diurnal pattern (wind picks up in afternoon)
    hour_of_day = np.array([ts.hour for ts in timestamps])
    diurnal = 0.5 * np.sin(2 * np.pi * (hour_of_day - 6) / 24)
    wind_speed = np.clip(wind_speed + diurnal, 0, 35)

    # ── Power output (cubic power curve with cut-in/out) ────────────
    cut_in = 3.0       # m/s
    rated_ws = 12.0    # m/s
    cut_out = 25.0     # m/s

    power = np.zeros(rows)
    for i, ws in enumerate(wind_speed):
        if ws < cut_in or ws > cut_out:
            power[i] = 0.0
        elif ws >= rated_ws:
            power[i] = rated_power_kw
        else:
            # Cubic relationship between cut-in and rated
            fraction = ((ws - cut_in) / (rated_ws - cut_in)) ** 3
            power[i] = fraction * rated_power_kw

    # Add Gaussian noise (± 3% of rated)
    noise = rng.normal(0, rated_power_kw * 0.03, size=rows)
    power = np.clip(power + noise, 0, rated_power_kw * 1.02)

    # ── Simulated downtime events (availability loss) ──────────────
    # ~5% of the time, turbine is down regardless of wind
    n_downtime = int(rows * 0.05)
    downtime_starts = rng.choice(
        max(1, rows - 6), size=max(1, n_downtime // 4), replace=False,
    )
    for start_idx in downtime_starts:
        duration = rng.integers(2, 7)  # 2–6 consecutive hours
        end_idx = min(start_idx + duration, rows)
        power[start_idx:end_idx] = 0.0

    # ── Wind direction (slowly varying with prevailing westerlies) ──
    base_dir = rng.uniform(180, 270)  # prevailing westerly
    wind_direction = (
        base_dir
        + 30 * np.sin(2 * np.pi * np.arange(rows) / (rows / 3))
        + rng.normal(0, 15, size=rows)
    ) % 360

    # ── Ambient temperature (seasonal + diurnal) ────────────────────
    day_of_year = np.array([ts.dayofyear for ts in timestamps])
    seasonal = 10 * np.sin(2 * np.pi * (day_of_year - 100) / 365)
    diurnal_temp = 5 * np.sin(2 * np.pi * (hour_of_day - 14) / 24)
    ambient_temperature = (
        10 + seasonal + diurnal_temp + rng.normal(0, 2, size=rows)
    )

    # ── Introduce missing values (2%) ──────────────────────────────
    n_missing = int(rows * 0.02)
    missing_idx = rng.choice(rows, size=n_missing, replace=False)
    wind_speed[missing_idx[: n_missing // 2]] = np.nan
    power[missing_idx[n_missing // 2 :]] = np.nan

    # ── Turbine status codes ───────────────────────────────────────
    # 1 = normal operation, 0 = stopped, 2 = maintenance
    turbine_status = np.ones(rows, dtype=int)
    # Mark downtime periods as status 0 (stopped)
    for start_idx in downtime_starts:
        duration = min(rng.integers(2, 7), rows - start_idx)
        turbine_status[start_idx:start_idx + duration] = 0
    # A few maintenance events (~1%)
    n_maint = max(1, int(rows * 0.01))
    maint_idx = rng.choice(rows, size=n_maint, replace=False)
    turbine_status[maint_idx] = 2

    # ── Blade pitch angle (degrees) ────────────────────────────────
    # Below rated wind speed: pitch ≈ 0° (optimal angle)
    # Above rated: pitch increases to limit power (towards feather ~90°)
    pitch_angle = np.zeros(rows)
    for i, ws in enumerate(wind_speed):
        if np.isnan(ws) or ws < cut_in:
            pitch_angle[i] = 0.0
        elif ws >= rated_ws:
            # Linear ramp from 0° at rated to ~25° at cut-out
            pitch_angle[i] = min(
                25.0 * (ws - rated_ws) / (cut_out - rated_ws), 90.0
            )
        else:
            pitch_angle[i] = 0.0
    pitch_angle += rng.normal(0, 0.5, size=rows)  # sensor noise
    pitch_angle = np.clip(pitch_angle, -2, 90)

    # ── Relative wind direction (wind vane / yaw error) ────────────
    # Small yaw error centred around 0° with some drift
    relative_wind_direction = (
        rng.normal(0, 5, size=rows)
        + 3 * np.sin(2 * np.pi * np.arange(rows) / (rows / 2))
    )
    relative_wind_direction = np.clip(relative_wind_direction, -30, 30)

    # ── Assemble DataFrame ──────────────────────────────────────────
    df = pd.DataFrame(
        {
            "timestamp": timestamps.strftime("%Y-%m-%d %H:%M:%S"),
            "wind_speed": np.round(wind_speed, 2),
            "power": np.round(power, 2),
            "wind_direction": np.round(wind_direction, 1),
            "ambient_temperature": np.round(ambient_temperature, 1),
            "turbine_status": turbine_status,
            "pitch_angle": np.round(pitch_angle, 2),
            "relative_wind_direction": np.round(relative_wind_direction, 1),
        }
    )

    return df
