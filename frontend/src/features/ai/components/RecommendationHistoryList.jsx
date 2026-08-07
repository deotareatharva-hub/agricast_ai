import Badge from "../../../components/ui/Badge";

const RISK_VARIANT = { Low: "brand", Medium: "warn", High: "danger" };

export default function RecommendationHistoryList({ history }) {
  if (!history?.length) {
    return <p className="text-sm text-neutral-400">No past recommendations yet.</p>;
  }

  return (
    <div className="divide-y divide-neutral-900/[0.05] overflow-hidden rounded-2xl border border-neutral-900/[0.06] bg-white shadow-[var(--shadow-soft-sm)]">
      {history.map((item) => (
        <div key={item.id} className="flex items-start justify-between gap-4 px-4 py-3.5 transition hover:bg-neutral-900/[0.02]">
          <div>
            <p className="text-sm text-neutral-800">{item.summary}</p>
            <p className="mt-0.5 text-xs text-neutral-400">
              {new Date(item.createdAt).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className="text-xs font-bold text-neutral-500">{item.confidence}%</span>
            {item.diseaseRisk?.level && (
              <Badge variant={RISK_VARIANT[item.diseaseRisk.level] || "neutral"}>{item.diseaseRisk.level}</Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
