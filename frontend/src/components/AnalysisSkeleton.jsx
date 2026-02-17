/**
 * AnalysisSkeleton Component
 * ==========================
 * Animated skeleton loader that mirrors the dashboard layout,
 * providing a polished loading experience instead of a plain spinner.
 */

export default function AnalysisSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header skeleton */}
      <div className="bg-card border border-border/40 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <Bone className="w-10 h-10 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Bone className="h-5 w-48 rounded" />
            <Bone className="h-3 w-64 rounded" />
          </div>
          <Bone className="h-8 w-28 rounded-md hidden sm:block" />
        </div>
      </div>

      {/* Nav skeleton */}
      <div className="flex gap-2 p-1.5 bg-muted/30 border border-border/40 rounded-xl">
        {Array.from({ length: 6 }).map((_, i) => (
          <Bone key={i} className="h-7 w-20 rounded-md" />
        ))}
      </div>

      {/* KPI cards skeleton */}
      <div>
        <Bone className="h-5 w-44 rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border/40 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <Bone className="w-9 h-9 rounded-xl" />
                {i % 3 === 0 && <Bone className="h-5 w-10 rounded-full" />}
              </div>
              <Bone className="h-7 w-24 rounded" />
              <Bone className="h-3 w-20 rounded" />
              <Bone className="h-2 w-28 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Chart skeleton */}
      <div className="bg-card border border-border/40 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bone className="w-8 h-8 rounded-md" />
          <div className="space-y-1.5">
            <Bone className="h-4 w-44 rounded" />
            <Bone className="h-3 w-64 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} className="h-12 rounded-lg" />
          ))}
        </div>
        <Bone className="h-80 w-full rounded-lg" />
      </div>

      {/* Second chart skeleton */}
      <div className="bg-card border border-border/40 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bone className="w-8 h-8 rounded-md" />
          <Bone className="h-4 w-36 rounded" />
        </div>
        <Bone className="h-72 w-full rounded-lg" />
      </div>

      {/* Progress indicator */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-150" />
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-300" />
        </div>
        <p className="text-sm text-muted-foreground">
          Analysing SCADA data&hellip; this may take a few seconds
        </p>
      </div>
    </div>
  );
}

/** Skeleton bone primitive – a shimmer rectangle with sweeping gradient. */
function Bone({ className = "" }) {
  return <div className={`skeleton-shimmer rounded ${className}`} />;
}
