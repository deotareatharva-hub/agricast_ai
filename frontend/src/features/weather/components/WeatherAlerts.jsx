import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { formatDateTime, toIntlLocale } from "../utils/weatherFormatters";

// Optional - only renders when the backend includes an `alerts` array on
// the current-weather response (documented as optional in
// WeatherIntegrationChecklist.md, since not every Open-Meteo-backed setup
// has a severe-weather feed wired up yet). Renders nothing rather than an
// empty state when there's simply no active alert - an empty alerts
// section would read as "something's missing" on a page that's otherwise
// fine.
const SEVERITY_CLASSES = {
  severe: "border-danger-500/30 bg-red-50 text-danger-500",
  moderate: "border-warn-500/30 bg-amber-50 text-soil-600",
  minor: "border-sky-alert-500/30 bg-blue-50 text-sky-alert-500",
};

export default function WeatherAlerts({ alerts = [] }) {
  const { t, i18n } = useTranslation();
  const locale = toIntlLocale(i18n.language);

  if (!alerts || alerts.length === 0) return null;

  return (
    <section aria-labelledby="weather-alerts-heading" className="space-y-2">
      <h2 id="weather-alerts-heading" className="sr-only">
        {t("weather.alerts.title")}
      </h2>
      <AnimatePresence initial={false}>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id || alert.title}
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
              SEVERITY_CLASSES[alert.severity] || SEVERITY_CLASSES.minor
            }`}
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">{alert.title}</p>
              {alert.description && <p className="mt-0.5 text-sm opacity-90">{alert.description}</p>}
              {alert.endTime && (
                <p className="mt-1 text-xs opacity-70">
                  {t("weather.alerts.until", { time: formatDateTime(alert.endTime, locale) })}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </section>
  );
}
