// Skeleton loader that mirrors the SatellitePage layout so there is no
// layout shift when data arrives. Mirrors the WeatherSkeleton pattern.

export default function SatelliteLoading({ rows = 3 }) {
  return (
    <div className="space-y-6 animate-pulse" aria-hidden="true">
      {/* Hero skeleton */}
      <div className="h-40 w-full rounded-2xl bg-brand-100" />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-neutral-100" />
        ))}
      </div>

      {/* Map skeleton */}
      <div className="h-96 rounded-2xl bg-neutral-100" />

      {/* Cards row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-64 rounded-2xl bg-neutral-100" />
        ))}
      </div>
    </div>
  );
}
