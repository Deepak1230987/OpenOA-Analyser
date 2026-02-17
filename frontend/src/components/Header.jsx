/**
 * Header Component
 * ================
 * Professional navigation bar with route-aware active states
 * and a polished animated light / dark theme toggle.
 */

import { NavLink, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  Wind,
  BookOpen,
  Upload,
  Sun,
  Moon,
  Menu,
  X,
  BarChart3,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { to: "/", label: "Upload", icon: Upload, end: true },
  { to: "/guide", label: "Guide", icon: BookOpen },
];

/* ---- Animated theme toggle ---- */
function ThemeToggle({ theme, toggleTheme, size = "default" }) {
  const isSmall = size === "sm";
  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-center overflow-hidden
        rounded-full border border-border
        bg-muted/50 hover:bg-muted
        transition-all duration-300
        cursor-pointer group
        ${isSmall ? "w-9 h-9" : "w-10 h-10"}
      `}
      aria-label={
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
    >
      <Sun
        className={`
          absolute transition-all duration-500
          ${isSmall ? "h-4 w-4" : "h-4.5 w-4.5"}
          ${
            theme === "dark"
              ? "rotate-0 scale-100 text-amber-400"
              : "rotate-90 scale-0 text-amber-500"
          }
        `}
      />
      <Moon
        className={`
          absolute transition-all duration-500
          ${isSmall ? "h-4 w-4" : "h-4.5 w-4.5"}
          ${
            theme === "dark"
              ? "-rotate-90 scale-0 text-slate-400"
              : "rotate-0 scale-100 text-slate-600"
          }
        `}
      />
    </button>
  );
}

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  /* Show Results tab when on results page */
  const isResults = location.pathname === "/results";

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/85 backdrop-blur-2xl supports-backdrop-filter:bg-background/60 shadow-sm shadow-black/3 dark:shadow-black/20">
      {/* Accent gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-primary via-blue-400 to-emerald-400 dark:from-primary dark:via-blue-500 dark:to-emerald-500 opacity-80" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-linear-to-br from-primary to-blue-400 dark:from-primary dark:to-blue-500 text-white shadow-md shadow-primary/25 group-hover:shadow-lg group-hover:shadow-primary/35 transition-all duration-300">
              <Wind className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <span className="text-base font-bold tracking-tight text-foreground">
                OpenOA Analyzer
              </span>
              <span className="hidden md:inline text-[11px] text-muted-foreground ml-2 font-medium">
                Wind Energy Analysis
              </span>
            </div>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm shadow-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}

            {isResults && (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary shadow-sm shadow-primary/5">
                <BarChart3 className="h-4 w-4" />
                Results
              </span>
            )}

            {/* Divider */}
            <div className="w-px h-6 bg-border/60 mx-1.5" />

            {/* Theme toggle */}
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </nav>

          {/* Mobile: theme toggle + hamburger */}
          <div className="flex sm:hidden items-center gap-1.5">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} size="sm" />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileOpen && (
          <nav className="sm:hidden pb-4 space-y-1 border-t border-border/50 pt-3 animate-in slide-in-from-top-2 duration-200">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
