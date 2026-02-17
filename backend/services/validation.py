"""
Validation Service
==================
Validates uploaded CSV files to ensure they contain the columns and
data types required for wind-turbine SCADA analysis.

OpenOA integration
------------------
- Uses ``openoa.schema.SCADAMetaData`` column naming conventions as
  reference for expected SCADA fields (WTUR_W, WMET_HorWdSpd, etc.)
  and maps common user-facing names to them.
- Uses ``openoa.utils.filters.range_flag`` for physical-range checks.
- Uses ``openoa.utils.timeseries.percent_nan`` for NaN reporting.
"""

from __future__ import annotations

import logging
from typing import IO, Dict, Any, List

import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

# ── OpenOA imports ──────────────────────────────────────────────────
OPENOA_AVAILABLE = False
try:
    from openoa.utils.filters import range_flag
    from openoa.utils.timeseries import percent_nan
    OPENOA_AVAILABLE = True
except ImportError:
    pass


# ── Column mapping ──────────────────────────────────────────────────
# OpenOA's SCADAMetaData uses IEC 61400 naming conventions:
#   WTUR_W         → power output (kW)
#   WMET_HorWdSpd  → horizontal wind speed (m/s)
#   WMET_HorWdDir  → wind direction (deg)
#   WMET_EnvTmp    → ambient temperature (°C)
#   time           → timestamp
#
# We accept user-friendly names and normalise internally.
COLUMN_ALIASES: Dict[str, List[str]] = {
    "timestamp": ["timestamp", "time", "datetime", "date_time", "date"],
    "wind_speed": [
        "wind_speed", "windspeed", "ws", "wmet_horwdspd",
        "wind_speed_ms", "wind_speed_(m/s)",
    ],
    "power": [
        "power", "power_output", "active_power", "wtur_w",
        "power_kw", "power_(kw)",
    ],
    "wind_direction": [
        "wind_direction", "wdir", "wd", "wmet_horwddir",
        "wind_dir",
    ],
    "ambient_temperature": [
        "ambient_temperature", "temperature", "temp", "wmet_envtmp",
        "ambient_temp",
    ],
    "availability": [
        "availability", "avail", "turbine_availability",
        "is_available",
    ],
    "turbine_status": [
        "turbine_status", "status", "status_code", "wtur_turst",
        "turbine_state", "operational_status",
    ],
    "pitch_angle": [
        "pitch_angle", "pitch", "blade_pitch", "wrot_blpthangval",
        "blade_pitch_angle", "pitch_deg",
    ],
    "relative_wind_direction": [
        "relative_wind_direction", "rel_wind_dir", "wmet_horwddirrel",
        "wind_vane", "nacelle_relative_direction", "yaw_error",
    ],
}

# Required columns (after normalisation)
REQUIRED_COLUMNS = {"timestamp", "wind_speed", "power"}

# Optional columns we can use if present
OPTIONAL_COLUMNS = {
    "wind_direction", "ambient_temperature", "availability",
    "turbine_status", "pitch_angle", "relative_wind_direction",
}

# Physical sanity bounds (aligned with OpenOA range_flag usage)
BOUNDS = {
    "wind_speed": (0.0, 100.0),        # m/s
    "power": (-500.0, 20_000.0),       # kW (negative = parasitic load)
    "wind_direction": (0.0, 360.0),    # degrees
    "ambient_temperature": (-60.0, 60.0),  # °C
    "pitch_angle": (-10.0, 95.0),      # degrees (feathered ≈ 90°)
    "relative_wind_direction": (-180.0, 180.0),  # degrees (yaw error)
}


# ====================================================================
# Public validation entry point
# ====================================================================

