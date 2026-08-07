import { motion } from "framer-motion";
import { Droplets, Wind, Gauge, Sun } from "lucide-react";
import { describeWeatherCode } from "../../../lib/weatherCodes";

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl bg-white/10 px-3 py-3 text-center backdrop-blur-sm">
      <Icon className="h-4 w-4 text-white/70" aria-hidden="true" />
      <div className="text-base font-semibold text-white">{value}</div>
      <div className="text-[11px] text-white/60">{label}</div>
    </div>
  );
}

export default function CurrentWeatherCard({ current }) {
  const { label, icon } = describeWeatherCode(current.weatherCode);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-info-600 via-info-500 to-brand-500 p-6 text-white shadow-[var(--shadow-soft-lg)] sm:p-7"
    >
      <div className="bg-noise-overlay absolute inset-0 opacity-30" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-6xl leading-none" aria-hidden="true">
            {icon}
          </span>
          <div>
            <div className="text-4xl font-bold tracking-[-0.02em]">
              {current.temperature}
              {current.units?.temperature || "°C"}
            </div>
            <div className="text-sm text-white/75">{label}</div>
          </div>
        </div>
        {current.cache && (
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-inset ring-white/20">
            {current.cache.hit ? "Cached" : "Live"}
          </span>
        )}
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Droplets} label="Humidity" value={`${current.humidity}${current.units?.humidity || "%"}`} />
        <Stat icon={Wind} label="Wind" value={`${current.windSpeed} ${current.units?.windSpeed || "km/h"}`} />
        <Stat icon={Gauge} label="Pressure" value={`${current.pressure} ${current.units?.pressure || "hPa"}`} />
        <Stat icon={Sun} label="UV Index" value={current.uvIndex} />
      </div>
    </motion.div>
  );
}
