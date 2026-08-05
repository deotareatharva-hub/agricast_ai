import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Clock, ImageOff } from "lucide-react";
import { buildImageSrc, formatTimelapseLabel } from "../utils/satelliteFormatters";

export default function SatelliteTimeline({ timelapse, className = "" }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(0);

  const frames = timelapse?.frames ?? [];

  if (frames.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white py-16 shadow-sm ${className}`}>
        <ImageOff className="h-10 w-10 text-neutral-300" aria-hidden="true" />
        <p className="mt-3 text-sm text-neutral-400">{t("satellite.timeline.noData")}</p>
      </div>
    );
  }

  const activeFrame = frames[selected];
  const imageSrc = buildImageSrc(activeFrame?.imageBase64, activeFrame?.mimeType);

  return (
    <div className={`overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm ${className}`}>
      <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-4">
        <Clock className="h-4 w-4 text-brand-600" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-neutral-900">{t("satellite.timeline.title")}</h3>
        <span className="ml-auto text-xs text-neutral-400">{t("satellite.timeline.subtitle")}</span>
      </div>

      {/* Period tabs */}
      <div className="flex border-b border-neutral-100 px-5">
        {frames.map((frame, i) => (
          <button
            key={frame.period}
            onClick={() => setSelected(i)}
            className={`relative px-4 py-3 text-sm font-medium transition-colors ${
              selected === i
                ? "text-brand-600"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {frame.label}
            {selected === i && (
              <motion.div
                layoutId="timeline-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600"
              />
            )}
          </button>
        ))}
      </div>

      {/* Image panel */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            {imageSrc ? (
              <div className="overflow-hidden rounded-xl">
                <img
                  src={imageSrc}
                  alt={`${activeFrame.label} ${t("satellite.timeline.imageAlt")}`}
                  className="h-72 w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-72 flex-col items-center justify-center rounded-xl bg-neutral-50 gap-2">
                <ImageOff className="h-8 w-8 text-neutral-300" aria-hidden="true" />
                <p className="text-sm text-neutral-400">{t("satellite.timeline.noImageForPeriod")}</p>
                <p className="text-xs text-neutral-300">{activeFrame.dateRange?.from} → {activeFrame.dateRange?.to}</p>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
              <span>{activeFrame.dateRange?.from} → {activeFrame.dateRange?.to}</span>
              <span>{activeFrame.layer ?? "TRUE_COLOR"}</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
