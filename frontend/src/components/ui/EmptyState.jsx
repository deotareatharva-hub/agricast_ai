import { Inbox } from "lucide-react";
import { motion } from "framer-motion";

// Generic "nothing here yet" panel. `icon` accepts any lucide-react icon
// component so each feature can show something relevant without a new
// component.
export default function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-white/60 px-6 py-16 text-center backdrop-blur-sm"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-accent-100 text-brand-600 shadow-[var(--shadow-soft-sm)]">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-neutral-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-neutral-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
