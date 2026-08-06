const RISK_STYLES = {
  Low: "bg-brand-50 text-brand-700",
  Medium: "bg-warn-500/10 text-soil-600",
  High: "bg-danger-500/10 text-danger-500",
};

export default function RecommendationHistoryList({ history }) {
  if (!history?.length) {
    return <p className="text-sm text-neutral-500">No past recommendations yet.</p>;
  }

  return (
    <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
      {history.map((item) => (
        <div key={item.id} className="flex items-start justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-sm text-neutral-800">{item.summary}</p>
            <p className="mt-0.5 text-xs text-neutral-400">
              {new Date(item.createdAt).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-xs font-medium text-neutral-500">{item.confidence}%</span>
            {item.diseaseRisk?.level && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  RISK_STYLES[item.diseaseRisk.level] || "bg-neutral-100 text-neutral-700"
                }`}
              >
                {item.diseaseRisk.level}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
