"""
Analysis Router
===============
Provides endpoints for retrieving sample data and running standalone
analysis queries.
"""

from __future__ import annotations

import io
import logging

from fastapi import APIRouter, HTTPException

from services.sample_data import generate_sample_scada
from services.analysis import run_full_analysis

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/sample-data")
async def get_sample_data():
    """
    Return a small auto-generated sample SCADA dataset as JSON so the
    frontend can offer a "Try with sample data" button without needing
    a real CSV file.
    """
    try:
        df = generate_sample_scada(rows=720)  # 30 days of hourly data
        logger.info("Sample data generated: %d rows", len(df))
        return {
            "status": "success",
            "columns": list(df.columns),
            "row_count": len(df),
            "preview": df.head(10).to_dict(orient="records"),
        }
    except Exception as exc:
        logger.exception("Failed to generate sample data")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/analyze-sample")
async def analyze_sample(rated_power_kw: float = 2000.0):
    """
    Generate sample data and run the full analysis pipeline.
    Useful for demo / testing without uploading a file.
    """
    try:
        df = generate_sample_scada(rows=720)

        # Convert DataFrame → CSV text → StringIO so the analysis
        # service receives the same format as an uploaded file.
        buf = io.StringIO()
        df.to_csv(buf, index=False)
        buf.seek(0)

        logger.info(
            "Running analysis on sample data (rated_power_kw=%.1f)",
            rated_power_kw,
        )
        results = run_full_analysis(buf, rated_power_kw=rated_power_kw)
        logger.info("Sample analysis completed successfully")

        return {
            "status": "success",
            "filename": "sample_scada.csv",
            "rated_power_kw": rated_power_kw,
            "results": results,
        }
    except Exception as exc:
        logger.exception("Sample analysis failed")
        raise HTTPException(status_code=500, detail=str(exc))
