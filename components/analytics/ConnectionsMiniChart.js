// components/analytics/ConnectionsMiniChart.js
import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function ConnectionsMiniChart({ labels, data }) {
  const maxVal = Math.max(0, ...(Array.isArray(data) ? data : [0]));
  // Aim to fill the box: at least 3, otherwise +1 above the max value
  const suggestedMax = Math.max(3, maxVal + 1);

  const barData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Connections",
          data,
          backgroundColor: "rgba(38,166,154,0.7)",
          borderRadius: 4,
          // Wider bars so it feels fuller
          categoryPercentage: 0.7,
          barPercentage: 0.8,
        },
      ],
    }),
    [labels, data]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false, // let the container height control it
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
      layout: {
        padding: { top: 4, right: 8, bottom: 4, left: 8 }, // tighter padding
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { padding: 6 },
        },
        y: {
          beginAtZero: true,
          suggestedMax,
          ticks: { stepSize: 1, padding: 6 },
          grid: { drawBorder: false },
        },
      },
    }),
    [suggestedMax]
  );

  return (
    <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
      <h2 className="text-[#FF7043] mt-0 mb-3 font-semibold">Connections (Last 7 Days)</h2>
      {/* Slightly taller than before and fully utilized by the chart */}
      <div className="h-44">
        <Bar data={barData} options={options} />
      </div>
    </section>
  );
}
