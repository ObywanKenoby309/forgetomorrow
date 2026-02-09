// components/recruiter/pools/utils.js
export function fmtUpdatedAt(d) {
  try {
    const dt = new Date(d);
    if (!Number.isFinite(dt.getTime())) return "";
    return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function fmtShortDate(v) {
  try {
    if (!v) return "-";
    const dt = new Date(v);
    if (!Number.isFinite(dt.getTime())) return "-";
    return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "-";
  }
}

export function normalizeReasonsText(s) {
  const raw = String(s || "").trim();
  if (!raw) return [];
  return raw
    .split(/\n+/g)
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .slice(0, 8);
}
