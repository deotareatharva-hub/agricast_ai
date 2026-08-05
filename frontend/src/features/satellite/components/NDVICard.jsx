import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Activity } from "lucide-react";
import { buildImageSrc } from "../utils/satelliteFormatters";

export default function NDVICard({ ndviImage, className = "" }) {
  const { t } = useTranslation();
  const imageSrc = buildImageSrc(ndviImage?.imageBase64, ndviImage?.mimeType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className={`overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
            <Activity className="h-4 w-4 text-brand-600" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">{t("satellite.ndvi.title")}</h3>
            <p className="text-xs text-neutral-500">{t("satellite.ndvi.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {imageSrc ? (
          <div className="overflow-hidden rounded-xl">
            <img
              src={imageSrc}
              alt={t("satellite.ndvi.imageAlt")}
              className="h-56 w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-56 items-center justify-center rounded-xl bg-neutral-50 text-sm text-neutral-400">
            {t("satellite.ndvi.noData")}
          </div>
        )}

        {/* NDVI color ramp legend (inline mini version) */}
        <div className="mt-3 flex items-center gap-1">
          <span className="text-xs text-neutral-500 shrink-0">{t("satellite.ndvi.low")}</span>
          <div
            className="h-2 flex-1 rounded-full"
            style={{
              background:
                "linear-gradient(to right, #1E64C8, #8C8C82, #B4DC50, #64BE32, #329628, #14640A)",
            }}
          />
          <span className="text-xs text-neutral-500 shrink-0">{t("satellite.ndvi.high")}</span>
        </div>
        <p className="mt-1 text-center text-xs text-neutral-400">{t("satellite.ndvi.scaleLabel")}</p>
      </div>
    </motion.div>
  );
}
