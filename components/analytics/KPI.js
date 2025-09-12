// components/analytics/KPI.js
export default function KPI({ label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 min-h-[70px] grid gap-1">
      <div className="text-xs text-[#607D8B] font-semibold">{label}</div>
      <div className="text-[22px] font-extrabold text-[#263238]">{value}</div>
    </div>
  );
}
