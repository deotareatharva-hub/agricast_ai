import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const COLORS = ["#16a34a", "#f59e0b", "#3b82f6", "#f97316"];

// Generic line chart: `labels` on the x-axis, `series` is an array of
// { label, data } lines. Kept deliberately simple - one chart component
// reused by weather, analytics, and anywhere else a trend needs showing.
export default function TrendLineChart({ labels, series, height = 240, unit = "" }) {
  const data = {
    labels,
    datasets: series.map((s, i) => ({
      label: s.label,
      data: s.data,
      borderColor: COLORS[i % COLORS.length],
      backgroundColor: COLORS[i % COLORS.length],
      tension: 0.35,
      pointRadius: 2,
      borderWidth: 2,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: series.length > 1, labels: { boxWidth: 10, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue}${unit}`,
        },
      },
    },
    scales: {
      x: { ticks: { font: { size: 10 }, maxRotation: 0 } },
      y: { ticks: { font: { size: 10 } } },
    },
  };

  return (
    <div style={{ height }}>
      <Line data={data} options={options} />
    </div>
  );
}
