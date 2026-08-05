import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Droplets, Wind, Sun } from "lucide-react";
import { getWeatherIcon, getWeatherLabel } from "../utils/weatherCodeMap";
import {
  formatDayLabel,
  formatFullDate,
  formatTemperature,
  formatPercent,
  formatWindSpeed,
  formatUvIndex,
  toIntlLocale,
} from "../utils/weatherFormatters";
import EmptyWeatherState from "./EmptyWeatherState";

// Renders each day's low->high as a proportional bar segment against the
// week's overall min/max, the way most weather apps do, so a farmer can
// scan relative temperature swings at a glance instead of just reading
// six pairs of numbers.
function TempRangeBar({ min, max, weekMin, weekMax }) {
  const span = Math.max(weekMax - weekMin, 1);
  const leftPct = ((min - weekMin) / span) * 100;
  const widthPct = Math.max(((max - min) / span) * 100, 6);

  return (
    <div className="relative h-1.5 w-24 rounded-full bg-neutral-100 sm:w-32">
      <div
        className="absolute h-1.5 rounded-full bg-gradient-to-r from-sky-alert-500 to-soil-500"
        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
      />
    </div>
  );
}

export default function SevenDayForecast({ daily = [] }) {
  const { t, i18n } = useTranslation();
  const locale = toIntlLocale(i18n.language);

  if (daily.length === 0) {
    return (
      <section aria-labelledby="seven-day-heading">
        <h2 id="seven-day-heading" className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          {t("weather.daily.title")}
        </h2>
        <div className="mt-3">
          <EmptyWeatherState title={t("weather.daily.empty")} />
        </div>
      </section>
    );
  }

  // Backend daily DTO uses temperatureMin/temperatureMax (not tempMin/tempMax)
  const weekMin = Math.min(...daily.map((d) => d.temperatureMin).filter((v) => v != null));
  const weekMax = Math.max(...daily.map((d) => d.temperatureMax).filter((v) => v != null));

  return (
    <section aria-labelledby="seven-day-heading">
      <h2 id="seven-day-heading" className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {t("weather.daily.title")}
      </h2>
      <div className="mt-3 divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {daily.map((day, index) => {
          const Icon = getWeatherIcon(day.weatherCode, true);
          return (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
              className="grid grid-cols-2 items-center gap-3 px-4 py-3 transition hover:bg-neutral-50 sm:grid-cols-[7rem_1fr_auto_auto] sm:gap-4"
            >
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  {index === 0 ? t("weather.daily.today") : formatDayLabel(day.date, locale)}
                </p>
                <p className="text-xs text-neutral-400">{formatFullDate(day.date, locale)}</p>
              </div>

              <div className="flex items-center gap-2 text-neutral-600">
                <Icon className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                <span className="hidden truncate text-sm sm:inline">{getWeatherLabel(day.weatherCode, t)}</span>
              </div>

              <div className="hidden items-center gap-3 text-xs text-neutral-400 sm:flex">
                {/* Backend uses rainProbabilityMax (not precipitationProbabilityMax) */}
                {day.rainProbabilityMax != null && (
                  <span className="flex items-center gap-1">
                    <Droplets className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatPercent(day.rainProbabilityMax)}
                  </span>
                )}
                {day.windSpeedMax != null && (
                  <span className="flex items-center gap-1">
                    <Wind className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatWindSpeed(day.windSpeedMax)}
                  </span>
                )}
                {day.uvIndexMax != null && (
                  <span className="flex items-center gap-1">
                    <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatUvIndex(day.uvIndexMax)}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-3">
                <span className="w-9 text-right text-sm text-neutral-400">{formatTemperature(day.temperatureMin, { withUnit: false })}</span>
                <TempRangeBar min={day.temperatureMin} max={day.temperatureMax} weekMin={weekMin} weekMax={weekMax} />
                <span className="w-9 text-right text-sm font-semibold text-neutral-900">
                  {formatTemperature(day.temperatureMax, { withUnit: false })}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
