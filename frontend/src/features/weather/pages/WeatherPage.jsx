import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

import { useFarm } from "../../farms/hooks/useFarm";
import { useFarms } from "../../farms/hooks/useFarms";
import { useCurrentWeather } from "../hooks/useCurrentWeather";
import { useHourlyWeather } from "../hooks/useHourlyWeather";
import { useDailyWeather } from "../hooks/useDailyWeather";

import WeatherHeader from "../components/WeatherHeader";
import WeatherHero from "../components/WeatherHero";
import WeatherSummary from "../components/WeatherSummary";
import WeatherAlerts from "../components/WeatherAlerts";
import WeatherHighlights from "../components/WeatherHighlights";
import CurrentWeatherCard from "../components/CurrentWeatherCard";
import HourlyForecast from "../components/HourlyForecast";
import SevenDayForecast from "../components/SevenDayForecast";
import WeatherHistory from "../components/WeatherHistory";
import WeatherSkeleton from "../components/WeatherSkeleton";
import WeatherErrorState from "../components/WeatherErrorState";
import EmptyWeatherState from "../components/EmptyWeatherState";
import WeatherFooter from "../components/WeatherFooter";

import Loading from "../../../components/common/Loading";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import { useState } from "react";

const TABS = [
  { key: "forecast", labelKey: "weather.tabs.forecast" },
  { key: "history", labelKey: "weather.tabs.history" },
];

// Shown at /dashboard/weather (no farmId yet) so a farmer with multiple
// farms picks which one before seeing conditions - same "pick a farm
// first" shape as the rest of the app rather than guessing.
function FarmPicker() {
  const { t } = useTranslation();
  const { data: farms, isLoading, isError, error, refetch } = useFarms();

  if (isLoading) return <Loading label={t("weather.picker.loading")} />;
  if (isError) return <WeatherErrorState message={error?.message} onRetry={refetch} />;

  if (!farms || farms.length === 0) {
    return (
      <EmptyWeatherState
        title={t("weather.picker.noFarms")}
        description={t("weather.picker.noFarmsHint")}
        action={
          <Link
            to="/dashboard/farms/new"
            className="focus-ring inline-flex items-center rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {t("farms.actions.addFarm")}
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {t("weather.picker.title")}
      </h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {farms.map((farm) => (
          <Link key={farm.id} to={`/dashboard/farms/${farm.id}/weather`} className="focus-ring block rounded-xl">
            <Card interactive className="h-full">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900">{farm.farmName}</h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-neutral-500">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {[farm.village, farm.district].filter(Boolean).join(", ")}
                  </p>
                </div>
                <Badge>{farm.crop}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function WeatherPage() {
  const { farmId } = useParams();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("forecast");

  const { data: farm } = useFarm(farmId);
  const current = useCurrentWeather(farmId);
  const hourly = useHourlyWeather(farmId);
  const daily = useDailyWeather(farmId);

  if (!farmId) {
    return (
      <div className="mx-auto max-w-6xl">
        <WeatherHeader />
        <div className="mt-6">
          <FarmPicker />
        </div>
      </div>
    );
  }

  const isLoading = current.isLoading || daily.isLoading;
  const isError = current.isError || daily.isError;
  const refetchAll = () => {
    current.refetch();
    hourly.refetch();
    daily.refetch();
  };

  const today = daily.data?.[0];

  return (
    <div className="mx-auto max-w-6xl">
      <WeatherHeader
        farm={farm}
        observedAt={current.data?.observedAt}
        onRefresh={refetchAll}
        isRefreshing={current.isFetching || daily.isFetching}
      />

      <div className="mt-6">
        {isLoading && <WeatherSkeleton />}

        {!isLoading && isError && (
          <WeatherErrorState
            message={current.error?.message || daily.error?.message}
            onRetry={refetchAll}
          />
        )}

        {!isLoading && !isError && !current.data && (
          <EmptyWeatherState title={t("weather.empty.title")} description={t("weather.empty.description")} />
        )}

        {!isLoading && !isError && current.data && (
          <div className="space-y-6">
            <div className="flex gap-2 border-b border-neutral-200">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`focus-ring -mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
                    activeTab === tab.key
                      ? "border-brand-600 text-brand-700"
                      : "border-transparent text-neutral-500 hover:text-neutral-700"
                  }`}
                  aria-current={activeTab === tab.key ? "page" : undefined}
                >
                  {t(tab.labelKey)}
                </button>
              ))}
            </div>

            {activeTab === "forecast" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <WeatherAlerts alerts={current.data?.alerts} />

                <WeatherHero
                  current={current.data}
                  todayHigh={today?.tempMax}
                  todayLow={today?.tempMin}
                  farmName={farm?.farmName}
                />

                <WeatherSummary current={current.data} today={today} />

                <WeatherHighlights current={current.data} today={today} />

                <CurrentWeatherCard current={current.data} />

                <HourlyForecast hourly={hourly.data} />

                <SevenDayForecast daily={daily.data} />

                <WeatherFooter />
              </motion.div>
            )}

            {activeTab === "history" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
                <WeatherHistory farmId={farmId} />
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
