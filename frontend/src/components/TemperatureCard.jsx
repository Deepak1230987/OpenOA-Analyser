/**
 * TemperatureCard Component
 * =========================
 * Displays temperature analysis metrics: mean ambient temperature
 * and temperature–power correlation, using shadcn Card.
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Thermometer, TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * Interpret the Pearson correlation coefficient.
 * Returns { label, color, icon } describing the strength & direction.
 */
function interpretCorrelation(r) {
  if (r == null) return { label: "N/A", color: "secondary", icon: Minus };
  const abs = Math.abs(r);
  let strength;
  if (abs >= 0.7) strength = "Strong";
  else if (abs >= 0.4) strength = "Moderate";
  else if (abs >= 0.2) strength = "Weak";
  else return { label: "Negligible", color: "secondary", icon: Minus };

  if (r > 0)
    return {
      label: `${strength} positive`,
      color: "default",
      icon: TrendingUp,
    };
  return {
    label: `${strength} negative`,
    color: "destructive",
    icon: TrendingDown,
  };
}

export default function TemperatureCard({ data }) {
  if (!data) return null;

  const { mean_temperature, temperature_power_correlation: corr } = data;
  const interp = interpretCorrelation(corr);
  const CorrIcon = interp.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-50 rounded-md dark:bg-orange-500/20">
            <Thermometer className="h-4 w-4 text-orange-600" />
          </div>
          <div>
            <CardTitle className="text-base">Temperature Analysis</CardTitle>
            <CardDescription>
              Ambient temperature and its impact on power output
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Mean Temperature */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-start gap-3">
            <div className="p-2 rounded-full bg-orange-50 dark:bg-orange-500/20">
              <Thermometer className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                Mean Ambient Temperature
              </p>
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {mean_temperature != null ? `${mean_temperature}°C` : "—"}
              </p>
            </div>
          </div>

          {/* Temperature–Power Correlation */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-start gap-3">
            <div className="p-2 rounded-full bg-orange-50 dark:bg-orange-500/20">
              <CorrIcon className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                Temp–Power Correlation
              </p>
              <p className="text-2xl font-bold tabular-nums text-foreground">
                {corr != null ? corr.toFixed(4) : "—"}
              </p>
              <Badge variant={interp.color} className="mt-1.5 text-[10px]">
                {interp.label}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
