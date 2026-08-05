import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Satellite, Calendar, Cloud, RefreshCw } from "lucide-react";
import { formatCaptureDate, daysAgo } from "../utils/satelliteFormatters";
import { formatCloudCover } from "../utils/satelliteFormatters";
import { gradeToBackground } from "../utils/ndviColorMap";

export default function SatelliteHero({ current, farmName, onRefresh, isRefreshing }) {
  const { t } = useTranslation();

  const metadata = current?.metadata;
  const health = current?.health;
  const latestCapture = metadata?.latestCapture;
  const avgCloudCover = metadata?.avgCloudCover;
  const grade = health?.grade;
  const gradeClasses = gradeToBackground(grade);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      aria-label={t("satellite.hero.ariaLabel", { name: farmName })}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 p-6 text-white shadow-lg sm:p-8"
    >
      {/* decorative blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-black/10 blur-3xl" />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: title and farm */}
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <Satellite className="h-8 w-8 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/80">{farmName}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {t("satellite.hero.title")}
            </h1>
            <p className="mt-1 text-sm text-white/75">{t("satellite.hero.subtitle")}</p>
          </div>
        </div>

        {/* Right: stats grid */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Health grade badge */}
          {grade && (
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 ${gradeClasses}`}>
              <span className="text-2xl font-bold">{grade}</span>
              <div>
                <p className="text-xs font-medium">{t("satellite.hero.healthGrade")}</p>
                <p className="text-sm font-semibold">{health?.description}</p>
              </div>
            </div>
          )}

          {/* Metadata quick-stats */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-white/10 p-3 backdrop-blur-sm sm:w-52">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-white/70 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-white/65 text-xs">{t("satellite.fields.lastCapture")}</p>
                <p className="font-semibold text-sm leading-tight">
                  {latestCapture ? daysAgo(latestCapture) : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Cloud className="h-4 w-4 text-white/70 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-white/65 text-xs">{t("satellite.fields.cloudCover")}</p>
                <p className="font-semibold text-sm leading-tight">
                  {formatCloudCover(avgCloudCover)}
                </p>
              </div>
            </div>
            <div className="col-span-2 flex items-center gap-2 text-sm">
              <Satellite className="h-4 w-4 text-white/70 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-white/65 text-xs">{t("satellite.fields.captureDate")}</p>
                <p className="font-semibold text-sm leading-tight">
                  {formatCaptureDate(latestCapture)}
                </p>
              </div>
            </div>
          </div>

          {/* Refresh button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={t("satellite.actions.refresh")}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden="true" />
              {isRefreshing ? t("satellite.actions.refreshing") : t("satellite.actions.refresh")}
            </button>
          )}
        </div>
      </div>
    </motion.section>
  );
}
