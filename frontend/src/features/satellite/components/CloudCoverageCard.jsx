import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Cloud } from "lucide-react";
import { formatCloudCover, formatCaptureDate } from "../utils/satelliteFormatters";
import { cloudCoverToClass } from "../utils/ndviColorMap";

export default function CloudCoverageCard({ metadata, className = "" }) {
  const { t } = useTranslation();

  const scenes = metadata?.scenes ?? [];
  const avgCloud = metadata?.avgCloudCover;
  const sceneCount = metadata?.sceneCount ?? 0;
  const cloudColorClass = cloudCoverToClass(avgCloud);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.25 }}
      className={`overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50">
          <Cloud className="h-4 w-4 text-sky-500" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">{t("satellite.cloud.title")}</h3>
          <p className="text-xs text-neutral-500">
            {t("satellite.cloud.sceneCount", { count: sceneCount })}
          </p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Average cloud cover */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-neutral-500">{t("satellite.cloud.average")}</p>
            <p className={`text-3xl font-bold ${cloudColorClass}`}>
              {formatCloudCover(avgCloud)}
            </p>
          </div>
          {/* Cloud cover bar */}
          <div className="w-32">
            <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-sky-400"
                initial={{ width: 0 }}
                animate={{ width: avgCloud != null ? `${avgCloud}%` : "0%" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <p className="mt-1 text-right text-xs text-neutral-400">
              {avgCloud != null && avgCloud < 30
                ? t("satellite.cloud.clear")
                : avgCloud != null && avgCloud < 70
                ? t("satellite.cloud.partial")
                : t("satellite.cloud.cloudy")}
            </p>
          </div>
        </div>

        {/* Scene list */}
        {scenes.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {t("satellite.cloud.recentScenes")}
            </p>
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {scenes.slice(0, 5).map((scene, i) => (
                <div
                  key={scene.sceneId || i}
                  className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-xs"
                >
                  <span className="text-neutral-600">{formatCaptureDate(scene.capturedAt)}</span>
                  <span className={`font-medium ${cloudCoverToClass(scene.cloudCoverPercent)}`}>
                    <Cloud className="mr-1 inline h-3 w-3" />
                    {formatCloudCover(scene.cloudCoverPercent)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {scenes.length === 0 && (
          <p className="text-center text-sm text-neutral-400">{t("satellite.cloud.noScenes")}</p>
        )}
      </div>
    </motion.div>
  );
}
