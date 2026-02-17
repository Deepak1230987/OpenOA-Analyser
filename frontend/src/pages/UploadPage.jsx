/**
 * UploadPage
 * ==========
 * Professional landing page with hero, upload zone, and sample-data gallery.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import AnalysisSkeleton from "../components/AnalysisSkeleton";
import ErrorMessage from "../components/ErrorMessage";
import { uploadCSV } from "../services/api";
import {
  Wind,
  Zap,
  BarChart3,
  ShieldCheck,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Gauge,
  Thermometer,
  Activity,
  ArrowRight,
  Sparkles,
  Clock,
  Database,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Sample-data catalogue                                              */
/* ------------------------------------------------------------------ */
const SAMPLES = [
  {
    file: "scada_1year_2MW.csv",
    label: "1-Year Full Dataset",
    rows: "8 760",
    cols: 8,
    rated: 2000,
    desc: "Full year of hourly SCADA data for a 2 MW turbine with all 8 columns including pitch, yaw & status.",
    color: "sky",
    tags: ["All Columns", "12 months"],
  },
  {
    file: "scada_90day_3MW.csv",
    label: "90-Day 3 MW Turbine",
    rows: "2 160",
    cols: 8,
    rated: 3000,
    desc: "Three months of data from a larger 3 MW turbine. Great for testing cross-rated-power analysis.",
    color: "violet",
    tags: ["3 MW", "90 days"],
  },
  {
    file: "scada_30day_2MW.csv",
    label: "30-Day Quick Test",
    rows: "720",
    cols: 8,
    rated: 2000,
    desc: "One month of data – fast to process, ideal for a quick demo of every analysis feature.",
    color: "emerald",
    tags: ["Fast", "30 days"],
  },
  {
    file: "scada_minimal.csv",
    label: "Minimal 3-Column",
    rows: "500",
    cols: 3,
    rated: 2000,
    desc: "Only timestamp, wind_speed & power – the bare minimum. Shows how the app handles missing optional columns.",
    color: "amber",
    tags: ["Minimal", "3 cols"],
  },
];

