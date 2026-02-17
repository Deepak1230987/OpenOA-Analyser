/**
 * useChartColors
 * ==============
 * Reads CSS custom properties for Recharts styling.
 * Automatically updates when the theme toggles (light ↔ dark).
 */

import { useMemo } from "react";
import { useTheme } from "../context/ThemeContext";

export function useChartColors() {
    const { theme } = useTheme();

    return useMemo(() => {
        const styles = getComputedStyle(document.documentElement);
        const get = (prop, fallback) =>
            styles.getPropertyValue(prop).trim() || fallback;
        return {
            // Axes / grid
            grid: get("--chart-grid", "hsl(214 32% 91%)"),
            tick: get("--chart-tick", "hsl(215 16% 47%)"),
            cursor: get("--chart-cursor", "hsl(214 32% 91%)"),
            dotStroke: get("--chart-dot-stroke", "#fff"),
            // Series
            wind: get("--chart-wind", "hsl(199 89% 48%)"),
            power: get("--chart-power", "hsl(160 84% 39%)"),
            temp: get("--chart-temp", "hsl(24 95% 53%)"),
            dir: get("--chart-dir", "hsl(262 83% 58%)"),
            pitch: get("--chart-pitch", "hsl(340 82% 52%)"),
            yaw: get("--chart-yaw", "hsl(45 93% 47%)"),
            primary: get("--chart-primary", "hsl(201 96% 32%)"),
            primaryLight: get("--chart-primary-light", "hsl(199 89% 48%)"),
            success: get("--chart-success", "hsl(160 84% 39%)"),
            danger: get("--chart-danger", "hsl(0 84% 60%)"),
            capacity: get("--chart-capacity", "hsl(262 83% 58%)"),
        };
    }, [theme]);
}
