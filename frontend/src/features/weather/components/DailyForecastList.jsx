import { motion } from "framer-motion";
import { describeWeatherCode } from "../../../lib/weatherCodes";

export default function DailyForecastList({ daily }) {
  if (!daily?.length) {
    return <p className="text-sm text-neutral-400">No forecast data available.</p>;
  }

  return (
    <div className="divide-y divide-neutral-900/[0.05] overflow-hidden rounded-2xl border border-neutral-900/[0.06] bg-white shadow-[var(--shadow-soft-sm)]">
      {daily.map((day, i) => {
        const { label, icon } = describeWeatherCode(day.weatherCode);
        const date = new Date(day.date);
        return (
          <motion.div
            key={day.date}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4) }}
            className="flex items-center gap-4 px-4 py-3.5 transition hover:bg-neutral-900/[0.02]"
          >
            <span className="w-24 shrink-0 text-sm font-semibold text-neutral-700">
              {date.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}
            </span>
            <span className="text-2xl" aria-hidden="true">
              {icon}
            </span>
            <span className="hidden flex-1 text-sm text-neutral-400 sm:block">{label}</span>
            <span className="ml-auto flex items-center gap-2 text-sm">
              <span className="font-bold text-neutral-900">{day.temperatureMax}°</span>
              <span className="text-neutral-400">{day.temperatureMin}°</span>
            </span>
            <span className="w-12 shrink-0 text-right text-xs font-semibold text-info-500">
              {day.rainProbabilityMax}%
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
