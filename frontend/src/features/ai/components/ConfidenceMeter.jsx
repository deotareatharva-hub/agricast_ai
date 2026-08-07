import { motion } from "framer-motion";

export default function ConfidenceMeter({ value }) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  const gradient =
    pct >= 75
      ? "from-brand-400 to-brand-600"
      : pct >= 50
        ? "from-amber-400 to-amber-500"
        : "from-red-400 to-red-500";

  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
        />
      </div>
      <span className="w-11 shrink-0 text-right text-sm font-bold text-neutral-900">{pct}%</span>
    </div>
  );
}
