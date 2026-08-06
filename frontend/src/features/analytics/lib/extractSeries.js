// Analytics trend points always include `temperature: { avg, min, max }`
// (documented shape). Humidity/wind/rainfall may also be present on each
// point using the same { avg, ... } convention - this reads them
// defensively so the chart never crashes if a metric is missing.
export function extractSeries(trends, key) {
  if (!trends?.length) return [];
  return trends.map((point) => {
    const metric = point[key];
    if (metric == null) return null;
    if (typeof metric === "number") return metric;
    if (typeof metric === "object" && "avg" in metric) return metric.avg;
    return null;
  });
}

export function trendLabels(trends) {
  if (!trends?.length) return [];
  return trends.map((point) =>
    new Date(point.period).toLocaleDateString([], { month: "short", day: "numeric" })
  );
}

export function hasMetric(trends, key) {
  return trends?.some((point) => point[key] != null);
}