const ACCENT = {
  sky: {
    border: "border-sky-200 dark:border-sky-800",
    badge: "bg-sky-50 text-sky-700 dark:bg-sky-500/20 dark:text-sky-500",
    icon: "text-sky-500",
    hover: "hover:border-sky-300 dark:hover:border-sky-700",
  },
  violet: {
    border: "border-violet-200 dark:border-violet-800",
    badge:
      "bg-violet-50 text-violet-700 dark:bg-violet-500/20 dark:text-violet-500",
    icon: "text-violet-500",
    hover: "hover:border-violet-300 dark:hover:border-violet-700",
  },
  emerald: {
    border: "border-emerald-200 dark:border-emerald-800",
    badge:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-500",
    icon: "text-emerald-500",
    hover: "hover:border-emerald-300 dark:hover:border-emerald-700",
  },
  amber: {
    border: "border-amber-200 dark:border-amber-800",
    badge:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-500",
    icon: "text-amber-500",
    hover: "hover:border-amber-300 dark:hover:border-amber-700",
  },
};

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */
export default function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [ratedPower, setRatedPower] = useState(2000);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useState(() => ({ current: null }))[0];

  /* ---- Helpers ---- */
  const analyze = async (csvFile, rated) => {
    setLoading(true);
    setError(null);
    try {
      const data = await uploadCSV(csvFile, rated);
      navigate("/results", {
        state: { results: data.results, filename: csvFile.name },
      });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleUpload = () => {
    if (file) analyze(file, ratedPower);
  };

  const handleSample = async (sample) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/samples/${sample.file}`);
      const blob = await res.blob();
      const csvFile = new File([blob], sample.file, { type: "text/csv" });
      await analyze(csvFile, sample.rated);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  /* ---- Drag & drop ---- */
  const onDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.toLowerCase().endsWith(".csv")) setFile(f);
  };
  const onFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <AnalysisSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* ================================================================ */}
      {/*  HERO                                                            */}
      {/* ================================================================ */}
      <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-blue-600 via-primary to-indigo-500 dark:from-blue-900 dark:via-blue-800 dark:to-indigo-900 text-white">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15)_0%,transparent_60%)]" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-indigo-400/10 blur-3xl" />

        <div className="relative px-8 py-14 sm:px-12 sm:py-20 flex flex-col lg:flex-row lg:items-center gap-10">
          {/* Left: text */}
          <div className="flex-1 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-white/15 backdrop-blur-sm text-sm font-medium">
              <Wind className="h-4 w-4" />
              Powered by OpenOA 3.2
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Wind Energy
              <br />
              Performance Analyzer
            </h1>
            <p className="mt-4 text-base sm:text-lg text-blue-100 leading-relaxed">
              Upload your SCADA data and get instant IEC-compliant power curve
              analysis, performance KPIs, and data quality reports.
            </p>
          </div>

          {/* Right: stat pills */}
          <div className="grid grid-cols-2 gap-3 lg:gap-4 shrink-0">
            {[
              {
                icon: <Zap className="h-4 w-4" />,
                label: "Power Curves",
                sub: "IEC 61400-12-1",
              },
              {
                icon: <BarChart3 className="h-4 w-4" />,
                label: "10+ KPIs",
                sub: "Capacity, AEP…",
              },
              {
                icon: <ShieldCheck className="h-4 w-4" />,
                label: "Data Quality",
                sub: "Gaps & anomalies",
              },
              {
                icon: <Sparkles className="h-4 w-4" />,
                label: "Auto Detect",
                sub: "Column aliases",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-white/10 backdrop-blur-sm"
              >
                <div className="mt-0.5 shrink-0">{s.icon}</div>
                <div>
                  <p className="text-sm font-semibold leading-none">
                    {s.label}
                  </p>
                  <p className="text-xs text-blue-200 mt-1">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <ErrorMessage message={error} onDismiss={() => setError(null)} />
      )}

      {/* ================================================================ */}
      {/*  UPLOAD ZONE                                                      */}
      {/* ================================================================ */}
      <section>
        <SectionTitle
          icon={<Upload className="h-5 w-5" />}
          title="Upload Your Dataset"
        />

        <div className="grid lg:grid-cols-5 gap-6 mt-6">
          {/* Drop zone – spans 3 cols */}
          <Card className="lg:col-span-3 border-border/40 hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div
                className={`
                  relative flex flex-col items-center justify-center gap-4
                  rounded-xl border-2 border-dashed p-10
                  cursor-pointer transition-all duration-300
                  ${
                    dragOver
                      ? "border-primary bg-primary/5 scale-[1.005]"
                      : file
                        ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20"
                        : "border-muted-foreground/15 hover:border-primary/50 hover:bg-primary/2"
                  }
                `}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === "Enter" && fileInputRef.current?.click()
                }
              >
                {file ? (
                  <>
                    <div className="p-3 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-foreground">
                        {file.name}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {(file.size / 1024).toFixed(1)} KB &middot; Click or
                        drop to replace
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3.5 rounded-2xl bg-muted/60 dark:bg-muted/30 text-muted-foreground">
                      <Upload className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-foreground">
                        Drop your CSV file here
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        or click to browse &middot; up to 50 MB
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center mt-1">
                      {["timestamp", "wind_speed", "power", "+ 5 optional"].map(
                        (c) => (
                          <Badge
                            key={c}
                            variant="secondary"
                            className="text-[10px] font-medium"
                          >
                            {c}
                          </Badge>
                        ),
                      )}
                    </div>
                  </>
                )}
                <input
                  ref={(el) => (fileInputRef.current = el)}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={onFileChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Settings + actions – spans 2 cols */}
          <Card className="lg:col-span-2 border-border/40 hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex flex-col gap-5 h-full justify-between">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="rated-power"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Turbine Rated Power
                  </Label>
                  <div className="relative">
                    <Input
                      id="rated-power"
                      type="number"
                      min={1}
                      value={ratedPower}
                      onChange={(e) => setRatedPower(Number(e.target.value))}
                      className="pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      kW
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[1500, 2000, 3000, 5000].map((v) => (
                    <button
                      key={v}
                      onClick={() => setRatedPower(v)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                        ratedPower === v
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {v.toLocaleString()} kW
                    </button>
                  ))}
                </div>
              </div>

              <Button
                disabled={!file}
                onClick={handleUpload}
                size="lg"
                className="w-full gap-2"
              >
                <Zap className="h-4 w-4" />
                Analyze Dataset
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  SAMPLE DATA GALLERY                                              */}
      {/* ================================================================ */}
      <section>
        <SectionTitle
          icon={<Database className="h-5 w-5" />}
          title="Try Sample Datasets"
          sub="No file? Pick a pre-built SCADA dataset to see the full analysis instantly."
        />

        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          {SAMPLES.map((s) => {
            const a = ACCENT[s.color];
            return (
              <button
                key={s.file}
                onClick={() => handleSample(s)}
                className={`group text-left p-5 rounded-xl border ${a.border} ${a.hover} bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`shrink-0 p-2 rounded-lg bg-muted/40 dark:bg-muted/20 ${a.icon}`}
                  >
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-foreground">
                        {s.label}
                      </span>
                      {s.tags.map((t) => (
                        <span
                          key={t}
                          className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded ${a.badge}`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      {s.desc}
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {s.rows} rows
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        {s.cols} cols
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Gauge className="h-3 w-3" />
                        {s.rated / 1000} MW
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0 mt-1" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ================================================================ */}
      {/*  FEATURE HIGHLIGHTS                                               */}
      {/* ================================================================ */}
      <section>
        <SectionTitle
          icon={<Sparkles className="h-5 w-5" />}
          title="What You Get"
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {[
            {
              icon: <Zap className="h-5 w-5 text-amber-500" />,
              bg: "bg-amber-50 dark:bg-amber-500/10",
              title: "Power Curve",
              desc: "IEC 61400-12-1 compliant binned analysis with mean, std, count per bin.",
            },
            {
              icon: <BarChart3 className="h-5 w-5 text-blue-500" />,
              bg: "bg-blue-50 dark:bg-blue-500/10",
              title: "Performance KPIs",
              desc: "Capacity factor, AEP, availability, total energy & 6 more metrics.",
            },
            {
              icon: <ShieldCheck className="h-5 w-5 text-emerald-500" />,
              bg: "bg-emerald-50 dark:bg-emerald-500/10",
              title: "Data Quality",
              desc: "Missing-value analysis, time-gap detection & composite completeness score.",
            },
            {
              icon: <Thermometer className="h-5 w-5 text-rose-500" />,
              bg: "bg-rose-50 dark:bg-rose-500/10",
              title: "Temperature",
              desc: "Ambient temperature trends and power-temperature correlation analysis.",
            },
            {
              icon: <Activity className="h-5 w-5 text-violet-500" />,
              bg: "bg-violet-50 dark:bg-violet-500/10",
              title: "Pitch & Yaw",
              desc: "Blade pitch statistics and yaw-error / nacelle alignment analysis.",
            },
            {
              icon: <Wind className="h-5 w-5 text-cyan-500" />,
              bg: "bg-cyan-50 dark:bg-cyan-500/10",
              title: "Wind Rose",
              desc: "16-sector directional energy & frequency distribution chart.",
            },
            {
              icon: <Gauge className="h-5 w-5 text-orange-500" />,
              bg: "bg-orange-50 dark:bg-orange-500/10",
              title: "Loss Breakdown",
              desc: "Curtailment, downtime & under-performance energy loss estimates.",
            },
            {
              icon: <FileSpreadsheet className="h-5 w-5 text-teal-500" />,
              bg: "bg-teal-50 dark:bg-teal-500/10",
              title: "Monthly Stats",
              desc: "Month-by-month tables and bar charts for production & wind speed.",
            },
          ].map((f) => (
            <Card
              key={f.title}
              className="border-border/40 hover:shadow-lg hover:border-border/80 hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <CardContent className="p-5">
                <div className={`inline-flex p-2.5 rounded-xl ${f.bg} mb-3 transition-transform duration-200 group-hover:scale-110`}>{f.icon}</div>
                <p className="text-sm font-bold text-foreground">{f.title}</p>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {f.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ================================================================== */
/*  Tiny helper sub-component                                          */
/* ================================================================== */
function SectionTitle({ icon, title, sub }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </div>
      {sub && <p className="text-sm text-muted-foreground mt-1 ml-7">{sub}</p>}
    </div>
  );
}
