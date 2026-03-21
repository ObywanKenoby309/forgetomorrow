// lib/analytics/analyticsUtils.js
//
// Shared utilities for all analytics pages.
// Import from: @/lib/analytics/analyticsUtils

// ─── Query string builder ─────────────────────────────────────────────────────
export function buildQS(state) {
  const p = new URLSearchParams();
  p.set("range",       state.range);
  p.set("jobId",       state.jobId);
  p.set("recruiterId", state.recruiterId);
  p.set("companyId",   state.companyId);
  if (state.range === "custom") {
    if (state.from) p.set("from", state.from);
    if (state.to)   p.set("to",   state.to);
  }
  return p.toString();
}

// ─── Filter state from URL query ─────────────────────────────────────────────
export function getFiltersFromQuery(query) {
  return {
    range:       typeof query.range       === "string" ? query.range       : "30d",
    jobId:       typeof query.jobId       === "string" ? query.jobId       : "all",
    recruiterId: typeof query.recruiterId === "string" ? query.recruiterId : "all",
    companyId:   typeof query.companyId   === "string" ? query.companyId   : "all",
    from:        typeof query.from        === "string" ? query.from        : "",
    to:          typeof query.to          === "string" ? query.to          : "",
  };
}

// ─── Filter change helper — merges patch into current filters ─────────────────
export function applyFilterPatch(current, patch) {
  return { ...current, ...patch };
}