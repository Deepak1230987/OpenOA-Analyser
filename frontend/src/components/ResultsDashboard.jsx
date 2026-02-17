/**
 * ResultsDashboard Component
 * ==========================
 * Full analysis dashboard with tab navigation, section anchors,
 * integrated WindRoseChart, and cohesive layout.
 */

import { useState } from "react";
import StatisticsCards from "./StatisticsCards";
import PowerCurveChart from "./PowerCurveChart";
import TimeSeriesChart from "./TimeSeriesChart";
import DataQualityPanel from "./DataQualityPanel";
import MonthlyTable from "./MonthlyTable";
import MonthlyBarChart from "./MonthlyBarChart";
import WindRoseChart from "./WindRoseChart";
import LossBreakdownCard from "./LossBreakdownCard";
import TemperatureCard from "./TemperatureCard";
import TurbineInsightsCard from "./TurbineInsightsCard";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import {
  ArrowLeft,
  FileText,
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Zap,
  Calendar,
  ShieldCheck,
  Compass,
  ChevronUp,
  Thermometer,
  Activity,
} from "lucide-react";

const SECTIONS = [
  {
    id: "summary",
    label: "Summary",
    icon: <BarChart3 className="h-3.5 w-3.5" />,
  },
  {
    id: "power-curve",
    label: "Power Curve",
    icon: <Zap className="h-3.5 w-3.5" />,
  },
  {
    id: "time-series",
    label: "Time Series",
    icon: <TrendingUp className="h-3.5 w-3.5" />,
  },
  {
    id: "wind-rose",
    label: "Wind Rose",
    icon: <Compass className="h-3.5 w-3.5" />,
  },
  {
    id: "monthly",
    label: "Monthly",
    icon: <Calendar className="h-3.5 w-3.5" />,
  },
  {
    id: "quality",
    label: "Data Quality",
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
  },
  {
    id: "losses",
    label: "Losses",
    icon: <TrendingDown className="h-3.5 w-3.5" />,
  },
  {
    id: "temperature",
    label: "Temperature",
    icon: <Thermometer className="h-3.5 w-3.5" />,
  },
  {
    id: "turbine-insights",
    label: "Turbine",
    icon: <Activity className="h-3.5 w-3.5" />,
  },
];

