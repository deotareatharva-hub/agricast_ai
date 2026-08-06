import { useOutletContext } from "react-router-dom";
import { useDashboardAnalytics } from "../hooks/useDashboardAnalytics";
import { useWeatherAnalytics } from "../hooks/useWeatherAnalytics";
import { useRecommendationAnalytics } from "../hooks/useRecommendationAnalytics";
import StatCard from "../components/StatCard";
import { extractSeries, trendLabels, hasMetric } from "../lib/extractSeries";
import Loading from "../../../components/common/Loading";
import ErrorState from "../../../components/common/ErrorState";
import TrendLineChart from "../../../components/common/TrendLineChart";

function Section({ title, children }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function AnalyticsPage() {
  const { farm } = useOutletContext();

  const dashboardQuery = useDashboardAnalytics(farm.id);
  const weatherQuery = useWeatherAnalytics(farm.id);
  const recQuery = useRecommendationAnalytics(farm.id);

  if (dashboardQuery.isLoading) return <Loading label="Loading analytics…" />;

  if (dashboardQuery.isError) {
    return (
      <ErrorState
        message={dashboardQuery.error?.message || "Could not load analytics for this farm."}
        onRetry={() => dashboardQuery.refetch()}
      />
    );
  }

  const dashboard = dashboardQuery.data;
  const weatherSummary = dashboard?.weather?.summary;
  const weatherTrends = weatherQuery.data?.trends || dashboard?.weather?.trends || [];
  const recTrends = recQuery.data?.trend || [];

  return (
    <div className="space-y-8">
      <Section title="Overview">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Days active" value={dashboard?.farm?.daysActive} />
          <StatCard label="Reports generated" value={dashboard?.farm?.reportCount} />
          <StatCard
            label="Avg temperature"
            value={weatherSummary ? `${weatherSummary.temperature?.avg}°C` : "—"}
            sub={
              weatherSummary
                ? `${weatherSummary.temperature?.min}° – ${weatherSummary.temperature?.max}°`
                : undefined
            }
          />
          <StatCard label="Records analyzed" value={weatherSummary?.recordCount} />
        </div>
      </Section>

      <Section title="Weather trends">
        {weatherTrends.length ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <TrendLineChart
              labels={trendLabels(weatherTrends)}
              series={[
                { label: "Temperature (°C)", data: extractSeries(weatherTrends, "temperature") },
                ...(hasMetric(weatherTrends, "humidity")
                  ? [{ label: "Humidity (%)", data: extractSeries(weatherTrends, "humidity") }]
                  : []),
                ...(hasMetric(weatherTrends, "rainfall")
                  ? [{ label: "Rainfall (mm)", data: extractSeries(weatherTrends, "rainfall") }]
                  : []),
                ...(hasMetric(weatherTrends, "wind")
                  ? [{ label: "Wind (km/h)", data: extractSeries(weatherTrends, "wind") }]
                  : []),
              ]}
            />
          </div>
        ) : (
          <p className="text-sm text-neutral-500">Not enough data yet to chart a trend.</p>
        )}
      </Section>

      <Section title="Recommendation confidence">
        {recQuery.isLoading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : recTrends.length ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <TrendLineChart
              labels={trendLabels(recTrends)}
              series={[{ label: "Confidence (%)", data: extractSeries(recTrends, "confidence") }]}
              unit="%"
            />
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            No AI recommendations yet to build a confidence trend.
          </p>
        )}
      </Section>

      <Section title="Recent AI recommendations">
        {dashboard?.recentRecommendations?.length ? (
          <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
            {dashboard.recentRecommendations.map((rec) => (
              <div key={rec.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <p className="text-sm text-neutral-800">{rec.summary}</p>
                <span className="shrink-0 text-xs text-neutral-500">{rec.confidence}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">No recommendations yet.</p>
        )}
      </Section>
    </div>
  );
}
