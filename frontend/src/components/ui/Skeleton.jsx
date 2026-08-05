// Bare building block: one pulsing rectangle. Feature skeletons (see
// features/farms/components/FarmListSkeleton.jsx) compose several of these
// into a shape that mirrors the real content, instead of writing their own
// "animate-pulse rounded bg-neutral-200" strings.
export default function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded bg-neutral-200 ${className}`} aria-hidden="true" />;
}
