// lib/analytics/instrumentation.js

const KEY = "ft_events";

/**
 * Append an event locally (pre-SQL). Later we’ll POST to an API.
 */
export function logEvent(evt) {
  if (typeof window === "undefined") return;
  try {
    window.__FT_EVENTS = window.__FT_EVENTS || [];
    window.__FT_EVENTS.push(evt);

    const arr = JSON.parse(localStorage.getItem(KEY) || "[]");
    arr.push(evt);
    // Keep dev storage bounded
    if (arr.length > 5000) arr.splice(0, arr.length - 5000);
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch (_) {}
}

/**
 * Specialized helper for WHY views.
 * We store a compact snapshot for audit (AEDT/EU readiness).
 */
export function logWhyOpened({
  orgId = null,
  jobId = null,
  candidateId,
  score,
  mode,          // "lite" | "full"
  role = "recruiter",
  explain,       // full explain object; we’ll store a trimmed snapshot
}) {
  const ts = new Date().toISOString();
  const snapshot = {
    score,
    mode,
    reasons: (explain?.reasons || []).slice(0, mode === "full" ? 8 : 2).map((r) => ({
      requirement: r.requirement,
      evidence: (r.evidence || []).slice(0, mode === "full" ? 4 : 1).map((e) => ({
        text: e.text,
        source: e.source || null,
      })),
    })),
    filters: explain?.filters_triggered || [],
  };

  logEvent({
    type: "why_opened",
    ts,
    orgId,
    jobId,
    candidateId,
    role,
    snapshot,
  });
}

/** Helper for debugging locally */
export function getLocalEvents() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
