/**
 * StatisticsCards Component
 * =========================
 * Polished KPI cards with colour-coded icons, animated numbers,
 * contextual sub-text, and responsive grid layout.
 */

import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Wind,
  Gauge,
  Zap,
  Clock,
  TrendingUp,
  BatteryCharging,
  BarChart3,
  Activity,
  Calendar,
  Database,
} from "lucide-react";

/* ---- Card definitions ---- */
function buildCards(s) {
  if (!s) return [];
  return [
    {
      label: "Total Records",
      value: s.total_records?.toLocaleString(),
      icon: <Database className="h-5 w-5" />,
      color: "text-slate-600",
      bg: "bg-slate-50 dark:bg-slate-500/20",
      sub: "SCADA timestamps ingested",
    },
    {
      label: "Time Span",
      value: `${s.time_span_days} days`,
      icon: <Calendar className="h-5 w-5" />,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-500/20",
      sub: "Dataset coverage",
    },
    {
      label: "Mean Wind Speed",
      value: `${s.mean_wind_speed_ms} m/s`,
      icon: <Wind className="h-5 w-5" />,
      color: "text-sky-600",
      bg: "bg-sky-50 dark:bg-sky-500/20",
      sub: `Median ${s.median_wind_speed_ms ?? "—"} m/s`,
    },
    {
      label: "Max Wind Speed",
      value: `${s.max_wind_speed_ms} m/s`,
      icon: <Gauge className="h-5 w-5" />,
      color: "text-cyan-600",
      bg: "bg-cyan-50 dark:bg-cyan-500/20",
      sub: "Peak recorded gust",
    },
    {
      label: "Mean Power",
      value: `${s.mean_power_kw?.toLocaleString()} kW`,
      icon: <Zap className="h-5 w-5" />,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-500/20",
      sub: `of ${s.rated_power_kw?.toLocaleString() ?? "—"} kW rated`,
    },
    {
      label: "Max Power",
      value: `${s.max_power_kw?.toLocaleString()} kW`,
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-500/20",
      sub: "Peak output observed",
    },
    {
      label: "Capacity Factor",
      value: `${s.capacity_factor_pct}%`,
      icon: <BatteryCharging className="h-5 w-5" />,
      color: cfColor(s.capacity_factor_pct),
      bg: cfBg(s.capacity_factor_pct),
      sub: capacityVerdict(s.capacity_factor_pct),
      badge: capacityBadge(s.capacity_factor_pct),
    },
    {
      label: "Availability",
      value: `${s.availability_pct}%`,
      icon: <Activity className="h-5 w-5" />,
      color:
        s.availability_pct >= 95
          ? "text-emerald-500"
          : s.availability_pct >= 85
            ? "text-amber-500"
            : "text-red-500",
      bg:
        s.availability_pct >= 95
          ? "bg-emerald-50 dark:bg-emerald-500/20"
          : "bg-amber-50 dark:bg-amber-500/20",
      sub: `${(100 - s.availability_pct).toFixed(1)}% downtime`,
    },
    {
      label: "Est. AEP",
      value: `${s.estimated_aep_mwh?.toLocaleString()} MWh`,
      icon: <BarChart3 className="h-5 w-5" />,
      color: "text-violet-600",
      bg: "bg-violet-50 dark:bg-violet-500/20",
      sub: "Annualised energy projection",
    },
    {
      label: "Total Energy",
      value: `${s.total_energy_mwh?.toLocaleString()} MWh`,
      icon: <Clock className="h-5 w-5" />,
      color: "text-indigo-600",
      bg: "bg-indigo-50 dark:bg-indigo-500/20",
      sub: "Cumulative production",
    },
  ];
}

function cfColor(pct) {
  if (pct >= 35) return "text-emerald-500";
  if (pct >= 25) return "text-amber-500";
  return "text-red-500";
}
function cfBg(pct) {
  if (pct >= 35) return "bg-emerald-50 dark:bg-emerald-500/20";
  if (pct >= 25) return "bg-amber-50 dark:bg-amber-500/20";
  return "bg-red-50 dark:bg-red-500/20";
}
function capacityVerdict(pct) {
  if (pct >= 40) return "Excellent site performance";
  if (pct >= 30) return "Good performance";
  if (pct >= 20) return "Below average";
  return "Poor — investigate losses";
}
function capacityBadge(pct) {
  if (pct >= 35) return "success";
  if (pct >= 25) return "warning";
  return "destructive";
}

export default function StatisticsCards({ summary }) {
  if (!summary) return null;

  const cards = buildCards(summary);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <Card
          key={c.label}
          className="overflow-hidden hover:shadow-lg hover:border-border/80 hover:-translate-y-0.5 transition-all duration-300 group"
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div
                className={`p-2 rounded-xl ${c.bg} ${c.color} transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}
              >
                {c.icon}
              </div>
              {c.badge && (
                <Badge variant={c.badge} className="text-[10px]">
                  {c.badge === "success"
                    ? "Good"
                    : c.badge === "warning"
                      ? "Fair"
                      : "Low"}
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-foreground tracking-tight tabular-nums mb-0.5">
              {c.value ?? "—"}
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              {c.label}
            </p>
            {c.sub && (
              <p className="text-[10px] text-muted-foreground/70 mt-1 truncate">
                {c.sub}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
