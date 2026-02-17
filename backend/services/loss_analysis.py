"""
Loss Analysis Service
=====================
Computes energy-loss breakdown for a wind turbine SCADA dataset.

Losses computed
---------------
- **Downtime loss**: Energy lost when turbine was unavailable while
  wind was above cut-in speed.
- **Cut-out loss**: Energy lost during high-wind shutdown events
  (wind speed ≥ cut-out threshold).
- **Missing data**: Percentage of expected records that are absent.
- **Operational energy**: Actual energy produced during the period.
- **Theoretical energy**: Energy that *would* have been produced if
  the turbine ran at the IEC power-curve prediction for every
  timestamp with valid wind data.

All energy values are in kWh.
"""

from __future__ import annotations

import logging
from typing import Any, Callable, Dict, Optional

import numpy as np
import pandas as pd

from utils.helpers import safe_round

logger = logging.getLogger(__name__)

# ── OpenOA imports (optional) ──────────────────────────────────────
OPENOA_AVAILABLE = False
try:
    from openoa.utils.unit_conversion import convert_power_to_energy
    from openoa.utils.timeseries import determine_frequency

    OPENOA_AVAILABLE = True
except ImportError:
    pass

# ── Default turbine constants ──────────────────────────────────────
DEFAULT_CUT_IN_WS = 3.0    # m/s
DEFAULT_CUT_OUT_WS = 25.0  # m/s


# ====================================================================
# Public API
# ====================================================================

def compute_loss_breakdown(
    df: pd.DataFrame,
    rated_power_kw: float,
    *,
    curve_fn: Optional[Callable] = None,
    cut_in_ws: float = DEFAULT_CUT_IN_WS,
    cut_out_ws: float = DEFAULT_CUT_OUT_WS,
) -> Dict[str, Any]:
    """
    Compute a structured energy-loss breakdown.

    Parameters
    ----------
    df : DataFrame
        Cleaned SCADA DataFrame with columns ``timestamp``, ``wind_speed``,
        ``power`` and optionally ``availability``.
    rated_power_kw : float
        Nameplate capacity (kW).
    curve_fn : callable, optional
        IEC power-curve function (wind_speed → expected_power).  When
        provided, theoretical energy is computed using this curve.
    cut_in_ws : float
        Wind speed below which the turbine does not generate.
    cut_out_ws : float
        Wind speed above which the turbine shuts down for safety.

    Returns
    -------
    dict
        ``downtime_loss_kwh``, ``cutout_loss_kwh``,
        ``missing_data_percent``, ``operational_energy_kwh``,
        ``theoretical_energy_kwh``.
    """
    logger.info("Computing loss breakdown for %d records", len(df))

    sample_hours = _detect_sample_hours(df)

    # ── Availability mask ──────────────────────────────────────────
    unavailable = _build_unavailability_mask(df, cut_in_ws)

    # ── Theoretical & operational energy ───────────────────────────
    theoretical_kwh = _theoretical_energy(
        df, rated_power_kw, curve_fn, sample_hours, cut_in_ws, cut_out_ws,
    )
    operational_kwh = _operational_energy(df, sample_hours)

    # ── Downtime loss ──────────────────────────────────────────────
    downtime_kwh = _downtime_loss(
        df, unavailable, rated_power_kw, curve_fn, sample_hours, cut_in_ws,
    )

    # ── Cut-out loss ───────────────────────────────────────────────
    cutout_kwh = _cutout_loss(df, rated_power_kw, sample_hours, cut_out_ws)

    # ── Missing data ───────────────────────────────────────────────
    missing_pct = _missing_data_percent(df)

    result = {
        "downtime_loss_kwh": safe_round(downtime_kwh, 2),
        "cutout_loss_kwh": safe_round(cutout_kwh, 2),
        "missing_data_percent": safe_round(missing_pct, 2),
        "operational_energy_kwh": safe_round(operational_kwh, 2),
        "theoretical_energy_kwh": safe_round(theoretical_kwh, 2),
    }

    logger.info(
        "Loss breakdown: downtime=%.1f kWh, cutout=%.1f kWh, "
        "missing=%.1f%%, operational=%.1f kWh, theoretical=%.1f kWh",
        downtime_kwh, cutout_kwh, missing_pct, operational_kwh, theoretical_kwh,
    )
    return result


# ====================================================================
# Internal helpers
# ====================================================================

def _detect_sample_hours(df: pd.DataFrame) -> float:
    """Return sampling interval in hours."""
    if OPENOA_AVAILABLE:
        try:
            freq = determine_frequency(df, index_col="timestamp")
            return pd.Timedelta(freq).total_seconds() / 3600
        except Exception:
            pass
    # Fallback: median inter-sample interval
    if len(df) > 1:
        diffs = df["timestamp"].diff().dt.total_seconds().dropna()
        return float(diffs.median()) / 3600
    return 1.0  # default to 1 h


