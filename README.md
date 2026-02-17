<div align="center">

# ⚡ OpenOA Wind Energy Analyzer

**Browser-based wind-turbine SCADA analytics powered by [OpenOA](https://github.com/NREL/OpenOA)**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## Overview

OpenOA Wind Energy Analyzer is a full-stack web application that turns raw wind-turbine SCADA CSV data into actionable performance insights — directly in the browser. Upload a file (or try one of the bundled sample datasets), and the platform delivers:

| Capability                  | Details                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Power Curve Analysis**    | IEC 61400-12-1 binned scatter plot with ±1σ confidence band, cut-in/rated reference lines, and sample-count sizing |
| **Performance KPIs**        | Capacity factor, availability, estimated AEP, mean wind speed, and peak power statistics                           |
| **Data Quality Assessment** | Completeness scoring, missing-data detection, irregular-interval flagging, and anomaly identification              |
| **Loss Breakdown**          | Availability losses, curtailment losses, and electrical losses quantified via OpenOA routines                      |
| **Monthly Trends**          | Energy production, capacity factor, and wind resource tracked across calendar months                               |
| **Temperature Analysis**    | Ambient temperature impact on turbine output with correlation metrics                                              |
| **Turbine Insights**        | Blade-pitch curtailment detection, yaw-alignment quality scoring, and operational status distribution              |
| **Wind Rose**               | Polar directional frequency chart with stacked speed-class breakdown                                               |
| **Dark / Light Theme**      | Fully adaptive UI — every chart, badge, and panel responds to the system or user-selected theme                    |

All charts feature **MATLAB-style click-and-drag zoom**, CSV export, and rich interactive tooltips.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Frontend  (React 18 + Vite 6)         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                    │
│  │UploadPage│  │ResultsPage│ │GuidePage │   ← React Router   │
│  └────┬─────┘  └────┬─────┘  └──────────┘                    │
│       │              │                                       │
│       │   ┌──────────┴──────────────────────┐                │
│       │   │ ResultsDashboard                │                │
│       │   │  ├─ StatisticsCards             │                │
│       │   │  ├─ PowerCurveChart (Recharts)  │                │
│       │   │  ├─ TimeSeriesChart             │                │
│       │   │  ├─ MonthlyBarChart             │                │
│       │   │  ├─ WindRoseChart (custom SVG)  │                │
│       │   │  ├─ DataQualityPanel            │                │
│       │   │  ├─ LossBreakdownCard           │                │
│       │   │  ├─ TemperatureCard             │                │
│       │   │  └─ TurbineInsightsCard         │                │
│       │   └─────────────────────────────────┘                │
│  Tailwind CSS v4 · shadcn/ui · Lucide Icons                  │
└──────────┬───────────────────────────────────────────────────┘
           │  REST / JSON
┌──────────▼───────────────────────────────────────────────────┐
│                        Backend  (FastAPI + Uvicorn)          │
│  /api/v1/upload          → CSV validation + full analysis    │
│  /api/v1/analyze-sample  → analysis on bundled sample data   │
│  /api/v1/sample-data     → preview generated SCADA records   │
│  /api/v1/health          → service + OpenOA status           │
│                                                              │
│  Services: validation · analysis (OpenOA 3.2) · loss_analysis│
│            sample_data                                       │
│  Stack:    Python 3.12 · Pandas · NumPy · SciPy · OpenOA     │
└──────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
openoa-wind-energy-analyzer/
├── backend/
│   ├── main.py                  # App entry, CORS, router wiring
│   ├── requirements.txt         # Python dependencies
│   ├── Procfile                 # Render start command
│   ├── .env.example             # Environment variable template
│   ├── routers/
│   │   ├── upload.py            # POST /api/v1/upload
│   │   ├── analysis.py          # POST /api/v1/analyze-sample, GET /api/v1/sample-data
│   │   └── health.py            # GET  /api/v1/health
│   ├── services/
│   │   ├── validation.py        # CSV schema & quality validation
│   │   ├── analysis.py          # Core OpenOA analysis pipeline
│   │   ├── loss_analysis.py     # Availability, curtailment, electrical losses
│   │   └── sample_data.py       # Synthetic SCADA data generator
│   └── utils/
│       └── helpers.py           # Shared utility functions
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── .env.example
│   ├── public/
│   │   └── samples/             # 4 bundled SCADA CSV files
│   └── src/
│       ├── main.jsx             # BrowserRouter + ThemeProvider bootstrap
│       ├── App.jsx              # Route definitions
│       ├── index.css            # Tailwind v4 theme variables (light + dark)
│       ├── context/
│       │   └── ThemeContext.jsx  # Light / dark toggle with localStorage
│       ├── hooks/
│       │   └── useChartColors.js# CSS-variable-aware chart color hook
│       ├── pages/
│       │   ├── UploadPage.jsx   # Landing: hero, drag-drop upload, sample gallery
│       │   ├── ResultsPage.jsx  # Analysis results wrapper
│       │   └── GuidePage.jsx    # Interactive documentation
│       ├── services/
│       │   └── api.js           # Axios-free fetch wrapper for the backend
│       ├── components/
│       │   ├── Header.jsx       # Sticky nav bar with route links + theme toggle
│       │   ├── FileUpload.jsx   # Drag-and-drop CSV uploader
│       │   ├── ResultsDashboard.jsx
│       │   ├── StatisticsCards.jsx
│       │   ├── PowerCurveChart.jsx
│       │   ├── TimeSeriesChart.jsx
│       │   ├── MonthlyBarChart.jsx
│       │   ├── WindRoseChart.jsx
│       │   ├── DataQualityPanel.jsx
│       │   ├── LossBreakdownCard.jsx
│       │   ├── TemperatureCard.jsx
│       │   ├── TurbineInsightsCard.jsx
│       │   ├── MonthlyTable.jsx
│       │   ├── DocumentationPage.jsx
│       │   ├── AnalysisSkeleton.jsx
│       │   ├── LoadingSpinner.jsx
│       │   └── ErrorMessage.jsx
│       ├── components/ui/       # shadcn/ui primitives
│       │   ├── badge.jsx
│       │   ├── button.jsx
│       │   ├── card.jsx
│       │   ├── input.jsx
│       │   ├── label.jsx
│       │   ├── alert.jsx
│       │   ├── separator.jsx
│       │   └── table.jsx
│       └── lib/
│           └── utils.js         # cn() helper (clsx + tailwind-merge)
│
└── README.md
```

---

## CSV Input Format

The upload endpoint accepts a CSV file with the following columns. Column names are **case-insensitive**; spaces and hyphens are normalised automatically.

### Required Columns

| Column       | Description           | Unit |
| ------------ | --------------------- | ---- |
| `timestamp`  | ISO-8601 date-time    | —    |
| `wind_speed` | Hub-height wind speed | m/s  |
| `power`      | Active power output   | kW   |

### Optional Columns

| Column                    | Description                    | Unit |
| ------------------------- | ------------------------------ | ---- |
| `wind_direction`          | Nacelle wind direction         | °    |
| `ambient_temperature`     | Ambient air temperature        | °C   |
| `turbine_status`          | Operational status code        | —    |
| `pitch_angle`             | Blade pitch angle              | °    |
| `relative_wind_direction` | Yaw error / relative direction | °    |

> **Tip:** The more optional columns you provide, the richer the analysis — pitch, yaw, and temperature insights are only generated when the corresponding data is present.

---

## Getting Started

### Prerequisites

| Requirement | Minimum Version |
| ----------- | --------------- |
| Python      | 3.10+           |
| Node.js     | 18+             |
| npm         | 9+              |

### 1. Clone the Repository

```bash
git clone https://github.com/Deepak1230987/OpenOA-Analyser.git
cd OpenOA-Analyser
```

### 2. Start the Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Launch the development server
uvicorn main:app --reload
```

### 3. Start the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Launch the development server
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable          | Default                                       | Description                                                |
| ----------------- | --------------------------------------------- | ---------------------------------------------------------- |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Comma-separated list of allowed CORS origins               |
| `LOG_LEVEL`       | `INFO`                                        | Python logging level (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |

### Frontend (`frontend/.env`)

| Variable       | Default                 | Description                 |
| -------------- | ----------------------- | --------------------------- |
| `VITE_API_URL` | `http://localhost:8000` | Base URL of the backend API |

---

## API Reference

All endpoints are versioned under `/api/v1`. Legacy `/api` routes are retained for backward compatibility.

| Method | Endpoint                 | Description                                 |
| ------ | ------------------------ | ------------------------------------------- |
| `GET`  | `/`                      | Root — links to docs and health check       |
| `GET`  | `/api/v1/health`         | Service health + OpenOA library status      |
| `POST` | `/api/v1/upload`         | Upload a CSV file → full analysis JSON      |
| `GET`  | `/api/v1/sample-data`    | Preview auto-generated sample SCADA records |
| `POST` | `/api/v1/analyze-sample` | Run analysis on generated sample data       |

<details>
<summary><strong>Example: Upload a CSV</strong></summary>

```bash
curl -X POST http://localhost:8000/api/v1/upload \
  -F "file=@my_scada_data.csv" \
  -F "rated_power=2000"
```

The response is a JSON object containing `power_curve`, `time_series`, `statistics`, `monthly`, `data_quality`, `losses`, `temperature`, `pitch_analysis`, `yaw_analysis`, `status_distribution`, and `wind_rose` sections.

</details>

---

## Tech Stack

| Layer        | Technologies                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------------- |
| **Backend**  | Python 3.12 · FastAPI 0.115 · Uvicorn · Pandas 2.2 · NumPy 1.26 · SciPy 1.14 · OpenOA 3.2      |
| **Frontend** | React 18 · Vite 6 · Tailwind CSS v4 · shadcn/ui · Recharts 2.x · React Router 7 · Lucide Icons |
| **Tooling**  | class-variance-authority · clsx · tailwind-merge                                               |
| **Hosting**  | Railway (backend) · Vercel (frontend)                                                           |

---

## Key Features at a Glance

- **Zero-config CSV upload** — drag-and-drop with automatic column detection and normalisation
- **Bundled sample datasets** — 4 pre-generated SCADA files (30-day to 1-year) for instant exploration
- **Real OpenOA integration** — all analysis runs through NREL's OpenOA 3.2 library
- **Dark / Light theme** — full theme support across every component, chart axis, and tooltip
- **MATLAB-style drag-to-zoom** — on all Recharts-based charts with double-click reset
- **CSV export** — export any chart's underlying data with one click
- **Responsive design** — works on desktop, tablet, and mobile viewports
- **Interactive documentation** — built-in guide page with API reference and usage examples

---

## License

This project is licensed under the [MIT License](LICENSE).
