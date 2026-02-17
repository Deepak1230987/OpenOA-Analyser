"""
Analysis Service
================
Core analysis pipeline that processes wind-turbine SCADA data using
actual OpenOA 3.2 utilities.

OpenOA integration points used in this module
----------------------------------------------
- ``openoa.utils.filters.range_flag``         – flag out-of-range values
- ``openoa.utils.filters.bin_filter``         – flag power-curve outliers
- ``openoa.utils.filters.unresponsive_flag``  – flag frozen/stuck sensors
- ``openoa.utils.filters.window_range_flag``  – contextual range filtering
- ``openoa.utils.power_curve.functions.IEC``  – IEC 61400-12-1 binned curve
- ``openoa.utils.unit_conversion.convert_power_to_energy`` – kW → kWh
- ``openoa.utils.timeseries.percent_nan``     – NaN percentage per column
- ``openoa.utils.timeseries.find_time_gaps``  – detect timestamp gaps
- ``openoa.utils.timeseries.gap_fill_data_frame`` – insert missing rows
- ``openoa.utils.timeseries.determine_frequency`` – infer sampling freq

Higher-level OpenOA analysis classes (``MonteCarloAEP``,
``TurbineLongTermGrossEnergy``, etc.) require reanalysis data, meter
data, or multi-turbine plant configurations that go beyond a single
SCADA CSV upload.  We therefore use the *utility-layer* functions
directly, which is how many real OpenOA workflows begin before
graduating to the full ``PlantData`` + analysis class pipeline.
"""

from __future__ import annotations

import logging
from typing import IO, Dict, Any, List, Optional, Callable

import pandas as pd
import numpy as np

from utils.helpers import safe_round
from services.loss_analysis import compute_loss_breakdown

logger = logging.getLogger(__name__)

# ── OpenOA imports ──────────────────────────────────────────────────
OPENOA_AVAILABLE = False
try:
    import openoa  # noqa: F401

    from openoa.utils.filters import (
        range_flag,
        bin_filter,
        unresponsive_flag,
        window_range_flag,
    )
    from openoa.utils.power_curve.functions import IEC as iec_power_curve
    from openoa.utils.unit_conversion import convert_power_to_energy
    from openoa.utils.timeseries import (
        percent_nan,
        find_time_gaps,
        gap_fill_data_frame,
        determine_frequency,
    )

    OPENOA_AVAILABLE = True
except ImportError:
    pass


# ── Default turbine parameters ─────────────────────────────────────
DEFAULT_CUT_IN_WS = 3.0    # m/s
DEFAULT_CUT_OUT_WS = 25.0  # m/s
DEFAULT_RATED_WS = 12.0    # m/s


# ====================================================================
# Public entry point
# ====================================================================
def run_full_analysis(
    file_obj: IO[str],
    rated_power_kw: float = 2000.0,
) -> Dict[str, Any]:
    """
    Run the complete operational-assessment pipeline on a SCADA CSV.

    Returns
    -------
    dict with keys:
      method, summary, power_curve, time_series,
      data_quality, monthly_stats, loss_breakdown
    """
    logger.info("Starting full analysis pipeline (rated_power_kw=%.1f)", rated_power_kw)

    df_raw = _load_and_clean(file_obj, rated_power_kw)

    # ── Availability handling ──────────────────────────────────────
    df_raw = _resolve_availability(df_raw)

    # Separate available data for power-curve fitting
    df_available = _filter_unavailable(df_raw)
    logger.info(
        "Records: total=%d, available=%d (%.1f%%)",
        len(df_raw), len(df_available),
        len(df_available) / len(df_raw) * 100 if len(df_raw) else 0,
    )

    # ── IEC power curve (fitted on available data only) ────────────
    power_curve_data, curve_fn = _compute_power_curve(df_available, rated_power_kw)

    result: Dict[str, Any] = {
        "method": "openoa" if OPENOA_AVAILABLE else "fallback",
        "summary": _compute_summary(df_raw, rated_power_kw),
        "power_curve": power_curve_data,
        "time_series": _prepare_time_series(df_raw),
        "data_quality": _assess_data_quality(df_raw, rated_power_kw),
        "monthly_stats": _compute_monthly_stats(df_raw, rated_power_kw),
    }

    # Add wind-rose distribution if direction data is available
    if "wind_direction" in df_raw.columns:
        result["wind_rose"] = _compute_wind_rose(df_raw)

    # ── Temperature analysis (optional) ────────────────────────────
    if "ambient_temperature" in df_raw.columns:
        temp_analysis = _compute_temperature_analysis(df_raw)
        if temp_analysis is not None:
            result["temperature_analysis"] = temp_analysis

    # ── Pitch analysis (optional) ───────────────────────────────
    if "pitch_angle" in df_raw.columns:
        pitch_analysis = _compute_pitch_analysis(df_raw)
        if pitch_analysis is not None:
            result["pitch_analysis"] = pitch_analysis

    # ── Yaw / relative-direction analysis (optional) ─────────────
    if "relative_wind_direction" in df_raw.columns:
        yaw_analysis = _compute_yaw_analysis(df_raw)
        if yaw_analysis is not None:
            result["yaw_analysis"] = yaw_analysis

    # ── Turbine status distribution (optional) ───────────────────
    if "turbine_status" in df_raw.columns:
        status_dist = _compute_status_distribution(df_raw)
        if status_dist is not None:
            result["status_distribution"] = status_dist

    # ── Loss breakdown ─────────────────────────────────────────────
    result["loss_breakdown"] = compute_loss_breakdown(
        df_raw, rated_power_kw, curve_fn=curve_fn,
    )

    logger.info("Full analysis pipeline completed successfully")
    return result


