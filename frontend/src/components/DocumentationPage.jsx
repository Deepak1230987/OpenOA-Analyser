/**
 * DocumentationPage Component
 * ===========================
 * Comprehensive guide with sidebar navigation explaining the app,
 * OpenOA integration, CSV format, analysis pipeline, and all outputs.
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import {
  BookOpen,
  FileSpreadsheet,
  Cpu,
  BarChart3,
  Upload,
  Filter,
  TrendingUp,
  Zap,
  Wind,
  Compass,
  Calendar,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  Layers,
  GitBranch,
  Table,
  Thermometer,
  Gauge,
  Activity,
  Menu,
  X,
  Download,
  Database,
} from "lucide-react";

/* ================================================================
   SIDEBAR NAVIGATION STRUCTURE
   ================================================================ */
const NAV = [
  {
    group: "Getting Started",
    items: [
      { id: "overview", label: "Overview", icon: BarChart3 },
      { id: "architecture", label: "Architecture", icon: Layers },
    ],
  },
  {
    group: "Data",
    items: [
      { id: "csv-format", label: "CSV Requirements", icon: FileSpreadsheet },
      { id: "column-reference", label: "Column Reference", icon: Table },
      { id: "sample-data", label: "Sample Datasets", icon: Download },
    ],
  },
  {
    group: "Analysis",
    items: [
      { id: "openoa", label: "OpenOA Integration", icon: Cpu },
      { id: "pipeline", label: "Analysis Pipeline", icon: GitBranch },
    ],
  },
  {
    group: "Outputs",
    items: [
      { id: "outputs-core", label: "Core Dashboard", icon: BarChart3 },
      { id: "outputs-advanced", label: "Advanced Analytics", icon: Activity },
    ],
  },
  {
    group: "API",
    items: [{ id: "api-reference", label: "API Endpoints", icon: Database }],
  },
  {
    group: "Help",
    items: [{ id: "faq", label: "FAQ", icon: BookOpen }],
  },
];

const ALL_IDS = NAV.flatMap((g) => g.items.map((i) => i.id));

/* ================================================================
   MAIN COMPONENT
   ================================================================ */
