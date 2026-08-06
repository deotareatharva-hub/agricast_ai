import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Leaf, Satellite } from "lucide-react";
import AnimatedBackground from "./AnimatedBackground";
import FloatingWeatherCard from "./FloatingWeatherCard";
import FloatingSatelliteCard from "./FloatingSatelliteCard";
import FloatingFarmCard from "./FloatingFarmCard";

/** AgriCast AI logo lockup: leaf-in-satellite-ring mark + wordmark. */
export function AgriCastMark({ dark = true, size = "md" }) {
  const dims = size === "sm" ? "h-8 w-8" : "h-11 w-11";
  const text = size === "sm" ? "text-base" : "text-xl";

  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`relative flex ${dims} shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 shadow-md shadow-brand-900/30`}
        aria-hidden="true"
      >
        <Satellite className="absolute h-3 w-3 -translate-x-2.5 -translate-y-2.5 text-accent-300" />
        <Leaf className="h-[55%] w-[55%] text-white" strokeWidth={2.25} />
      </span>
      <span className={`font-display ${text} font-semibold tracking-tight ${dark ? "text-white" : "text-neutral-900"}`}>
        AgriCast <span className={dark ? "text-brand-300" : "text-brand-600"}>AI</span>
      </span>
    </div>
  );
}

export default function AuthHero() {
  const { t } = useTranslation();

  return (
    <div className="relative hidden h-full min-h-screen w-full overflow-hidden lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-10 xl:px-16">
      <AnimatedBackground />

      <div className="relative z-10">
        <AgriCastMark />
      </div>

      <div className="relative z-10 max-w-md">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-brand-100 backdrop-blur-md"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
          {t("app.tagline", "AI-Powered Precision Agriculture")}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.25 }}
          className="font-display text-3xl font-semibold leading-[1.15] tracking-tight text-white xl:text-4xl"
        >
          {t("auth.heroHeadline", "Farm decisions, grounded in data you can see from orbit.")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.35 }}
          className="mt-4 text-sm leading-relaxed text-brand-100/80"
        >
          {t(
            "auth.heroDescription",
            "Make smarter farming decisions using weather intelligence, satellite imagery, AI recommendations, and precision agriculture insights."
          )}
        </motion.p>
      </div>

      {/* Floating telemetry cards - purely decorative, positioned relative to the panel */}
      <div className="pointer-events-none relative z-10 mt-10 hidden h-40 xl:block">
        <FloatingWeatherCard className="left-0 top-0" />
        <FloatingSatelliteCard className="left-40 top-14" />
        <FloatingFarmCard className="left-16 top-32" />
      </div>
    </div>
  );
}
