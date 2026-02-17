/**
 * PowerCurveChart Component
 * =========================
 * Advanced interactive scatter + area chart of the IEC-binned power curve.
 *
 * Features:
 *  - MATLAB-style click-and-drag rectangle zoom
 *  - Confidence band (mean ± std_power)
 *  - Scatter dot size proportional to sample count
 *  - Cut-in / Rated reference lines
 *  - Summary statistics strip
 *  - Layer toggles (band, dots)
 *  - CSV export
 *  - Custom rich tooltip
 */

import { useState, useMemo } from "react";
import { useChartColors } from "../hooks/useChartColors";
import {
  ComposedChart,
  Scatter,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
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
  Zap,
  Maximize2,
  Minimize2,
  Info,
  RotateCcw,
  ZoomIn,
  Download,
  Layers,
  BarChart3,
} from "lucide-react";

/* ---- helper: read a CSS custom property ---- */
const cssVar = (name, fallback = "") =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
  fallback;

/* ---- Dot sized by sample count ---- */
function SizedDot({ cx, cy, payload }) {
  const count = payload?.count ?? 1;
  const r = Math.max(3, Math.min(8, 2 + Math.sqrt(count) * 0.8));
  const dotStroke = cssVar("--chart-dot-stroke", "#fff");
  const primaryLight = cssVar("--chart-primary-light", "hsl(199 89% 48%)");
  const primary = cssVar("--chart-primary", "hsl(201 96% 32%)");
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 3} fill={primaryLight} opacity={0.15} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={primary}
        stroke={dotStroke}
        strokeWidth={1.5}
      />
    </g>
  );
}

/* ---- Tooltip ---- */
function PcTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-xl p-4 text-sm min-w-52">
      <div className="flex items-center justify-between mb-2.5 border-b border-border pb-2">
        <span className="font-semibold text-foreground">
          {d.wind_speed_bin} m/s
        </span>
        <Badge variant="outline" className="text-[10px]">
          n = {d.count?.toLocaleString() ?? "—"}
        </Badge>
      </div>
      <div className="space-y-1.5">
        <TipRow
          label="Mean Power"
          value={`${d.mean_power?.toLocaleString()} kW`}
          dotClass="bg-sky-700"
        />
        {d.std_power != null && (
          <TipRow
            label="Std Dev"
            value={`± ${d.std_power?.toLocaleString()} kW`}
            dotClass="bg-slate-500"
          />
        )}
        {d.ci_lower != null && d.ci_upper != null && (
          <TipRow
            label="95% CI"
            value={`${d.ci_lower.toLocaleString()} – ${d.ci_upper.toLocaleString()} kW`}
            dotClass="bg-blue-400"
          />
        )}
        {d.std_power != null && d.mean_power > 0 && (
          <TipRow
            label="CoV"
            value={`${((d.std_power / d.mean_power) * 100).toFixed(1)}%`}
            dotClass="bg-violet-500"
          />
        )}
        {d.count != null && (
          <div className="border-t border-border pt-1.5 mt-1.5">
            <TipRow
              label="Samples"
              value={d.count.toLocaleString()}
              dotClass="bg-emerald-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function TipRow({ label, value, dotClass = "bg-sky-500" }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-muted-foreground flex items-center gap-1.5">
        <span className={`inline-block w-2 h-2 rounded-full ${dotClass}`} />
        {label}
      </span>
      <span className="font-medium text-foreground tabular-nums">{value}</span>
    </div>
  );
}

