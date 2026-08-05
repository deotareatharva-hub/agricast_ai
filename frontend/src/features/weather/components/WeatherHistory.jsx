import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useWeatherHistory } from "../hooks/useWeatherHistory";
import Field from "../../../components/ui/Field";
import Input from "../../../components/ui/Input";
import Card from "../../../components/ui/Card";
import Loading from "../../../components/common/Loading";
import WeatherErrorState from "./WeatherErrorState";
import EmptyWeatherState from "./EmptyWeatherState";
import WeatherStats from "./WeatherStats";
import WeatherChart from "./WeatherChart";
import { getDefaultHistoryRange, clampHistoryRange, toDateInputValue } from "../utils/weatherHelpers";
import { formatChartLabel, toIntlLocale } from "../utils/weatherFormatters";

// History is per-hour individual readings (recordedAt, temperature,
// humidity, windSpeed, rainProbability) - NOT daily aggregates.
// Chart labels use formatChartLabel (day + hour) so adjacent readings
// stay distinguishable on the x-axis.

const TREND_TABS = [
  { key: "temperature", metric: "temperature" },
  { key: "humidity", metric: "humidity" },
  { key: "rain", metric: "rain" },
  { key: "wind", metric: "wind" },
];

export default function WeatherHistory({ farmId }) {
  const { t, i18n } = useTranslation();
  const locale = toIntlLocale(i18n.language);
  const [range, setRange] = useState(getDefaultHistoryRange);
  const [activeTrend, setActiveTrend] = useState("temperature");

  const { data: history, isLoading, isError, error, refetch } = useWeatherHistory(farmId, range);

  const handleRangeChange = (field) => (event) => {
    const next = { ...range, [field]: event.target.value };
    setRange(clampHistoryRange(next.startDate, next.endDate));
  };

  // Each reading has a recordedAt timestamp; use that for chart labels.
  const labels = (history ?? []).map((d) => formatChartLabel(d.recordedAt, locale));

  const trendValues = {
    temperature: (history ?? []).map((d) => d.temperature),
    humidity: (history ?? []).map((d) => d.humidity),
    rain: (history ?? []).map((d) => d.rainProbability),
    wind: (history ?? []).map((d) => d.windSpeed),
  };

  return (
    <section aria-labelledby="weather-history-heading" className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="weather-history-heading" className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {t("weather.history.title")}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">{t("weather.history.subtitle")}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Field label={t("weather.history.startDate")} htmlFor="weather-history-start">
            <Input
              id="weather-history-start"
              type="date"
              value={range.startDate}
              max={range.endDate || toDateInputValue(new Date())}
              onChange={handleRangeChange("startDate")}
            />
          </Field>
          <Field label={t("weather.history.endDate")} htmlFor="weather-history-end">
            <Input
              id="weather-history-end"
              type="date"
              value={range.endDate}
              max={toDateInputValue(new Date())}
              onChange={handleRangeChange("endDate")}
            />
          </Field>
        </div>
      </div>

      {isLoading && <Loading label={t("weather.history.loading")} />}

      {isError && <WeatherErrorState message={error?.message} onRetry={refetch} />}

      {!isLoading && !isError && (!history || history.length === 0) && (
        <EmptyWeatherState title={t("weather.history.empty")} description={t("weather.history.emptyHint")} />
      )}

      {!isLoading && !isError && history && history.length > 0 && (
        <div className="space-y-5">
          <WeatherStats history={history} />

          <Card>
            <div className="flex flex-wrap gap-2 border-b border-neutral-100 pb-3">
              {TREND_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTrend(tab.metric)}
                  className={`focus-ring rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    activeTrend === tab.metric
                      ? "bg-brand-600 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                  aria-pressed={activeTrend === tab.metric}
                >
                  {t(`weather.history.trends.${tab.key}`)}
                </button>
              ))}
            </div>
            <motion.div
              key={activeTrend}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="pt-4"
            >
              <WeatherChart
                metric={activeTrend}
                labels={labels}
                values={trendValues[activeTrend]}
                title={t(`weather.history.trends.${TREND_TABS.find((t2) => t2.metric === activeTrend)?.key}`)}
              />
            </motion.div>
          </Card>
        </div>
      )}
    </section>
  );
}
