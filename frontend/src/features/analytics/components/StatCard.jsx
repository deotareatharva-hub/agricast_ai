import { motion } from "framer-motion";

export default function StatCard({ label, value, sub }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-neutral-900/[0.06] bg-white p-4 shadow-[var(--shadow-soft-sm)]"
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{label}</div>
      <div className="mt-1.5 text-2xl font-bold tracking-[-0.01em] text-neutral-900">{value ?? "—"}</div>
      {sub && <div className="mt-0.5 text-xs text-neutral-400">{sub}</div>}
    </motion.div>
  );
}
