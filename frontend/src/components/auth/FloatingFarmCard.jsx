import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

/**
 * Decorative "telemetry" card evoking a farm-analytics yield trend.
 * Position is controlled by the parent via `className`.
 */
export default function FloatingFarmCard({ className = "" }) {
  const bars = [40, 55, 48, 70, 62, 82];

  return (
    <motion.div
      className={`absolute w-48 rounded-2xl border border-white/15 bg-white/10 p-3 shadow-lg backdrop-blur-md ${className}`}
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: [0, -6, 0], scale: 1 }}
      transition={{
        opacity: { duration: 0.6, delay: 1.1 },
        scale: { duration: 0.6, delay: 1.1 },
        y: { duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.1 },
      }}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-400/25 text-brand-100">
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-white/60">
            Farm analytics
          </p>
          <p className="font-display text-sm font-semibold text-white">Yield +12% YoY</p>
        </div>
      </div>
      <div className="mt-2.5 flex h-8 items-end gap-1">
        {bars.map((h, i) => (
          <motion.span
            key={i}
            className="w-full rounded-sm bg-gradient-to-t from-brand-400/80 to-accent-300/80"
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 0.6, delay: 1.3 + i * 0.08, ease: "easeOut" }}
          />
        ))}
      </div>
    </motion.div>
  );
}
