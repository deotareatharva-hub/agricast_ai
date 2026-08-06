export default function ConfidenceMeter({ value }) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  const color = pct >= 75 ? "bg-brand-600" : pct >= 50 ? "bg-warn-500" : "bg-danger-500";

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right text-sm font-semibold text-neutral-900">
        {pct}%
      </span>
    </div>
  );
}
