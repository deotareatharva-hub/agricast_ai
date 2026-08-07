import { AlertTriangle, CloudRain } from "lucide-react";

// Backend doesn't ship a dedicated alerts endpoint yet, so alerts here are
// simple, transparent thresholds computed from data we already fetched -
// not a hidden model. Kept intentionally conservative and unchanged.
function buildAlerts({ current, daily }) {
  const alerts = [];

  if (current?.windSpeed >= 40) {
    alerts.push({ level: "warn", text: `High wind speed (${current.windSpeed} km/h)` });
  }
  if (current?.uvIndex >= 8) {
    alerts.push({ level: "warn", text: `Very high UV index (${current.uvIndex})` });
  }
  const heavyRainDay = daily?.find((d) => d.rainProbabilityMax >= 80);
  if (heavyRainDay) {
    alerts.push({
      level: "info",
      text: `Heavy rain likely on ${new Date(heavyRainDay.date).toLocaleDateString([], {
        weekday: "long",
      })} (${heavyRainDay.rainProbabilityMax}% chance)`,
    });
  }

  return alerts;
}

export default function WeatherAlerts({ current, daily }) {
  const alerts = buildAlerts({ current, daily });
  if (!alerts.length) return null;

  return (
    <div className="flex flex-col gap-2">
      {alerts.map((alert, i) => {
        const Icon = alert.level === "warn" ? AlertTriangle : CloudRain;
        return (
          <div
            key={i}
            className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium shadow-[var(--shadow-soft-sm)] ${
              alert.level === "warn"
                ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/15"
                : "bg-info-50 text-info-600 ring-1 ring-inset ring-info-600/10"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {alert.text}
          </div>
        );
      })}
    </div>
  );
}
