// components/analytics/RecentViewers.js
export default function RecentViewers({ viewers = [], allViewsHref = "#" }) {
  return (
    <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
      <h2 className="text-[#FF7043] mt-0 mb-3 font-semibold">Recent Viewers</h2>
      <ul className="space-y-2">
        {viewers.map((v) => (
          <li key={v.name} className="flex items-center justify-between text-sm">
            <span className="font-semibold text-[#263238]">{v.name}</span>
            <span className="text-[#607D8B]">{v.when}</span>
          </li>
        ))}
      </ul>
      <a
        href={allViewsHref}
        className="inline-block mt-3 text-[#FF7043] font-bold no-underline"
      >
        See all viewers →
      </a>
    </section>
  );
}
