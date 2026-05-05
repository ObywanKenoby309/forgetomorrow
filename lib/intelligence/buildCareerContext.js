// lib/intelligence/buildCareerContext.js
//
// ForgeTomorrow Unified Career Intelligence
// Stage 1 — Server utility only. Read-only. No AI calls. No localStorage.
//
// Naming:
//   Proof Map      = person-only baseline intelligence (no JD)
//   Alignment Map  = JD/resume comparison intelligence
//   Why Engine     = recruiter/person reasoning explanation
//   Execution Layer = action plans, projects, negotiation strategy, roadmap, coaching strategy
//
// Usage:
//   const context = await buildCareerContext({ userId, includeHistory: true });

import { prisma } from '@/lib/prisma';

// ─── Safe JSON parser ──────────────────────────────────────────────────────────
function safeJson(value, fallback = null) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value; // already parsed by Prisma
  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

// ─── Safe string ──────────────────────────────────────────────────────────────
function safeStr(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

// ─── Safe array ───────────────────────────────────────────────────────────────
function safeArr(value, fallback = []) {
  if (Array.isArray(value)) return value;
  const parsed = safeJson(value);
  return Array.isArray(parsed) ? parsed : fallback;
}

// ─── Build profile snapshot from User fields ───────────────────────────────────
function buildProfileSnapshot(user) {
  return {
    aboutMe:       safeStr(user.aboutMe),
    skills:        safeArr(user.skillsJson),
    projects:      safeArr(user.projectsJson),
    certifications:safeArr(user.certificationsJson),
    education:     safeArr(user.educationJson),
    languages:     safeArr(user.languagesJson),
    customSections:safeArr(user.customSectionJson),
    workPreferences:safeJson(user.workPreferences, {}),
  };
}

// ─── Normalize resume row ──────────────────────────────────────────────────────
function normalizeResume(resume) {
  if (!resume) return null;
  return {
    id:        resume.id,
    name:      safeStr(resume.name),
    content:   safeStr(resume.content),
    isPrimary: Boolean(resume.isPrimary),
    updatedAt: resume.updatedAt ?? null,
  };
}

// ─── Normalize history rows ───────────────────────────────────────────────────
function normalizeRoadmap(row) {
  return {
    id:          row.id,
    generatedAt: row.generatedAt ?? row.createdAt,
    data:        safeJson(row.data, {}),
    isPro:       Boolean(row.isPro),
  };
}

function normalizeNegotiation(row) {
  return {
    id:        row.id,
    createdAt: row.createdAt,
    input:     safeJson(row.input, {}),
    result:    safeJson(row.result, {}),
  };
}

function normalizeProfileSnapshot(row) {
  return {
    id:        row.id,
    createdAt: row.createdAt,
    headline:  safeStr(row.headline),
    bio:       safeStr(row.bio),
    skills:    safeStr(row.skills),
    resumeId:  row.resumeId ?? null,
  };
}

function normalizeRecruiterExplainRun(row) {
  return {
    id:             row.id,
    createdAt:      row.createdAt,
    jobId:          row.jobId ?? null,
    result:         safeJson(row.result, {}),
    accountKey:     row.accountKey ?? null,
  };
}

// ─── Main export ───────────────────────────────────────────────────────────────
export async function buildCareerContext({ userId, includeHistory = true } = {}) {
  if (!userId || typeof userId !== 'string') {
    return null;
  }

  try {
    // ── Load User ────────────────────────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id:               true,
        name:             true,
        firstName:        true,
        lastName:         true,
        email:            true,
        headline:         true,
        aboutMe:          true,
        location:         true,
        plan:             true,
        role:             true,
        skillsJson:       true,
        projectsJson:     true,
        certificationsJson: true,
        educationJson:    true,
        languagesJson:    true,
        customSectionJson:true,
        workPreferences:  true,
      },
    });

    if (!user) return null;

    // ── Load primary resume (fallback: most recently updated) ─────────────────
    let resume = await prisma.resume.findFirst({
      where:   { userId, isPrimary: true },
      orderBy: { updatedAt: 'desc' },
      select:  { id: true, name: true, content: true, isPrimary: true, updatedAt: true },
    });

    if (!resume) {
      resume = await prisma.resume.findFirst({
        where:   { userId },
        orderBy: { updatedAt: 'desc' },
        select:  { id: true, name: true, content: true, isPrimary: true, updatedAt: true },
      });
    }

    // ── Build profile snapshot ────────────────────────────────────────────────
    const profile = buildProfileSnapshot(user);

    // ── Derive display name ───────────────────────────────────────────────────
    const displayName = safeStr(user.name) ||
      [safeStr(user.firstName), safeStr(user.lastName)].filter(Boolean).join(' ') ||
      '';

    // ── Load history if requested ─────────────────────────────────────────────
    let history = {
      roadmaps:            [],
      negotiations:        [],
      profileSnapshots:    [],
      recruiterExplainRuns:[],
    };

    if (includeHistory) {
      const [roadmaps, negotiations, profileSnapshots, recruiterExplainRuns] =
        await Promise.all([
          prisma.careerRoadmap.findMany({
            where:   { userId },
            orderBy: { createdAt: 'desc' },
            take:    3,
            select:  { id: true, generatedAt: true, createdAt: true, data: true, isPro: true },
          }).catch((e) => { if (process.env.NODE_ENV !== 'production') console.warn('[buildCareerContext] careerRoadmap:', e?.message); return []; }),

          prisma.negotiation.findMany({
            where:   { userId },
            orderBy: { createdAt: 'desc' },
            take:    3,
            select:  { id: true, createdAt: true, input: true, result: true },
          }).catch((e) => { if (process.env.NODE_ENV !== 'production') console.warn('[buildCareerContext] negotiation:', e?.message); return []; }),

          prisma.profileSnapshot.findMany({
            where:   { userId },
            orderBy: { createdAt: 'desc' },
            take:    3,
            select:  { id: true, createdAt: true, headline: true, bio: true, skills: true, resumeId: true },
          }).catch((e) => { if (process.env.NODE_ENV !== 'production') console.warn('[buildCareerContext] profileSnapshot:', e?.message); return []; }),

          prisma.recruiterExplainRun.findMany({
            where:   { candidateUserId: userId },
            orderBy: { createdAt: 'desc' },
            take:    5,
            select:  { id: true, createdAt: true, jobId: true, result: true, accountKey: true },
          }).catch((e) => { if (process.env.NODE_ENV !== 'production') console.warn('[buildCareerContext] recruiterExplainRun:', e?.message); return []; }),
        ]);

      history = {
        roadmaps:            roadmaps.map(normalizeRoadmap),
        negotiations:        negotiations.map(normalizeNegotiation),
        profileSnapshots:    profileSnapshots.map(normalizeProfileSnapshot),
        recruiterExplainRuns:recruiterExplainRuns.map(normalizeRecruiterExplainRun),
      };
    }

    // ── Return normalized context object ──────────────────────────────────────
    return {
      user: {
        id:       user.id,
        name:     displayName,
        email:    safeStr(user.email),
        headline: safeStr(user.headline),
        location: safeStr(user.location),
        plan:     safeStr(user.plan),
        role:     safeStr(user.role),
      },
      resume: normalizeResume(resume),
      profile,
      history,
      maps: {
        // Stage 2 will populate these from evidence engine runs
        proofMap:      null,
        alignmentMaps: [],
      },
    };
  } catch (err) {
    console.error('[buildCareerContext] error:', err?.message || err);
    return null;
  }
}

export default buildCareerContext;