def validate_scada_csv(file_obj: IO[str]) -> Dict[str, Any]:
    """
    Parse *file_obj* as CSV and return a validation report::

        {"valid": True/False, "errors": [...], "warnings": [...], "info": {...}}

    Checks performed
    ~~~~~~~~~~~~~~~~
    1. CSV readability
    2. Column aliasing (IEC / OpenOA naming → canonical names)
    3. Required column presence
    4. Minimum row count
    5. Data-type checks
    6. Physical-range sanity (via OpenOA ``range_flag`` when available)
    7. Missing-value report (via OpenOA ``percent_nan`` when available)
    8. Optional column detection
    """
    errors: List[str] = []
    warnings: List[str] = []

    # ── 1. Read CSV ─────────────────────────────────────────────────
    try:
        df = pd.read_csv(file_obj)
        logger.info("CSV parsed: %d rows, %d columns", len(df), len(df.columns))
    except Exception as exc:
        logger.error("CSV parsing failed: %s", exc)
        return {
            "valid": False,
            "errors": [f"Cannot parse CSV: {exc}. Ensure the file is a valid comma-separated values file with a header row."],
            "warnings": [],
        }

    # ── 2. Normalise & alias columns ────────────────────────────────
    df = _normalise_columns(df)
    df, alias_report = _apply_column_aliases(df)
    if alias_report:
        warnings.extend(alias_report)

    # ── 3. Required columns ────────────────────────────────────────
    present = set(df.columns)
    missing = REQUIRED_COLUMNS - present
    if missing:
        errors.append(
            f"Missing required column(s): {', '.join(sorted(missing))}. "
            f"Found columns: {', '.join(sorted(present))}. "
            f"Accepted aliases: timestamp/time/datetime, "
            f"wind_speed/ws/wmet_horwdspd, power/active_power/wtur_w."
        )
        logger.warning("Validation failed: missing columns %s", missing)
        return {"valid": False, "errors": errors, "warnings": warnings}

    # ── 4. Minimum row count ───────────────────────────────────────
    if len(df) < 10:
        errors.append(
            f"File has only {len(df)} data rows. At least 10 are needed "
            f"for meaningful analysis. A typical dataset should contain "
            f"hundreds to thousands of rows."
        )
        logger.warning("Validation failed: only %d rows", len(df))
        return {"valid": False, "errors": errors, "warnings": warnings}

    # ── 5. Timestamp parsing ───────────────────────────────────────
    try:
        parsed_ts = pd.to_datetime(df["timestamp"], errors="coerce")
        n_bad_ts = int(parsed_ts.isna().sum())
        if n_bad_ts == len(df):
            errors.append(
                "Column 'timestamp' could not be parsed as dates. "
                "Use ISO-8601 format (e.g. 2024-01-15 08:00:00) or "
                "other common datetime formats."
            )
        elif n_bad_ts > 0:
            pct = n_bad_ts / len(df) * 100
            warnings.append(
                f"Column 'timestamp': {n_bad_ts} rows ({pct:.1f}%) "
                f"have unparseable dates and will be dropped."
            )
    except Exception:
        errors.append(
            "Column 'timestamp' could not be parsed as dates. "
            "Use ISO-8601 format (e.g. 2024-01-15 08:00:00)."
        )

    # ── 6. Numeric columns ─────────────────────────────────────────
    for col in ("wind_speed", "power"):
        if not pd.api.types.is_numeric_dtype(df[col]):
            coerced = pd.to_numeric(df[col], errors="coerce")
            pct_bad = coerced.isna().sum() / len(df) * 100
            if pct_bad > 50:
                errors.append(
                    f"Column '{col}' is not numeric and >50% of values "
                    f"cannot be converted."
                )
            elif pct_bad > 0:
                warnings.append(
                    f"Column '{col}': {pct_bad:.1f}% of values are non-numeric "
                    f"and will be treated as missing."
                )

    # ── 7. Physical-range checks ───────────────────────────────────
    if OPENOA_AVAILABLE:
        _openoa_range_check(df, warnings)
    else:
        _fallback_range_check(df, warnings)

    # ── 8. Missing-value report ────────────────────────────────────
    if OPENOA_AVAILABLE:
        _openoa_nan_report(df, warnings)
    else:
        _fallback_nan_report(df, warnings)

    # ── 9. Optional columns ───────────────────────────────────────
    found_optional = OPTIONAL_COLUMNS & present
    if found_optional:
        warnings.append(
            f"Optional column(s) detected and will be used: "
            f"{', '.join(sorted(found_optional))}."
        )

    info = {
        "rows": len(df),
        "columns": list(df.columns),
        "required_present": sorted(REQUIRED_COLUMNS & present),
        "optional_present": sorted(found_optional),
        "openoa_available": OPENOA_AVAILABLE,
    }

    is_valid = len(errors) == 0
    logger.info(
        "Validation complete: valid=%s, rows=%d, errors=%d, warnings=%d",
        is_valid, len(df), len(errors), len(warnings),
    )

    return {
        "valid": is_valid,
        "errors": errors,
        "warnings": warnings,
        "info": info,
    }


