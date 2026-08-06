export default function WeatherSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-40 rounded-xl border border-neutral-200 bg-white" />
      <div className="flex gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 w-20 shrink-0 rounded-lg bg-neutral-200" />
        ))}
      </div>
      <div className="h-64 rounded-xl border border-neutral-200 bg-white" />
    </div>
  );
}
