import { describeWeatherCode } from "../../../lib/weatherCodes";

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-neutral-50 px-3 py-2 text-center">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-neutral-900">{value}</div>
    </div>
  );
}

export default function CurrentWeatherCard({ current }) {
  const { label, icon } = describeWeatherCode(current.weatherCode);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-5xl" aria-hidden="true">
            {icon}
          </span>
          <div>
            <div className="text-3xl font-semibold text-neutral-900">
              {current.temperature}
              {current.units?.temperature || "°C"}
            </div>
            <div className="text-sm text-neutral-500">{label}</div>
          </div>
        </div>
        {current.cache && (
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            {current.cache.hit ? "Cached" : "Live"}
          </span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Humidity" value={`${current.humidity}${current.units?.humidity || "%"}`} />
        <Stat
          label="Wind"
          value={`${current.windSpeed} ${current.units?.windSpeed || "km/h"}`}
        />
        <Stat
          label="Pressure"
          value={`${current.pressure} ${current.units?.pressure || "hPa"}`}
        />
        <Stat label="UV Index" value={current.uvIndex} />
      </div>
    </div>
  );
}