export default function     PowerCurveChart({ data, showSampleCounts = true }) {
  const chartColors = useChartColors();
  const [expanded, setExpanded] = useState(false);
  const [showBand, setShowBand] = useState(true);
  const [showDots, setShowDots] = useState(true);
  const [showCounts, setShowCounts] = useState(showSampleCounts);

  const [refAreaLeft, setRefAreaLeft] = useState(null);
  const [refAreaRight, setRefAreaRight] = useState(null);
  const [xDomain, setXDomain] = useState(null);
  const [yDomain, setYDomain] = useState(null);
  const isZoomed = xDomain !== null;

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No power-curve data available.
        </CardContent>
      </Card>
    );
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const enriched = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        upper: d.std_power != null ? d.mean_power + d.std_power : d.mean_power,
        lower:
          d.std_power != null
            ? Math.max(0, d.mean_power - d.std_power)
            : d.mean_power,
      })),
    [data],
  );

  const maxPower = Math.max(...data.map((d) => d.mean_power));
  const ratedWs = data.find(
    (d) => d.mean_power >= maxPower * 0.95,
  )?.wind_speed_bin;
  const cutIn = data.find(
    (d) => d.mean_power > maxPower * 0.01,
  )?.wind_speed_bin;
  const cutOut = data[data.length - 1]?.wind_speed_bin;
  const totalSamples = data.reduce((s, d) => s + (d.count ?? 0), 0);
  const avgPower = data.reduce((s, d) => s + d.mean_power, 0) / data.length;

  /* ---- Zoom handlers ---- */
  const handleMouseDown = (e) => {
    if (e?.activeLabel != null) setRefAreaLeft(e.activeLabel);
  };
  const handleMouseMove = (e) => {
    if (refAreaLeft != null && e?.activeLabel != null)
      setRefAreaRight(e.activeLabel);
  };
  const handleMouseUp = () => {
    if (
      refAreaLeft == null ||
      refAreaRight == null ||
      refAreaLeft === refAreaRight
    ) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }
    const l = Math.min(refAreaLeft, refAreaRight);
    const r = Math.max(refAreaLeft, refAreaRight);
    const visible = enriched.filter(
      (d) => d.wind_speed_bin >= l && d.wind_speed_bin <= r,
    );
    const yMax = visible.length
      ? Math.max(...visible.map((d) => d.upper ?? d.mean_power)) * 1.15
      : maxPower;
    setXDomain([l - 0.3, r + 0.3]);
    setYDomain([0, Math.ceil(yMax / 50) * 50]);
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };
  const resetZoom = () => {
    setXDomain(null);
    setYDomain(null);
  };

  const exportCSV = () => {
    const header = "wind_speed_bin,mean_power,std_power,count\n";
    const rows = data
      .map(
        (d) =>
          `${d.wind_speed_bin},${d.mean_power},${d.std_power ?? ""},${d.count ?? ""}`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), {
      href: url,
      download: "power_curve.csv",
    }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-50 rounded-md dark:bg-amber-500/20">
              <Zap className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-base">
                Power Curve (IEC Binning)
              </CardTitle>
              <CardDescription>
                Binned mean power vs. wind speed with ±1σ confidence band
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {isZoomed && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={resetZoom}
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </Button>
            )}
            {isZoomed && (
              <Badge variant="default" className="text-[10px] bg-sky-500">
                <ZoomIn className="h-3 w-3 mr-0.5" /> Zoomed
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={exportCSV}
              title="Export CSV"
            >
              <Download className="h-3 w-3" />
            </Button>
            <Badge variant="secondary" className="text-xs">
              {data.length} bins
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
        {/* Mini stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <MiniStat
            icon={<Zap className="h-3.5 w-3.5" />}
            label="Peak Power"
            value={`${maxPower?.toLocaleString()} kW`}
          />
          <MiniStat
            icon={<BarChart3 className="h-3.5 w-3.5" />}
            label="Avg Bin Power"
            value={`${avgPower.toFixed(0)} kW`}
          />
          <MiniStat
            icon={<Layers className="h-3.5 w-3.5" />}
            label="Total Samples"
            value={totalSamples.toLocaleString()}
          />
          <MiniStat
            icon={<Info className="h-3.5 w-3.5" />}
            label="Wind Range"
            value={`${cutIn ?? "?"} – ${cutOut ?? "?"} m/s`}
          />
        </div>

        {/* Toggle pills */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <TogglePill
            active={showBand}
            onClick={() => setShowBand(!showBand)}
            activeClass="bg-sky-50 border-sky-200 text-sky-500 dark:bg-sky-600/10 dark:border-sky-400 dark:text-sky-500"
          >
            ± Std Band
          </TogglePill>
          <TogglePill
            active={showDots}
            onClick={() => setShowDots(!showDots)}
            activeClass="bg-blue-50 border-blue-200 text-blue-500 dark:bg-blue-600/10 dark:border-blue-400 dark:text-blue-500"
          >
            Scatter Dots
          </TogglePill>
          <TogglePill
            active={showCounts}
            onClick={() => setShowCounts(!showCounts)}
            activeClass="bg-emerald-50 border-emerald-200 text-emerald-500 dark:bg-emerald-600/10 dark:border-emerald-400 dark:text-emerald-500"
          >
            Sample Counts
          </TogglePill>
          <span className="text-border">|</span>
          {cutIn && (
            <LegendItem color="bg-emerald-500" text={`Cut-in ≈ ${cutIn} m/s`} />
          )}
          {ratedWs && (
            <LegendItem color="bg-rose-500" text={`Rated ≈ ${ratedWs} m/s`} />
          )}
        </div>

        {/* Sample count bar chart */}
        {showCounts && (
          <div className="mb-3">
            <p className="text-[10px] text-muted-foreground mb-1">
              Samples per bin
            </p>
            <div className="flex items-end gap-px h-10">
              {data.map((d) => {
                const maxCount = Math.max(...data.map((b) => b.count ?? 0));
                const pct =
                  maxCount > 0 ? ((d.count ?? 0) / maxCount) * 100 : 0;
                return (
                  <div
                    key={d.wind_speed_bin}
                    className="flex-1 bg-emerald-400/60 hover:bg-emerald-500/80 rounded-t-sm transition-colors"
                    style={{ height: `${Math.max(pct, 2)}%` }}
                    title={`${d.wind_speed_bin} m/s: ${d.count ?? 0} samples`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Chart */}
        <div
          className={`w-full cursor-crosshair transition-all duration-300 ${expanded ? "h-[550px]" : "h-[380px]"}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={enriched}
              margin={{ top: 15, right: 25, bottom: 35, left: 15 }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onDoubleClick={resetZoom}
            >
              <defs>
                <linearGradient id="pcFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={chartColors.primaryLight}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={chartColors.primaryLight}
                    stopOpacity={0.02}
                  />
                </linearGradient>
                <linearGradient id="pcBand" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={chartColors.primaryLight}
                    stopOpacity={0.12}
                  />
                  <stop
                    offset="95%"
                    stopColor={chartColors.primaryLight}
                    stopOpacity={0.04}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartColors.grid}
                vertical={false}
              />
              <XAxis
                dataKey="wind_speed_bin"
                type="number"
                domain={xDomain ?? [0, "dataMax + 1"]}
                allowDataOverflow
                tick={{ fontSize: 11, fill: chartColors.tick }}
                tickLine={false}
                axisLine={{ stroke: chartColors.grid }}
                label={{
                  value: "Wind Speed (m/s)",
                  position: "insideBottom",
                  offset: -22,
                  style: {
                    fill: chartColors.tick,
                    fontSize: 12,
                    fontWeight: 500,
                  },
                }}
              />
              <YAxis
                dataKey="mean_power"
                type="number"
                domain={yDomain ?? [0, "dataMax + 100"]}
                allowDataOverflow
                tick={{ fontSize: 11, fill: chartColors.tick }}
                tickLine={false}
                axisLine={false}
                label={{
                  value: "Power (kW)",
                  angle: -90,
                  position: "insideLeft",
                  offset: 5,
                  style: {
                    fill: chartColors.tick,
                    fontSize: 12,
                    fontWeight: 500,
                  },
                }}
              />

              {/* Confidence band (upper) */}
              {showBand && (
                <Area
                  dataKey="upper"
                  type="monotone"
                  fill="url(#pcBand)"
                  stroke={chartColors.primaryLight}
                  strokeWidth={0.5}
                  strokeDasharray="4 2"
                  strokeOpacity={0.4}
                  isAnimationActive={!isZoomed}
                  animationDuration={800}
                />
              )}
              {/* Confidence band (lower — fills white to create the 'cut-out') */}
              {showBand && (
                <Area
                  dataKey="lower"
                  type="monotone"
                  fill="var(--card)"
                  stroke={chartColors.primaryLight}
                  strokeWidth={0.5}
                  strokeDasharray="4 2"
                  strokeOpacity={0.4}
                  isAnimationActive={!isZoomed}
                  animationDuration={800}
                />
              )}

              {cutIn && (
                <ReferenceLine
                  x={cutIn}
                  stroke={chartColors.success}
                  strokeDasharray="6 3"
                  strokeWidth={1.5}
                  label={{
                    value: "Cut-in",
                    position: "top",
                    fill: chartColors.success,
                    fontSize: 11,
                  }}
                />
              )}
              {ratedWs && (
                <ReferenceLine
                  x={ratedWs}
                  stroke={chartColors.danger}
                  strokeDasharray="6 3"
                  strokeWidth={1.5}
                  label={{
                    value: "Rated",
                    position: "top",
                    fill: chartColors.danger,
                    fontSize: 11,
                  }}
                />
              )}

              <Area
                dataKey="mean_power"
                fill="url(#pcFill)"
                stroke="none"
                type="monotone"
                animationDuration={1200}
                isAnimationActive={!isZoomed}
              />
              <Line
                dataKey="mean_power"
                type="monotone"
                stroke={chartColors.primary}
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 5,
                  strokeWidth: 2,
                  fill: chartColors.dotStroke,
                  stroke: chartColors.primary,
                }}
                animationDuration={1000}
                isAnimationActive={!isZoomed}
              />
              {showDots && (
                <Scatter
                  dataKey="mean_power"
                  fill={chartColors.primaryLight}
                  shape={<SizedDot />}
                  animationDuration={800}
                  isAnimationActive={!isZoomed}
                />
              )}

              <Tooltip
                content={<PcTooltip />}
                cursor={{ stroke: chartColors.tick, strokeDasharray: "4 4" }}
              />

              {refAreaLeft != null && refAreaRight != null && (
                <ReferenceArea
                  x1={refAreaLeft}
                  x2={refAreaRight}
                  fill={chartColors.primaryLight}
                  fillOpacity={0.15}
                  stroke={chartColors.primaryLight}
                  strokeOpacity={0.4}
                  strokeDasharray="4 2"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <Info className="h-3 w-3" />
          Drag to zoom · double-click to reset · dot size ∝ sample count ·
          shaded band = ±1σ
        </p>
      </CardContent>
    </Card>
  );
}

function MiniStat({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <span className="text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
        <p className="text-sm font-semibold text-foreground tabular-nums truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

function TogglePill({ active, onClick, activeClass, children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition-all cursor-pointer
        ${active ? activeClass : "bg-muted/50 border-border text-muted-foreground line-through opacity-60"}`}
    >
      {children}
    </button>
  );
}

function LegendItem({ color, text }) {
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <span className={`w-3 h-0.5 ${color} inline-block rounded`} /> {text}
    </span>
  );
}
