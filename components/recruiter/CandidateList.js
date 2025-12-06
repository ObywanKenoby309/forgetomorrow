// components/recruiter/CandidateList.jsx
import React from "react";

export default function CandidateList({
  candidates = [],
  isEnterprise = false,
  onView,
  onMessage,
  onWhy,
  showFilters,      // currently unused but kept for compatibility
  showFilterBar,    // currently unused but kept for compatibility
  filtersVisible,   // currently unused but kept for compatibility
  query,
  locationFilter,
  booleanQuery,
}) {
  const hasCandidates = Array.isArray(candidates) && candidates.length > 0;

  if (!hasCandidates) {
    return (
      <div className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
        <p className="font-medium text-slate-800 mb-1">
          No candidates found yet
        </p>
        <p className="text-xs text-slate-500">
          Adjust your search filters above, or widen your criteria. As your
          automation rules run, new candidates that match your filters will
          appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {candidates.map((c) => (
        <CandidateCard
          key={c.id}
          candidate={c}
          isEnterprise={isEnterprise}
          onView={onView}
          onMessage={onMessage}
          onWhy={onWhy}
        />
      ))}
    </div>
  );
}

function CandidateCard({ candidate, isEnterprise, onView, onMessage, onWhy }) {
  const {
    id,
    name,
    title,
    role,
    currentTitle,
    location,
    match,
    tags,
    workStatus,
    preferredWorkType,
  } = candidate;

  const displayTitle = role || title || currentTitle || "Candidate";
  const matchLabel =
    typeof match === "number" ? `${match.toFixed(0)}% match` : null;

  const tagList = Array.isArray(tags)
    ? tags
    : typeof tags === "string" && tags.trim()
    ? tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-start sm:justify-between">
      {/* Left: main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="truncate text-sm font-semibold text-slate-900">
              {name || "Unnamed candidate"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-600 truncate">
              {displayTitle}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {location && <span>{location}</span>}
              {location && (workStatus || preferredWorkType) && (
                <span className="mx-1 text-slate-400">•</span>
              )}
              {workStatus && (
                <span className="capitalize">
                  {workStatus.replace(/_/g, " ")}
                </span>
              )}
              {preferredWorkType && (
                <>
                  <span className="mx-1 text-slate-400">•</span>
                  <span className="capitalize">
                    {preferredWorkType.replace(/_/g, " ")}
                  </span>
                </>
              )}
            </p>
          </div>

          {matchLabel && (
            <span className="ml-2 inline-flex shrink-0 items-center rounded-full border border-[#FF7043]/40 bg-[#FFEDE6] px-2 py-0.5 text-[11px] font-semibold text-[#D84315]">
              {matchLabel}
            </span>
          )}
        </div>

        {tagList.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tagList.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex flex-col items-stretch gap-2 sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
          {/* Primary CTA: Message */}
          {typeof onMessage === "function" && (
            <button
              type="button"
              onClick={() => onMessage(candidate)}
              className="inline-flex items-center justify-center rounded-full bg-[#FF7043] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#F4511E] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#FF7043]"
            >
              Message
            </button>
          )}

          {/* Secondary: View profile */}
          {typeof onView === "function" && (
            <button
              type="button"
              onClick={() => onView(candidate)}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-300"
            >
              View profile
            </button>
          )}

          {/* WHY button (if provided) */}
          {typeof onWhy === "function" && (
            <button
              type="button"
              onClick={() => onWhy(candidate)}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-200"
            >
              WHY this candidate
            </button>
          )}
        </div>

        <p className="mt-1 text-[10px] text-slate-500 text-right max-w-[220px]">
          New threads start here. Your choice of Recruiter inbox or Signal
          (personal) inbox happens on the next step.
        </p>
      </div>
    </div>
  );
}
