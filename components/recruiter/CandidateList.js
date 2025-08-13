// components/recruiter/CandidateList.js
import { useMemo, useState } from "react";

function CandidateCard({ c, isEnterprise, onView, onMessage }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="font-medium">{c.name}</div>
      <div className="text-sm text-slate-500">{c.role} • {c.location}</div>
      <div className="mt-2 text-sm">
        Match Score:{" "}
        {isEnterprise ? (
          <span className="font-semibold">{c.match}%</span>
        ) : (
          <span className="text-slate-500">🔒 Upgrade for AI Match %</span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button className="rounded bg-black text-white text-sm px-3 py-2" onClick={() => onView?.(c)}>View Profile</button>
        <button className="rounded border text-sm px-3 py-2" onClick={() => onMessage?.(c)}>Message</button>
      </div>
    </div>
  );
}

export default function CandidateList({ candidates = [], isEnterprise, onView, onMessage }) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const loc = location.trim().toLowerCase();
    return candidates.filter((c) => {
      const okQ = !q || `${c.name} ${c.role}`.toLowerCase().includes(q);
      const okL = !loc || (c.location || "").toLowerCase().includes(loc);
      return okQ && okL;
    });
  }, [candidates, query, location]);

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            className="border rounded px-3 py-2 text-sm w-64"
            placeholder="Search by name or role…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <input
            className="border rounded px-3 py-2 text-sm w-56"
            placeholder="Filter by location…"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {filtered.map((c) => (
          <CandidateCard
            key={c.id}
            c={c}
            isEnterprise={isEnterprise}
            onView={onView}
            onMessage={onMessage}
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
