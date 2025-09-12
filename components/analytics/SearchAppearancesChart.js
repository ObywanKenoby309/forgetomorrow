// components/analytics/SearchAppearancesChart.js
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

export default function SearchAppearancesChart({ labels, data }) {
  const barData = useMemo(() => ({
    labels,
    datasets: [{
      label: "Search Appearances",
      data,
      backgroundColor: "rgba(38,166,154,0.7)", // teal accent
      borderRadius: 4,
    }],
  }), [labels, data]);

  const options = useMemo(() => ({
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 20 } } },
  }), []);

  return (
    <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
      <h2 className="text-[#FF7043] mt-0 mb-3 font-semibold">Search Appearances (Last 7 Days)</h2>
      <div className="h-64">
        <Bar data={barData} options={options} />
      </div>
    </section>
  );
}
