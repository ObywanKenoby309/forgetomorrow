// components/recruiter/CandidateList.jsx
import React from "react";
import CandidateActionsMenu from "./CandidateActionsMenu";

function toSafeArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return [];
    return s.split(",").map((x) => String(x || "").trim()).filter(Boolean);
  }
  return [];
}

function formatWorkStatus(value) {
  const v = String(value || "").trim().toLowerCase();
  if (!v) return null;
  if (v === "unemployed" || v === "actively seeking" || v === "active") return { label: "Actively Seeking", color: "emerald" };
  if (v === "open to opportunities" || v === "open") return { label: "Open to Opportunities", color: "blue" };
  if (v === "not seeking") return { label: "Not Seeking", color: "slate" };
  if (v === "employed") return { label: "Employed", color: "slate" };
  if (v === "student") return { label: "Student", color: "purple" };
  if (v === "contractor") return { label: "Contractor", color: "amber" };
  return { label: String(value || "").trim(), color: "slate" };
}

function formatWorkType(value) {
  const v = String(value || "").trim().toLowerCase();
  if (!v) return "";
  if (v === "remote-only" || v === "remote only" || v === "remote") return "Remote";
  if (v === "full-time") return "Full-time";
  if (v === "part-time") return "Part-time";
  if (v === "hybrid") return "Hybrid";
  if (v === "flexible") return "Flexible";
  if (v === "on-site" || v === "onsite") return "On-site";
  return String(value || "").trim();
}

function formatRelocate(value) {
  if (typeof value === "boolean") return value ? "Open to relocate" : null;
  const v = String(value || "").trim().toLowerCase();
  if (!v || v === "no" || v === "false") return null;
  if (v === "yes" || v === "true") return "Open to relocate";
  if (v === "maybe") return "Possibly relocate";
  return null;
}

function getInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Deterministic color from name
const AVATAR_COLORS = [
  ["#FF7043", "#BF360C"],
  ["#1E88E5", "#0D47A1"],
  ["#43A047", "#1B5E20"],
  ["#8E24AA", "#4A148C"],
  ["#00897B", "#004D40"],
  ["#F4511E", "#BF360C"],
  ["#3949AB", "#1A237E"],
];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const STATUS_STYLES = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  slate: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function CandidateList({
  candidates = [],
  isEnterprise = false,
  onView,
  onMessage,
  onWhy,
  onViewResume,
  onToggleCompare,
  compareSelectedIds = [],
}) {
  const hasCandidates = Array.isArray(candidates) && candidates.length > 0;

  if (!hasCandidates) {
    return (
      <div className="mt-4 w-full max-w-full min-w-0 overflow-x-hidden rounded-xl border border-slate-200 bg-white/80 px-5 py-8 text-sm text-slate-600 shadow-sm">
        <p className="mb-1 font-semibold text-slate-800">No candidates found yet</p>
        <p className="text-xs text-slate-500">
          Adjust your filters above, or widen your criteria. New candidates matching
          your automation rules will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 w-full max-w-full min-w-0 overflow-x-hidden space-y-3">
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
    skills,
  } = candidate || {};

  const displayTitle = role || title || currentTitle || null;
  const matchScore = typeof match === "number" ? Math.round(match) : null;
  const hasResume = Boolean(resumeId);

  const preferredLocationList = toSafeArray(preferredLocations);
  const displayLocation =
    preferredLocationList.length > 0
      ? preferredLocationList.slice(0, 3).join(" • ")
      : location || null;

  const workTypeLabel = formatWorkType(preferredWorkType);
  const statusObj = formatWorkStatus(workStatus);
  const relocateLabel = formatRelocate(willingToRelocate);

  const skillsList = toSafeArray(skills).slice(0, 4);

  const initials = getInitials(name);
  const [avatarFrom, avatarTo] = getAvatarColor(name || "");

  // Match score color
  const matchColor =
    matchScore == null ? null
    : matchScore >= 80 ? "text-emerald-600"
    : matchScore >= 60 ? "text-blue-600"
    : "text-slate-500";

  return (
    <div className="group relative w-full max-w-full min-w-0 rounded-xl border border-slate-200/80 bg-white shadow-sm transition-shadow duration-150 hover:shadow-md" style={{ overflow: "visible", position: "relative", zIndex: 1 }}>
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: `linear-gradient(180deg, ${avatarFrom}, ${avatarTo})` }}
      />

      <div className="min-w-0 max-w-full overflow-hidden pl-4 pr-4 py-3">
        {/* Top row: avatar + name/title + match score */}
        <div className="flex min-w-0 max-w-full items-start gap-3 overflow-hidden">
          {/* Avatar */}
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
            style={{ background: `linear-gradient(135deg, ${avatarFrom}, ${avatarTo})` }}
            aria-hidden="true"
          >
            {initials}
          </div>

          {/* Name + title */}
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex min-w-0 max-w-full items-start justify-between gap-2 overflow-hidden">
              <h2 className="min-w-0 flex-1 truncate text-sm font-bold leading-tight text-slate-900">
                {name || "Unnamed candidate"}
              </h2>

              {matchScore != null && (
                <span className={`flex-shrink-0 text-xs font-bold tabular-nums ${matchColor}`}>
                  {matchScore}%
                </span>
              )}
            </div>

            {displayTitle && (
              <p className="mt-0.5 truncate text-xs leading-tight text-slate-500">
                {displayTitle}
              </p>
            )}
          </div>
        </div>

        {/* Meta chips row */}
        {(displayLocation || workTypeLabel || statusObj || relocateLabel) && (
          <div className="mt-2.5 flex min-w-0 max-w-full flex-wrap items-center gap-1.5 overflow-hidden">
            {displayLocation && (
              <span className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] leading-none text-slate-600">
                <svg className="h-3 w-3 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="block min-w-0 max-w-[180px] truncate sm:max-w-[220px]">
                  {displayLocation}
                </span>
              </span>
            )}

            {workTypeLabel && (
              <span className="inline-flex max-w-full min-w-0 items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] leading-none text-slate-600">
                <span className="truncate">{workTypeLabel}</span>
              </span>
            )}

            {statusObj && (
              <span className={`inline-flex max-w-full min-w-0 items-center rounded-full border px-2.5 py-1 text-[11px] leading-none ${STATUS_STYLES[statusObj.color] || STATUS_STYLES.slate}`}>
                <span className="truncate">{statusObj.label}</span>
              </span>
            )}

            {relocateLabel && (
              <span className="inline-flex max-w-full min-w-0 items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] leading-none text-blue-600">
                <span className="truncate">{relocateLabel}</span>
              </span>
            )}
          </div>
        )}

        {/* Skills preview */}
        {skillsList.length > 0 && (
          <div className="mt-2 flex min-w-0 max-w-full flex-wrap gap-1.5 overflow-hidden">
            {skillsList.map((skill, i) => (
              <span
                key={`${skill}-${i}`}
                className="inline-flex max-w-full min-w-0 items-center rounded border border-slate-200/70 bg-slate-100 px-2 py-0.5 text-[10px] font-medium leading-none text-slate-600"
              >
                <span className="truncate">{skill}</span>
              </span>
            ))}
            {toSafeArray(skills).length > 4 && (
              <span className="inline-flex max-w-full items-center px-1 py-0.5 text-[10px] leading-none text-slate-400">
                +{toSafeArray(skills).length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="mt-3 border-t border-slate-100" />

        {/* Action buttons */}
        <div className="mt-2.5 flex min-w-0 max-w-full flex-wrap items-center gap-1.5 overflow-hidden">
          {typeof onMessage === "function" && (
            <button
              type="button"
              onClick={() => onMessage(candidate)}
              className="inline-flex max-w-full items-center justify-center rounded-full bg-[#FF7043] px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-[#F4511E]"
            >
              Message
            </button>
          )}

          {typeof onView === "function" && (
            <button
              type="button"
              onClick={() => onView(candidate)}
              className="inline-flex max-w-full items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              View profile
            </button>
          )}

          {typeof onViewResume === "function" && (
            <button
              type="button"
              onClick={() => onViewResume(candidate)}
              disabled={!hasResume}
              className={`inline-flex max-w-full items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                hasResume
                  ? "text-slate-700 hover:bg-slate-50"
                  : "cursor-not-allowed text-slate-300"
              }`}
              title={hasResume ? "View resume" : "No resume on file"}
            >
              Resume
            </button>
          )}

          {typeof onWhy === "function" && (
            <button
              type="button"
              onClick={() => onWhy(candidate)}
              className="inline-flex max-w-full items-center justify-center gap-1 rounded-full border border-[#FF7043]/30 bg-[#FFF3EF] px-3 py-1.5 text-[11px] font-semibold text-[#FF7043] transition-colors hover:bg-[#FFE8E0]"
            >
              <span className="text-[10px]">✦</span>
              WHY
            </button>
          )}

          {typeof onToggleCompare === "function" && (
            <label className="inline-flex max-w-full cursor-pointer select-none items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50">
              <span className="truncate">Compare</span>
              <input
                type="checkbox"
                checked={Boolean(compareSelected)}
                onChange={() => onToggleCompare(candidate)}
                className="h-3 w-3 flex-shrink-0 accent-[#FF7043]"
              />
            </label>
          )}

          {/* Actions menu — always last, pushed to the right */}
          <div style={{ marginLeft: "auto" }}>
            <CandidateActionsMenu
              candidate={candidate}
              context="candidates"
            />
          </div>
        </div>
      </div>
    </div>
  );
}