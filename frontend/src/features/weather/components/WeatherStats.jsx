import { Thermometer, Droplets, CloudRain, Wind } from "lucide-react";
import { useTranslation } from "react-i18next";
import StatCard from "../../../components/ui/StatCard";
import { formatTemperature, formatPercent, formatWindSpeed } from "../utils/weatherFormatters";
import { average, maxOf, minOf } from "../utils/weatherHelpers";

// History is a series of individual per-hour readings (recordedAt,
// temperature, humidity, windSpeed, rainProbability) - NOT daily
// aggregates. Stats are computed client-side from the raw series.
// There is no rainfall-amount field, only rainProbability, so "total
// rainfall" is replaced with "avg. chance of rain".
export default function WeatherStats({ history = [] }) {
  const { t } = useTranslation();

  if (history.length === 0) return null;

  const avgTemp = average(history.map((d) => d.temperature));
  const highTemp = maxOf(history.map((d) => d.temperature));
  const lowTemp = minOf(history.map((d) => d.temperature));
  const avgRainChance = average(history.map((d) => d.rainProbability));
  const avgHumidity = average(history.map((d) => d.humidity));
  const avgWind = average(history.map((d) => d.windSpeed));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={Thermometer}
        label={t("weather.history.avgTemp")}
        value={formatTemperature(avgTemp)}
        hint={t("weather.history.highLowHint", {
          high: formatTemperature(highTemp),
          low: formatTemperature(lowTemp),
        })}
      />
      <StatCard icon={CloudRain} label={t("weather.history.avgRainChance")} value={formatPercent(avgRainChance)} />
      <StatCard icon={Droplets} label={t("weather.history.avgHumidity")} value={formatPercent(avgHumidity)} />
      <StatCard icon={Wind} label={t("weather.history.avgWind")} value={formatWindSpeed(avgWind)} />
    </div>
  );
}
