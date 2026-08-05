import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Leaf, AlertCircle, CheckCircle, Info } from "lucide-react";

export default function VegetationHealthCard({ health, className = "" }) {
  const { t } = useTranslation();

  const assessment = health?.assessment;
  const summary = assessment?.summary;
  const recommendations = assessment?.recommendations ?? [];

  const iconForRec = (rec) => {
    const lower = rec.toLowerCase();
    if (lower.includes("excellent") || lower.includes("maintain")) {
      return <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />;
    }
    if (lower.includes("check") || lower.includes("inspect") || lower.includes("high cloud")) {
      return <Info className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />;
    }
    return <AlertCircle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className={`overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
          <Leaf className="h-4 w-4 text-brand-600" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">{t("satellite.vegetation.title")}</h3>
          <p className="text-xs text-neutral-500">{t("satellite.vegetation.subtitle")}</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {summary && (
          <p className="text-sm text-neutral-700 bg-brand-50 rounded-xl px-4 py-3 border border-brand-100">
            {summary}
          </p>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              {t("satellite.vegetation.recommendations")}
            </p>
            <ul className="space-y-2">
              {recommendations.map((rec, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-2 text-sm text-neutral-700"
                >
                  {iconForRec(rec)}
                  <span>{rec}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        {!summary && recommendations.length === 0 && (
          <p className="text-sm text-neutral-400 text-center py-4">{t("satellite.vegetation.noData")}</p>
        )}
      </div>
    </motion.div>
  );
}
