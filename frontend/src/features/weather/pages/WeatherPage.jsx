import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { useCurrentWeather } from "../hooks/useCurrentWeather";
import { useHourlyWeather } from "../hooks/useHourlyWeather";
import { useDailyWeather } from "../hooks/useDailyWeather";
import { useWeatherHistory } from "../hooks/useWeatherHistory";
import CurrentWeatherCard from "../components/CurrentWeatherCard";
import HourlyForecastStrip from "../components/HourlyForecastStrip";
import DailyForecastList from "../components/DailyForecastList";
import WeatherAlerts from "../components/WeatherAlerts";
import WeatherSkeleton from "../components/WeatherSkeleton";
import ErrorState from "../../../components/common/ErrorState";
import TrendLineChart from "../../../components/common/TrendLineChart";
import Card from "../../../components/ui/Card";

function Section({ title, children }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-400">
        {title}
      </h2>
      {children}
    </motion.section>
  );
}

export default function WeatherPage() {
  const { farm } = useOutletContext();

  const currentQuery = useCurrentWeather(farm.id);
  const hourlyQuery = useHourlyWeather(farm.id);
  const dailyQuery = useDailyWeather(farm.id);
  const historyQuery = useWeatherHistory(farm.id);

  const isLoading =
    currentQuery.isLoading || hourlyQuery.isLoading || dailyQuery.isLoading;
  const isError = currentQuery.isError || hourlyQuery.isError || dailyQuery.isError;

  if (isLoading) return <WeatherSkeleton />;

  if (isError) {
    return (
      <ErrorState
        message={
          currentQuery.error?.message ||
          hourlyQuery.error?.message ||
          dailyQuery.error?.message ||
          "Could not load weather data for this farm."
        }
        onRetry={() => {
          currentQuery.refetch();
          hourlyQuery.refetch();
          dailyQuery.refetch();
        }}
      />
    );
  }

  const history = historyQuery.data || [];

  return (
    <div className="space-y-8">
      <WeatherAlerts current={currentQuery.data} daily={dailyQuery.data} />

      <Section title="Current conditions">
        <CurrentWeatherCard current={currentQuery.data} />
      </Section>

      <Section title="Next 24 hours">
        <HourlyForecastStrip hourly={hourlyQuery.data} />
      </Section>

      <Section title="7-day forecast">
        <DailyForecastList daily={dailyQuery.data} />
      </Section>

      <Section title="Recent trend">
        {historyQuery.isLoading ? (
          <p className="text-sm text-neutral-400">Loading history…</p>
        ) : historyQuery.isError || !history.length ? (
          <p className="text-sm text-neutral-400">No recent history available yet.</p>
        ) : (
          <Card>
            <TrendLineChart
              labels={history.map((h) =>
                new Date(h.time || h.date).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })
              )}
              series={[
                { label: "Temperature (°C)", data: history.map((h) => h.temperature) },
              ]}
              unit="°C"
            />
          </Card>
        )}
      </Section>
    </div>
  );
}
