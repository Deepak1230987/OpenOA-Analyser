/**
 * WindRoseChart Component
 * =======================
 * Polar wind-rose chart showing directional frequency distribution
 * with speed-class colour breakdown.
 *
 * Uses Recharts RadarChart for the polar grid and custom SVG wedges
 * for the stacked speed-class bars rendered on a polar coordinate system.
 */

import { useState, useMemo } from "react";
import { useChartColors } from "../hooks/useChartColors";
import { useTheme } from "../context/ThemeContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Compass, Maximize2, Minimize2, Download } from "lucide-react";

/* ---- Speed-class colours (theme-adaptive) ---- */
const SPEED_CLASSES_LIGHT = [
  { key: "0-3", label: "0–3 m/s", color: "#93c5fd" },
  { key: "3-6", label: "3–6 m/s", color: "#60a5fa" },
  { key: "6-9", label: "6–9 m/s", color: "#3b82f6" },
  { key: "9-12", label: "9–12 m/s", color: "#2563eb" },
  { key: "12-15", label: "12–15 m/s", color: "#1d4ed8" },
  { key: "15-25", label: "15–25 m/s", color: "#1e40af" },
  { key: "25+", label: "25+ m/s", color: "#1e3a5f" },
];
const SPEED_CLASSES_DARK = [
  { key: "0-3", label: "0–3 m/s", color: "#7dd3fc" },
  { key: "3-6", label: "3–6 m/s", color: "#38bdf8" },
  { key: "6-9", label: "6–9 m/s", color: "#0ea5e9" },
  { key: "9-12", label: "9–12 m/s", color: "#0284c7" },
  { key: "12-15", label: "12–15 m/s", color: "#0369a1" },
  { key: "15-25", label: "15–25 m/s", color: "#075985" },
  { key: "25+", label: "25+ m/s", color: "#0c4a6e" },
];