export default function DocumentationPage() {
  const navigate = useNavigate();
  const goBack = () => navigate("/");
  const [activeId, setActiveId] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const contentRef = useRef(null);

  /* Intersection-observer-based active section tracking */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 },
    );
    ALL_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id) => {
    setActiveId(id);
    setSidebarOpen(false);
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border -mx-4 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer"
        >
          {sidebarOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
          Navigation
        </button>
        <Button
          variant="outline"
          size="sm"
          onClick={goBack}
          className="text-xs gap-1"
        >
          <ArrowLeft className="h-3 w-3" /> Back
        </Button>
      </div>

      <div className="flex gap-8 relative">
        {/* ── SIDEBAR ── */}
        <aside
          className={`
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            fixed lg:sticky top-0 lg:top-4 left-0 z-40 lg:z-auto
            w-64 shrink-0 h-screen lg:h-fit lg:max-h-[calc(100vh-2rem)] overflow-y-auto
            bg-background lg:bg-transparent border-r lg:border-r-0 border-border
            pt-16 lg:pt-0 pb-8 px-4 lg:px-0
            transition-transform duration-200
            lg:block lg:self-start
          `}
        >
          {/* Sidebar header */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="p-1.5 bg-blue-50 rounded-lg dark:bg-blue-900/40">
              <BookOpen className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-sm font-bold tracking-tight">
              Documentation
            </span>
          </div>

          {/* Nav groups */}
          <nav className="space-y-5">
            {NAV.map((group) => (
              <div key={group.group}>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 px-2">
                  {group.group}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeId === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => scrollTo(item.id)}
                          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-all cursor-pointer
                            ${
                              isActive
                                ? "bg-primary/8 text-primary font-semibold border border-primary/10"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                            }`}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          {item.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Back button at bottom */}
          <div className="hidden lg:block mt-8 pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={goBack}
              className="w-full text-xs gap-1.5"
            >
              <ArrowLeft className="h-3 w-3" /> Back to App
            </Button>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── MAIN CONTENT ── */}
        <main ref={contentRef} className="flex-1 min-w-0 py-6 space-y-10">
          {/* OVERVIEW */}
          <section id="overview">
            <SectionHeading
              icon={<BarChart3 className="h-4 w-4" />}
              title="What This App Does"
            />
            <Card>
              <CardContent className="p-6 space-y-4">
                <p className="text-sm text-foreground/75 leading-relaxed">
                  The{" "}
                  <strong className="text-foreground">
                    OpenOA Wind Energy Analyzer
                  </strong>{" "}
                  is a full-stack web application that performs operational
                  assessment of wind turbines using SCADA (Supervisory Control
                  and Data Acquisition) data. It is built around the{" "}
                  <strong className="text-foreground">OpenOA 3.2</strong>{" "}
                  library developed by the National Renewable Energy Laboratory
                  (NREL).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                  <FeatureCard
                    icon={<Upload className="h-5 w-5 text-sky-500" />}
                    title="Upload CSV"
                    desc="Upload your SCADA CSV data or use the built-in sample dataset for a quick demo."
                  />
                  <FeatureCard
                    icon={<Cpu className="h-5 w-5 text-violet-500" />}
                    title="Automated Analysis"
                    desc="Data is validated, cleaned, and analysed using real OpenOA 3.2 utility functions."
                  />
                  <FeatureCard
                    icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
                    title="Interactive Charts"
                    desc="Power curves, time series, wind roses, and more — all with drag-to-zoom."
                  />
                  <FeatureCard
                    icon={<Activity className="h-5 w-5 text-rose-500" />}
                    title="Advanced Insights"
                    desc="Temperature, pitch, yaw, turbine status, and energy loss analytics."
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ARCHITECTURE */}
          <section id="architecture">
            <SectionHeading
              icon={<Layers className="h-4 w-4" />}
              title="Architecture"
            />
            <Card>
              <CardContent className="p-6 space-y-4">
                <p className="text-sm text-foreground/75 leading-relaxed">
                  The application follows a clean client–server architecture
                  with a React frontend and a FastAPI Python backend.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TechStackCard
                    title="Frontend"
                    items={[
                      "React 18 with Vite 6 — fast HMR and builds",
                      "Tailwind CSS v4 — utility-first styling",
                      "shadcn/ui — accessible, composable components",
                      "Recharts — SVG charting with drag-to-zoom",
                      "Skeleton loading states for async data",
                    ]}
                    color="sky"
                  />
                  <TechStackCard
                    title="Backend"
                    items={[
                      "FastAPI — async Python web framework",
                      "OpenOA 3.2 — NREL wind energy analysis",
                      "Pandas / NumPy — data manipulation",
                      "API versioning (v1) with legacy compat",
                      "Structured validation with detailed errors",
                    ]}
                    color="emerald"
                  />
                </div>

                <Callout
                  color="blue"
                  icon={<Info className="h-4 w-4 text-blue-500" />}
                >
                  All OpenOA function calls run server-side. The frontend sends
                  the CSV and receives a JSON response with all computed
                  results. No data is stored on disk.
                </Callout>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* CSV FORMAT */}
          <section id="csv-format">
            <SectionHeading
              icon={<FileSpreadsheet className="h-4 w-4" />}
              title="CSV File Requirements"
            />
            <Card>
              <CardContent className="p-6 space-y-5">
                <p className="text-sm text-foreground/75 leading-relaxed">
                  Upload a standard CSV file containing wind-turbine SCADA data.
                  The file must have a header row with column names. Column
                  names are{" "}
                  <strong className="text-foreground">case-insensitive</strong>{" "}
                  and the app recognises many common naming conventions
                  including IEC 61400-25 names.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-emerald-200 dark:border-emerald-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        Required Columns (3)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <ColItem
                        name="timestamp"
                        desc="Date/time (ISO-8601 or parsable datetime)"
                        required
                      />
                      <ColItem
                        name="wind_speed"
                        desc="Horizontal wind speed in m/s"
                        required
                      />
                      <ColItem
                        name="power"
                        desc="Active power output in kW"
                        required
                      />
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200 dark:border-blue-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-500" />
                        Optional Columns (5)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <ColItem
                        name="wind_direction"
                        desc="Wind direction 0–360° — enables Wind Rose"
                      />
                      <ColItem
                        name="ambient_temperature"
                        desc="Ambient temp °C — enables Temperature Analysis"
                      />
                      <ColItem
                        name="turbine_status"
                        desc="Status code (0/1/2) — enables Status Distribution"
                      />
                      <ColItem
                        name="pitch_angle"
                        desc="Blade pitch angle ° — enables Pitch Analysis"
                      />
                      <ColItem
                        name="relative_wind_direction"
                        desc="Nacelle-relative direction ° — Yaw Analysis"
                      />
                    </CardContent>
                  </Card>
                </div>

                <h4 className="text-sm font-semibold text-foreground mt-2">
                  File Constraints
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <ConstraintCard label="Max File Size" value="50 MB" />
                  <ConstraintCard label="Encoding" value="UTF-8" />
                  <ConstraintCard label="Min Rows" value="10" />
                  <ConstraintCard label="Format" value=".csv only" />
                </div>

                <h4 className="text-sm font-bold text-foreground mt-2">
                  Example CSV (all 8 columns)
                </h4>
                <div className="bg-muted/50 rounded-xl p-4 overflow-x-auto border border-border dark:bg-muted/30">
                  <pre className="text-xs text-foreground/80 font-mono whitespace-pre leading-relaxed">{`timestamp,wind_speed,power,wind_direction,ambient_temperature,turbine_status,pitch_angle,relative_wind_direction
2025-01-01 00:00:00,8.5,1200.0,225.3,5.2,1,2.1,3.4
2025-01-01 01:00:00,9.2,1450.5,230.1,4.8,1,2.5,-2.1
2025-01-01 02:00:00,7.1,890.2,215.7,4.5,1,1.8,5.7
2025-01-01 03:00:00,3.8,45.0,200.0,4.1,1,0.5,1.2
2025-01-01 04:00:00,2.1,0.0,195.5,3.8,0,0.0,0.8
2025-01-01 05:00:00,11.5,2000.0,240.2,5.0,1,4.2,-1.5
2025-01-01 06:00:00,14.3,2000.0,250.8,5.5,1,8.5,2.3
2025-01-01 07:00:00,,1800.0,245.0,6.1,1,6.1,-0.5
2025-01-01 08:00:00,10.2,,230.5,6.8,2,,3.1`}</pre>
                </div>
                <p className="text-xs text-foreground/65">
                  Missing values (empty cells or NaN) are acceptable.{" "}
                  <code className="text-xs bg-primary/10 text-primary font-semibold font-mono px-1.5 py-0.5 rounded-md border border-primary/15">
                    turbine_status
                  </code>
                  : 0 = stopped, 1 = normal operation, 2 = maintenance/fault.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* COLUMN REFERENCE */}
          <section id="column-reference">
            <SectionHeading
              icon={<Table className="h-4 w-4" />}
              title="Column Reference & Aliases"
            />
            <Card>
              <CardContent className="p-6 space-y-4">
                <p className="text-sm text-foreground/75 leading-relaxed">
                  The app maps many common column-name variations to canonical
                  names, including the IEC 61400-25 naming convention used by
                  OpenOA&apos;s{" "}
                  <code className="text-xs bg-primary/10 text-primary font-semibold font-mono px-1.5 py-0.5 rounded-md border border-primary/15">
                    SCADAMetaData
                  </code>{" "}
                  schema. Matching is{" "}
                  <strong className="text-foreground">case-insensitive</strong>.
                </p>

                <div className="overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-muted/40 dark:bg-muted/20">
                      <tr className="border-b border-border/60">
                        <Th>Canonical Name</Th>
                        <Th>OpenOA / IEC Name</Th>
                        <Th>Accepted Aliases</Th>
                        <Th>Unit</Th>
                        <Th center>Required</Th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground [&_tr:nth-child(even)]:bg-muted/15 dark:[&_tr:nth-child(even)]:bg-muted/10">
                      <AliasRow
                        canonical="timestamp"
                        iec="time"
                        aliases="timestamp, time, datetime, date_time, date"
                        unit="ISO-8601"
                        required
                      />
                      <AliasRow
                        canonical="wind_speed"
                        iec="WMET_HorWdSpd"
                        aliases="wind_speed, windspeed, ws, wmet_horwdspd, wind_speed_ms"
                        unit="m/s"
                        required
                      />
                      <AliasRow
                        canonical="power"
                        iec="WTUR_W"
                        aliases="power, power_output, active_power, wtur_w, power_kw"
                        unit="kW"
                        required
                      />
                      <AliasRow
                        canonical="wind_direction"
                        iec="WMET_HorWdDir"
                        aliases="wind_direction, wdir, wd, wmet_horwddir"
                        unit="degrees"
                      />
                      <AliasRow
                        canonical="ambient_temperature"
                        iec="WMET_EnvTmp"
                        aliases="ambient_temperature, temperature, temp, wmet_envtmp"
                        unit="°C"
                      />
                      <AliasRow
                        canonical="turbine_status"
                        iec="WTUR_TurSt"
                        aliases="turbine_status, status_code, wtur_turst, operating_status"
                        unit="code"
                      />
                      <AliasRow
                        canonical="pitch_angle"
                        iec="WROT_BlPthAngVal"
                        aliases="pitch_angle, pitch, blade_pitch, wrot_blpthangval"
                        unit="degrees"
                      />
                      <AliasRow
                        canonical="relative_wind_direction"
                        iec="WMET_HorWdDirRel"
                        aliases="relative_wind_direction, yaw_error, nacelle_direction, wmet_horwddirrel"
                        unit="degrees"
                      />
                    </tbody>
                  </table>
                </div>

                <Callout
                  color="blue"
                  icon={<Info className="h-4 w-4 text-blue-500" />}
                >
                  <strong>OpenOA SCADAMetaData context:</strong> OpenOA defines
                  SCADA columns following the IEC 61400-25 standard. The app
                  maps your column names to these conventions automatically — no
                  need to rename columns in your CSV.
                </Callout>
              </CardContent>
            </Card>
          </section>

          {/* SAMPLE DATA */}
          <section id="sample-data">
            <SectionHeading
              icon={<Download className="h-4 w-4" />}
              title="Sample Datasets"
            />
            <Card>
              <CardContent className="p-6 space-y-4">
                <p className="text-sm text-foreground/75 leading-relaxed">
                  The app includes a built-in sample dataset generator, or you
                  can use one of the pre-generated CSV files below. Click{" "}
                  <strong className="text-foreground">
                    &quot;Try Sample Data&quot;
                  </strong>{" "}
                  in the app to instantly analyse a 30-day synthetic SCADA
                  dataset.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <SampleCard
                    name="scada_30day_2MW.csv"
                    rows="720"
                    cols="8"
                    desc="30 days of hourly data for a 2 MW turbine. All 8 columns. Good for quick testing."
                  />
                  <SampleCard
                    name="scada_1year_2MW.csv"
                    rows="8,760"
                    cols="8"
                    desc="Full year of hourly data for a 2 MW turbine. Best for comprehensive analysis."
                  />
                  <SampleCard
                    name="scada_90day_3MW.csv"
                    rows="2,160"
                    cols="8"
                    desc="90 days of hourly data for a 3 MW turbine. Different rated power for testing."
                  />
                  <SampleCard
                    name="scada_minimal.csv"
                    rows="720"
                    cols="3"
                    desc="30 days with only the 3 required columns. Tests minimal-data analysis path."
                  />
                </div>

                <Callout
                  color="amber"
                  icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
                >
                  Sample datasets include realistic features:
                  Weibull-distributed wind, cubic power curve with noise,
                  seasonal temperature patterns, downtime events, and
                  physically-modelled pitch control logic.
                </Callout>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* OPENOA INTEGRATION */}
          <section id="openoa">
            <SectionHeading
              icon={<Cpu className="h-4 w-4" />}
              title="How It Uses OpenOA"
            />
            <Card>
              <CardContent className="p-6 space-y-5">
                <p className="text-sm text-foreground/75 leading-relaxed">
                  <a
                    href="https://github.com/NREL/OpenOA"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                  >
                    OpenOA (Open Operational Assessment){" "}
                    <ExternalLink className="h-3 w-3" />
                  </a>{" "}
                  is an open-source Python library by NREL for wind plant
                  performance analysis. This application uses{" "}
                  <strong className="text-foreground">OpenOA 3.2</strong>&apos;s
                  utility-layer functions for data cleaning, filtering,
                  power-curve modelling, and energy accounting.
                </p>

                <div className="space-y-3">
                  <FunctionGroup
                    title="Data Filtering & Cleaning"
                    icon={<Filter className="h-4 w-4 text-amber-500" />}
                    functions={[
                      {
                        name: "range_flag(col, lo, hi, data)",
                        desc: "Flags values outside physical bounds (e.g. wind speed < 0 or > 40 m/s, power < 0 or > rated+5%).",
                      },
                      {
                        name: "unresponsive_flag(col, threshold, data)",
                        desc: "Detects frozen/stuck sensor readings where the same value repeats consecutively (threshold=3).",
                      },
                      {
                        name: "window_range_flag(window_col, …, data)",
                        desc: "Contextual filter — flags near-zero power when wind speed is below cut-in.",
                      },
                      {
                        name: "bin_filter(bin_col, value_col, threshold, data)",
                        desc: "Flags statistical outliers within each 1 m/s wind-speed bin using a 2σ threshold.",
                      },
                    ]}
                  />
                  <FunctionGroup
                    title="Power Curve Modelling"
                    icon={<Zap className="h-4 w-4 text-emerald-500" />}
                    functions={[
                      {
                        name: "IEC(wind_col, power_col, data, bin_width=1.0)",
                        desc: "Computes IEC 61400-12-1 compliant binned power curve. Returns a callable interpolation function.",
                      },
                    ]}
                  />
                  <FunctionGroup
                    title="Energy & Conversion"
                    icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
                    functions={[
                      {
                        name: "convert_power_to_energy(col, rate, data)",
                        desc: "Converts instantaneous power (kW) to cumulative energy (kWh) using sampling interval.",
                      },
                      {
                        name: "determine_frequency(timestamps)",
                        desc: "Auto-infers sampling frequency (e.g. '10min', '1h') from timestamp column.",
                      },
                    ]}
                  />
                  <FunctionGroup
                    title="Data Quality"
                    icon={<ShieldCheck className="h-4 w-4 text-violet-500" />}
                    functions={[
                      {
                        name: "percent_nan(col, data)",
                        desc: "Computes fraction of NaN/missing values — used for completeness reporting.",
                      },
                      {
                        name: "find_time_gaps(timestamps)",
                        desc: "Identifies gaps where data is missing for expected intervals.",
                      },
                      {
                        name: "gap_fill_data_frame(df, freq)",
                        desc: "Inserts empty rows for missing timestamps to ensure uniform spacing.",
                      },
                    ]}
                  />
                </div>

                <Callout
                  color="amber"
                  icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
                >
                  <strong>Note on higher-level analyses:</strong> OpenOA also
                  includes{" "}
                  <code className="text-xs px-1.5 py-0.5 rounded font-semibold font-mono bg-primary/10 text-primary border border-primary/15">
                    MonteCarloAEP
                  </code>
                  ,{" "}
                  <code className="text-xs px-1.5 py-0.5 rounded font-semibold font-mono bg-primary/10 text-primary border border-primary/15">
                    TurbineLongTermGrossEnergy
                  </code>
                  , and{" "}
                  <code className="text-xs px-1.5 py-0.5 rounded font-semibold font-mono bg-primary/10 text-primary border border-primary/15">
                    WakeLosses
                  </code>
                  . These require reanalysis weather data and multi-turbine
                  plant configurations beyond a single CSV upload.
                </Callout>
              </CardContent>
            </Card>
          </section>

          {/* ANALYSIS PIPELINE */}
          <section id="pipeline">
            <SectionHeading
              icon={<GitBranch className="h-4 w-4" />}
              title="Analysis Pipeline"
            />
            <Card>
              <CardContent className="p-6 space-y-5">
                <p className="text-sm text-foreground/75 leading-relaxed">
                  When you upload a CSV, the backend executes a multi-stage
                  pipeline. Each stage uses real OpenOA functions (with fallback
                  logic if OpenOA is unavailable).
                </p>

                <div className="space-y-0">
                  <PipelineStep
                    step={1}
                    title="Validation & Column Mapping"
                    desc="CSV is parsed, column names matched to canonical names using alias table. Physical range checks use OpenOA's range_flag(). Structured validation errors are returned for any issues."
                    badge="validation.py"
                    color="sky"
                  />
                  <PipelineConnector />
                  <PipelineStep
                    step={2}
                    title="4-Stage OpenOA Filter Pipeline"
                    desc="Data is cleaned through: (1) range_flag — impossible values, (2) unresponsive_flag — frozen sensors, (3) window_range_flag — below cut-in anomalies, (4) bin_filter — per-bin 2σ outliers."
                    badge="analysis.py"
                    color="amber"
                  />
                  <PipelineConnector />
                  <PipelineStep
                    step={3}
                    title="IEC Power Curve Computation"
                    desc="OpenOA's IEC() function computes an IEC 61400-12-1 compliant binned power curve with per-bin statistics (mean, std, count, min, max) and confidence intervals."
                    badge="IEC()"
                    color="emerald"
                  />
                  <PipelineConnector />
                  <PipelineStep
                    step={4}
                    title="Energy & Performance Metrics"
                    desc="Power-to-energy conversion via convert_power_to_energy() with auto-detected frequency. Capacity factor, availability (from turbine_status codes when available), and AEP are computed."
                    badge="energy"
                    color="violet"
                  />
                  <PipelineConnector />
                  <PipelineStep
                    step={5}
                    title="Data Quality Assessment"
                    desc="percent_nan(), find_time_gaps(), and gap_fill_data_frame() assess completeness, gaps, and NaN coverage. A composite completeness score is calculated."
                    badge="quality"
                    color="rose"
                  />
                  <PipelineConnector />
                  <PipelineStep
                    step={6}
                    title="Advanced Analytics"
                    desc="Temperature trends (daily/diurnal patterns, power–temperature correlation), pitch analysis (feathering detection, pitch vs wind curve), yaw error analysis (mean deviation, wind-speed correlation), and turbine status distribution."
                    badge="analytics"
                    color="blue"
                  />
                  <PipelineConnector />
                  <PipelineStep
                    step={7}
                    title="Loss Analysis & Assembly"
                    desc="Energy loss breakdown (curtailment, downtime, wake, blade degradation, electrical losses) is computed. All results are assembled into JSON and returned."
                    badge="response"
                    color="sky"
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* OUTPUTS - CORE */}
          <section id="outputs-core">
            <SectionHeading
              icon={<BarChart3 className="h-4 w-4" />}
              title="Core Dashboard Outputs"
            />
            <Card>
              <CardContent className="p-6 space-y-4">
                <p className="text-sm text-foreground/75 leading-relaxed">
                  The results dashboard provides nine interactive sections,
                  conditionally shown based on available data columns:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <OutputCard
                    icon={<BarChart3 className="h-5 w-5 text-slate-500" />}
                    title="Summary Statistics"
                    desc="10 KPI cards: total records, time span, mean/max wind speed, mean/max power, capacity factor, availability, estimated AEP, and total energy."
                    badge="Always"
                  />
                  <OutputCard
                    icon={<Zap className="h-5 w-5 text-amber-500" />}
                    title="Power Curve"
                    desc="IEC-binned scatter + area chart with ±1σ confidence band, dot size ∝ sample count, cut-in/rated lines, availability colour toggle, drag-to-zoom, CSV export."
                    badge="Always"
                  />
                  <OutputCard
                    icon={<TrendingUp className="h-5 w-5 text-sky-500" />}
                    title="Time Series"
                    desc="6 toggleable series (wind speed, power, temperature, direction, pitch angle, yaw error) with 12-point moving average, drag-to-zoom, CSV export."
                    badge="Always"
                  />
                  <OutputCard
                    icon={<Compass className="h-5 w-5 text-teal-500" />}
                    title="Wind Rose"
                    desc="16-sector polar chart showing directional frequency with 7 speed-class colour bands. Shows prevailing wind direction."
                    badge="wind_direction"
                  />
                  <OutputCard
                    icon={<Calendar className="h-5 w-5 text-violet-500" />}
                    title="Monthly Breakdown"
                    desc="Grouped bar chart + table with per-month energy (MWh), capacity factor (%), mean wind speed, and availability. Sorting and metric toggles."
                    badge="Always"
                  />
                  <OutputCard
                    icon={<ShieldCheck className="h-5 w-5 text-rose-500" />}
                    title="Data Quality"
                    desc="Radial completeness score, missing data %, detected frequency, timestamp gaps, curtailment events, and idle-in-wind count."
                    badge="Always"
                  />
                </div>

                <Callout
                  color="emerald"
                  icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                >
                  <strong>All charts are interactive:</strong> Drag to zoom on
                  power curve and time series charts. Toggle data layers on/off.
                  Export CSV. Double-click to reset. Expand/collapse chart
                  height.
                </Callout>
              </CardContent>
            </Card>
          </section>

          {/* OUTPUTS - ADVANCED */}
          <section id="outputs-advanced">
            <SectionHeading
              icon={<Activity className="h-4 w-4" />}
              title="Advanced Analytics"
            />
            <Card>
              <CardContent className="p-6 space-y-4">
                <p className="text-sm text-foreground/75 leading-relaxed">
                  When optional columns are present, the dashboard unlocks
                  additional analysis panels. These provide deeper operational
                  insights into turbine behaviour.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AdvancedCard
                    icon={<TrendingUp className="h-5 w-5 text-red-500" />}
                    title="Energy Loss Breakdown"
                    desc="Waterfall-style analysis of energy losses: curtailment, downtime, wake effects, blade degradation, and electrical losses. Gross vs net energy comparison."
                    requires="power + wind_speed"
                    color="red"
                  />
                  <AdvancedCard
                    icon={<Thermometer className="h-5 w-5 text-orange-500" />}
                    title="Temperature Analysis"
                    desc="Daily temperature trends, diurnal patterns (hourly heat map), power–temperature correlation coefficient, and statistical summary."
                    requires="ambient_temperature"
                    color="orange"
                  />
                  <AdvancedCard
                    icon={<Gauge className="h-5 w-5 text-rose-500" />}
                    title="Pitch Analysis"
                    desc="Pitch angle distribution, pitch vs wind speed binned curve, feathering detection (pitch > 15° during high wind), and operating statistics."
                    requires="pitch_angle"
                    color="rose"
                  />
                  <AdvancedCard
                    icon={<Compass className="h-5 w-5 text-amber-500" />}
                    title="Yaw Error Analysis"
                    desc="Mean yaw deviation, yaw error vs wind speed trend, large-error frequency (> 10°), and yaw alignment statistics."
                    requires="relative_wind_direction"
                    color="amber"
                  />
                  <AdvancedCard
                    icon={<Activity className="h-5 w-5 text-violet-500" />}
                    title="Status Distribution"
                    desc="Pie chart of turbine operating states: normal operation, stopped, maintenance/fault. Percentage breakdown and availability inference."
                    requires="turbine_status"
                    color="violet"
                  />
                </div>

                <Callout
                  color="blue"
                  icon={<Info className="h-4 w-4 text-blue-500" />}
                >
                  <strong>Availability inference:</strong> When{" "}
                  <code className="text-xs px-1.5 py-0.5 rounded font-semibold font-mono bg-primary/10 text-primary border border-primary/15">
                    turbine_status
                  </code>{" "}
                  is present, availability is computed from status codes (1 =
                  normal). Without it, availability is inferred from power
                  output and wind speed thresholds.
                </Callout>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* API REFERENCE */}
          <section id="api-reference">
            <SectionHeading
              icon={<Database className="h-4 w-4" />}
              title="API Endpoints"
            />
            <Card>
              <CardContent className="p-6 space-y-4">
                <p className="text-sm text-foreground/75 leading-relaxed">
                  The backend exposes a versioned REST API. All endpoints accept
                  standard HTTP requests and return JSON responses.
                </p>

                <div className="space-y-3">
                  <ApiEndpoint
                    method="POST"
                    path="/api/v1/upload"
                    desc="Upload a SCADA CSV file for analysis. Accepts multipart/form-data with 'file' and optional 'rated_power_kw' fields. Returns the full analysis JSON."
                  />
                  <ApiEndpoint
                    method="POST"
                    path="/api/v1/analyze-sample"
                    desc="Analyse the built-in sample dataset. Accepts optional 'rated_power_kw' form field. Returns the same analysis structure as /upload."
                  />
                  <ApiEndpoint
                    method="GET"
                    path="/api/v1/health"
                    desc="Health check endpoint. Returns status, OpenOA version, and uptime information."
                  />
                </div>

                <h4 className="text-sm font-bold text-foreground mt-2">
                  Response Structure
                </h4>
                <div className="bg-muted/50 rounded-xl p-4 overflow-x-auto border border-border dark:bg-muted/30">
                  <pre className="text-xs text-foreground/80 font-mono whitespace-pre leading-relaxed">{`{
  "method": "openoa",           // "openoa" or "fallback"
  "summary": { ... },           // 10 KPI metrics
  "power_curve": [ ... ],       // Binned power curve data
  "time_series": [ ... ],       // Time-indexed SCADA values
  "data_quality": { ... },      // Completeness & gap info
  "monthly_stats": [ ... ],     // Per-month breakdowns
  "wind_rose": [ ... ],         // 16-sector directional data (if wind_direction)
  "loss_breakdown": { ... },    // Energy loss analysis
  "temperature_analysis": {},   // Temp trends (if ambient_temperature)
  "pitch_analysis": {},         // Pitch stats (if pitch_angle)
  "yaw_analysis": {},           // Yaw error stats (if relative_wind_direction)
  "status_distribution": {}     // Status breakdown (if turbine_status)
}`}</pre>
                </div>

                <Callout
                  color="blue"
                  icon={<Info className="h-4 w-4 text-blue-500" />}
                >
                  Legacy endpoints (
                  <code className="text-xs px-1.5 py-0.5 rounded font-semibold font-mono bg-primary/10 text-primary border border-primary/15">
                    /api/upload
                  </code>
                  ,{" "}
                  <code className="text-xs px-1.5 py-0.5 rounded font-semibold font-mono bg-primary/10 text-primary border border-primary/15">
                    /api/analyze-sample
                  </code>
                  ) are still supported for backward compatibility and redirect
                  to v1 routes.
                </Callout>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* FAQ */}
          <section id="faq">
            <SectionHeading
              icon={<BookOpen className="h-4 w-4" />}
              title="Frequently Asked Questions"
            />
            <div className="space-y-3">
              <FaqItem
                q="What sampling frequency should my data have?"
                a="Any regular interval — 1-min, 10-min, or hourly. OpenOA's determine_frequency() auto-detects it. Irregular intervals are handled but may reduce quality scores."
              />
              <FaqItem
                q="How many rows of data do I need?"
                a="Minimum 10 rows, but 500+ rows (a week of 10-min data) is recommended for meaningful analysis. The sample dataset has 720 hourly rows (≈ 30 days)."
              />
              <FaqItem
                q="Does the app handle missing values?"
                a="Yes. Missing values are handled gracefully. The pipeline drops NaN rows for specific calculations and reports missing-data percentages in Data Quality. OpenOA's percent_nan() and gap_fill_data_frame() are used."
              />
              <FaqItem
                q="Can I upload data for multiple turbines?"
                a="Currently analyses one turbine at a time. If your CSV has multiple turbines (e.g. 'asset_id' column), all rows are analysed together. Upload separate files for per-turbine results."
              />
              <FaqItem
                q="What is the 'rated power' input for?"
                a="The nameplate capacity (kW) of your turbine — maximum power it can produce. Used for capacity factor, curtailment detection, and power curve normalisation. Default: 2000 kW (2 MW)."
              />
              <FaqItem
                q="What do the turbine_status codes mean?"
                a="0 = stopped/offline, 1 = normal operation, 2 = maintenance/fault. When present, availability is computed directly from the fraction of status=1 readings."
              />
              <FaqItem
                q="What enables the advanced analytics panels?"
                a="Each panel requires specific optional columns: Temperature needs ambient_temperature, Pitch needs pitch_angle, Yaw needs relative_wind_direction, and Status needs turbine_status. Loss breakdown is always shown."
              />
              <FaqItem
                q="Why doesn't it use MonteCarloAEP?"
                a="OpenOA's MonteCarloAEP, TurbineLongTermGrossEnergy, and WakeLosses need reanalysis weather data and multi-turbine PlantData configurations beyond a single CSV upload."
              />
              <FaqItem
                q="What does 'method: openoa' mean?"
                a="This badge indicates OpenOA 3.2 was loaded and used for analysis. If OpenOA isn't installed, the app falls back to equivalent pandas/numpy implementations (shown as 'method: fallback')."
              />
              <FaqItem
                q="Is my data stored anywhere?"
                a="No. Uploaded data is processed in memory and never written to disk. Once analysis completes, the raw data is discarded — only results are returned to your browser."
              />
            </div>
          </section>

          {/* Bottom back button */}
          <div className="flex justify-center pt-4 pb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={goBack}
              className="gap-1.5 text-xs"
            >
              <ArrowLeft className="h-3 w-3" /> Back to App
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ================================================================
   SUB-COMPONENTS
   ================================================================ */

function SectionHeading({ icon, title }) {
  return (
    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2.5">
      <span className="inline-flex items-center justify-center w-8 h-8 bg-primary/8 rounded-lg text-primary border border-primary/10">
        {icon}
      </span>
      {title}
    </h3>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="flex flex-col items-center text-center gap-2.5 p-5 rounded-xl border border-border bg-gradient-to-b from-background to-muted/40 hover:shadow-lg hover:border-primary/20 transition-all duration-200">
      <div className="p-2.5 rounded-xl bg-background shadow-sm border border-border/40">
        {icon}
      </div>
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="text-xs text-foreground/70 leading-relaxed">{desc}</p>
    </div>
  );
}

function ColItem({ name, desc, required }) {
  return (
    <div className="flex items-start gap-2">
      <Badge
        variant={required ? "default" : "outline"}
        className={`text-[10px] mt-0.5 shrink-0 ${required ? "bg-emerald-600" : ""}`}
      >
        {name}
      </Badge>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

function ConstraintCard({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 bg-gradient-to-r from-muted/25 to-muted/10 hover:from-muted/40 hover:to-muted/20 transition-colors">
      <span className="text-xs font-medium text-foreground/70">{label}</span>
      <Badge variant="secondary" className="text-xs font-semibold">
        {value}
      </Badge>
    </div>
  );
}

function FunctionGroup({ title, icon, functions }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden shadow-sm">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/30 border-b border-border">
        {icon}
        <span className="text-sm font-bold text-foreground">{title}</span>
      </div>
      <div className="divide-y divide-border">
        {functions.map((f) => (
          <div
            key={f.name}
            className="px-4 py-3 hover:bg-muted/20 transition-colors"
          >
            <code className="text-xs font-mono font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/15">
              {f.name}
            </code>
            <p className="text-xs text-foreground/65 mt-1 leading-relaxed">
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Th({ children, center }) {
  return (
    <th
      className={`${center ? "text-center" : "text-left"} py-2.5 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground`}
    >
      {children}
    </th>
  );
}

function AliasRow({ canonical, iec, aliases, unit, required }) {
  return (
    <tr className="border-b border-border/40 hover:bg-muted/40 dark:hover:bg-muted/20 transition-colors">
      <td className="py-2 px-3">
        <code className="text-xs font-mono font-semibold text-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/50">
          {canonical}
        </code>
      </td>
      <td className="py-2 px-3">
        <code className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/15">
          {iec}
        </code>
      </td>
      <td className="py-2 px-3 text-xs">{aliases}</td>
      <td className="py-2 px-3 text-xs">{unit}</td>
      <td className="py-2 px-3 text-center">
        {required ? (
          <Badge variant="default" className="text-[9px] bg-emerald-600">
            Required
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[9px]">
            Optional
          </Badge>
        )}
      </td>
    </tr>
  );
}

function PipelineStep({ step, title, desc, badge, color }) {
  const accentColors = {
    sky: "border-l-sky-400 dark:border-l-sky-500",
    amber: "border-l-amber-400 dark:border-l-amber-500",
    emerald: "border-l-emerald-400 dark:border-l-emerald-500",
    violet: "border-l-violet-400 dark:border-l-violet-500",
    rose: "border-l-rose-400 dark:border-l-rose-500",
    blue: "border-l-blue-400 dark:border-l-blue-500",
  };

  const stepColors = {
    sky: "bg-sky-50 text-sky-900 dark:bg-sky-400/20 dark:text-sky-500",
    amber:
      "bg-amber-50 text-amber-900 dark:bg-amber-400/20 dark:text-amber-500",
    emerald:
      "bg-emerald-50 text-emerald-900 dark:bg-emerald-400/20 dark:text-emerald-500",
    violet:
      "bg-violet-50 text-violet-900 dark:bg-violet-400/20 dark:text-violet-500",
    rose: "bg-rose-50 text-rose-900 dark:bg-rose-400/20 dark:text-rose-500",
    blue: "bg-blue-50 text-blue-900 dark:bg-blue-400/20 dark:text-blue-500",
  };

  return (
    <div
      className={`rounded-xl border border-border/60 border-l-4 p-4 bg-background dark:bg-card ${accentColors[color]}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 ${stepColors[color]}`}
        >
          {step}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-foreground">{title}</span>
            <Badge variant="outline" className="text-[9px] font-semibold">
              {badge}
            </Badge>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
}

function PipelineConnector() {
  return (
    <div className="flex justify-start pl-7 py-0.5">
      <div className="w-0.5 h-4 bg-border rounded-full" />
    </div>
  );
}

function OutputCard({ icon, title, desc, badge }) {
  return (
    <div className="flex flex-col gap-2.5 p-4 rounded-xl border border-border bg-gradient-to-br from-background to-muted/30 hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="p-1.5 rounded-lg bg-muted/25">{icon}</div>
        {badge && (
          <Badge variant="secondary" className="text-[9px] font-semibold">
            {badge}
          </Badge>
        )}
      </div>
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="text-xs text-foreground/65 leading-relaxed">{desc}</p>
    </div>
  );
}

function AdvancedCard({ icon, title, desc, requires, color }) {
  const styles = {
    red: "border-l-red-400 dark:border-l-red-500",
    orange: "border-l-orange-400 dark:border-l-orange-500",
    rose: "border-l-rose-400 dark:border-l-rose-500",
    amber: "border-l-amber-400 dark:border-l-amber-500",
    violet: "border-l-violet-400 dark:border-l-violet-500",
  };

  return (
    <div
      className={`flex flex-col gap-2.5 p-4 rounded-xl border border-border/60 border-l-4 bg-background dark:bg-card ${styles[color]} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
    >
      <div className="flex items-center justify-between">
        <div className="p-1.5 rounded-lg bg-background/80">{icon}</div>
        <Badge variant="secondary" className="text-[9px] font-semibold">
          Requires: {requires}
        </Badge>
      </div>
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="text-xs text-foreground/65 leading-relaxed">{desc}</p>
    </div>
  );
}

function TechStackCard({ title, items, color }) {
  const styles = {
    sky: "border-l-4 border-l-sky-400 dark:border-l-sky-500",
    emerald: "border-l-4 border-l-emerald-400 dark:border-l-emerald-500",
  };

  return (
    <Card
      className={`${styles[color]} border-border/60 bg-background dark:bg-card shadow-sm`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-2 text-xs text-foreground/70"
          >
            <ChevronRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
            <span>{item}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SampleCard({ name, rows, cols, desc }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-linear-0 hover:shadow-md hover:border-emerald-300/50 transition-all duration-200 dark:from-emerald-850/50 dark:to-background">
      <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-400/20">
        <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-foreground">{name}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-[9px] font-semibold">
            {rows} rows
          </Badge>
          <Badge variant="secondary" className="text-[9px] font-semibold">
            {cols} columns
          </Badge>
        </div>
        <p className="text-xs text-foreground/65 mt-1.5 leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}

function ApiEndpoint({ method, path, desc }) {
  const methodColors = {
    GET: "bg-emerald-50 text-emerald-800 font-bold dark:bg-emerald-500/30 dark:text-emerald-700",
    POST: "bg-blue-50 text-blue-800 font-bold dark:bg-blue-500/30 dark:text-blue-700",
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/20 border-b border-border">
        <span
          className={`text-[10px] px-2.5 py-1 rounded-md ${methodColors[method]}`}
        >
          {method}
        </span>
        <code className="text-sm font-mono font-semibold text-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/50">
          {path}
        </code>
      </div>
      <div className="px-4 py-3">
        <p className="text-xs text-foreground/65 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function Callout({ color, icon, children }) {
  const accentColors = {
    blue: "border-l-blue-400 dark:border-l-blue-500",
    amber: "border-l-amber-400 dark:border-l-amber-500",
    emerald: "border-l-emerald-400 dark:border-l-emerald-500",
  };

  /* colour-aware code tag styles */
  const codeColors = {
    blue: "[&_code]:!bg-blue-500 [&_code]:!text-blue-800 [&_code]:!border-blue-200 dark:[&_code]:!bg-blue-200/20 dark:[&_code]:!text-blue-500 dark:[&_code]:!border-blue-700/30",
    amber:
      "[&_code]:!bg-amber-500 [&_code]:!text-amber-800 [&_code]:!border-amber-200 dark:[&_code]:!bg-amber-200/20 dark:[&_code]:!text-amber-500 dark:[&_code]:!border-amber-700/30",
    emerald:
      "[&_code]:!bg-emerald-500 [&_code]:!text-emerald-800 [&_code]:!border-emerald-200 dark:[&_code]:!bg-emerald-200/20 dark:[&_code]:!text-emerald-500 dark:[&_code]:!border-emerald-700/30",
  };

  return (
    <div
      className={`border border-border/60 border-l-4 rounded-lg p-4 bg-background dark:bg-card text-foreground ${accentColors[color]} ${codeColors[color]}`}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0">{icon}</span>
        <p className="text-sm leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-muted/40 transition-colors"
      >
        <span className="text-sm font-semibold text-foreground pr-4">{q}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <p className="text-sm text-foreground/70 leading-relaxed">{a}</p>
        </div>
      )}
    </Card>
  );
}
