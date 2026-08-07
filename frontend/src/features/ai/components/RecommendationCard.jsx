import { motion } from "framer-motion";
import { Droplet, Wheat, AlertTriangle, Sparkles } from "lucide-react";
import ConfidenceMeter from "./ConfidenceMeter";
import Badge from "../../../components/ui/Badge";

const RISK_VARIANT = { Low: "brand", Medium: "warn", High: "danger" };

function AdviceRow({ icon: Icon, label, action, reason }) {
  if (!action) return null;
  return (
    <div className="rounded-2xl bg-neutral-900/[0.03] p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-neutral-400">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </div>
      <div className="mt-1.5 text-sm font-semibold text-neutral-900">{action}</div>
      {reason && <p className="mt-0.5 text-sm text-neutral-500">{reason}</p>}
    </div>
  );
}

export default function RecommendationCard({ recommendation }) {
  if (!recommendation) return null;
  const { summary, confidence, irrigation, harvest, diseaseRisk, alerts, nextReview, createdAt } =
    recommendation;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden rounded-3xl border border-neutral-900/[0.06] bg-white shadow-[var(--shadow-soft-md)]"
    >
      <div className="bg-gradient-hero relative px-6 py-5 text-white sm:px-7">
        <div className="bg-noise-overlay absolute inset-0 opacity-30" aria-hidden="true" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-white/70">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Today's advice
            </div>
            <p className="mt-1.5 max-w-xl text-base font-medium">{summary}</p>
          </div>
          {diseaseRisk?.level && (
            <Badge variant={RISK_VARIANT[diseaseRisk.level] || "neutral"} className="bg-white/15 text-white ring-white/25">
              Disease risk: {diseaseRisk.level}
            </Badge>
          )}
        </div>
      </div>

      <div className="p-6 sm:p-7">
        <div>
          <div className="mb-1.5 text-xs font-semibold text-neutral-400">Confidence</div>
          <ConfidenceMeter value={confidence} />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <AdviceRow icon={Droplet} label="Water requirement" action={irrigation?.action} reason={irrigation?.reason} />
          <AdviceRow icon={Wheat} label="Harvest suggestion" action={harvest?.action} reason={harvest?.reason} />
        </div>

        {diseaseRisk?.reason && (
          <p className="mt-4 text-sm text-neutral-500">
            <span className="font-semibold text-neutral-800">Disease risk note:</span> {diseaseRisk.reason}
          </p>
        )}

        {alerts?.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {alerts.map((alert, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm font-medium text-amber-700 ring-1 ring-inset ring-amber-600/15">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                {typeof alert === "string" ? alert : alert.message}
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-between gap-2 border-t border-neutral-100 pt-4 text-xs text-neutral-400">
          <span>Generated {createdAt && new Date(createdAt).toLocaleString()}</span>
          {nextReview && <span>Next review: {nextReview}</span>}
        </div>
      </div>
    </motion.div>
  );
}
