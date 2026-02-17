/**
 * DataQualityPanel Component
 * ==========================
 * Comprehensive data-quality dashboard with progress bars, colour-coded
 * severity, radial overall score, and expandable filter pipeline details.
 */

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Database,
  SearchCheck,
  Activity,
  Gauge,
} from "lucide-react";

/* ---- Radial progress ring ---- */
function RadialScore({ score }) {
  const pct = Math.max(0, Math.min(100, score ?? 0));
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color =
    pct >= 90
      ? "text-emerald-500"
      : pct >= 70
        ? "text-amber-500"
        : "text-red-500";
  const strokeColor =
    pct >= 90
      ? "stroke-emerald-500"
      : pct >= 70
        ? "stroke-amber-500"
        : "stroke-red-500";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          className="stroke-muted"
          strokeWidth="6"
        />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          className={`${strokeColor} transition-all duration-1000`}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-xl font-bold ${color}`}>{pct}%</span>
        <span className="text-[9px] text-muted-foreground">Score</span>
      </div>
    </div>
  );
}

/* ---- Progress bar with label ---- */
function MetricBar({
  label,
  value,
  max = 100,
  unit = "%",
  invert = false,
  icon,
}) {
  const num = parseFloat(value) || 0;
  const pct = Math.min((num / max) * 100, 100);
  const good = invert ? num <= 2 : num >= 90;
  const warn = invert ? num <= 10 : num >= 70;
  const barColor = good
    ? "bg-emerald-500"
    : warn
      ? "bg-amber-500"
      : "bg-red-500";
  const textColor = good
    ? "text-emerald-600 dark:text-emerald-400"
    : warn
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        <span className={`text-xs font-semibold tabular-nums ${textColor}`}>
          {value}
          {unit}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${invert ? Math.min(num * 5, 100) : pct}%` }}
        />
      </div>
    </div>
  );
}

export default function DataQualityPanel({ quality }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!quality) return null;

  const score = quality.completeness_score ?? 0;
  const verdict =
    score >= 95
      ? "Excellent"
      : score >= 85
        ? "Good"
        : score >= 70
          ? "Fair"
          : "Poor";
  const verdictColor =
    score >= 95 ? "success" : score >= 85 ? "warning" : "destructive";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-violet-50 rounded-md dark:bg-violet-500/20">
              <ShieldCheck className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-base">
                Data Quality Assessment
              </CardTitle>
              <CardDescription>
                OpenOA-powered integrity and completeness analysis
              </CardDescription>
            </div>
          </div>
          <Badge variant={verdictColor}>{verdict}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Radial score */}
          <div className="flex flex-col items-center justify-center gap-2 min-w-[120px]">
            <RadialScore score={score} />
            <p className="text-xs text-muted-foreground text-center">
              Overall Quality
            </p>
          </div>

          {/* Right: Metric bars */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <MetricBar
              label="Data Completeness"
              value={quality.data_completeness_pct}
              icon={<Database className="h-3 w-3" />}
            />
            <MetricBar
              label="Missing Wind Speed"
              value={quality.missing_wind_speed_pct}
              max={20}
              invert
              icon={<AlertTriangle className="h-3 w-3" />}
            />
            <MetricBar
              label="Missing Power"
              value={quality.missing_power_pct}
              max={20}
              invert
              icon={<AlertTriangle className="h-3 w-3" />}
            />
            <MetricBar
              label="Completeness Score"
              value={quality.completeness_score}
              icon={<Gauge className="h-3 w-3" />}
            />
          </div>
        </div>

        {/* Detail cards row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <DetailCard
            icon={<Database className="h-3.5 w-3.5 text-slate-500" />}
            label="Clean Records"
            value={quality.total_records_after_cleaning?.toLocaleString()}
          />
          <DetailCard
            icon={<Clock className="h-3.5 w-3.5 text-blue-500" />}
            label="Detected Freq"
            value={quality.detected_frequency ?? "—"}
          />
          <DetailCard
            icon={<Activity className="h-3.5 w-3.5 text-amber-500" />}
            label="Timestamp Gaps"
            value={quality.timestamp_gaps ?? 0}
          />
          <DetailCard
            icon={<SearchCheck className="h-3.5 w-3.5 text-violet-500" />}
            label="Curtailment Events"
            value={quality.potential_curtailment_count ?? 0}
          />
        </div>

        {/* Expandable extra details */}
        <div className="mt-4 border-t border-border pt-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-xs text-muted-foreground"
            onClick={() => setShowDetails(!showDetails)}
          >
            <span>Additional Details</span>
            {showDetails ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
          {showDetails && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <DetailCard
                icon={<Activity className="h-3.5 w-3.5 text-emerald-500" />}
                label="Idle in Wind (>3 m/s)"
                value={`${quality.idle_in_wind_count ?? 0} events`}
              />
              <DetailCard
                icon={<AlertTriangle className="h-3.5 w-3.5 text-orange-500" />}
                label="Missing WS %"
                value={`${quality.missing_wind_speed_pct}%`}
              />
              <DetailCard
                icon={<AlertTriangle className="h-3.5 w-3.5 text-orange-500" />}
                label="Missing Power %"
                value={`${quality.missing_power_pct}%`}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---- Small detail card ---- */
function DetailCard({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
      {icon}
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
        <p className="text-sm font-semibold text-foreground tabular-nums truncate">
          {value}
        </p>
      </div>
    </div>
  );
}
