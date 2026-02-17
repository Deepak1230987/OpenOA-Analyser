"""
OpenOA Web Application – Backend Entry Point
=============================================
FastAPI server that wraps OpenOA wind energy analysis functionality.
Accepts CSV uploads of wind turbine SCADA data, validates them,
runs power-curve and summary analyses, and returns structured JSON.

This module only handles app instantiation, middleware, and router
wiring.  All business logic lives in ``services/`` and route
handlers live in ``routers/``.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load .env file from the backend directory
load_dotenv(Path(__file__).resolve().parent / ".env")

from routers import upload, analysis, health

# ── Logging configuration ──────────────────────────────────────────
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── App initialisation ─────────────────────────────────────────────
app = FastAPI(
    title="OpenOA Wind Energy Analyzer",
    description=(
        "A web-based interface for analysing wind turbine SCADA data "
        "using the OpenOA library."
    ),
    version="1.0.0",
)

# ── CORS ───────────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000",
).split(",")


ALLOWED_ORIGINS = [o.strip() for o in ALLOWED_ORIGINS if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers (versioned under /api/v1/) ─────────────────────────────
app.include_router(upload.router, prefix="/api/v1", tags=["Upload"])
app.include_router(analysis.router, prefix="/api/v1", tags=["Analysis"])
app.include_router(health.router, prefix="/api/v1", tags=["Health"])

# Keep legacy /api routes for backward-compatibility
app.include_router(upload.router, prefix="/api", tags=["Upload (legacy)"])
app.include_router(analysis.router, prefix="/api", tags=["Analysis (legacy)"])


# ── Root endpoint ──────────────────────────────────────────────────
@app.get("/", tags=["Root"])
async def root():
    """Root – directs users to v1 health check and docs."""
    return {
        "message": "OpenOA Wind Energy Analyzer API",
        "docs": "/docs",
        "health": "/api/v1/health",
    }

logger.info("OpenOA Wind Energy Analyzer backend started")
