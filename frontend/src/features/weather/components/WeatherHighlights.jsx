import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Sun, CloudRain, Wind, Droplets } from "lucide-react";
import { getUvBand } from "../utils/weatherColors";
import { formatUvIndex, formatPercent, formatWindSpeed } from "../utils/weatherFormatters";

// Sunrise/sunset removed — backend (weatherMapper.js) does not return these fields.
export default function WeatherHighlights({ current, today }) {
  const { t } = useTranslation();

  if (!current && !today) return null;

  const uvBand = getUvBand(current?.uvIndex);

  const cards = [
    current?.uvIndex != null && {
      icon: Sun,
      label: t("weather.fields.uvIndex"),
      value: formatUvIndex(current.uvIndex),
      description: t(`weather.uv.tip.${uvBand.labelKey}`, {
        defaultValue: t(`weather.uv.${uvBand.labelKey}`, { defaultValue: uvBand.fallbackLabel }),
      }),
    },
    today?.rainProbabilityMax != null && {
      icon: CloudRain,
      label: t("weather.highlights.rainChance"),
      value: formatPercent(today.rainProbabilityMax),
      description: t("weather.highlights.rainChanceHint"),
    },
    current?.windSpeed != null && {
      icon: Wind,
      label: t("weather.fields.wind"),
      value: formatWindSpeed(current.windSpeed),
      description: t("weather.highlights.windHint"),
    },
    current?.humidity != null && {
      icon: Droplets,
      label: t("weather.fields.humidity"),
      value: formatPercent(current.humidity),
      description: t("weather.highlights.humidityHint"),
    },
  ].filter(Boolean);

  if (cards.length === 0) return null;

  return (
    <section aria-labelledby="weather-highlights-heading">
      <h2 id="weather-highlights-heading" className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {t("weather.highlights.title")}
      </h2>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-2" role="list">
        {cards.map((card, index) => (
          <motion.div
            key={card.label}
            role="listitem"
            tabIndex={0}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="focus-ring w-44 shrink-0 rounded-xl border border-neutral-200 bg-white p-4"
          >
            <div className="flex items-center gap-2 text-brand-600">
              <card.icon className="h-4 w-4" aria-hidden="true" />
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{card.label}</p>
            </div>
            <p className="mt-2 text-xl font-semibold text-neutral-900">{card.value}</p>
            <p className="mt-1 text-xs leading-snug text-neutral-400">{card.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
