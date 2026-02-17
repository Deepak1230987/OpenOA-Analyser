"""
Utility Helpers
===============
Small pure-function utilities shared across the backend.
"""

import math
from typing import Any, Optional


def safe_round(value: Any, decimals: int = 2) -> Optional[float]:
    """
    Round *value* to *decimals* places, returning ``None`` for
    non-finite inputs (NaN / Inf / None).
    """
    if value is None:
        return None
    try:
        f = float(value)
        if math.isnan(f) or math.isinf(f):
            return None
        return round(f, decimals)
    except (TypeError, ValueError):
        return None


def clamp(value: float, lo: float, hi: float) -> float:
    """Clamp *value* between *lo* and *hi*."""
    return max(lo, min(hi, value))