# ====================================================================
# Loading & cleaning
# ====================================================================

def _load_and_clean(
    file_obj: IO[str],
    rated_power_kw: float,
) -> pd.DataFrame:
    """Read CSV, normalise columns, apply OpenOA filters."""
    df = pd.read_csv(file_obj)
    logger.info("Raw CSV loaded: %d rows, %d columns", len(df), len(df.columns))

    # Normalise column names
    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(r"[\s\-]+", "_", regex=True)
    )

    # Parse timestamp & sort
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df = df.dropna(subset=["timestamp"]).sort_values("timestamp").reset_index(drop=True)

    # Coerce core numeric columns
    for col in ("wind_speed", "power"):
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Coerce optional numeric columns
    for col in ("wind_direction", "ambient_temperature", "availability",
                "pitch_angle", "relative_wind_direction"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Coerce turbine_status (keep as categorical-friendly int/str)
    if "turbine_status" in df.columns:
        df["turbine_status"] = df["turbine_status"].astype(str).str.strip()

    # ── OpenOA-based filtering pipeline ─────────────────────────────
    pre_filter = len(df)
    if OPENOA_AVAILABLE:
        df = _openoa_filter_pipeline(df, rated_power_kw)
    else:
        df = _fallback_filter(df, rated_power_kw)

    df = df.dropna(subset=["wind_speed", "power"]).reset_index(drop=True)
    logger.info(
        "Filtering complete: %d → %d records (%d removed)",
        pre_filter, len(df), pre_filter - len(df),
    )
    return df


# ====================================================================
# Availability handling
# ====================================================================

def _resolve_availability(df: pd.DataFrame) -> pd.DataFrame:
    """
    Ensure an ``availability`` column exists.

    - If already present: normalise to 0/1 (fraction or percentage).
    - Otherwise: infer from power ≤ 0 AND wind_speed > cut-in.
    """
    if "availability" in df.columns:
        avail = pd.to_numeric(df["availability"], errors="coerce").fillna(1)
        if avail.max() > 1:          # percentages → fraction
            avail = avail / 100.0
        df["availability"] = avail
        logger.info("Availability column found in data (used as-is)")
    elif "turbine_status" in df.columns:
        # Use turbine status codes: treat non-"1" (non-normal) as unavailable
        normal_codes = {"1", "1.0", "normal", "run", "running", "ok"}
        avail = df["turbine_status"].str.lower().isin(normal_codes).astype(float)
        df["availability"] = avail
        n_unavail = int((avail < 0.5).sum())
        logger.info(
            "Availability inferred from turbine_status: %d unavailable (%.1f%%)",
            n_unavail, n_unavail / len(df) * 100 if len(df) else 0,
        )
    else:
        # Infer: available = producing power OR wind below cut-in
        inferred = ~(
            (df["power"] <= 0) & (df["wind_speed"] > DEFAULT_CUT_IN_WS)
        )
        df["availability"] = inferred.astype(float)
        n_unavail = int((~inferred).sum())
        logger.info(
            "Availability inferred: %d unavailable records (%.1f%%)",
            n_unavail, n_unavail / len(df) * 100 if len(df) else 0,
        )
    return df


def _filter_unavailable(df: pd.DataFrame) -> pd.DataFrame:
    """Return only rows where turbine is considered available."""
    return df.loc[df["availability"] >= 0.5].reset_index(drop=True)


def _openoa_filter_pipeline(
    df: pd.DataFrame,
    rated_power_kw: float,
) -> pd.DataFrame:
    """
    Multi-stage OpenOA-based data cleaning.

    Stage 1 – ``range_flag``           physical bounds
    Stage 2 – ``unresponsive_flag``    frozen / stuck sensors
    Stage 3 – ``window_range_flag``    contextual power limits
    Stage 4 – ``bin_filter``           statistical power-curve outliers
    """
    flags = pd.DataFrame(index=df.index)

    # Stage 1: Physical range check ──────────────────────────────────
    flags["ws_range"] = range_flag(df["wind_speed"], lower=0, upper=40)
    flags["pw_range"] = range_flag(
        df["power"], lower=-50, upper=rated_power_kw * 1.15,
    )

    # Stage 2: Unresponsive / frozen sensor detection ────────────────
    #   Flag sequences where wind_speed or power stays constant for
    #   ≥ 3 consecutive timestamps (sensor stuck / comms freeze).
    flags["ws_stuck"] = unresponsive_flag(df["wind_speed"], threshold=3)
    flags["pw_stuck"] = unresponsive_flag(df["power"], threshold=3)

    # Stage 3: Contextual filtering via window_range_flag ────────────
    #   Power should be near zero below cut-in.
    flags["low_ws_high_pw"] = window_range_flag(
        window_col="wind_speed",
        window_start=0,
        window_end=DEFAULT_CUT_IN_WS,
        value_col="power",
        value_min=-50,
        value_max=rated_power_kw * 0.05,
        data=df,
    )

    # Stage 4: Power-curve outlier filter ────────────────────────────
    #   Within each 1 m/s wind-speed bin, flag power values more than
    #   2 standard deviations from the bin mean.
    try:
        flags["pc_outlier"] = bin_filter(
            bin_col="wind_speed",
            value_col="power",
            bin_width=1.0,
            threshold=2.0,
            center_type="mean",
            threshold_type="std",
            direction="all",
            data=df,
        )
    except Exception:
        flags["pc_outlier"] = False

    # Keep only rows where no flag is True
    combined = flags.any(axis=1)
    df = df.loc[~combined].reset_index(drop=True)
    return df


def _fallback_filter(
    df: pd.DataFrame,
    rated_power_kw: float,
) -> pd.DataFrame:
    """Simple range filter when OpenOA is not installed."""
    df = df[
        (df["wind_speed"] >= 0) & (df["wind_speed"] <= 40)
        & (df["power"] >= -50) & (df["power"] <= rated_power_kw * 1.15)
    ]
    return df


# ====================================================================
# Summary statistics
# ====================================================================

def _compute_summary(
    df: pd.DataFrame,
    rated_power_kw: float,
) -> Dict[str, Any]:
    """Key performance indicators for the dataset."""
    n = len(df)
    mean_ws = df["wind_speed"].mean()
    mean_power = df["power"].mean()
    max_power = df["power"].max()
    capacity_factor = mean_power / rated_power_kw if rated_power_kw > 0 else 0.0

    # ── Energy production via OpenOA ────────────────────────────────
    if OPENOA_AVAILABLE:
        try:
            freq = determine_frequency(df, index_col="timestamp")
            energy_kwh = convert_power_to_energy(
                "power", sample_rate_min=str(freq), data=df,
            )
            total_energy_kwh = float(energy_kwh.sum())
        except Exception:
            total_energy_kwh = _fallback_energy_kwh(df)
    else:
        total_energy_kwh = _fallback_energy_kwh(df)

    total_energy_mwh = total_energy_kwh / 1000.0

    # Availability – fraction of time turbine produced positive power
    availability = (df["power"] > 0).sum() / n if n > 0 else 0.0

    # Time span
    time_span_days = (
        (df["timestamp"].max() - df["timestamp"].min()).total_seconds() / 86400
        if n > 1 else 0
    )

    # Estimated AEP (simple extrapolation)
    hours_in_data = time_span_days * 24 if time_span_days > 0 else n
    if hours_in_data > 0:
        aep_mwh = total_energy_mwh / hours_in_data * 8760
    else:
        aep_mwh = 0.0

    return {
        "total_records": n,
        "time_span_days": safe_round(time_span_days, 1),
        "mean_wind_speed_ms": safe_round(mean_ws, 2),
        "median_wind_speed_ms": safe_round(df["wind_speed"].median(), 2),
        "max_wind_speed_ms": safe_round(df["wind_speed"].max(), 2),
        "mean_power_kw": safe_round(mean_power, 2),
        "max_power_kw": safe_round(max_power, 2),
        "capacity_factor": safe_round(capacity_factor, 4),
        "capacity_factor_pct": safe_round(capacity_factor * 100, 2),
        "availability_pct": safe_round(availability * 100, 2),
        "estimated_aep_mwh": safe_round(aep_mwh, 1),
        "total_energy_mwh": safe_round(total_energy_mwh, 1),
        "rated_power_kw": rated_power_kw,
    }


def _fallback_energy_kwh(df: pd.DataFrame) -> float:
    """Estimate total energy assuming hourly resolution."""
    return float(df["power"].sum())  # kW × 1 h = kWh


# ====================================================================
# Power-curve analysis (IEC 61400-12-1)
# ====================================================================

def _compute_power_curve(
    df: pd.DataFrame,
    rated_power_kw: float,
) -> tuple[List[Dict[str, Any]], Optional[Callable]]:
    """
    Build a binned power curve.

    When OpenOA is available we use ``openoa.utils.power_curve.functions.IEC``
    which returns a *callable* (wind-speed → power).  We evaluate it over
    bin centres to produce the chart data.

    Returns
    -------
    (list_of_bin_records, curve_callable_or_None)
    """
    bin_width = 0.5
    ws = df["wind_speed"].values
    pw = df["power"].values

    if OPENOA_AVAILABLE:
        try:
            records, fn = _openoa_iec_curve(df, bin_width, ws, pw)
            return records, fn
        except Exception:
            logger.warning("OpenOA IEC curve failed, falling back to manual binning")

    return _manual_iec_binning(ws, pw, bin_width), None


def _openoa_iec_curve(
    df: pd.DataFrame,
    bin_width: float,
    ws: np.ndarray,
    pw: np.ndarray,
) -> tuple[List[Dict[str, Any]], Callable]:
    """
    Use ``openoa.utils.power_curve.functions.IEC`` to build the curve.

    IEC() returns a callable f(wind_speed_array) → power_array.
    We evaluate it on bin centres and also compute per-bin statistics
    (std, count, confidence interval) from the raw data.

    Returns (list_of_records, curve_fn).
    """
    curve_fn = iec_power_curve(
        windspeed_col="wind_speed",
        power_col="power",
        data=df,
        bin_width=bin_width,
        windspeed_start=0,
        windspeed_end=float(np.nanmax(ws)) + bin_width,
    )

    # Evaluate the fitted curve on bin centres
    bin_edges = np.arange(0, float(np.nanmax(ws)) + bin_width, bin_width)
    bin_centres = bin_edges[:-1] + bin_width / 2
    predicted = curve_fn(bin_centres)

    # Compute per-bin statistics from raw data
    digitized = np.digitize(ws, bin_edges)
    records: List[Dict[str, Any]] = []
    for i, centre in enumerate(bin_centres, start=1):
        mask = digitized == i
        count = int(mask.sum())
        if count < 3:
            continue
        mean_pw = float(predicted[i - 1]) if not np.isnan(predicted[i - 1]) else 0.0
        std_pw = float(pw[mask].std()) if count > 1 else 0.0
        ci = std_pw / np.sqrt(count) * 1.96 if count > 1 else 0.0

        records.append({
            "wind_speed_bin": safe_round(centre, 2),
            "mean_power": safe_round(mean_pw, 2),
            "std_power": safe_round(std_pw, 2),
            "count": count,
            "ci_lower": safe_round(mean_pw - ci, 2),
            "ci_upper": safe_round(mean_pw + ci, 2),
            "min_power": safe_round(float(pw[mask].min()), 2),
            "max_power": safe_round(float(pw[mask].max()), 2),
        })

    logger.info("OpenOA IEC power curve: %d bins computed", len(records))
    return records, curve_fn


def _manual_iec_binning(
    ws: np.ndarray,
    pw: np.ndarray,
    bin_width: float = 0.5,
) -> List[Dict[str, Any]]:
    """IEC 61400-12-1 style binned power curve (NumPy fallback)."""
    bins = np.arange(0, np.nanmax(ws) + bin_width, bin_width)
    bin_centres = bins[:-1] + bin_width / 2
    digitized = np.digitize(ws, bins)

    records: List[Dict[str, Any]] = []
    for i, centre in enumerate(bin_centres, start=1):
        mask = digitized == i
        count = int(mask.sum())
        if count < 3:
            continue
        mean_pw = float(pw[mask].mean())
        std_pw = float(pw[mask].std()) if count > 1 else 0.0
        ci = std_pw / np.sqrt(count) * 1.96 if count > 1 else 0.0
        records.append({
            "wind_speed_bin": safe_round(centre, 2),
            "mean_power": safe_round(mean_pw, 2),
            "std_power": safe_round(std_pw, 2),
            "count": count,
            "ci_lower": safe_round(mean_pw - ci, 2),
            "ci_upper": safe_round(mean_pw + ci, 2),
            "min_power": safe_round(float(pw[mask].min()), 2),
            "max_power": safe_round(float(pw[mask].max()), 2),
        })

    logger.info("Manual IEC binning: %d bins computed (fallback)", len(records))
    return records


# ====================================================================
# Time-series (down-sampled for charting)
# ====================================================================

# ====================================================================
# Temperature analysis
# ====================================================================

def _compute_temperature_analysis(
    df: pd.DataFrame,
) -> Optional[Dict[str, Any]]:
    """
    Compute temperature metrics when ``ambient_temperature`` is present.

    Returns
    -------
    dict with ``mean_temperature`` and ``temperature_power_correlation``,
    or *None* if insufficient valid data.
    """
    temp = df["ambient_temperature"].dropna()
    if len(temp) < 10:
        logger.info("Temperature analysis skipped: only %d valid readings", len(temp))
        return None

    mean_temp = float(temp.mean())

    # Pearson correlation between temperature & power (on paired valid rows)
    paired = df[["ambient_temperature", "power"]].dropna()
    if len(paired) < 10:
        corr = None
    else:
        corr = float(paired["ambient_temperature"].corr(paired["power"]))
        if np.isnan(corr):
            corr = None

    logger.info(
        "Temperature analysis: mean=%.1f °C, correlation=%s (n=%d)",
        mean_temp,
        f"{corr:.4f}" if corr is not None else "N/A",
        len(paired),
    )

    return {
        "mean_temperature": safe_round(mean_temp, 2),
        "temperature_power_correlation": safe_round(corr, 4) if corr is not None else None,
    }


# ====================================================================
# Pitch analysis
# ====================================================================

def _compute_pitch_analysis(
    df: pd.DataFrame,
) -> Optional[Dict[str, Any]]:
    """
    Compute blade-pitch analytics when ``pitch_angle`` is present.

    Returns mean pitch, pitch–power correlation, and a curtailment
    indicator (high pitch + below-rated power suggests curtailment).
    """
    pitch = df["pitch_angle"].dropna()
    if len(pitch) < 10:
        logger.info("Pitch analysis skipped: only %d valid readings", len(pitch))
        return None

    mean_pitch = float(pitch.mean())
    max_pitch = float(pitch.max())

    # Correlation between pitch and power
    paired = df[["pitch_angle", "power"]].dropna()
    corr = None
    if len(paired) >= 10:
        corr = float(paired["pitch_angle"].corr(paired["power"]))
        if np.isnan(corr):
            corr = None

    # Curtailment indicator: rows where pitch > 5° but power < 80% rated
    # (suggests intentional power limitation)
    rated_est = df["power"].quantile(0.95) if len(df) > 20 else df["power"].max()
    curtail_mask = (
        (df["pitch_angle"] > 5.0)
        & (df["power"] < rated_est * 0.8)
        & (df["power"] > 0)
    )
    n_curtailed = int(curtail_mask.sum())
    curtailment_pct = safe_round(n_curtailed / len(df) * 100, 2) if len(df) > 0 else 0.0

    logger.info(
        "Pitch analysis: mean=%.1f°, max=%.1f°, corr=%s, curtailment=%.1f%%",
        mean_pitch, max_pitch,
        f"{corr:.4f}" if corr is not None else "N/A",
        curtailment_pct,
    )

    return {
        "mean_pitch_angle": safe_round(mean_pitch, 2),
        "max_pitch_angle": safe_round(max_pitch, 2),
        "pitch_power_correlation": safe_round(corr, 4) if corr is not None else None,
        "curtailment_pct": curtailment_pct,
        "curtailed_count": n_curtailed,
    }


# ====================================================================
# Yaw / relative wind direction analysis
# ====================================================================

def _compute_yaw_analysis(
    df: pd.DataFrame,
) -> Optional[Dict[str, Any]]:
    """
    Compute yaw-misalignment analytics from ``relative_wind_direction``.

    A perfect yaw alignment would keep the vane reading near 0°.
    Systematic offset indicates yaw misalignment; high std indicates
    poor yaw tracking.
    """
    reldir = df["relative_wind_direction"].dropna()
    if len(reldir) < 10:
        logger.info("Yaw analysis skipped: only %d valid readings", len(reldir))
        return None

    mean_yaw_error = float(reldir.mean())
    std_yaw_error = float(reldir.std())
    max_abs_yaw = float(reldir.abs().max())

    # Misalignment severity
    abs_mean = abs(mean_yaw_error)
    if abs_mean > 10:
        alignment = "poor"
    elif abs_mean > 5:
        alignment = "moderate"
    else:
        alignment = "good"

    logger.info(
        "Yaw analysis: mean_error=%.1f°, std=%.1f°, alignment=%s",
        mean_yaw_error, std_yaw_error, alignment,
    )

    return {
        "mean_yaw_error": safe_round(mean_yaw_error, 2),
        "std_yaw_error": safe_round(std_yaw_error, 2),
        "max_abs_yaw_error": safe_round(max_abs_yaw, 2),
        "alignment_quality": alignment,
    }


# ====================================================================
# Turbine status distribution
# ====================================================================

def _compute_status_distribution(
    df: pd.DataFrame,
) -> Optional[Dict[str, Any]]:
    """
    Compute the distribution of turbine status codes.

    Returns the count and percentage for each unique status value.
    """
    status = df["turbine_status"].dropna()
    if len(status) == 0:
        return None

    counts = status.value_counts().to_dict()
    total = len(status)
    distribution = [
        {
            "status": str(code),
            "count": int(cnt),
            "percentage": safe_round(cnt / total * 100, 2),
        }
        for code, cnt in sorted(counts.items(), key=lambda x: -x[1])
    ]

    logger.info(
        "Status distribution: %d unique codes across %d records",
        len(counts), total,
    )

    return {
        "total_records": total,
        "unique_codes": len(counts),
        "distribution": distribution,
    }


def _prepare_time_series(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Return a time-series suitable for front-end charting."""
    cols = ["wind_speed", "power"]
    has_dir = "wind_direction" in df.columns
    has_temp = "ambient_temperature" in df.columns
    has_pitch = "pitch_angle" in df.columns
    has_reldir = "relative_wind_direction" in df.columns
    if has_dir:
        cols.append("wind_direction")
    if has_temp:
        cols.append("ambient_temperature")
    if has_pitch:
        cols.append("pitch_angle")
    if has_reldir:
        cols.append("relative_wind_direction")

    ts = df.set_index("timestamp")[cols].copy()

    if len(ts) > 5000:
        ts = ts.resample("D").mean()
    elif len(ts) > 2000:
        ts = ts.resample("6h").mean()

    ts = ts.dropna(subset=["wind_speed", "power"])

    records = []
    for idx, row in ts.iterrows():
        rec = {
            "timestamp": idx.isoformat(),
            "wind_speed": safe_round(row["wind_speed"], 2),
            "power": safe_round(row["power"], 2),
        }
        if has_dir and pd.notna(row.get("wind_direction")):
            rec["wind_direction"] = safe_round(row["wind_direction"], 1)
        if has_temp and pd.notna(row.get("ambient_temperature")):
            rec["ambient_temperature"] = safe_round(row["ambient_temperature"], 1)
        if has_pitch and pd.notna(row.get("pitch_angle")):
            rec["pitch_angle"] = safe_round(row["pitch_angle"], 2)
        if has_reldir and pd.notna(row.get("relative_wind_direction")):
            rec["relative_wind_direction"] = safe_round(row["relative_wind_direction"], 1)
        records.append(rec)

    return records


# ====================================================================
# Data-quality assessment
# ====================================================================

def _assess_data_quality(
    df: pd.DataFrame,
    rated_power_kw: float,
) -> Dict[str, Any]:
    """
    Compute data-quality metrics.

    Uses OpenOA ``percent_nan``, ``find_time_gaps``, ``determine_frequency``,
    and ``gap_fill_data_frame`` to assess timestamp completeness and data
    coverage in a way that mirrors real operational-assessment workflows.
    """
    total = len(df)

    if OPENOA_AVAILABLE:
        try:
            return _openoa_quality(df, rated_power_kw, total)
        except Exception:
            pass

    return _fallback_quality(df, rated_power_kw, total)


def _openoa_quality(
    df: pd.DataFrame,
    rated_power_kw: float,
    total: int,
) -> Dict[str, Any]:
    """Quality assessment backed by openoa.utils.timeseries."""

    # Percent NaN via OpenOA
    pct_nan_ws = percent_nan("wind_speed", data=df) * 100
    pct_nan_pw = percent_nan("power", data=df) * 100

    # Determine sampling frequency
    freq = determine_frequency(df, index_col="timestamp")

    # Detect timestamp gaps
    gap_timestamps = find_time_gaps(
        dt_col="timestamp", freq=str(freq), data=df,
    )
    n_gaps = len(gap_timestamps)

    # Fill gaps to compute completeness score
    try:
        filled = gap_fill_data_frame(
            data=df[["timestamp", "wind_speed", "power"]].copy(),
            dt_col="timestamp",
            freq=str(freq),
        )
        expected_rows = len(filled)
    except Exception:
        expected_rows = total

    completeness = total / expected_rows * 100 if expected_rows > 0 else 100.0

    # Potential curtailment
    curtailed = int(
        ((df["power"] >= rated_power_kw * 0.95) & (df["wind_speed"] > DEFAULT_RATED_WS)).sum()
    )

    # Idle in wind (potential downtime / availability loss)
    idle_in_wind = int(
        ((df["power"] <= 0) & (df["wind_speed"] > DEFAULT_CUT_IN_WS)).sum()
    )

    return {
        "total_records_after_cleaning": total,
        "missing_wind_speed_pct": safe_round(pct_nan_ws, 2),
        "missing_power_pct": safe_round(pct_nan_pw, 2),
        "detected_frequency": str(freq),
        "timestamp_gaps": n_gaps,
        "data_completeness_pct": safe_round(completeness, 2),
        "potential_curtailment_count": curtailed,
        "idle_in_wind_count": idle_in_wind,
        "completeness_score": safe_round(completeness, 2),
    }


def _fallback_quality(
    df: pd.DataFrame,
    rated_power_kw: float,
    total: int,
) -> Dict[str, Any]:
    """Quality assessment without OpenOA."""
    missing_ws = safe_round(df["wind_speed"].isna().sum() / total * 100, 2) if total else 0
    missing_pw = safe_round(df["power"].isna().sum() / total * 100, 2) if total else 0

    curtailed = int(
        ((df["power"] >= rated_power_kw * 0.95) & (df["wind_speed"] > DEFAULT_RATED_WS)).sum()
    )
    idle_in_wind = int(
        ((df["power"] <= 0) & (df["wind_speed"] > DEFAULT_CUT_IN_WS)).sum()
    )

    # Simple regularity check
    if total > 1:
        diffs = df["timestamp"].diff().dt.total_seconds().dropna()
        median_interval = diffs.median()
        freq_str = f"{int(median_interval)}s"
    else:
        median_interval = 0
        freq_str = "unknown"

    return {
        "total_records_after_cleaning": total,
        "missing_wind_speed_pct": missing_ws,
        "missing_power_pct": missing_pw,
        "detected_frequency": freq_str,
        "timestamp_gaps": 0,
        "data_completeness_pct": safe_round(100 - (missing_ws + missing_pw) / 2, 2),
        "potential_curtailment_count": curtailed,
        "idle_in_wind_count": idle_in_wind,
        "completeness_score": safe_round(100 - (missing_ws + missing_pw) / 2, 2),
    }


# ====================================================================
# Monthly statistics
# ====================================================================

def _compute_monthly_stats(
    df: pd.DataFrame,
    rated_power_kw: float,
) -> List[Dict[str, Any]]:
    """Per-month summary following operational-assessment conventions."""
    tmp = df.copy()
    tmp["month"] = tmp["timestamp"].dt.to_period("M")

    # ── Energy via OpenOA conversion ────────────────────────────────
    if OPENOA_AVAILABLE:
        try:
            freq = determine_frequency(df, index_col="timestamp")
            tmp["energy_kwh"] = convert_power_to_energy(
                "power", sample_rate_min=str(freq), data=tmp,
            )
        except Exception:
            tmp["energy_kwh"] = tmp["power"]  # fallback: assume 1 h
    else:
        tmp["energy_kwh"] = tmp["power"]  # kW × 1 h

    grouped = tmp.groupby("month")

    records = []
    for period, grp in grouped:
        n = len(grp)
        energy_mwh = grp["energy_kwh"].sum() / 1000.0

        records.append({
            "month": str(period),
            "record_count": n,
            "mean_wind_speed": safe_round(grp["wind_speed"].mean(), 2),
            "mean_power": safe_round(grp["power"].mean(), 2),
            "max_power": safe_round(grp["power"].max(), 2),
            "energy_mwh": safe_round(energy_mwh, 1),
            "capacity_factor_pct": safe_round(
                grp["power"].mean() / rated_power_kw * 100, 2
            ) if rated_power_kw > 0 else 0.0,
            "availability_pct": safe_round(
                (grp["power"] > 0).sum() / n * 100, 2
            ),
        })
    return records


# ====================================================================
# Wind-rose distribution
# ====================================================================

_DIRECTION_LABELS = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
]

_WS_BINS = [
    (0, 3, "0-3"),
    (3, 6, "3-6"),
    (6, 9, "6-9"),
    (9, 12, "9-12"),
    (12, 15, "12-15"),
    (15, 25, "15-25"),
    (25, 100, "25+"),
]


def _compute_wind_rose(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Compute a 16-sector wind-rose with speed-class breakdown.

    Returns a list of dicts with keys:
      direction, angle, frequency, and one key per speed bin label.
    """
    wd = df["wind_direction"].dropna()
    ws = df.loc[wd.index, "wind_speed"].dropna()
    common_idx = wd.index.intersection(ws.index)
    wd = wd.loc[common_idx]
    ws = ws.loc[common_idx]

    total = len(wd)
    if total == 0:
        return []

    # Assign each row to a 22.5° sector
    sector_size = 360 / 16
    sector_idx = ((wd.values + sector_size / 2) % 360 / sector_size).astype(int) % 16

    records = []
    for i, label in enumerate(_DIRECTION_LABELS):
        mask = sector_idx == i
        sector_ws = ws.values[mask]
        n = int(mask.sum())
        rec = {
            "direction": label,
            "angle": i * sector_size,
            "frequency": safe_round(n / total * 100, 2),
            "count": n,
            "mean_ws": safe_round(float(sector_ws.mean()), 2) if n > 0 else 0,
        }
        # Speed-class breakdown within sector
        for lo, hi, sl in _WS_BINS:
            cnt = int(((sector_ws >= lo) & (sector_ws < hi)).sum())
            rec[sl] = safe_round(cnt / total * 100, 2)
        records.append(rec)

    return records
