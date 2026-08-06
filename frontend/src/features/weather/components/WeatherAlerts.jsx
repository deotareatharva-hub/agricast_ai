// Backend doesn't ship a dedicated alerts endpoint yet, so alerts here are
// simple, transparent thresholds computed from data we already fetched -
// not a hidden model. Kept intentionally conservative.
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
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={`rounded-lg px-4 py-2.5 text-sm font-medium ${
            alert.level === "warn"
              ? "bg-warn-500/10 text-soil-600"
              : "bg-sky-alert-500/10 text-sky-alert-500"
          }`}
        >
          ⚠️ {alert.text}
        </div>
      ))}
    </div>
  );
}
