import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ShieldCheck } from "lucide-react";
import { gradeToBackground, gradeToColorClass } from "../utils/ndviColorMap";
import { formatHealthScore } from "../utils/satelliteFormatters";

export default function HealthScoreCard({ health, className = "" }) {
  const { t } = useTranslation();

  const score = health?.score;
  const grade = health?.grade;
  const description = health?.description;
  const gradeClasses = gradeToBackground(grade);
  const scoreColor = gradeToColorClass(grade);

  // Circular progress percentage
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const progress = score != null ? (score / 100) * circumference : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
      className={`overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
          <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">{t("satellite.health.title")}</h3>
          <p className="text-xs text-neutral-500">{t("satellite.health.subtitle")}</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 p-6">
        {/* Circular score */}
        <div className="relative flex items-center justify-center">
          <svg width="120" height="120" className="-rotate-90">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
            <motion.circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              stroke={
                grade === "A" ? "#16a34a" :
                grade === "B" ? "#65a30d" :
                grade === "C" ? "#ca8a04" :
                grade === "D" ? "#ea580c" : "#dc2626"
              }
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - progress }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className={`text-3xl font-bold ${scoreColor}`}>
              {score != null ? score : "—"}
            </span>
            <span className="text-xs text-neutral-500">/100</span>
          </div>
        </div>

        {/* Grade badge */}
        {grade && (
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold ${gradeClasses}`}>
            <span>{t("satellite.health.grade")}: {grade}</span>
            <span className="font-normal">— {description}</span>
          </div>
        )}

        {/* Score label */}
        <p className="text-center text-xs text-neutral-500 max-w-xs">
          {t("satellite.health.scoreDescription")}
        </p>
      </div>
    </motion.div>
  );
}