/* ---- Wedge path builder ---- */
function wedgePath(cx, cy, innerR, outerR, startAngle, endAngle) {
  // Angles in degrees, 0 = North (top), clockwise
  const toRad = (deg) => ((deg - 90) * Math.PI) / 180;
  const x1 = cx + innerR * Math.cos(toRad(startAngle));
  const y1 = cy + innerR * Math.sin(toRad(startAngle));
  const x2 = cx + outerR * Math.cos(toRad(startAngle));
  const y2 = cy + outerR * Math.sin(toRad(startAngle));
  const x3 = cx + outerR * Math.cos(toRad(endAngle));
  const y3 = cy + outerR * Math.sin(toRad(endAngle));
  const x4 = cx + innerR * Math.cos(toRad(endAngle));
  const y4 = cy + innerR * Math.sin(toRad(endAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M${x1},${y1} L${x2},${y2} A${outerR},${outerR} 0 ${largeArc} 1 ${x3},${y3} L${x4},${y4} A${innerR},${innerR} 0 ${largeArc} 0 ${x1},${y1} Z`;
}

/* ---- Tooltip on hover ---- */
function RoseTooltip({ data, x, y }) {
  if (!data) return null;
  return (
    <div
      className="absolute pointer-events-none bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-xl p-3 text-sm min-w-40 z-50"
      style={{ left: x + 12, top: y - 60 }}
    >
      <p className="font-semibold text-foreground mb-1.5 border-b border-border pb-1.5">
        {data.direction} ({data.angle}°)
      </p>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground text-xs">Frequency</span>
          <span className="font-medium text-xs">{data.frequency}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground text-xs">Mean WS</span>
          <span className="font-medium text-xs">{data.mean_ws} m/s</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground text-xs">Count</span>
          <span className="font-medium text-xs">{data.count}</span>
        </div>
      </div>
    </div>
  );
}

export default function WindRoseChart({ data }) {
  const chartColors = useChartColors();
  const { theme } = useTheme();
  const SPEED_CLASSES = theme === "dark" ? SPEED_CLASSES_DARK : SPEED_CLASSES_LIGHT;
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No wind direction data available.
        </CardContent>
      </Card>
    );
  }

  const maxFreq = Math.max(...data.map((d) => d.frequency));
  const prevailing = data.reduce(
    (best, d) => (d.frequency > best.frequency ? d : best),
    data[0],
  );

  const size = expanded ? 480 : 360;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 40;

  /* Concentric grid circles */
  const gridSteps = [0.25, 0.5, 0.75, 1.0];

  const exportCSV = () => {
    const header = "direction,angle,frequency,mean_ws,count\n";
    const rows = data
      .map(
        (d) =>
          `${d.direction},${d.angle},${d.frequency},${d.mean_ws},${d.count}`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), {
      href: url,
      download: "wind_rose.csv",
    }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-teal-50 rounded-md dark:bg-teal-500/20">
              <Compass className="h-4 w-4 text-teal-600" />
            </div>
            <div>
              <CardTitle className="text-base">Wind Rose</CardTitle>
              <CardDescription>
                Directional frequency distribution with speed classes
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px]">
              Prevailing: {prevailing.direction} ({prevailing.frequency}%)
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={exportCSV}
              title="Export CSV"
            >
              <Download className="h-3 w-3" />
            </Button>
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
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* SVG polar chart */}
          <div className="relative" onMouseLeave={() => setHovered(null)}>
            <svg width={size} height={size} className="mx-auto">
              {/* Concentric grid circles */}
              {gridSteps.map((step) => (
                <g key={step}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={maxR * step}
                    fill="none"
                    stroke={chartColors.grid}
                    strokeWidth={0.5}
                  />
                  <text
                    x={cx + 3}
                    y={cy - maxR * step + 12}
                    className="text-[9px] fill-muted-foreground"
                  >
                    {(maxFreq * step).toFixed(1)}%
                  </text>
                </g>
              ))}

              {/* Radial lines to each direction */}
              {data.map((d) => {
                const rad = ((d.angle - 90) * Math.PI) / 180;
                return (
                  <line
                    key={d.direction + "line"}
                    x1={cx}
                    y1={cy}
                    x2={cx + maxR * Math.cos(rad)}
                    y2={cy + maxR * Math.sin(rad)}
                    stroke={chartColors.grid}
                    strokeWidth={0.5}
                  />
                );
              })}

              {/* Stacked wedges (speed classes) */}
              {data.map((d, i) => {
                const sectorWidth = 360 / data.length;
                const startAngle = d.angle - sectorWidth / 2;
                const endAngle = d.angle + sectorWidth / 2;
                let cumR = 0;

                return (
                  <g
                    key={d.direction}
                    onMouseEnter={(e) => {
                      setHovered(d);
                      setMousePos({
                        x: e.nativeEvent.offsetX,
                        y: e.nativeEvent.offsetY,
                      });
                    }}
                    onMouseMove={(e) =>
                      setMousePos({
                        x: e.nativeEvent.offsetX,
                        y: e.nativeEvent.offsetY,
                      })
                    }
                    className="cursor-pointer"
                  >
                    {SPEED_CLASSES.map((sc) => {
                      const val = d[sc.key] ?? 0;
                      if (val === 0) return null;
                      const innerR = (cumR / maxFreq) * maxR;
                      cumR += val;
                      const outerR = (cumR / maxFreq) * maxR;
                      return (
                        <path
                          key={sc.key}
                          d={wedgePath(
                            cx,
                            cy,
                            innerR,
                            outerR,
                            startAngle,
                            endAngle,
                          )}
                          fill={sc.color}
                          fillOpacity={
                            hovered?.direction === d.direction ? 1 : 0.8
                          }
                          stroke={chartColors.dotStroke}
                          strokeWidth={0.5}
                          className="transition-opacity duration-150"
                        />
                      );
                    })}
                  </g>
                );
              })}

              {/* Direction labels */}
              {data.map((d) => {
                const rad = ((d.angle - 90) * Math.PI) / 180;
                const labelR = maxR + 18;
                return (
                  <text
                    key={d.direction + "label"}
                    x={cx + labelR * Math.cos(rad)}
                    y={cy + labelR * Math.sin(rad)}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-[11px] font-medium fill-foreground"
                  >
                    {d.direction}
                  </text>
                );
              })}

              {/* Center dot */}
              <circle cx={cx} cy={cy} r={3} fill={chartColors.tick} />
            </svg>

            {hovered && (
              <RoseTooltip data={hovered} x={mousePos.x} y={mousePos.y} />
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-foreground mb-1">
              Speed Classes
            </p>
            {SPEED_CLASSES.map((sc) => (
              <div key={sc.key} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ background: sc.color }}
                />
                <span className="text-xs text-muted-foreground">
                  {sc.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
