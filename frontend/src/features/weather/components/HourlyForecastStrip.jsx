import { describeWeatherCode } from "../../../lib/weatherCodes";

export default function HourlyForecastStrip({ hourly }) {
  if (!hourly?.length) {
    return <p className="text-sm text-neutral-500">No hourly data available.</p>;
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {hourly.map((hour) => {
        const { icon } = describeWeatherCode(hour.weatherCode);
        const time = new Date(hour.time);
        return (
          <div
            key={hour.time}
            className="flex min-w-[76px] shrink-0 flex-col items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-3 text-center"
          >
            <span className="text-xs font-medium text-neutral-500">
              {time.toLocaleTimeString([], { hour: "numeric" })}
            </span>
            <span className="text-2xl" aria-hidden="true">
              {icon}
            </span>
            <span className="text-sm font-semibold text-neutral-900">{hour.temperature}°</span>
            <span className="text-xs text-sky-alert-500">{hour.rainProbability}%</span>
          </div>
        );
      })}
    </div>
  );
}
