/**
 * LossBreakdownCard Component
 * ============================
 * Displays energy-loss breakdown returned by the backend's
 * loss_analysis service: downtime loss, cut-out loss,
 * missing-data percentage, and operational vs. theoretical energy.
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
  AlertTriangle,
  Wind,
  Database,
  Zap,
  TrendingDown,
  Activity,
} from "lucide-react";

export default function LossBreakdownCard({ data }) {
  if (!data) return null;

  const {
    downtime_loss_kwh = 0,
    cutout_loss_kwh = 0,
    missing_data_percent = 0,
    operational_energy_kwh = 0,
    theoretical_energy_kwh = 0,
  } = data;

  const downtimeMWh = (downtime_loss_kwh / 1000).toFixed(2);
  const cutoutMWh = (cutout_loss_kwh / 1000).toFixed(2);
  const operationalMWh = (operational_energy_kwh / 1000).toFixed(1);
  const theoreticalMWh = (theoretical_energy_kwh / 1000).toFixed(1);

  const efficiencyPct =
    theoretical_energy_kwh > 0
      ? ((operational_energy_kwh / theoretical_energy_kwh) * 100).toFixed(1)
      : "—";

  const totalLoss = downtime_loss_kwh + cutout_loss_kwh;
  const totalLossMWh = (totalLoss / 1000).toFixed(2);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-rose-50 rounded-md dark:bg-rose-500/20">
            <TrendingDown className="h-4 w-4 text-rose-600" />
          </div>
          <div>
            <CardTitle className="text-base">Energy Loss Breakdown</CardTitle>
            <CardDescription>
              Losses from downtime, high-wind cut-out, and data gaps
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2 space-y-4">
        {/* Efficiency banner */}
        <div className="flex items-center justify-between rounded-lg bg-muted/40 border border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Operational Efficiency
            </span>
          </div>
          <Badge
            variant={
              Number(efficiencyPct) >= 90
                ? "default"
                : Number(efficiencyPct) >= 75
                  ? "secondary"
                  : "destructive"
            }
            className="text-sm tabular-nums"
          >
            {efficiencyPct}%
          </Badge>
        </div>

        {/* Loss items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <LossItem
            icon={<AlertTriangle className="h-4 w-4" />}
            iconColor="text-amber-600"
            iconBg="bg-amber-50 dark:bg-amber-500/30"
            label="Downtime Loss"
            value={`${downtimeMWh} MWh`}
            sub={`${downtime_loss_kwh.toLocaleString()} kWh`}
          />
          <LossItem
            icon={<Wind className="h-4 w-4" />}
            iconColor="text-sky-600"
            iconBg="bg-sky-50 dark:bg-sky-500/20"
            label="Cut-out Loss"
            value={`${cutoutMWh} MWh`}
            sub={`High wind (≥ 25 m/s)`}
          />
          <LossItem
            icon={<Database className="h-4 w-4" />}
            iconColor="text-violet-600"
            iconBg="bg-violet-50 dark:bg-violet-500/20"
            label="Missing Data"
            value={`${missing_data_percent}%`}
            sub="Records with NaN values"
          />
          <LossItem
            icon={<TrendingDown className="h-4 w-4" />}
            iconColor="text-rose-600"
            iconBg="bg-rose-50 dark:bg-rose-500/20"
            label="Total Loss"
            value={`${totalLossMWh} MWh`}
            sub="Downtime + Cut-out combined"
          />
        </div>

        {/* Energy comparison bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" /> Operational vs Theoretical Energy
            </span>
            <span className="tabular-nums">
              {operationalMWh} / {theoreticalMWh} MWh
            </span>
          </div>
          <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-linear-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
              style={{
                width: `${theoretical_energy_kwh > 0 ? Math.min((operational_energy_kwh / theoretical_energy_kwh) * 100, 100) : 0}%`,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LossItem({ icon, iconColor, iconBg, label, value, sub }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:shadow-sm transition-shadow">
      <div className={`p-1.5 rounded-md ${iconBg} ${iconColor} mt-0.5`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground tabular-nums leading-tight">
          {value}
        </p>
        {sub && (
          <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}
