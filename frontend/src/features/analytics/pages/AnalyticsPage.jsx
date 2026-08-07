import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { useDashboardAnalytics } from "../hooks/useDashboardAnalytics";
import { useWeatherAnalytics } from "../hooks/useWeatherAnalytics";
import { useRecommendationAnalytics } from "../hooks/useRecommendationAnalytics";
import StatCard from "../components/StatCard";
import { extractSeries, trendLabels, hasMetric } from "../lib/extractSeries";
import Loading from "../../../components/common/Loading";
import ErrorState from "../../../components/common/ErrorState";
import TrendLineChart from "../../../components/common/TrendLineChart";
import Card from "../../../components/ui/Card";

function Section({ title, children }) {
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-400">{title}</h2>
      {children}
    </motion.section>
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
          <Card>
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
          </Card>
        ) : (
          <p className="text-sm text-neutral-400">Not enough data yet to chart a trend.</p>
        )}
      </Section>

      <Section title="Recommendation confidence">
        {recQuery.isLoading ? (
          <p className="text-sm text-neutral-400">Loading…</p>
        ) : recTrends.length ? (
          <Card>
            <TrendLineChart
              labels={trendLabels(recTrends)}
              series={[{ label: "Confidence (%)", data: extractSeries(recTrends, "confidence") }]}
              unit="%"
            />
          </Card>
        ) : (
          <p className="text-sm text-neutral-400">
            No AI recommendations yet to build a confidence trend.
          </p>
        )}
      </Section>

      <Section title="Recent AI recommendations">
        {dashboard?.recentRecommendations?.length ? (
          <div className="divide-y divide-neutral-900/[0.05] overflow-hidden rounded-2xl border border-neutral-900/[0.06] bg-white shadow-[var(--shadow-soft-sm)]">
            {dashboard.recentRecommendations.map((rec) => (
              <div key={rec.id} className="flex items-center justify-between gap-4 px-4 py-3.5 transition hover:bg-neutral-900/[0.02]">
                <p className="text-sm text-neutral-800">{rec.summary}</p>
                <span className="shrink-0 text-xs font-semibold text-neutral-400">{rec.confidence}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-400">No recommendations yet.</p>
        )}
      </Section>
    </div>
  );
}
