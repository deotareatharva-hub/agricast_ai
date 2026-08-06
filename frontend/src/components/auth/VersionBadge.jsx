/**
 * Small status pill for the auth top bar. Signals "this is a live,
 * actively-developed product" without asserting a specific version
 * number the app doesn't actually track yet.
 */
export default function VersionBadge({ label = "Early Access" }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800/70 dark:text-neutral-400">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
      </span>
      {label}
    </span>
  );
}
