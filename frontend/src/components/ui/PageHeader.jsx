import { motion } from "framer-motion";

// The shared "<h1> + subtitle + optional action" header used across every
// authenticated page. `breadcrumb` accepts a <Breadcrumb /> element.
export default function PageHeader({ title, subtitle, actions, breadcrumb, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div>
        {breadcrumb}
        <h1 className="text-[1.75rem] font-bold tracking-[-0.02em] text-neutral-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-[15px] text-neutral-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </motion.div>
  );
}
