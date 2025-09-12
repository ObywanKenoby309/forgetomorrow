// components/analytics/ViewsChart.js
import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function ViewsChart({ labels, data }) {
  const lineData = useMemo(() => ({
    labels,
    datasets: [{
      label: "Profile Views",
      data,
      borderColor: "#FF7043",
      backgroundColor: "rgba(255,112,67,0.15)",
      pointBackgroundColor: "#FF7043",
      pointBorderColor: "#FF7043",
      borderWidth: 2,
      tension: 0.35,
      pointRadius: 3,
      fill: true,
    }],
  }), [labels, data]);

  const options = useMemo(() => ({
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 20 } } },
  }), []);

  return (
    <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
      <h2 className="text-[#FF7043] mt-0 mb-3 font-semibold">Views (Last 7 Days)</h2>
      <div className="h-64">
        <Line data={lineData} options={options} />
      </div>
    </section>
  );
}
