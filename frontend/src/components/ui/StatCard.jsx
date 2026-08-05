// The DoD for this refactor asks for a StatCard even though today's
// Dashboard only shows two info cards, not numeric stats - so it's used
// once now (farm count on DashboardPage) to prove it out, and is what
// Weather/Analytics widgets should reach for instead of a bespoke card.
export default function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
        <div>
          <p className="text-sm font-medium text-neutral-500">{label}</p>
          <p className="text-xl font-semibold text-neutral-900">{value}</p>
        </div>
      </div>
      {hint && <p className="mt-2 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}
