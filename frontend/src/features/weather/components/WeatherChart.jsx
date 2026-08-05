import { useMemo } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler);

// Metric presets so callers just say metric="temperature" instead of
// repeating color/unit choices at every call site. `history`/`hourly`
// pass raw values in; this only owns how a metric is drawn.
// Note: "rain" shows rainProbability (%), not rainfall amount (mm),
// because the backend history DTO has no rainfall-amount field.
const METRIC_PRESETS = {
  temperature: { color: "#3d8449", type: "line", unit: "°C" },
  humidity: { color: "#2f7ec9", type: "line", unit: "%" },
  pressure: { color: "#96602f", type: "line", unit: "hPa" },
  wind: { color: "#1f4327", type: "bar", unit: "km/h" },
  rain: { color: "#2f7ec9", type: "bar", unit: "%" },
};

// One reusable chart for every trend in the module (temperature, humidity,
// pressure, wind, rain probability) - see WeatherIntegrationChecklist.md
// for how WeatherHistory feeds this. `labels` and `values` must be the
// same length; `secondaryValues` (optional) draws a second line, e.g.
// today's min alongside max.
export default function WeatherChart({ metric = "temperature", labels = [], values = [], secondaryLabel, secondaryValues, title, height = 220 }) {
  const preset = METRIC_PRESETS[metric] ?? METRIC_PRESETS.temperature;
  const ChartComponent = preset.type === "bar" ? Bar : Line;

  const data = useMemo(() => {
    const datasets = [
      {
        label: title || metric,
        data: values,
        borderColor: preset.color,
        backgroundColor: preset.type === "bar" ? `${preset.color}CC` : `${preset.color}33`,
        pointRadius: preset.type === "bar" ? 0 : 2,
        pointHoverRadius: 4,
        borderWidth: 2,
        fill: preset.type === "line",
        tension: 0.35,
        borderRadius: preset.type === "bar" ? 4 : 0,
      },
    ];

    if (secondaryValues) {
      datasets.push({
        label: secondaryLabel || `${metric}-secondary`,
        data: secondaryValues,
        borderColor: "#b8763e",
        backgroundColor: "transparent",
        pointRadius: 2,
        borderWidth: 2,
        borderDash: [4, 4],
        fill: false,
        tension: 0.35,
      });
    }

    return { labels, datasets };
  }, [labels, values, secondaryValues, secondaryLabel, metric, title, preset]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: Boolean(secondaryValues), position: "bottom", labels: { boxWidth: 10, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue}${preset.unit}`,
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 }, maxRotation: 0 } },
        y: {
          grid: { color: "#f1f5f2" },
          ticks: { font: { size: 11 }, callback: (value) => `${value}${preset.unit}` },
        },
      },
    }),
    [preset.unit, secondaryValues]
  );

  const hasData = values.some((v) => v != null);

  return (
    <div style={{ height }}>
      {hasData ? (
        <ChartComponent data={data} options={options} />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-neutral-400">–</div>
      )}
    </div>
  );
}