# ====================================================================
# Internal helpers
# ====================================================================

def _normalise_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Lower-case and normalise separators."""
    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(r"[\s\-]+", "_", regex=True)
    )
    return df


def _apply_column_aliases(
    df: pd.DataFrame,
) -> tuple[pd.DataFrame, List[str]]:
    """
    Rename columns from common/IEC aliases to canonical names.
    Returns (df, list_of_rename_messages).
    """
    report: List[str] = []
    present = set(df.columns)

    for canonical, aliases in COLUMN_ALIASES.items():
        if canonical in present:
            continue  # already has the canonical name
        for alias in aliases:
            if alias in present:
                df = df.rename(columns={alias: canonical})
                report.append(
                    f"Column '{alias}' recognised as '{canonical}' "
                    f"(OpenOA / IEC alias)."
                )
                present.discard(alias)
                present.add(canonical)
                break

    return df, report


def _openoa_range_check(
    df: pd.DataFrame,
    warnings: List[str],
) -> None:
    """Use OpenOA ``range_flag`` for physical-range validation."""
    for col, (lo, hi) in BOUNDS.items():
        if col not in df.columns:
            continue
        series = pd.to_numeric(df[col], errors="coerce")
        valid = series.dropna()
        if len(valid) == 0:
            continue
        flagged = range_flag(valid, lower=lo, upper=hi)
        n_out = int(flagged.sum())
        if n_out > 0:
            pct = n_out / len(valid) * 100
            if pct > 25:
                warnings.append(
                    f"Column '{col}': {pct:.1f}% of values flagged by "
                    f"OpenOA range_flag as outside [{lo}, {hi}]."
                )


def _fallback_range_check(
    df: pd.DataFrame,
    warnings: List[str],
) -> None:
    """Manual range check when OpenOA is unavailable."""
    for col, (lo, hi) in BOUNDS.items():
        if col not in df.columns:
            continue
        series = pd.to_numeric(df[col], errors="coerce").dropna()
        if len(series) == 0:
            continue
        out_of_range = ((series < lo) | (series > hi)).sum()
        if out_of_range > 0:
            pct = out_of_range / len(series) * 100
            if pct > 25:
                warnings.append(
                    f"Column '{col}': {pct:.1f}% of values are outside the "
                    f"expected range [{lo}, {hi}]."
                )


def _openoa_nan_report(
    df: pd.DataFrame,
    warnings: List[str],
) -> None:
    """Report missing-value percentages via OpenOA ``percent_nan``."""
    for col in REQUIRED_COLUMNS:
        if col not in df.columns:
            continue
        # percent_nan uses np.isnan internally, which only works on
        # numeric dtypes.  Skip non-numeric columns gracefully.
        if not pd.api.types.is_numeric_dtype(df[col]):
            pct_missing = df[col].isna().sum() / len(df) * 100
        else:
            pct_missing = percent_nan(col, data=df) * 100
        if pct_missing > 0:
            warnings.append(
                f"Column '{col}' has {pct_missing:.1f}% missing values "
                f"(per OpenOA percent_nan)."
            )


def _fallback_nan_report(
    df: pd.DataFrame,
    warnings: List[str],
) -> None:
    """Report missing-value percentages without OpenOA."""
    for col in REQUIRED_COLUMNS:
        if col not in df.columns:
            continue
        pct_missing = df[col].isna().sum() / len(df) * 100
        if pct_missing > 0:
            warnings.append(
                f"Column '{col}' has {pct_missing:.1f}% missing values."
            )
