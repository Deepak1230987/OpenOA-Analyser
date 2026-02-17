/**
 * TimeSeriesChart Component
 * =========================
 * Advanced dual-axis area chart with MATLAB-style drag-zoom, 4 toggleable
 * series (wind speed, power, temperature, wind direction), moving average
 * overlay, statistics footer, and CSV export.
 */

import { useState, useMemo } from "react";
import { useChartColors } from "../hooks/useChartColors";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Brush,
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
  TrendingUp,
  Maximize2,
  Minimize2,
  Info,
  Wind,
  Zap,
  Thermometer,
  Compass,
  RotateCcw,
  ZoomIn,
  Download,
  Activity,
  Navigation,
} from "lucide-react";

/* ---- Colours (now theme-aware via CSS vars) ---- */
function getSeriesColors() {
  const s = getComputedStyle(document.documentElement);
  const v = (prop, fb) => s.getPropertyValue(prop).trim() || fb;
  return {
    wind: v("--chart-wind", "hsl(199 89% 48%)"),
    power: v("--chart-power", "hsl(160 84% 39%)"),
    temp: v("--chart-temp", "hsl(24 95% 53%)"),
    dir: v("--chart-dir", "hsl(262 83% 58%)"),
    pitch: v("--chart-pitch", "hsl(340 82% 52%)"),
    yaw: v("--chart-yaw", "hsl(45 93% 47%)"),
  };
}

/* ---- Moving-average helper ---- */
function movingAvg(arr, key, window = 12) {
  return arr.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = arr.slice(start, i + 1).filter((d) => d[key] != null);
    if (slice.length === 0) return null;
    return +(slice.reduce((s, d) => s + d[key], 0) / slice.length).toFixed(2);
  });
}

