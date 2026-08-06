import { motion } from "framer-motion";
import { CloudSun } from "lucide-react";

/**
 * Decorative "telemetry" card evoking a live weather readout.
 * Position is controlled by the parent via `className`.
 */
export default function FloatingWeatherCard({ className = "" }) {
  return (
    <motion.div
      className={`absolute w-44 rounded-2xl border border-white/15 bg-white/10 p-3 shadow-lg backdrop-blur-md ${className}`}
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: [0, -8, 0], scale: 1 }}
      transition={{
        opacity: { duration: 0.6, delay: 0.5 },
        scale: { duration: 0.6, delay: 0.5 },
        y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
      }}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-alert-500/25 text-sky-100">
          <CloudSun className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-white/60">
            Weather intel
          </p>
          <p className="font-display text-sm font-semibold text-white">27°C · Clear</p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/60">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
        Rain risk low next 48h
      </div>
    </motion.div>
  );
}
