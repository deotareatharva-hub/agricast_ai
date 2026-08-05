import { useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeftRight, ImageOff } from "lucide-react";
import { buildImageSrc } from "../utils/satelliteFormatters";

// Drag-based before/after image comparison slider.
// "before" = the older frame; "after" = the newer frame.
export default function ImageComparisonSlider({ beforeFrame, afterFrame, className = "" }) {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const [position, setPosition] = useState(50); // percent
  const isDragging = useRef(false);

  const beforeSrc = buildImageSrc(beforeFrame?.imageBase64, beforeFrame?.mimeType);
  const afterSrc = buildImageSrc(afterFrame?.imageBase64, afterFrame?.mimeType);

  const moveHandler = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPosition(pct);
  }, []);

  const onMouseMove = (e) => {
    if (!isDragging.current) return;
    moveHandler(e.clientX);
  };

  const onTouchMove = (e) => {
    if (!isDragging.current) return;
    moveHandler(e.touches[0].clientX);
  };

  if (!beforeSrc && !afterSrc) {
    return (
      <div className={`flex flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white py-16 shadow-sm ${className}`}>
        <ImageOff className="h-10 w-10 text-neutral-300" aria-hidden="true" />
        <p className="mt-3 text-sm text-neutral-400">{t("satellite.comparison.noData")}</p>
        <p className="text-xs text-neutral-300 mt-1">{t("satellite.comparison.noDataHint")}</p>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm ${className}`}>
      <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-4">
        <ArrowLeftRight className="h-4 w-4 text-brand-600" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-neutral-900">{t("satellite.comparison.title")}</h3>
        <span className="ml-auto text-xs text-neutral-400">{t("satellite.comparison.dragHint")}</span>
      </div>

      {/* Comparison viewport */}
      <div
        ref={containerRef}
        className="relative h-72 w-full cursor-ew-resize select-none overflow-hidden bg-neutral-900 sm:h-96"
        onMouseMove={onMouseMove}
        onMouseDown={() => { isDragging.current = true; }}
        onMouseUp={() => { isDragging.current = false; }}
        onMouseLeave={() => { isDragging.current = false; }}
        onTouchStart={() => { isDragging.current = true; }}
        onTouchMove={onTouchMove}
        onTouchEnd={() => { isDragging.current = false; }}
      >
        {/* After image (right / full width) */}
        {afterSrc ? (
          <img
            src={afterSrc}
            alt={t("satellite.comparison.afterAlt")}
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-500 text-sm">
            {t("satellite.comparison.noAfter")}
          </div>
        )}

        {/* Before image (left / clipped) */}
        {beforeSrc && (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${position}%` }}
          >
            <img
              src={beforeSrc}
              alt={t("satellite.comparison.beforeAlt")}
              className="h-full object-cover"
              style={{ width: `${100 / (position / 100)}%`, maxWidth: "none" }}
              draggable={false}
            />
          </div>
        )}

        {/* Divider line */}
        <div
          className="absolute inset-y-0 z-10 w-0.5 bg-white shadow-lg"
          style={{ left: `${position}%` }}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-neutral-200">
            <ArrowLeftRight className="h-4 w-4 text-neutral-600" />
          </div>
        </div>

        {/* Labels */}
        <div className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
          {beforeFrame?.label ?? t("satellite.comparison.before")}
        </div>
        <div className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
          {afterFrame?.label ?? t("satellite.comparison.after")}
        </div>
      </div>
    </div>
  );
}
