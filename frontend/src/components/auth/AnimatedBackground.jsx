import { motion } from "framer-motion";
import GradientBlob from "./GradientBlob";

/**
 * The hero panel's signature visual: a slowly-drifting topographic
 * contour field (elevation lines, the way satellite/GIS farmland maps
 * render terrain) crossed by a soft "satellite pass" scan line. Reused
 * across Login and Register so the auth experience feels like one
 * consistent instrument rather than two separate screens.
 */
export default function AnimatedBackground() {
  const contourPaths = [
    "M-40,120 C120,60 260,180 420,90 C560,20 680,140 800,80",
    "M-40,220 C140,150 300,260 460,180 C600,110 700,220 820,160",
    "M-40,320 C160,260 320,340 480,270 C620,210 720,300 840,250",
    "M-40,420 C180,370 340,430 500,370 C630,320 730,390 850,350",
  ];

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950">
      <GradientBlob tone="brand" className="top-[-15%] left-[-10%] h-[26rem] w-[26rem]" duration={16} />
      <GradientBlob tone="accent" className="bottom-[-15%] right-[-10%] h-[22rem] w-[22rem]" duration={19} delay={1.5} />
      <GradientBlob tone="deep" className="top-[35%] left-[45%] h-[20rem] w-[20rem]" duration={22} delay={0.8} />

      {/* Fine dot grid - "sensor field" texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Topographic contour lines - farmland elevation / GIS motif */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full opacity-40"
        viewBox="0 0 800 500"
        preserveAspectRatio="none"
      >
        {contourPaths.map((d, i) => (
          <motion.path
            key={d}
            d={d}
            fill="none"
            stroke="rgba(163,230,53,0.55)"
            strokeWidth="1.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1, y: [0, i % 2 === 0 ? 6 : -6, 0] }}
            transition={{
              pathLength: { duration: 2.4, delay: i * 0.25, ease: "easeOut" },
              opacity: { duration: 1.2, delay: i * 0.25 },
              y: { duration: 10 + i, repeat: Infinity, ease: "easeInOut" },
            }}
          />
        ))}
      </svg>

      {/* Satellite scan line sweeping down the panel */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-accent-400/20 to-transparent"
        initial={{ top: "-10%" }}
        animate={{ top: ["-10%", "110%"] }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
      />

      {/* Bottom fade so floating cards / copy stay legible */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-brand-950/70 to-transparent" />
    </div>
  );
}