/* ---- Tooltip ---- */
function TsTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-xl p-4 text-sm min-w-52">
      <p className="font-semibold text-foreground mb-2.5 border-b border-border pb-2 text-xs">
        {label}
      </p>
      <div className="space-y-1.5">
        {payload
          .filter((e) => !e.dataKey.startsWith("ma_"))
          .map((entry) => (
            <div
              key={entry.dataKey}
              className="flex justify-between items-center gap-6"
            >
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ background: entry.color }}
                />
                {entry.name}
              </span>
              <span className="font-medium text-foreground tabular-nums">
                {entry.value != null
                  ? entry.value.toLocaleString(undefined, {
                      maximumFractionDigits: 1,
                    })
                  : "—"}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

export default function TimeSeriesChart({ data }) {
  const chartColors = useChartColors();
  /* Series colours derived from CSS vars (theme-reactive) */
  const C = useMemo(getSeriesColors, [chartColors]);
  const [expanded, setExpanded] = useState(false);
  const [showWind, setShowWind] = useState(true);
  const [showPower, setShowPower] = useState(true);
  const [showTemp, setShowTemp] = useState(false);
  const [showDir, setShowDir] = useState(false);
  const [showPitch, setShowPitch] = useState(false);
  const [showYaw, setShowYaw] = useState(false);
  const [showMA, setShowMA] = useState(false);

  // Drag-to-zoom
  const [refAreaLeft, setRefAreaLeft] = useState(null);
  const [refAreaRight, setRefAreaRight] = useState(null);
  const [dragStartIdx, setDragStartIdx] = useState(null);
  const [dragEndIdx, setDragEndIdx] = useState(null);
  const [zoomSlice, setZoomSlice] = useState(null);

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No time-series data available.
        </CardContent>
      </Card>
    );
  }

  const hasTemp = data.some((d) => d.ambient_temperature != null);
  const hasDir = data.some((d) => d.wind_direction != null);
  const hasPitch = data.some((d) => d.pitch_angle != null);
  const hasYaw = data.some((d) => d.relative_wind_direction != null);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const formatted = useMemo(() => {
    const maWind = movingAvg(data, "wind_speed");
    const maPower = movingAvg(data, "power");
    return data.map((d, i) => ({
      ...d,
      label: d.timestamp?.replace("T", " ").slice(0, 16) ?? "",
      ma_wind: maWind[i],
      ma_power: maPower[i],
    }));
  }, [data]);

  const displayData = zoomSlice
    ? formatted.slice(zoomSlice[0], zoomSlice[1] + 1)
    : formatted;
  const isZoomed = zoomSlice !== null;

  // Stats for visible data
  const stats = useMemo(() => {
    const ws = displayData
      .filter((d) => d.wind_speed != null)
      .map((d) => d.wind_speed);
    const pw = displayData.filter((d) => d.power != null).map((d) => d.power);
    return {
      avgWind: ws.length ? ws.reduce((a, b) => a + b, 0) / ws.length : 0,
      maxWind: ws.length ? Math.max(...ws) : 0,
      avgPower: pw.length ? pw.reduce((a, b) => a + b, 0) / pw.length : 0,
      maxPower: pw.length ? Math.max(...pw) : 0,
    };
  }, [displayData]);

  /* ---- Zoom ---- */
  const handleMouseDown = (e) => {
    if (e?.activeTooltipIndex != null) {
      setDragStartIdx((zoomSlice ? zoomSlice[0] : 0) + e.activeTooltipIndex);
      setRefAreaLeft(e.activeLabel);
    }
  };
  const handleMouseMove = (e) => {
    if (dragStartIdx != null && e?.activeLabel) {
      setDragEndIdx((zoomSlice ? zoomSlice[0] : 0) + e.activeTooltipIndex);
      setRefAreaRight(e.activeLabel);
    }
  };
  const handleMouseUp = () => {
    if (
      dragStartIdx == null ||
      dragEndIdx == null ||
      dragStartIdx === dragEndIdx
    ) {
      clearDrag();
      return;
    }
    setZoomSlice([
      Math.min(dragStartIdx, dragEndIdx),
      Math.max(dragStartIdx, dragEndIdx),
    ]);
    clearDrag();
  };
  const clearDrag = () => {
    setRefAreaLeft(null);
    setRefAreaRight(null);
    setDragStartIdx(null);
    setDragEndIdx(null);
  };
  const resetZoom = () => {
    setZoomSlice(null);
    clearDrag();
  };

  const exportCSV = () => {
    const cols = ["timestamp", "wind_speed", "power"];
    if (hasTemp) cols.push("ambient_temperature");
    if (hasDir) cols.push("wind_direction");
    if (hasPitch) cols.push("pitch_angle");
    if (hasYaw) cols.push("relative_wind_direction");
    const header = cols.join(",") + "\n";
    const rows = displayData
      .map((d) => cols.map((c) => d[c] ?? "").join(","))
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), {
      href: url,
      download: "time_series.csv",
    }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-sky-50 rounded-md dark:bg-sky-500/20">
              <TrendingUp className="h-4 w-4 text-sky-600" />
            </div>
            <div>
              <CardTitle className="text-base">
                Wind Speed &amp; Power Over Time
              </CardTitle>
              <CardDescription>
                Multi-variable temporal trends with moving average overlay
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
                <ZoomIn className="h-3 w-3 mr-0.5" /> {displayData.length} /{" "}
                {formatted.length}
              </Badge>
            )}
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
              {formatted.length} pts
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
        {/* Series toggles */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <SeriesToggle
            active={showWind}
            onClick={() => setShowWind(!showWind)}
            icon={<Wind className="h-3 w-3" />}
            color="sky"
            label="Wind Speed"
          />
          <SeriesToggle
            active={showPower}
            onClick={() => setShowPower(!showPower)}
            icon={<Zap className="h-3 w-3" />}
            color="emerald"
            label="Power"
          />
          {hasTemp && (
            <SeriesToggle
              active={showTemp}
              onClick={() => setShowTemp(!showTemp)}
              icon={<Thermometer className="h-3 w-3" />}
              color="orange"
              label="Temperature"
            />
          )}
          {hasDir && (
            <SeriesToggle
              active={showDir}
              onClick={() => setShowDir(!showDir)}
              icon={<Compass className="h-3 w-3" />}
              color="violet"
              label="Direction"
            />
          )}
          {hasPitch && (
            <SeriesToggle
              active={showPitch}
              onClick={() => setShowPitch(!showPitch)}
              icon={<RotateCcw className="h-3 w-3" />}
              color="rose"
              label="Pitch"
            />
          )}
          {hasYaw && (
            <SeriesToggle
              active={showYaw}
              onClick={() => setShowYaw(!showYaw)}
              icon={<Navigation className="h-3 w-3" />}
              color="amber"
              label="Yaw Error"
            />
          )}
          <span className="text-border">|</span>
          <SeriesToggle
            active={showMA}
            onClick={() => setShowMA(!showMA)}
            icon={<Activity className="h-3 w-3" />}
            color="slate"
            label="Moving Avg"
          />
        </div>

        {/* Live stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <MiniStat
            label="Avg Wind"
            value={`${stats.avgWind.toFixed(1)} m/s`}
            color={C.wind}
          />
          <MiniStat
            label="Max Wind"
            value={`${stats.maxWind.toFixed(1)} m/s`}
            color={C.wind}
          />
          <MiniStat
            label="Avg Power"
            value={`${Math.round(stats.avgPower)} kW`}
            color={C.power}
          />
          <MiniStat
            label="Max Power"
            value={`${Math.round(stats.maxPower)} kW`}
            color={C.power}
          />
        </div>

        {/* Chart */}
        <div
          className={`w-full transition-all duration-300 cursor-crosshair ${expanded ? "h-[550px]" : "h-[380px]"}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={displayData}
              margin={{ top: 10, right: 20, bottom: 30, left: 15 }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onDoubleClick={resetZoom}
            >
              <defs>
                <linearGradient id="tsWind" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.wind} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={C.wind} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="tsPower" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.power} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={C.power} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartColors.grid}
                vertical={false}
              />

              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: chartColors.tick }}
                tickLine={false}
                axisLine={{ stroke: chartColors.grid }}
                interval="preserveStartEnd"
                angle={-30}
                textAnchor="end"
                height={50}
              />

              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: chartColors.tick }}
                tickLine={false}
                axisLine={false}
                label={{
                  value: "Wind Speed (m/s)",
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: C.wind, fontSize: 12, fontWeight: 500 },
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: chartColors.tick }}
                tickLine={false}
                axisLine={false}
                label={{
                  value: "Power (kW)",
                  angle: 90,
                  position: "insideRight",
                  style: { fill: C.power, fontSize: 12, fontWeight: 500 },
                }}
              />

              {/* Average ref lines */}
              {showWind && (
                <ReferenceLine
                  yAxisId="left"
                  y={stats.avgWind}
                  stroke={C.wind}
                  strokeDasharray="8 4"
                  strokeWidth={1}
                  label={{
                    value: `Avg ${stats.avgWind.toFixed(1)} m/s`,
                    position: "left",
                    fill: C.wind,
                    fontSize: 10,
                  }}
                />
              )}
              {showPower && (
                <ReferenceLine
                  yAxisId="right"
                  y={stats.avgPower}
                  stroke={C.power}
                  strokeDasharray="8 4"
                  strokeWidth={1}
                  label={{
                    value: `Avg ${Math.round(stats.avgPower)} kW`,
                    position: "right",
                    fill: C.power,
                    fontSize: 10,
                  }}
                />
              )}

              {/* Wind area + line */}
              {showWind && (
                <>
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="wind_speed"
                    fill="url(#tsWind)"
                    stroke="none"
                    isAnimationActive={!isZoomed}
                    animationDuration={800}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="wind_speed"
                    name="Wind Speed (m/s)"
                    stroke={C.wind}
                    dot={false}
                    strokeWidth={1.5}
                    activeDot={{
                      r: 4,
                      strokeWidth: 2,
                      fill: chartColors.dotStroke,
                      stroke: C.wind,
                    }}
                    isAnimationActive={!isZoomed}
                  />
                </>
              )}
              {showWind && showMA && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="ma_wind"
                  name="Wind MA"
                  stroke={C.wind}
                  dot={false}
                  strokeWidth={2.5}
                  strokeDasharray="6 3"
                  strokeOpacity={0.7}
                  isAnimationActive={false}
                />
              )}

              {/* Power area + line */}
              {showPower && (
                <>
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="power"
                    fill="url(#tsPower)"
                    stroke="none"
                    isAnimationActive={!isZoomed}
                    animationDuration={1000}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="power"
                    name="Power (kW)"
                    stroke={C.power}
                    dot={false}
                    strokeWidth={1.5}
                    activeDot={{
                      r: 4,
                      strokeWidth: 2,
                      fill: chartColors.dotStroke,
                      stroke: C.power,
                    }}
                    isAnimationActive={!isZoomed}
                  />
                </>
              )}
              {showPower && showMA && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="ma_power"
                  name="Power MA"
                  stroke={C.power}
                  dot={false}
                  strokeWidth={2.5}
                  strokeDasharray="6 3"
                  strokeOpacity={0.7}
                  isAnimationActive={false}
                />
              )}

              {/* Temperature */}
              {showTemp && hasTemp && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="ambient_temperature"
                  name="Temp (°C)"
                  stroke={C.temp}
                  dot={false}
                  strokeWidth={1.5}
                  activeDot={{
                    r: 4,
                    strokeWidth: 2,
                    fill: chartColors.dotStroke,
                    stroke: C.temp,
                  }}
                  isAnimationActive={!isZoomed}
                />
              )}

              {/* Wind direction */}
              {showDir && hasDir && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="wind_direction"
                  name="Direction (°)"
                  stroke={C.dir}
                  dot={false}
                  strokeWidth={1}
                  strokeDasharray="3 2"
                  activeDot={{ r: 3, fill: C.dir }}
                  isAnimationActive={!isZoomed}
                />
              )}

              {/* Blade pitch angle */}
              {showPitch && hasPitch && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="pitch_angle"
                  name="Pitch (°)"
                  stroke={C.pitch}
                  dot={false}
                  strokeWidth={1.5}
                  activeDot={{
                    r: 3,
                    strokeWidth: 2,
                    fill: chartColors.dotStroke,
                    stroke: C.pitch,
                  }}
                  isAnimationActive={!isZoomed}
                />
              )}

              {/* Yaw error / relative wind direction */}
              {showYaw && hasYaw && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="relative_wind_direction"
                  name="Yaw Error (°)"
                  stroke={C.yaw}
                  dot={false}
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  activeDot={{
                    r: 3,
                    strokeWidth: 2,
                    fill: chartColors.dotStroke,
                    stroke: C.yaw,
                  }}
                  isAnimationActive={!isZoomed}
                />
              )}

              <Tooltip content={<TsTooltip />} />

              {refAreaLeft && refAreaRight && (
                <ReferenceArea
                  x1={refAreaLeft}
                  x2={refAreaRight}
                  fill={C.wind}
                  fillOpacity={0.15}
                  stroke={C.wind}
                  strokeOpacity={0.4}
                  strokeDasharray="4 2"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <Info className="h-3 w-3" />
          Drag to zoom · double-click to reset · toggle series & moving-average
          above
        </p>
      </CardContent>
    </Card>
  );
}

/* ---- Helpers ---- */
function SeriesToggle({ active, onClick, icon, color, label }) {
  const ac = {
    sky: "bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-500/10 dark:border-sky-400 dark:text-sky-500",
    emerald:
      "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-400 dark:text-emerald-500",
    orange:
      "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-500/10 dark:border-orange-400 dark:text-orange-500",
    violet:
      "bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-500/10 dark:border-violet-400 dark:text-violet-500",
    rose: "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-400 dark:text-rose-500",
    amber:
      "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-400 dark:text-amber-500",
    slate:
      "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-500/10 dark:border-slate-400 dark:text-slate-500",
  }[color];
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-all cursor-pointer
        ${active ? ac : "bg-muted/50 border-border text-muted-foreground line-through opacity-60"}`}
    >
      {icon} {label}
    </button>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div className="w-1 h-6 rounded-full" style={{ background: color }} />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground truncate">{label}</p>
        <p className="text-sm font-semibold text-foreground tabular-nums truncate">
          {value}
        </p>
      </div>
    </div>
  );
}
