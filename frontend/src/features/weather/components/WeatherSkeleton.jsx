import Skeleton from "../../../components/ui/Skeleton";

// Mirrors the real WeatherPage layout (hero, highlights row, hourly
// strip, 7-day list) so the loading state doesn't jump around once data
// arrives - same idea as features/farms/components/FarmListSkeleton.jsx.
export default function WeatherSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <Skeleton className="h-48 w-full rounded-2xl sm:h-56" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>

      <div>
        <Skeleton className="mb-3 h-4 w-32 rounded" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-16 shrink-0 rounded-xl" />
          ))}
        </div>
      </div>

      <div>
        <Skeleton className="mb-3 h-4 w-32 rounded" />
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
