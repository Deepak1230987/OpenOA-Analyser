/**
 * MonthlyBarChart Component
 * =========================
 * Interactive grouped bar chart with clickable bars, sorted/default views,
 * metric toggles, reference lines, bar value labels, and CSV export.
 */

import { useState, useMemo } from "react";
import { useChartColors } from "../hooks/useChartColors";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  LabelList,
} from "recharts";
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
  BarChart3,
  Maximize2,
  Minimize2,
  Info,
  Download,
  ArrowDownWideNarrow,
  ArrowUpDown,
} from "lucide-react";

const MONTH_SHORT = {
  1: "Jan",
  2: "Feb",
  3: "Mar",
  4: "Apr",
  5: "May",
  6: "Jun",
  7: "Jul",
  8: "Aug",
  9: "Sep",
  10: "Oct",
  11: "Nov",
  12: "Dec",
};

function getBarColors() {
  const s = getComputedStyle(document.documentElement);
  const v = (prop, fb) => s.getPropertyValue(prop).trim() || fb;
  return {
    energy: v("--chart-wind", "hsl(199 89% 48%)"),
    capacity: v("--chart-capacity", "hsl(262 83% 58%)"),
    wind: v("--chart-power", "hsl(160 84% 39%)"),
    temp: v("--chart-temp", "hsl(24 95% 53%)"),
    tick: v("--chart-tick", "hsl(215 16% 47%)"),
    primary: v("--chart-primary", "hsl(201 96% 32%)"),
  };
}

/* ---- Tooltip ---- */
function MonthTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const BC = getBarColors();

  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-xl p-4 text-sm min-w-52">
      <p className="font-semibold text-foreground mb-2.5 border-b border-border pb-2">
        {label}
      </p>
      <div className="space-y-1.5">
        <TipRow
          label="Energy"
          value={`${d.energy_mwh?.toLocaleString()} MWh`}
          color={BC.energy}
        />
        <TipRow
          label="Capacity Factor"
          value={`${d.capacity_factor_pct}%`}
          color={BC.capacity}
        />
        <TipRow
          label="Availability"
          value={`${d.availability_pct}%`}
          color={BC.temp}
        />
        <TipRow
          label="Mean Wind"
          value={`${d.mean_wind_speed} m/s`}
          color={BC.wind}
        />
        <TipRow
          label="Mean Power"
          value={`${d.mean_power?.toLocaleString()} kW`}
          color={BC.tick}
        />
        <TipRow
          label="Records"
          value={d.record_count?.toLocaleString()}
          color={BC.tick}
        />
      </div>
    </div>
  );
}

function TipRow({ label, value, color }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-muted-foreground flex items-center gap-1.5">
        <span
          className="inline-block w-2.5 h-2.5 rounded-sm"
          style={{ background: color }}
        />
        {label}
      </span>
      <span className="font-medium text-foreground tabular-nums">{value}</span>
    </div>
  );
}