def _build_unavailability_mask(
    df: pd.DataFrame,
    cut_in_ws: float,
) -> pd.Series:
    """
    Boolean mask — ``True`` where turbine is *unavailable*.

    If an ``availability`` column exists (0/1 or fraction), use it.
    Otherwise infer: unavailable = power ≤ 0 AND wind_speed > cut_in.
    """
    if "availability" in df.columns:
        avail = pd.to_numeric(df["availability"], errors="coerce").fillna(1)
        # Normalise: values > 1 are likely percentages
        if avail.max() > 1:
            avail = avail / 100.0
        return avail < 0.5  # treat < 50% as unavailable
    # Inferred unavailability
    return (df["power"] <= 0) & (df["wind_speed"] > cut_in_ws)


def _theoretical_energy(
    df: pd.DataFrame,
    rated_power_kw: float,
    curve_fn: Optional[Callable],
    sample_hours: float,
    cut_in_ws: float,
    cut_out_ws: float,
) -> float:
    """
    Energy that would be produced if the turbine were always available
    and followed the power curve.
    """
    ws = df["wind_speed"].values

    if curve_fn is not None:
        try:
            expected_power = np.array(curve_fn(ws), dtype=float)
            expected_power = np.nan_to_num(expected_power, nan=0.0)
            expected_power = np.clip(expected_power, 0, rated_power_kw)
        except Exception:
            expected_power = _simple_expected_power(ws, rated_power_kw, cut_in_ws, cut_out_ws)
    else:
        expected_power = _simple_expected_power(ws, rated_power_kw, cut_in_ws, cut_out_ws)

    return float(np.nansum(expected_power) * sample_hours)


def _simple_expected_power(
    ws: np.ndarray,
    rated_power_kw: float,
    cut_in_ws: float,
    cut_out_ws: float,
) -> np.ndarray:
    """Cubic-law power estimate when no IEC curve function is available."""
    rated_ws = 12.0
    power = np.zeros_like(ws, dtype=float)
    operating = (ws >= cut_in_ws) & (ws <= cut_out_ws) & np.isfinite(ws)
    below_rated = operating & (ws < rated_ws)
    at_or_above_rated = operating & (ws >= rated_ws)
    fraction = np.clip((ws[below_rated] - cut_in_ws) / (rated_ws - cut_in_ws), 0, 1) ** 3
    power[below_rated] = fraction * rated_power_kw
    power[at_or_above_rated] = rated_power_kw
    return power


def _operational_energy(df: pd.DataFrame, sample_hours: float) -> float:
    """Actual energy produced."""
    if OPENOA_AVAILABLE:
        try:
            freq = determine_frequency(df, index_col="timestamp")
            energy = convert_power_to_energy(
                "power", sample_rate_min=str(freq), data=df,
            )
            return float(energy.sum())
        except Exception:
            pass
    return float(df["power"].clip(lower=0).sum() * sample_hours)


def _downtime_loss(
    df: pd.DataFrame,
    unavailable: pd.Series,
    rated_power_kw: float,
    curve_fn: Optional[Callable],
    sample_hours: float,
    cut_in_ws: float,
) -> float:
    """Energy lost because the turbine was down when wind was available."""
    down_df = df.loc[unavailable]
    if len(down_df) == 0:
        return 0.0

    ws = down_df["wind_speed"].values
    if curve_fn is not None:
        try:
            expected = np.array(curve_fn(ws), dtype=float)
            expected = np.nan_to_num(expected, nan=0.0)
            expected = np.clip(expected, 0, rated_power_kw)
        except Exception:
            expected = _simple_expected_power(
                ws, rated_power_kw, cut_in_ws, 25.0,
            )
    else:
        expected = _simple_expected_power(ws, rated_power_kw, cut_in_ws, 25.0)

    return float(np.nansum(expected) * sample_hours)


def _cutout_loss(
    df: pd.DataFrame,
    rated_power_kw: float,
    sample_hours: float,
    cut_out_ws: float,
) -> float:
    """Energy lost due to high-wind cut-out events."""
    cutout_mask = df["wind_speed"] >= cut_out_ws
    n_cutout = int(cutout_mask.sum())
    # During cut-out the turbine could theoretically run at rated power
    return float(n_cutout * rated_power_kw * sample_hours)


def _missing_data_percent(df: pd.DataFrame) -> float:
    """Percentage of rows with NaN in wind_speed or power."""
    total = len(df)
    if total == 0:
        return 0.0
    missing = df[["wind_speed", "power"]].isna().any(axis=1).sum()
    return float(missing / total * 100)
