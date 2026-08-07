import { motion } from "framer-motion";

export default function LayerSelector({ layers, value, onChange }) {
  if (!layers?.length) return null;

  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-neutral-900/[0.06] bg-white p-1.5 shadow-[var(--shadow-soft-sm)]">
      {layers.map((layer) => {
        const isActive = value === layer.id;
        return (
          <button
            key={layer.id}
            type="button"
            onClick={() => onChange(layer.id)}
            title={layer.description}
            className="focus-ring relative rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors"
          >
            {isActive && (
              <motion.span
                layoutId="satellite-layer-pill"
                className="absolute inset-0 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 shadow-[var(--shadow-glow-brand)]"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}
            <span className={`relative z-10 ${isActive ? "text-white" : "text-neutral-600 hover:text-neutral-900"}`}>
              {layer.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
