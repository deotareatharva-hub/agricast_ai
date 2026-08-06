import { motion } from "framer-motion";
import { Satellite } from "lucide-react";

/**
 * Decorative "telemetry" card evoking a satellite / NDVI pass readout.
 * Position is controlled by the parent via `className`.
 */
export default function FloatingSatelliteCard({ className = "" }) {
  return (
    <motion.div
      className={`absolute w-48 rounded-2xl border border-white/15 bg-white/10 p-3 shadow-lg backdrop-blur-md ${className}`}
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: [0, 10, 0], scale: 1 }}
      transition={{
        opacity: { duration: 0.6, delay: 0.8 },
        scale: { duration: 0.6, delay: 0.8 },
        y: { duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.8 },
      }}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/25 text-accent-200">
          <Satellite className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-white/60">
            Satellite pass
          </p>
          <p className="font-display text-sm font-semibold text-white">NDVI 0.78</p>
        </div>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-brand-400 to-accent-400"
          initial={{ width: "0%" }}
          animate={{ width: "78%" }}
          transition={{ duration: 1.4, delay: 1, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}
