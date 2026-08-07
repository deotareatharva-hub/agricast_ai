import { motion } from "framer-motion";
import { describeWeatherCode } from "../../../lib/weatherCodes";

export default function HourlyForecastStrip({ hourly }) {
  if (!hourly?.length) {
    return <p className="text-sm text-neutral-400">No hourly data available.</p>;
  }

  return (
    <div className="scrollbar-thin flex gap-3 overflow-x-auto pb-2">
      {hourly.map((hour, i) => {
        const { icon } = describeWeatherCode(hour.weatherCode);
        const time = new Date(hour.time);
        return (
          <motion.div
            key={hour.time}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.4) }}
            className="flex min-w-[84px] shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-neutral-900/[0.06] bg-white px-3 py-3.5 text-center shadow-[var(--shadow-soft-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft-md)]"
          >
            <span className="text-xs font-medium text-neutral-400">
              {time.toLocaleTimeString([], { hour: "numeric" })}
            </span>
            <span className="text-2xl" aria-hidden="true">
              {icon}
            </span>
            <span className="text-sm font-bold text-neutral-900">{hour.temperature}°</span>
            <span className="text-xs font-medium text-info-500">{hour.rainProbability}%</span>
          </motion.div>
        );
      })}
    </div>
  );
}
