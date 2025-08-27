// components/recruiter/CandidateList.js
import { useMemo, useState } from "react";

function CandidateCard({ c, isEnterprise, onView, onMessage, onWhy }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="font-medium">{c.name}</div>
      <div className="text-sm text-slate-500">
        {c.role} • {c.location}
      </div>

      <div className="mt-2 text-sm">
        Match Score:{" "}
        {isEnterprise ? (
          <span className="font-semibold">{c.match}%</span>
        ) : (
          <span className="text-slate-500">🔒 Upgrade for AI Match %</span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        {/* Primary: brand orange */}
        <button
          type="button"
          className="rounded px-3 py-2 text-sm font-medium text-white bg-[#FF7043] hover:bg-[#F4511E] transition-colors"
          onClick={() => onView?.(c)}
        >
          View Profile
        </button>

        {/* Secondary: subtle outline */}
        <button
          type="button"
          className="rounded border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm px-3 py-2 transition-colors"
          onClick={() => onMessage?.(c)}
        >
          Message
        </button>

        {/* WHY (tertiary) — only renders if parent passed onWhy */}
        {onWhy && (
          <button
            type="button"
            aria-label={`Why ${c.name} matched`}
            className="rounded border border-[#FF7043] text-[#FF7043] hover:bg-[#FFEDE6] text-xs px-2 py-1 font-semibold transition-colors"
            onClick={() => onWhy(c)}
          >
            WHY
          </button>
        )}
      </div>
    </div>
  );
}

export default function CandidateList({
  candidates = [],
  isEnterprise = false,
  onView,
  onMessage,
  onWhy, // ← NEW
  showFilters = true,
  query: externalQuery = "",
  locationFilter: externalLocation = "",
  booleanQuery: externalBoolean = "",
  ...rest
}) {
  // Internal state (only when showFilters === true)
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [boolQ, setBoolQ] = useState("");

  const effectiveQuery = showFilters ? query : externalQuery;
  const effectiveLocation = showFilters ? location : externalLocation;
  const effectiveBoolean = showFilters ? boolQ : externalBoolean;

  const filtered = useMemo(() => {
    const q = (effectiveQuery || "").trim().toLowerCase();
    const loc = (effectiveLocation || "").trim().toLowerCase();
    return candidates.filter((c) => {
      const okQ = !q || `${c.name} ${c.role}`.toLowerCase().includes(q);
      const okL = !loc || (c.location || "").toLowerCase().includes(loc);
      return okQ && okL;
    });
  }, [candidates, effectiveQuery, effectiveLocation, effectiveBoolean]);

  return (
    <>
      {/* OPTIONAL internal filters */}
      {showFilters && (
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            className="border rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
            placeholder="Search by name or role…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <input
            className="border rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
            placeholder="Filter by location…"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <input
            className="border rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#FF7043]"
            placeholder="Boolean Search (optional)…"
            value={boolQ}
            onChange={(e) => setBoolQ(e.target.value)}
          />
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {filtered.map((c) => (
          <CandidateCard
            key={c.id}
            c={c}
            isEnterprise={isEnterprise}
            onView={onView}
            onMessage={onMessage}
            onWhy={onWhy}
          />
        ))}

        {filtered.length === 0 && (
          <div className="text-sm text-slate-500 col-span-full border rounded bg-white p-4">
            No candidates match your filters.
          </div>
        )}
      </div>
    </>
  );
}
