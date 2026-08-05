import Skeleton from "../../../components/ui/Skeleton";

// Composes the generic Skeleton primitive into the shape of a FarmCard,
// instead of hand-rolling "animate-pulse rounded bg-neutral-200" divs.
export default function FarmListSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-xl border border-neutral-200 bg-white p-5">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-2 h-3 w-1/3" />
          <Skeleton className="mt-4 h-3 w-full" />
          <div className="mt-4 flex gap-3 border-t border-neutral-100 pt-4">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-10" />
            <Skeleton className="ml-auto h-3 w-10" />
          </div>
        </div>
      ))}
    </div>
  );
}
