import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { getWeatherLabel } from "../utils/weatherCodeMap";
import { formatTemperature, formatPercent } from "../utils/weatherFormatters";

export default function WeatherSummary({ current, today }) {
  const { t } = useTranslation();

  if (!current) return null;

  const condition = getWeatherLabel(current.weatherCode, t).toLowerCase();
  const rainChance = today?.rainProbabilityMax;

  const summary =
    rainChance != null && rainChance >= 40
      ? t("weather.summary.withRain", {
          condition,
          high: formatTemperature(today?.temperatureMax ?? current.temperature),
          chance: formatPercent(rainChance),
        })
      : t("weather.summary.default", {
          condition,
          high: formatTemperature(today?.temperatureMax ?? current.temperature),
        });

  return (
    <p className="flex items-start gap-2 text-sm text-neutral-600">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
      <span>{summary}</span>
    </p>
  );
}
