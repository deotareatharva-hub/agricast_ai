export default function FarmListSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-xl border border-neutral-200 bg-white p-5"
        >
          <div className="h-4 w-2/3 rounded bg-neutral-200" />
          <div className="mt-2 h-3 w-1/3 rounded bg-neutral-200" />
          <div className="mt-4 h-3 w-full rounded bg-neutral-200" />
          <div className="mt-4 flex gap-3 border-t border-neutral-100 pt-4">
            <div className="h-3 w-10 rounded bg-neutral-200" />
            <div className="h-3 w-10 rounded bg-neutral-200" />
            <div className="ml-auto h-3 w-10 rounded bg-neutral-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
