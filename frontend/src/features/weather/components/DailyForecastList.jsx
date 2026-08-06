import { describeWeatherCode } from "../../../lib/weatherCodes";

export default function DailyForecastList({ daily }) {
  if (!daily?.length) {
    return <p className="text-sm text-neutral-500">No forecast data available.</p>;
  }

  return (
    <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
      {daily.map((day) => {
        const { label, icon } = describeWeatherCode(day.weatherCode);
        const date = new Date(day.date);
        return (
          <div key={day.date} className="flex items-center gap-4 px-4 py-3">
            <span className="w-24 shrink-0 text-sm font-medium text-neutral-700">
              {date.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}
            </span>
            <span className="text-2xl" aria-hidden="true">
              {icon}
            </span>
            <span className="hidden flex-1 text-sm text-neutral-500 sm:block">{label}</span>
            <span className="ml-auto flex items-center gap-2 text-sm">
              <span className="font-semibold text-neutral-900">{day.temperatureMax}°</span>
              <span className="text-neutral-400">{day.temperatureMin}°</span>
            </span>
            <span className="w-12 shrink-0 text-right text-xs text-sky-alert-500">
              {day.rainProbabilityMax}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
