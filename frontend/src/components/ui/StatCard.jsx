import { motion } from "framer-motion";

// Compact metric card used across Dashboard/Weather/Analytics widgets.
// `trend` is optional: { direction: "up" | "down", label }.
export default function StatCard({ icon: Icon, label, value, hint, trend, accent = "brand" }) {
  const accentClasses = {
    brand: "from-brand-50 to-brand-100/60 text-brand-600",
    amber: "from-amber-50 to-amber-100/60 text-amber-600",
    info: "from-info-50 to-info-100/60 text-info-600",
    danger: "from-red-50 to-red-100/60 text-red-600",
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="rounded-2xl border border-neutral-900/[0.06] bg-white p-5 shadow-[var(--shadow-soft-sm)]"
    >
      <div className="flex items-center justify-between">
        {Icon && (
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${
              accentClasses[accent] || accentClasses.brand
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
        {trend && (
          <span
            className={`text-xs font-semibold ${trend.direction === "down" ? "text-red-500" : "text-brand-600"}`}
          >
            {trend.direction === "down" ? "↓" : "↑"} {trend.label}
          </span>
        )}
      </div>
      <p className="mt-3.5 text-sm font-medium text-neutral-500">{label}</p>
      <p className="mt-0.5 text-2xl font-bold tracking-[-0.02em] text-neutral-900">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-neutral-400">{hint}</p>}
    </motion.div>
  );
}