export default function ResultsDashboard({ results, filename, onReset }) {
  const [activeSection, setActiveSection] = useState("summary");

  if (!results) return null;

  const hasWindRose = results.wind_rose && results.wind_rose.length > 0;
  const hasLosses = !!results.loss_breakdown;
  const hasTemp = !!results.temperature_analysis;
  const hasTurbineInsights =
    !!results.pitch_analysis ||
    !!results.yaw_analysis ||
    !!results.status_distribution;

  const scrollTo = (id) => {
    setActiveSection(id);
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="space-y-8">
      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border/40 rounded-xl p-5 shadow-sm shadow-black/3 dark:shadow-black/20 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-linear-to-br from-primary/15 to-primary/5 rounded-xl">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-xl font-bold tracking-tight">
              Analysis Results
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              <span className="truncate max-w-50">{filename}</span>
              {results.method && (
                <>
                  <span className="text-border">|</span>
                  <Badge
                    variant={
                      results.method === "openoa" ? "success" : "secondary"
                    }
                    className="text-[10px] h-5"
                  >
                    {results.method === "openoa"
                      ? "OpenOA 3.2"
                      : results.method}
                  </Badge>
                </>
              )}
              {results.summary?.total_records && (
                <>
                  <span className="text-border">|</span>
                  <span className="text-xs">
                    {results.summary.total_records.toLocaleString()} records
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> New Analysis
        </Button>
      </div>

      {/* ---- Section navigation ---- */}
      <nav className="sticky top-16 z-40 bg-background/85 backdrop-blur-2xl border border-border/40 rounded-xl p-1.5 flex flex-wrap gap-1 shadow-sm shadow-black/3 dark:shadow-black/20">
        {SECTIONS.filter(
          (s) =>
            (s.id !== "wind-rose" || hasWindRose) &&
            (s.id !== "losses" || hasLosses) &&
            (s.id !== "temperature" || hasTemp) &&
            (s.id !== "turbine-insights" || hasTurbineInsights),
        ).map((s) => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer
              ${
                activeSection === s.id
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </nav>

      {/* ---- KPI cards ---- */}
      <section id="summary">
        <SectionHeading icon={<BarChart3 className="h-4 w-4" />}>
          Summary Statistics
        </SectionHeading>
        <StatisticsCards summary={results.summary} />
      </section>

      <Separator />

      {/* ---- Power Curve ---- */}
      <section id="power-curve">
        <SectionHeading icon={<Zap className="h-4 w-4" />}>
          Power Curve Analysis
        </SectionHeading>
        <PowerCurveChart data={results.power_curve} />
      </section>

      {/* ---- Time Series ---- */}
      <section id="time-series">
        <SectionHeading icon={<TrendingUp className="h-4 w-4" />}>
          Temporal Trends
        </SectionHeading>
        <TimeSeriesChart data={results.time_series} />
      </section>

      <Separator />

      {/* ---- Wind Rose ---- */}
      {hasWindRose && (
        <section id="wind-rose">
          <SectionHeading icon={<Compass className="h-4 w-4" />}>
            Wind Direction Analysis
          </SectionHeading>
          <WindRoseChart data={results.wind_rose} />
        </section>
      )}

      {hasWindRose && <Separator />}

      {/* ---- Monthly ---- */}
      <section id="monthly">
        <SectionHeading icon={<Calendar className="h-4 w-4" />}>
          Monthly Breakdown
        </SectionHeading>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <MonthlyBarChart data={results.monthly_stats} />
          <MonthlyTable data={results.monthly_stats} />
        </div>
      </section>

      <Separator />

      {/* ---- Data quality ---- */}
      <section id="quality">
        <SectionHeading icon={<ShieldCheck className="h-4 w-4" />}>
          Data Quality
        </SectionHeading>
        <DataQualityPanel quality={results.data_quality} />
      </section>

      {/* ---- Loss Breakdown ---- */}
      {hasLosses && (
        <>
          <Separator />
          <section id="losses">
            <SectionHeading icon={<TrendingDown className="h-4 w-4" />}>
              Energy Loss Breakdown
            </SectionHeading>
            <LossBreakdownCard data={results.loss_breakdown} />
          </section>
        </>
      )}

      {/* ---- Temperature Analysis ---- */}
      {hasTemp && (
        <>
          <Separator />
          <section id="temperature">
            <SectionHeading icon={<Thermometer className="h-4 w-4" />}>
              Temperature Analysis
            </SectionHeading>
            <TemperatureCard data={results.temperature_analysis} />
          </section>
        </>
      )}

      {/* ---- Turbine Insights (Pitch / Yaw / Status) ---- */}
      {hasTurbineInsights && (
        <>
          <Separator />
          <section id="turbine-insights">
            <SectionHeading icon={<Activity className="h-4 w-4" />}>
              Turbine Insights
            </SectionHeading>
            <TurbineInsightsCard
              pitchAnalysis={results.pitch_analysis}
              yawAnalysis={results.yaw_analysis}
              statusDistribution={results.status_distribution}
            />
          </section>
        </>
      )}

      {/* ---- Back to top ---- */}
      <div className="flex justify-center pt-4 pb-8">
        <Button
          variant="outline"
          size="sm"
          onClick={scrollToTop}
          className="gap-1.5 text-xs"
        >
          <ChevronUp className="h-3 w-3" /> Back to Top
        </Button>
      </div>
    </div>
  );
}

function SectionHeading({ icon, children }) {
  return (
    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2.5">
      <span className="inline-flex items-center justify-center w-8 h-8 bg-linear-to-br from-primary/15 to-primary/5 rounded-lg text-primary shadow-sm shadow-primary/5">
        {icon}
      </span>
      {children}
    </h3>
  );
}
