// lib/ai/strikerContextBuilders.js
// ForgeTomorrow Striker context normalization.
// Updated: detectSurfaceFromPath replaced with full inlay-aware detectSurface from strikerSiteMap.js

import { detectSurface } from '@/lib/ai/strikerSiteMap';

export function safeString(value, max = 500) {
  const s = String(value || "").trim();
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

export function safeArray(value, max = 12) {
  if (Array.isArray(value)) return value.filter(Boolean).slice(0, max);
  if (typeof value === "string") {
    return value
      .split(/[,|\n]/g)
      .map((x) => String(x || "").trim())
      .filter(Boolean)
      .slice(0, max);
  }
  return [];
}

export function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

// ✅ UPDATED: Now passes query object for inlay-aware surface detection.
// detectSurface reads router.query (module, tab, chrome) to resolve the true
// active surface even when the URL doesn't change (Anvil, The Hearth, Client Hub, etc.)
export function detectSurfaceFromPath(pathname = "", asPath = "", query = {}) {
  return detectSurface(pathname, asPath, query);
}

export function normalizeCandidate(candidate = null) {
  const c = safeObject(candidate);
  if (!c) return null;

  return {
    id: safeString(c.id || c.candidateId || c.userId, 120),
    name: safeString(c.name || c.fullName || c.displayName, 160),
    title: safeString(c.title || c.currentTitle || c.role || c.headline, 220),
    location: safeString(c.location || c.city || c.region, 220),
    workStatus: safeString(c.workStatus || c.status, 120),
    match: typeof c.match === "number" ? c.match : typeof c.score === "number" ? c.score : null,
    skills: safeArray(c.skills || c.topSkills || c.skillTags, 16),
    summary: safeString(c.summary || c.about || c.bio, 700),
    profileSlug: safeString(c.slug || c.profileSlug || c.publicSlug, 180),
  };
}

export function normalizeJob(job = null) {
  const j = safeObject(job);
  if (!j) return null;

  return {
    id: safeString(j.id || j.jobId, 120),
    title: safeString(j.title || j.jobTitle, 220),
    company: safeString(j.company || j.companyName, 220),
    location: safeString(j.location, 220),
    workType: safeString(j.workType || j.remoteType || j.employmentType, 160),
    status: safeString(j.status, 120),
    requirements: safeArray(j.requirements || j.mustHaves, 12),
    skills: safeArray(j.skills || j.requiredSkills, 16),
    summary: safeString(j.summary || j.description, 900),
  };
}

export function normalizeResume(resume = null) {
  const r = safeObject(resume);
  if (!r) return null;

  return {
    id: safeString(r.id || r.resumeId, 120),
    title: safeString(r.title || r.name, 220),
    targetRole: safeString(r.targetRole || r.role, 220),
    summary: safeString(r.summary || r.professionalSummary, 900),
    skills: safeArray(r.skills, 20),
    score: typeof r.score === "number" ? r.score : null,
  };
}

export function normalizeSearch(search = null) {
  const s = safeObject(search);
  if (!s) return null;

  return {
    query: safeString(s.query || s.q || s.nameQuery || s.roleQuery, 260),
    location: safeString(s.location || s.locQuery, 220),
    bool: safeString(s.bool || s.boolQuery, 400),
    resultCount: Number.isFinite(Number(s.resultCount)) ? Number(s.resultCount) : null,
  };
}

export function normalizeFilters(filters = null) {
  const f = safeObject(filters);
  if (!f) return null;

  return {
    summaryKeywords: safeString(f.summaryKeywords, 260),
    jobTitle: safeString(f.jobTitle, 260),
    workStatus: safeString(f.workStatus, 160),
    preferredWorkType: safeString(f.preferredWorkType, 160),
    willingToRelocate: safeString(f.willingToRelocate || f.relocate, 80),
    location: safeString(f.location || f.locationFilter, 220),
    skills: safeString(f.skills, 400),
    languages: safeString(f.languages, 300),
    education: safeString(f.education, 300),
  };
}

export function normalizeWhy(why = null) {
  const w = safeObject(why);
  if (!w) return null;

  return {
    score: typeof w.score === "number" ? w.score : null,
    mode: safeString(w.mode, 80),
    summary: safeString(w.summary, 700),
    strongestAlignment: safeString(w.strongestAlignment || w.strongest, 320),
    biggestGap: safeString(w.biggestGap || w.gap, 320),
    reasons: safeArray(w.reasons, 6),
  };
}

export function normalizeTool(tool = null) {
  const t = safeObject(tool);
  if (!t) return null;

  return {
    name: safeString(t.name || t.id || t.tool, 160),
    state: safeString(t.state || t.status, 160),
    step: safeString(t.step || t.currentStep, 160),
    goal: safeString(t.goal || t.outcome, 260),
  };
}

export function buildStrikerContextPacket(rawContext = {}) {
  const raw = safeObject(rawContext) || {};
  const ft =
    safeObject(raw.ftContext) ||
    safeObject(raw.__FT_CONTEXT__) ||
    safeObject(raw.workspaceContext) ||
    {};

  const pathname = safeString(raw.pathname, 260);
  const asPath   = safeString(raw.asPath, 320);
  const query    = safeObject(raw.query) || {};

  // ✅ UPDATED: Pass query to detectSurface for inlay-aware resolution.
  // If the page explicitly passes a surface key, use it. Otherwise detect from path + query.
  const surface  = safeString(raw.surface || ft.surface, 120) || detectSurface(pathname, asPath, query);

  return {
    mode: safeString(raw.mode, 80),
    surface,
    pathname,
    asPath,
    query,
    ts: safeString(raw.ts, 80),

    activeCandidate: normalizeCandidate(
      raw.activeCandidate || raw.candidate || raw.candidateContext || ft.activeCandidate || ft.candidate
    ),
    activeJob: normalizeJob(raw.activeJob || raw.job || raw.jobContext || ft.activeJob || ft.job),
    activeResume: normalizeResume(raw.activeResume || raw.resume || raw.resumeContext || ft.activeResume || ft.resume),
    activeSearch: normalizeSearch(raw.activeSearch || raw.search || raw.searchContext || ft.activeSearch || ft.search),
    activeTargetingFilters: normalizeFilters(
      raw.activeTargetingFilters || raw.targetingFilters || raw.filters || ft.activeTargetingFilters || ft.filters
    ),
    activeWhy: normalizeWhy(raw.activeWhy || raw.why || raw.explainability || ft.activeWhy || ft.why),
    activeTool: normalizeTool(raw.activeTool || raw.tool || raw.anvilTool || ft.activeTool || ft.tool),
    selectedText: safeString(raw.selectedText || ft.selectedText, 1200),
  };
}

export function summarizeContextPacket(packet = {}) {
  const p = safeObject(packet) || {};
  const lines = [];

  if (p.surface) lines.push(`surface=${p.surface}`);
  if (p.activeCandidate?.name) lines.push(`candidate=${p.activeCandidate.name}`);
  if (p.activeCandidate?.title) lines.push(`candidateTitle=${p.activeCandidate.title}`);
  if (p.activeJob?.title) lines.push(`job=${p.activeJob.title}`);
  if (p.activeResume?.title) lines.push(`resume=${p.activeResume.title}`);
  if (p.activeSearch?.query) lines.push(`search=${p.activeSearch.query}`);
  if (p.activeWhy?.score != null) lines.push(`whyScore=${p.activeWhy.score}`);
  if (p.activeTool?.name) lines.push(`tool=${p.activeTool.name}`);
  if (p.query?.module) lines.push(`module=${p.query.module}`);
  if (p.query?.tab) lines.push(`tab=${p.query.tab}`);

  return lines.join(" | ");
}