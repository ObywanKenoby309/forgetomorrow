// components/recruiter/CandidateList.jsx
import React from "react";

export default function CandidateList({
  candidates = [],
  isEnterprise = false,
  onView,
  onMessage,
  onWhy,
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
        <p className="font-medium text-slate-800 mb-1">No candidates found yet</p>
        <p className="text-xs text-slate-500">
          Adjust your search filters above, or widen your criteria. As your
          automation rules run, new candidates that match your filters will
          appear here.
        </p>
      </div>
    );
  }

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
            className="inline-flex items-center justify-center rounded-full bg-[#FF7043] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#F4511E] max-w-full"
          >
            Message
          </button>
        )}

        {typeof onView === "function" && (
          <button
            type="button"
            onClick={() => onView(candidate)}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 max-w-full"
          >
            View profile
          </button>
        )}

        {typeof onWhy === "function" && (
          <button
            type="button"
            onClick={() => onWhy(candidate)}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 max-w-full"
          >
            WHY this candidate
          </button>
        )}
      </div>
    </div>
  );


function CandidateCard({ candidate, isEnterprise, onView, onMessage, onWhy }) {
  const {
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
    ? tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="w-full max-w-full min-w-0 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-start sm:justify-between">
      {/* Left */}
      <div className="flex-1 min-w-0 max-w-full">
        <div className="flex items-start gap-2 min-w-0">
          <div className="flex-1 min-w-0 max-w-full">
            {/* IMPORTANT: remove truncate on mobile so it WRAPS */}
            <h2 className="text-sm font-semibold text-slate-900 !whitespace-normal break-words sm:truncate">
              {name || "Unnamed candidate"}
            </h2>

            {/* Same idea: wrap on mobile, optionally truncate on sm+ */}
            <p className="mt-0.5 text-xs text-slate-600 !whitespace-normal break-words sm:truncate">
              {displayTitle}
            </p>

            <p className="mt-0.5 text-[11px] text-slate-500 !whitespace-normal break-words">
              {location && <span className="break-words">{location}</span>}
              {location && (workStatus || preferredWorkType) && (
                <span className="mx-1 text-slate-400">•</span>
              )}
              {workStatus && (
                <span className="capitalize break-words">
                  {String(workStatus).replace(/_/g, " ")}
                </span>
              )}
              {preferredWorkType && (
                <>
                  <span className="mx-1 text-slate-400">•</span>
                  <span className="capitalize break-words">
                    {String(preferredWorkType).replace(/_/g, " ")}
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
          <div className="mt-2 flex flex-wrap gap-1 min-w-0 max-w-full">
            {tagList.map((tag) => (
              <span
                key={tag}
                className="inline-flex max-w-full items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 break-words"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right */}
      <div className="w-full max-w-full min-w-0 flex flex-col items-stretch gap-2 sm:w-auto sm:items-end sm:justify-between">
        <div className="flex w-full max-w-full flex-wrap items-center justify-start gap-2 sm:justify-end min-w-0">
          {typeof onMessage === "function" && (
            <button
              type="button"
              onClick={() => onMessage(candidate)}
              className="inline-flex items-center justify-center rounded-full bg-[#FF7043] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#F4511E] max-w-full"
            >
              Message
            </button>
          )}

          {typeof onView === "function" && (
            <button
              type="button"
              onClick={() => onView(candidate)}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 max-w-full"
            >
              View profile
            </button>
          )}

          {typeof onWhy === "function" && (
            <button
              type="button"
              onClick={() => onWhy(candidate)}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 max-w-full"
            >
              WHY this candidate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
