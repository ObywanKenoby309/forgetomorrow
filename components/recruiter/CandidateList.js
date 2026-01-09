// components/recruiter/CandidateList.jsx
import React from "react";

export default function CandidateList({
  candidates = [],
  isEnterprise = false,
  onView,
  onMessage,
  onWhy,
  // NEW
  onToggleCompare,
  compareSelectedIds = [],
  showFilters,
  showFilterBar,
  filtersVisible,
  query,
  locationFilter,
  booleanQuery,
}) {
  const hasCandidates = Array.isArray(candidates) && candidates.length > 0;

  if (!hasCandidates) {
    return (
      <div className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
        <p className="mb-1 font-medium text-slate-800">No candidates found yet</p>
        <p className="text-xs text-slate-500">
          Adjust your search filters above, or widen your criteria. As your automation
          rules run, new candidates that match your filters will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 w-full max-w-full space-y-3">
      {candidates.map((c) => (
        <CandidateCard
          key={c.id}
          candidate={c}
          isEnterprise={isEnterprise}
          onView={onView}
          onMessage={onMessage}
          onWhy={onWhy}
          onToggleCompare={onToggleCompare}
          compareSelected={Array.isArray(compareSelectedIds)
            ? compareSelectedIds.includes(c.id)
            : false}
        />
      ))}
    </div>
  );
}

function CandidateCard({
  candidate,
  isEnterprise,
  onView,
  onMessage,
  onWhy,
  onToggleCompare,
  compareSelected = false,
}) {
  const { name, title, role, currentTitle, match } = candidate || {};
  const displayTitle = role || title || currentTitle || "Candidate";

  const matchLabel =
    typeof match === "number" ? `${Math.round(match)}%` : null;

  return (
    <div className="w-full max-w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-md">
      {/* Top row: name (left) + title (right) */}
      <div className="flex items-start justify-between gap-3 min-w-0">
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
          {name || "Unnamed candidate"}
        </h2>

        <p className="min-w-0 max-w-[60%] truncate text-right text-xs text-slate-500">
          {displayTitle}
        </p>
      </div>

      {/* Buttons row */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {typeof onMessage === "function" && (
          <button
            type="button"
            onClick={() => onMessage(candidate)}
            className="inline-flex items-center justify-center rounded-full bg-[#FF7043] px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-[#F4511E]"
          >
            Message
          </button>
        )}

        {typeof onView === "function" && (
          <button
            type="button"
            onClick={() => onView(candidate)}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            View profile
          </button>
        )}

        {typeof onWhy === "function" && (
          <button
            type="button"
            onClick={() => onWhy(candidate)}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            WHY this candidate
          </button>
        )}

        {/* Compare (NEW) */}
        {typeof onToggleCompare === "function" && (
          <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer select-none">
            <span>Compare</span>
            <input
              type="checkbox"
              checked={Boolean(compareSelected)}
              onChange={() => onToggleCompare(candidate)}
              className="h-3 w-3 accent-[#FF7043]"
            />
          </label>
        )}

        {/* Match % (right-side vibe like the mock) */}
        {matchLabel && (
          <span className="ml-auto inline-flex items-center gap-1 text-sm font-bold text-[#FF7043]">
            {matchLabel}
          </span>
        )}
      </div>
    </div>
  );
}
