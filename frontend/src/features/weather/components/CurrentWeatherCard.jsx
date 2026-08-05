import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Droplets, Gauge, Wind, Sun, Clock } from "lucide-react";
import {
  formatPercent,
  formatPressure,
  formatWindSpeed,
  formatUvIndex,
  formatTime,
  getCompassDirection,
  toIntlLocale,
} from "../utils/weatherFormatters";
import { getUvBand } from "../utils/weatherColors";

function StatTile({ icon: Icon, label, value, hint, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
    >
      <div className="flex items-center gap-2 text-neutral-400">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-2 text-lg font-semibold text-neutral-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-neutral-400">{hint}</p>}
    </motion.div>
  );
}

// Limited to exactly the fields backend's toCurrentDto returns (humidity,
// pressure, wind + direction, UV) - no feels-like/visibility/precipitation
// fields exist on the backend, so this doesn't invent placeholders.
export default function CurrentWeatherCard({ current }) {
  const { t, i18n } = useTranslation();
  const locale = toIntlLocale(i18n.language);

  if (!current) return null;

  const uvBand = getUvBand(current.uvIndex);

  const tiles = [
    { icon: Droplets, label: t("weather.fields.humidity"), value: formatPercent(current.humidity) },
    { icon: Gauge, label: t("weather.fields.pressure"), value: formatPressure(current.pressure) },
    {
      icon: Wind,
      label: t("weather.fields.wind"),
      value: formatWindSpeed(current.windSpeed),
      hint: current.windDirection != null ? getCompassDirection(current.windDirection) : undefined,
    },
    {
      icon: Sun,
      label: t("weather.fields.uvIndex"),
      value: formatUvIndex(current.uvIndex),
      hint: t(`weather.uv.${uvBand.labelKey}`, { defaultValue: uvBand.fallbackLabel }),
    },
  ];

  return (
    <section aria-labelledby="current-conditions-heading">
      <h2 id="current-conditions-heading" className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {t("weather.currentConditions")}
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((tile, index) => (
          <StatTile key={tile.label} {...tile} index={index} />
        ))}
      </div>
      {current.observedAt && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-neutral-400">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {t("weather.observedAt", { time: formatTime(current.observedAt, locale) })}
        </p>
      )}
    </section>
  );
}