export default function MonthlyBarChart({ data }) {
  const chartColors = useChartColors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const BAR_COLORS = useMemo(getBarColors, [chartColors]);
  const [expanded, setExpanded] = useState(false);
  const [metric, setMetric] = useState("both");
  const [sorted, setSorted] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No monthly data available.
        </CardContent>
      </Card>
    );
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const formatted = useMemo(() => {
    let items = data.map((d) => ({
      ...d,
      label: MONTH_SHORT[d.month] ?? `M${d.month}`,
      energy_mwh: Number(d.energy_mwh) || 0,
      capacity_factor_pct: Number(d.capacity_factor_pct) || 0,
    }));
    if (sorted) {
      items = [...items].sort((a, b) => b.energy_mwh - a.energy_mwh);
    }
    return items;
  }, [data, sorted]);

  const avgEnergy =
    formatted.reduce((s, d) => s + d.energy_mwh, 0) / formatted.length;
  const avgCF =
    formatted.reduce((s, d) => s + d.capacity_factor_pct, 0) / formatted.length;
  const totalEnergy = formatted.reduce((s, d) => s + d.energy_mwh, 0);
  const showEnergy = metric === "both" || metric === "energy";
  const showCF = metric === "both" || metric === "capacity";

  const exportCSV = () => {
    const header =
      "month,energy_mwh,capacity_factor_pct,availability_pct,mean_wind_speed,mean_power,record_count\n";
    const rows = formatted
      .map(
        (d) =>
          `${d.label},${d.energy_mwh},${d.capacity_factor_pct},${d.availability_pct},${d.mean_wind_speed},${d.mean_power},${d.record_count}`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), {
      href: url,
      download: "monthly_stats.csv",
    }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-violet-50 rounded-md dark:bg-violet-500/20">
              <BarChart3 className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-base">Monthly Performance</CardTitle>
              <CardDescription>
                Energy production &amp; capacity factor by month
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setSorted(!sorted)}
              title={sorted ? "Chronological" : "Sort by energy"}
            >
              {sorted ? (
                <ArrowUpDown className="h-3 w-3" />
              ) : (
                <ArrowDownWideNarrow className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={exportCSV}
              title="Export CSV"
            >
              <Download className="h-3 w-3" />
            </Button>
            <Badge variant="secondary" className="text-xs">
              {formatted.length} months
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              Σ {totalEnergy.toFixed(1)} MWh
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {/* Metric toggles */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {[
            { key: "both", label: "Both Metrics" },
            { key: "energy", label: "Energy (MWh)" },
            { key: "capacity", label: "Capacity Factor (%)" },
          ].map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-all cursor-pointer
                ${metric === m.key ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"}`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div
          className={`w-full transition-all duration-300 ${expanded ? "h-[500px]" : "h-[340px]"}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={formatted}
              margin={{ top: 20, right: 20, bottom: 10, left: 10 }}
              barGap={4}
              barCategoryGap="20%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartColors.grid}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: chartColors.tick }}
                tickLine={false}
                axisLine={{ stroke: chartColors.grid }}
              />

              {showEnergy && (
                <YAxis
                  yAxisId="energy"
                  tick={{ fontSize: 11, fill: chartColors.tick }}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: "Energy (MWh)",
                    angle: -90,
                    position: "insideLeft",
                    style: {
                      fill: BAR_COLORS.energy,
                      fontSize: 12,
                      fontWeight: 500,
                    },
                  }}
                />
              )}
              {showCF && (
                <YAxis
                  yAxisId="cf"
                  orientation={showEnergy ? "right" : "left"}
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: chartColors.tick }}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: "CF (%)",
                    angle: showEnergy ? 90 : -90,
                    position: showEnergy ? "insideRight" : "insideLeft",
                    style: {
                      fill: BAR_COLORS.capacity,
                      fontSize: 12,
                      fontWeight: 500,
                    },
                  }}
                />
              )}

              {showEnergy && (
                <ReferenceLine
                  yAxisId="energy"
                  y={avgEnergy}
                  stroke={BAR_COLORS.energy}
                  strokeDasharray="8 4"
                  label={{
                    value: `Avg ${avgEnergy.toFixed(1)}`,
                    position: "left",
                    fill: BAR_COLORS.energy,
                    fontSize: 10,
                  }}
                />
              )}
              {showCF && (
                <ReferenceLine
                  yAxisId="cf"
                  y={avgCF}
                  stroke={BAR_COLORS.capacity}
                  strokeDasharray="8 4"
                  label={{
                    value: `Avg ${avgCF.toFixed(1)}%`,
                    position: "right",
                    fill: BAR_COLORS.capacity,
                    fontSize: 10,
                  }}
                />
              )}

              <Tooltip
                content={<MonthTip />}
                cursor={{ fill: chartColors.cursor, opacity: 0.4 }}
              />

              {showEnergy && (
                <Bar
                  yAxisId="energy"
                  dataKey="energy_mwh"
                  name="Energy (MWh)"
                  fill={BAR_COLORS.energy}
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
                  maxBarSize={40}
                  onClick={(_, idx) =>
                    setSelectedMonth(idx === selectedMonth ? null : idx)
                  }
                >
                  {formatted.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={BAR_COLORS.energy}
                      fillOpacity={
                        selectedMonth != null
                          ? selectedMonth === i
                            ? 1
                            : 0.3
                          : entry.energy_mwh >= avgEnergy
                            ? 1
                            : 0.6
                      }
                      stroke={selectedMonth === i ? BAR_COLORS.primary : "none"}
                      strokeWidth={selectedMonth === i ? 2 : 0}
                    />
                  ))}
                  <LabelList
                    dataKey="energy_mwh"
                    position="top"
                    formatter={(v) => v?.toFixed(0)}
                    className="text-[10px] fill-muted-foreground"
                  />
                </Bar>
              )}
              {showCF && (
                <Bar
                  yAxisId="cf"
                  dataKey="capacity_factor_pct"
                  name="Capacity Factor (%)"
                  fill={BAR_COLORS.capacity}
                  radius={[4, 4, 0, 0]}
                  animationDuration={1000}
                  maxBarSize={40}
                  onClick={(_, idx) =>
                    setSelectedMonth(idx === selectedMonth ? null : idx)
                  }
                >
                  {formatted.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={BAR_COLORS.capacity}
                      fillOpacity={
                        selectedMonth != null
                          ? selectedMonth === i
                            ? 1
                            : 0.3
                          : entry.capacity_factor_pct >= avgCF
                            ? 1
                            : 0.6
                      }
                      stroke={selectedMonth === i ? BAR_COLORS.capacity : "none"}
                      strokeWidth={selectedMonth === i ? 2 : 0}
                    />
                  ))}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <Info className="h-3 w-3" />
          Click a bar to highlight · above-average bars are full opacity ·
          toggle sort & metrics above
        </p>
      </CardContent>
    </Card>
  );
}
