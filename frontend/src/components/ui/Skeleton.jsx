// Bare building block: one shimmering rectangle. Feature skeletons compose
// several of these into a shape that mirrors the real content.
export default function Skeleton({ className = "" }) {
  return <div className={`animate-shimmer rounded-lg ${className}`} aria-hidden="true" />;
}
