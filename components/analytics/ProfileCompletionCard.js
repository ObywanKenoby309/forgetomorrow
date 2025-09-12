// components/analytics/ProfileCompletionCard.js
export default function ProfileCompletionCard({ completionPct = 0, checklist = [] }) {
  return (
    <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
      <h2 className="text-[#FF7043] mt-0 mb-3 font-semibold">Profile Completion</h2>
      <div className="mb-3">
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-2 bg-[#FF7043] rounded-full"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <div className="mt-2 text-sm text-[#607D8B] font-semibold">
          {completionPct}% complete
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {checklist.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span
              className={`inline-flex h-4 w-4 rounded-full border ${
                item.done ? "bg-emerald-500 border-emerald-500" : "bg-transparent border-gray-300"
              }`}
            />
            <span className={item.done ? "text-[#263238]" : "text-gray-500"}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
