import ConfidenceMeter from "./ConfidenceMeter";

const RISK_STYLES = {
  Low: "bg-brand-50 text-brand-700",
  Medium: "bg-warn-500/10 text-soil-600",
  High: "bg-danger-500/10 text-danger-500",
};

function AdviceRow({ label, action, reason }) {
  if (!action) return null;
  return (
    <div className="rounded-lg bg-neutral-50 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-neutral-900">{action}</div>
      {reason && <p className="mt-0.5 text-sm text-neutral-600">{reason}</p>}
    </div>
  );
}

export default function RecommendationCard({ recommendation }) {
  if (!recommendation) return null;
  const { summary, confidence, irrigation, harvest, diseaseRisk, alerts, nextReview, createdAt } =
    recommendation;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Today's advice
          </h3>
          <p className="mt-1 max-w-xl text-base text-neutral-900">{summary}</p>
        </div>
        {diseaseRisk?.level && (
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
              RISK_STYLES[diseaseRisk.level] || "bg-neutral-100 text-neutral-700"
            }`}
          >
            Disease risk: {diseaseRisk.level}
          </span>
        )}
      </div>

      <div className="mt-4">
        <div className="mb-1 text-xs font-medium text-neutral-500">Confidence</div>
        <ConfidenceMeter value={confidence} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <AdviceRow label="Water requirement" action={irrigation?.action} reason={irrigation?.reason} />
        <AdviceRow label="Harvest suggestion" action={harvest?.action} reason={harvest?.reason} />
      </div>

      {diseaseRisk?.reason && (
        <p className="mt-3 text-sm text-neutral-600">
          <span className="font-medium text-neutral-800">Disease risk note:</span>{" "}
          {diseaseRisk.reason}
        </p>
      )}

      {alerts?.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className="rounded-lg bg-warn-500/10 px-3 py-2 text-sm text-soil-600"
            >
              ⚠️ {typeof alert === "string" ? alert : alert.message}
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap justify-between gap-2 border-t border-neutral-100 pt-3 text-xs text-neutral-400">
        <span>Generated {createdAt && new Date(createdAt).toLocaleString()}</span>
        {nextReview && <span>Next review: {nextReview}</span>}
      </div>
    </div>
  );
}
