import { motion } from "framer-motion";

/**
 * Soft, blurred gradient shape used as ambient atmosphere behind the
 * auth hero panel. Purely decorative - aria-hidden.
 *
 * @param {Object} props
 * @param {string} props.className - Tailwind position/size classes (e.g. "top-[-10%] left-[-10%] w-96 h-96")
 * @param {"brand"|"accent"|"deep"} [props.tone="brand"]
 * @param {number} [props.duration=14] - seconds per drift cycle
 * @param {number} [props.delay=0]
 */
export default function GradientBlob({
  className = "",
  tone = "brand",
  duration = 14,
  delay = 0,
}) {
  const gradients = {
    brand: "radial-gradient(circle at 30% 30%, rgba(34,197,94,0.55), rgba(22,101,52,0) 70%)",
    accent: "radial-gradient(circle at 40% 40%, rgba(132,204,22,0.45), rgba(132,204,22,0) 70%)",
    deep: "radial-gradient(circle at 50% 50%, rgba(15,61,34,0.65), rgba(15,61,34,0) 70%)",
  };

  return (
    <motion.div
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
      style={{ background: gradients[tone] ?? gradients.brand }}
      initial={{ opacity: 0.6, scale: 1 }}
      animate={{
        opacity: [0.5, 0.75, 0.5],
        scale: [1, 1.08, 1],
        x: [0, 12, 0],
        y: [0, -10, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}
