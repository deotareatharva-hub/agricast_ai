import Skeleton from "../../../components/ui/Skeleton";

export default function WeatherSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-44 rounded-3xl" />
      <div className="flex gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-20 shrink-0 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}
