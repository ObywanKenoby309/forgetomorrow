// components/recruiter/CandidateList.jsx
import React from "react";

function toSafeArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);

  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return [];
    return s
      .split(",")
      .map((x) => String(x || "").trim())
      .filter(Boolean);
  }

  return [];
}

function formatWorkStatus(value) {
  const v = String(value || "").trim().toLowerCase();
  if (!v) return "";
  if (v === "unemployed") return "Actively looking";
  if (v === "employed") return "Employed";
  if (v === "student") return "Student";
  if (v === "contractor") return "Contractor / Freelance";
  return String(value || "").trim();
}

function formatWorkType(value) {
  const v = String(value || "").trim().toLowerCase();
  if (!v) return "";
  if (v === "remote-only") return "Remote only";
  if (v === "full-time") return "Full-time";
  if (v === "part-time") return "Part-time";
  return String(value || "").trim();
}

function formatRelocate(value) {
  if (typeof value === "boolean") return value ? "Relocate: Yes" : "Relocate: No";

  const v = String(value || "").trim().toLowerCase();
  if (!v) return "";
  if (v === "yes") return "Relocate: Yes";
  if (v === "no") return "Relocate: No";
  if (v === "maybe") return "Relocate: Maybe";
  return `Relocate: ${String(value || "").trim()}`;
}

export default function CandidateList({
  candidates = [],
  isEnterprise = false,
  onView,
  onMessage,
  onWhy,
  onViewResume,
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
          onViewResume={onViewResume}
          onToggleCompare={onToggleCompare}
          compareSelected={
            Array.isArray(compareSelectedIds) ? compareSelectedIds.includes(c.id) : false
          }
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
  onViewResume,
  onToggleCompare,
  compareSelected = false,
}) {
  const {
    name,
    title,
    role,
    currentTitle,
    match,
    resumeId,
    location,
    preferredLocations,
    preferredWorkType,
    workStatus,
    willingToRelocate,
  } = candidate || {};

  const displayTitle = role || title || currentTitle || "Candidate";
  const matchLabel = typeof match === "number" ? `${Math.round(match)}%` : null;
  const hasResume = Boolean(resumeId);

  const preferredLocationList = toSafeArray(preferredLocations);
  const displayLocation =
    preferredLocationList.length > 0
      ? preferredLocationList.join(" • ")
      : location || "";

  const metaChips = [
    displayLocation,
    formatWorkType(preferredWorkType),
    formatWorkStatus(workStatus),
    formatRelocate(willingToRelocate),
  ].filter(Boolean);

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

      {/* NEW: location + profile preference chips */}
      {metaChips.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {metaChips.map((chip, idx) => (
            <span
              key={`${chip}-${idx}`}
              className="inline-flex max-w-full items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600"
              title={chip}
            >
              <span className="truncate">{chip}</span>
            </span>
          ))}
        </div>
      )}

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

        {typeof onViewResume === "function" && (
          <button
            type="button"
            onClick={() => onViewResume(candidate)}
            disabled={!hasResume}
            className={`inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold hover:bg-slate-50 ${
              hasResume ? "text-slate-700" : "text-slate-400 cursor-not-allowed opacity-70"
            }`}
            title={hasResume ? "View resume" : "No resume on file"}
          >
            View resume
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

        {matchLabel && (
          <span className="ml-auto inline-flex items-center gap-1 text-sm font-bold text-[#FF7043]">
            {matchLabel}
          </span>
        )}
      </div>
    </div>
  );
}