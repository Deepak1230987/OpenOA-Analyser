/**
 * TurbineInsightsCard Component
 * ==============================
 * Displays pitch analysis, yaw alignment, and turbine status
 * distribution from OpenOA-aligned SCADA columns.
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Badge } from "./ui/badge";
import {
  RotateCcw,
  Navigation,
  Activity,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";

/* ---- Pitch Section ---- */
function PitchSection({ data }) {
  if (!data) return null;
  const hasCurtailment = data.curtailment_pct > 1;
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <RotateCcw className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-semibold">Blade Pitch</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Mean Pitch" value={`${data.mean_pitch_angle}°`} />
        <Metric label="Max Pitch" value={`${data.max_pitch_angle}°`} />
        <Metric
          label="Pitch–Power Corr"
          value={data.pitch_power_correlation?.toFixed(4) ?? "—"}
        />
        <Metric label="Curtailment" value={`${data.curtailment_pct}%`} />
      </div>
      {hasCurtailment && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 mt-1">
          <AlertTriangle className="h-3 w-3" />
          <span>
            {data.curtailed_count} records show potential curtailment (high
            pitch + below-rated power)
          </span>
        </div>
      )}
    </div>
  );
}

/* ---- Yaw Section ---- */
function YawSection({ data }) {
  if (!data) return null;
  const qualityColor = {
    good: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-500",
    moderate: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    poor: "bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  }[data.alignment_quality];

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-semibold">Yaw Alignment</span>
        </div>
        <Badge className={`text-[10px] ${qualityColor}`}>
          {data.alignment_quality}
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Metric label="Mean Yaw Error" value={`${data.mean_yaw_error}°`} />
        <Metric label="Std Dev" value={`${data.std_yaw_error}°`} />
        <Metric label="Max |Error|" value={`${data.max_abs_yaw_error}°`} />
      </div>
      {Math.abs(data.mean_yaw_error) > 5 && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 mt-1">
          <Info className="h-3 w-3" />
          <span>
            Systematic yaw offset detected — consider nacelle calibration
          </span>
        </div>
      )}
    </div>
  );
}

/* ---- Status Distribution Section ---- */
function StatusSection({ data }) {
  if (!data) return null;
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Activity className="h-4 w-4 text-violet-500" />
        <span className="text-sm font-semibold">Turbine Status</span>
        <Badge variant="secondary" className="text-[10px] ml-auto">
          {data.unique_codes} codes
        </Badge>
      </div>
      <div className="space-y-1.5">
        {data.distribution.map((d) => (
          <div key={d.status} className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2">
              <StatusIcon code={d.status} />
              <span className="text-xs font-medium">Code {d.status}</span>
            </div>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-violet-400 transition-all duration-500"
                style={{ width: `${Math.min(d.percentage, 100)}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-muted-foreground w-16 text-right">
              {d.percentage}% ({d.count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusIcon({ code }) {
  const c = String(code);
  if (c === "1" || c === "1.0" || c.toLowerCase() === "normal")
    return <CheckCircle className="h-3 w-3 text-emerald-500" />;
  if (c === "0" || c === "0.0" || c.toLowerCase() === "stopped")
    return <AlertTriangle className="h-3 w-3 text-red-500" />;
  return <Info className="h-3 w-3 text-amber-500" />;
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

/* ---- Main Card ---- */
export default function TurbineInsightsCard({
  pitchAnalysis,
  yawAnalysis,
  statusDistribution,
}) {
  const hasAny = pitchAnalysis || yawAnalysis || statusDistribution;
  if (!hasAny) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-violet-50 rounded-md dark:bg-violet-500/20">
            <Activity className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <CardTitle className="text-base">Turbine Insights</CardTitle>
            <CardDescription>
              Blade pitch, yaw alignment &amp; operational status from OpenOA
              SCADA fields
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <PitchSection data={pitchAnalysis} />
        <YawSection data={yawAnalysis} />
        <StatusSection data={statusDistribution} />
      </CardContent>
    </Card>
  );
}
