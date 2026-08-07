import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Expand, X } from "lucide-react";
import Badge from "../../../components/ui/Badge";

export default function SatelliteImageViewer({ image }) {
  const [fullscreen, setFullscreen] = useState(false);

  if (!image) return null;

  const src = `data:${image.mimeType};base64,${image.imageBase64}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-900/[0.06] bg-white p-4 shadow-[var(--shadow-soft-sm)] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span>{image.dateRange?.from} → {image.dateRange?.to}</span>
          {image.cache && <Badge variant={image.cache.hit ? "neutral" : "brand"}>{image.cache.hit ? "Cached" : "Fresh"}</Badge>}
        </div>
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:border-brand-300 hover:text-brand-700"
        >
          <Expand className="h-3.5 w-3.5" aria-hidden="true" />
          Fullscreen
        </button>
      </div>

      <img
        src={src}
        alt={`${image.layer} satellite imagery`}
        className="mt-3.5 w-full rounded-xl border border-neutral-900/[0.06] object-cover"
      />

      {createPortal(
        <AnimatePresence>
          {fullscreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/90 p-6 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              onClick={() => setFullscreen(false)}
            >
              <motion.img
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={src}
                alt={`${image.layer} satellite imagery, fullscreen`}
                className="max-h-full max-w-full rounded-2xl shadow-[var(--shadow-soft-xl)]"
              />
              <button
                type="button"
                onClick={() => setFullscreen(false)}
                className="focus-ring absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-900 shadow-[var(--shadow-soft-md)]"
                aria-label="Close"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
