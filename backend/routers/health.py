"""
Health Router
=============
Provides a lightweight health-check endpoint used by load-balancers,
monitoring dashboards, and the frontend documentation page.
"""

from __future__ import annotations

import logging
from fastapi import APIRouter

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Lightweight health probe.

    Returns
    -------
    JSON with ``status``, ``version``, and ``openoa`` availability.
    """
    try:
        import openoa  # noqa: F401
        openoa_status = "available"
    except ImportError:
        openoa_status = "not installed – using fallback analysis"

    logger.debug("Health check requested")

    return {
        "status": "healthy",
        "version": "1.0",
        "openoa": openoa_status,
    }
