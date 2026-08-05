import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Droplets, Wind, Gauge, Sun } from "lucide-react";
import { getWeatherIcon, getWeatherLabel, getWeatherTone } from "../utils/weatherCodeMap";
import { getToneGradient } from "../utils/weatherColors";
import { formatTemperature, formatWindSpeed, formatPressure, formatUvIndex } from "../utils/weatherFormatters";
import { inferIsDay } from "../utils/weatherHelpers";

export default function WeatherHero({ current, todayHigh, todayLow, farmName }) {
  const { t } = useTranslation();

  if (!current) return null;

  const tone = getWeatherTone(current.weatherCode);
  const Icon = getWeatherIcon(current.weatherCode, inferIsDay(current.observedAt));
  const gradient = getToneGradient(tone);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      aria-label={t("weather.hero.ariaLabel", { name: farmName })}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 text-white shadow-lg sm:p-8`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-black/10 blur-3xl"
      />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{farmName}</p>
          <div className="mt-2 flex items-center gap-4">
            <Icon className="h-16 w-16 shrink-0 drop-shadow-sm sm:h-20 sm:w-20" aria-hidden="true" />
            <div>
              <p className="text-5xl font-semibold tracking-tight sm:text-6xl">
                {formatTemperature(current.temperature)}
              </p>
              <p className="mt-1 text-sm font-medium text-white/90">
                {getWeatherLabel(current.weatherCode, t)}
              </p>
            </div>
          </div>
          {(todayHigh != null || todayLow != null) && (
            <p className="mt-3 text-sm text-white/80">
              {t("weather.hero.highLow", {
                high: formatTemperature(todayHigh),
                low: formatTemperature(todayLow),
              })}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl bg-white/10 p-4 backdrop-blur-sm sm:w-56">
          <div className="flex items-center gap-2 text-sm">
            <Droplets className="h-4 w-4 text-white/80" aria-hidden="true" />
            <div>
              <p className="text-white/70">{t("weather.fields.humidity")}</p>
              <p className="font-semibold">{current.humidity != null ? `${Math.round(current.humidity)}%` : "–"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Wind className="h-4 w-4 text-white/80" aria-hidden="true" />
            <div>
              <p className="text-white/70">{t("weather.fields.wind")}</p>
              <p className="font-semibold">{formatWindSpeed(current.windSpeed)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Gauge className="h-4 w-4 text-white/80" aria-hidden="true" />
            <div>
              <p className="text-white/70">{t("weather.fields.pressure")}</p>
              <p className="font-semibold">{formatPressure(current.pressure)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Sun className="h-4 w-4 text-white/80" aria-hidden="true" />
            <div>
              <p className="text-white/70">{t("weather.fields.uvIndex")}</p>
              <p className="font-semibold">{formatUvIndex(current.uvIndex)}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
