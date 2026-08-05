import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Droplets } from "lucide-react";
import { getWeatherIcon } from "../utils/weatherCodeMap";
import { formatHour, formatTemperature, formatPercent, toIntlLocale } from "../utils/weatherFormatters";
import { getUpcomingHours, getRainRiskLevel, inferIsDay } from "../utils/weatherHelpers";
import EmptyWeatherState from "./EmptyWeatherState";

const RAIN_RISK_CLASSES = {
  none: "text-neutral-300",
  low: "text-sky-alert-500/60",
  moderate: "text-sky-alert-500",
  high: "text-sky-alert-500 font-semibold",
};

export default function HourlyForecast({ hourly = [] }) {
  const { t, i18n } = useTranslation();
  const locale = toIntlLocale(i18n.language);
  const hours = getUpcomingHours(hourly, 24);

  return (
    <section aria-labelledby="hourly-forecast-heading">
      <h2 id="hourly-forecast-heading" className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {t("weather.hourly.title")}
      </h2>

      {hours.length === 0 ? (
        <div className="mt-3">
          <EmptyWeatherState title={t("weather.hourly.empty")} />
        </div>
      ) : (
        <div
          className="mt-3 flex gap-3 overflow-x-auto pb-2"
          role="list"
          aria-label={t("weather.hourly.title")}
        >
          {hours.map((hour, index) => {
            // Backend hourly DTO uses rainProbability (not precipitationProbability)
            // and does not include isDay - infer from the reading's timestamp instead.
            const Icon = getWeatherIcon(hour.weatherCode, inferIsDay(hour.time));
            const riskLevel = getRainRiskLevel(hour.rainProbability);
            return (
              <motion.div
                key={hour.time}
                role="listitem"
                tabIndex={0}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.025, 0.4) }}
                whileHover={{ y: -3 }}
                className="focus-ring flex w-16 shrink-0 flex-col items-center gap-1.5 rounded-xl border border-neutral-200 bg-white py-3"
              >
                <p className="text-xs font-medium text-neutral-500">
                  {index === 0 ? t("weather.hourly.now") : formatHour(hour.time, locale)}
                </p>
                <Icon className="h-6 w-6 text-brand-600" aria-hidden="true" />
                <p className="text-sm font-semibold text-neutral-900">{formatTemperature(hour.temperature)}</p>
                {hour.rainProbability != null && (
                  <p className={`flex items-center gap-0.5 text-[11px] ${RAIN_RISK_CLASSES[riskLevel]}`}>
                    <Droplets className="h-3 w-3" aria-hidden="true" />
                    {formatPercent(hour.rainProbability)}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
