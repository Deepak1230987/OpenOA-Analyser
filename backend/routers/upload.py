"""
Upload Router
=============
Handles CSV file uploads, validates the file, and triggers analysis.
"""

from __future__ import annotations

import io
import logging

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from services.validation import validate_scada_csv
from services.analysis import run_full_analysis

logger = logging.getLogger(__name__)

router = APIRouter()

# Maximum upload size: 50 MB
MAX_UPLOAD_BYTES = 50 * 1024 * 1024


@router.post("/upload")
async def upload_csv(
    file: UploadFile = File(..., description="CSV file with SCADA data"),
    rated_power_kw: float = Form(
        default=2000.0,
        description="Rated power of the turbine in kW",
    ),
):
    """
    Upload a wind-turbine SCADA CSV and receive a full analysis.

    Expected CSV columns (case-insensitive, underscores/spaces OK):
      - **timestamp** – ISO-8601 or parsable datetime
      - **wind_speed** – wind speed in m/s
      - **power** – active power output in kW

    Optional columns (used when present):
      - **wind_direction** – degrees (0-360)
      - **ambient_temperature** – °C
      - **availability** – 0/1 flag or fraction (0-1 or 0-100)
      - **turbine_status** – operational status code (string or int)
      - **pitch_angle** – blade pitch angle in degrees
      - **relative_wind_direction** – wind vane / nacelle-relative direction (°)
    """
    # --- basic file checks ------------------------------------------------
    if not file.filename.lower().endswith(".csv"):
        logger.warning("Rejected upload: non-CSV file '%s'", file.filename)
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are accepted. Please upload a .csv file.",
        )

    contents = await file.read()
    file_size = len(contents)
    logger.info(
        "File upload received: '%s' (%s bytes / %.2f MB)",
        file.filename, file_size, file_size / (1024 * 1024),
    )

    if file_size > MAX_UPLOAD_BYTES:
        logger.warning("Rejected upload: file too large (%d bytes)", file_size)
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds {MAX_UPLOAD_BYTES // (1024*1024)} MB limit.",
        )

    if file_size == 0:
        logger.warning("Rejected upload: empty file")
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    # --- decode --------------------------------------------------------
    try:
        text = contents.decode("utf-8")
    except UnicodeDecodeError:
        logger.warning("Rejected upload: not UTF-8")
        raise HTTPException(
            status_code=400,
            detail="File is not valid UTF-8 encoded text.",
        )

    # --- validate (returns structured report) --------------------------
    validation = validate_scada_csv(io.StringIO(text))

    logger.info(
        "Validation result for '%s': valid=%s, errors=%d, warnings=%d",
        file.filename,
        validation["valid"],
        len(validation.get("errors", [])),
        len(validation.get("warnings", [])),
    )

    if not validation["valid"]:
        raise HTTPException(status_code=400, detail={
            "message": "CSV validation failed",
            "errors": validation["errors"],
            "warnings": validation.get("warnings", []),
        })

    # --- run analysis --------------------------------------------------
    try:
        results = run_full_analysis(
            io.StringIO(text),
            rated_power_kw=rated_power_kw,
        )
    except Exception as exc:
        logger.exception("Analysis failed for '%s'", file.filename)
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(exc)}",
        )

    logger.info("Analysis completed successfully for '%s'", file.filename)

    return {
        "status": "success",
        "filename": file.filename,
        "rated_power_kw": rated_power_kw,
        "results": results,
    }
