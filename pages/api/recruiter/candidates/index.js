// pages/api/recruiter/candidates/index.js
// List recruiter candidates from Prisma (main DB) — LIVE from User table
// + join recruiter-specific metadata (notes/tags/pipelineStage) from RecruiterCandidate (Option A)
// ✅ Impersonation-aware: resolves effective recruiter via ft_imp cookie (Platform Admin only)

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import jwt from "jsonwebtoken";

let prisma;
function getPrisma() {
  if (!prisma) prisma = new PrismaClient();
  return prisma;
}

function toStringArray(v) {
  if (Array.isArray(v)) return v.map((x) => String(x || "").trim()).filter(Boolean);
  return [];
}

function readCookie(req, name) {
  try {
    const raw = req.headers?.cookie || "";
    const parts = raw.split(";").map((p) => p.trim());
    for (const p of parts) {
      if (p.startsWith(name + "=")) return decodeURIComponent(p.slice(name.length + 1));
    }
    return "";
  } catch {
    return "";
  }
}

async function resolveEffectiveRecruiter(prisma, req, session) {
  const sessionEmail = String(session?.user?.email || "").trim().toLowerCase();
  if (!sessionEmail) return null;

  const isPlatformAdmin = !!session?.user?.isPlatformAdmin;

  // Default: real logged-in user
  let effectiveUserId = null;

  // If platform admin + impersonation cookie exists, use targetUserId
  if (isPlatformAdmin) {
    const imp = readCookie(req, "ft_imp");
    if (imp) {
      try {
        const decoded = jwt.verify(
          imp,
          process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production"
        );
        if (decoded && typeof decoded === "object" && decoded.targetUserId) {
          effectiveUserId = String(decoded.targetUserId);
        }
      } catch {
        // ignore invalid/expired cookie
      }
    }
  }

  if (effectiveUserId) {
    const u = await prisma.user.findUnique({
      where: { id: effectiveUserId },
      select: { id: true, email: true, accountKey: true },
    });
    return u?.id ? u : null;
  }

  const u = await prisma.user.findUnique({
    where: { email: sessionEmail },
    select: { id: true, email: true, accountKey: true },
  });
  return u?.id ? u : null;
}

// ─────────────────────────────────────────────────────────────
// SAFE helpers for “experience from primary resume” (optional)
// ─────────────────────────────────────────────────────────────
function extractExperienceFromResumeRow(r) {
  // We don’t know your schema yet, so we probe a few common shapes.
  // Returned format matches CandidateProfileModal expectation:
  // [{ title, company, range, highlights: [] }]
  try {
    if (!r || typeof r !== "object") return [];

    const candidates = [
      r.experience,
      r.experiences,
      r.experiencesJson,
      r.workHistory,
      r.workHistoryJson,
      r.resumeJson?.experience,
      r.resumeJson?.experiences,
      r.data?.experience,
      r.data?.experiences,
    ].filter(Boolean);

    const raw = candidates.find((x) => Array.isArray(x)) || null;
    if (!raw) return [];

    return raw
      .filter(Boolean)
      .slice(0, 20)
      .map((e) => ({
        title: e.title || e.role || "",
        company: e.company || e.employer || "",
        range:
          e.range ||
          [e.from || e.startDate || e.start || "", e.to || e.endDate || e.end || ""]
            .filter(Boolean)
            .join(" – "),
        highlights: Array.isArray(e.highlights)
          ? e.highlights.map((h) => String(h || "")).filter(Boolean)
          : [],
      }))
      .filter((x) => x.title || x.company || x.range || (x.highlights || []).length);
  } catch {
    return [];
  }
}

async function fetchPrimaryResumeExperience(prisma, candidateUserIds) {
  // If prisma.resume model doesn’t exist, do nothing safely.
  if (!prisma?.resume || typeof prisma.resume.findMany !== "function") {
    return new Map(); // candidateUserId -> experience[]
  }

  try {
    // We also don’t know your exact field names, so we select a few likely ones.
    const rows = await prisma.resume.findMany({
      where: {
        userId: { in: candidateUserIds },
        OR: [{ isPrimary: true }, { isDefault: true }],
      },
      select: {
        id: true,
        userId: true,
        isPrimary: true,
        isDefault: true,
        experience: true,
        experiences: true,
        experiencesJson: true,
        workHistory: true,
        workHistoryJson: true,
        resumeJson: true,
        data: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    const map = new Map();
    for (const r of rows || []) {
      const uid = String(r.userId || "");
      if (!uid) continue;
      if (map.has(uid)) continue; // keep first (newest due to orderBy)
      map.set(uid, extractExperienceFromResumeRow(r));
    }
    return map;
  } catch (err) {
    console.error("[recruiter/candidates] primary resume lookup failed (soft):", err);
    return new Map();
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const prisma = getPrisma();

  // Require authentication (recruiter, admin, etc.)
  let session;
  try {
    session = await getServerSession(req, res, authOptions);
  } catch (err) {
    console.error("[recruiter/candidates] session error:", err);
  }

  if (!session?.user?.email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // ✅ Impersonation-aware recruiter identity
  const recruiter = await resolveEffectiveRecruiter(prisma, req, session);

  if (!recruiter?.id) {
    return res.status(404).json({ error: "User not found" });
  }
  if (!recruiter.accountKey) {
    return res.status(404).json({ error: "accountKey not found" });
  }

  const recruiterUserId = recruiter.id;
  const recruiterAccountKey = recruiter.accountKey;

  const {
    q = "",
    location = "",
    bool = "",
    summaryKeywords = "",
    jobTitle = "",
    workStatus = "",
    preferredWorkType = "",
    willingToRelocate = "",
    skills = "",
    languages = "",
  } = req.query || {};

  const nameRoleQuery = (q || "").toString().trim();
  const locationQuery = (location || "").toString().trim();
  const booleanQuery = (bool || "").toString().trim();
  const summaryKeywordsQuery = (summaryKeywords || "").toString().trim();
  const jobTitleQuery = (jobTitle || "").toString().trim();
  const workStatusQuery = (workStatus || "").toString().trim();
  const preferredWorkTypeQuery = (preferredWorkType || "").toString().trim();
  const relocateQuery = (willingToRelocate || "").toString().trim();
  const skillsQuery = (skills || "").toString().trim();
  const languagesQuery = (languages || "").toString().trim();

  // Recruiter discovery is LIVE and only includes:
  // - PUBLIC profiles
  // - RECRUITERS_ONLY profiles
  // Private profiles are excluded instantly.
  const andClauses = [
    { deletedAt: null },
    {
      OR: [
        { profileVisibility: { in: ["PUBLIC", "RECRUITERS_ONLY"] } },
        { isProfilePublic: true }, // legacy safety net
      ],
    },
  ];

  // Manual search by name / headline / aboutMe (allowed)
  if (nameRoleQuery) {
    andClauses.push({
      OR: [
        { name: { contains: nameRoleQuery, mode: "insensitive" } },
        { headline: { contains: nameRoleQuery, mode: "insensitive" } },
        { aboutMe: { contains: nameRoleQuery, mode: "insensitive" } },
      ],
    });
  }

  // Location filter (uses user.location)
  if (locationQuery) {
    andClauses.push({
      location: { contains: locationQuery, mode: "insensitive" },
    });
  }

  // Summary keywords -> aboutMe
  if (summaryKeywordsQuery) {
    andClauses.push({
      aboutMe: { contains: summaryKeywordsQuery, mode: "insensitive" },
    });
  }

  // Job title -> headline (best live equivalent)
  if (jobTitleQuery) {
    andClauses.push({
      headline: { contains: jobTitleQuery, mode: "insensitive" },
    });
  }

  // Work status / preferred work type / relocate come from workPreferences Json
  if (workStatusQuery) {
    andClauses.push({
      workPreferences: {
        path: ["workStatus"],
        equals: workStatusQuery,
      },
    });
  }

  if (preferredWorkTypeQuery) {
    andClauses.push({
      workPreferences: {
        path: ["workType"],
        equals: preferredWorkTypeQuery,
      },
    });
  }

  if (relocateQuery) {
    const v = relocateQuery.toLowerCase();
    if (v === "yes") {
      andClauses.push({
        workPreferences: { path: ["willingToRelocate"], equals: true },
      });
    } else if (v === "no") {
      andClauses.push({
        workPreferences: { path: ["willingToRelocate"], equals: false },
      });
    }
    // "maybe" => no filter
  }

  // Skills / Languages (comma-separated; ALL terms must be present)
  if (skillsQuery) {
    const terms = skillsQuery
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const term of terms) {
      andClauses.push({
        skillsJson: { array_contains: [term] },
      });
    }
  }

  if (languagesQuery) {
    const terms = languagesQuery
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const term of terms) {
      andClauses.push({
        languagesJson: { array_contains: [term] },
      });
    }
  }

  // Boolean query placeholder — for now search it in aboutMe
  if (booleanQuery) {
    andClauses.push({
      aboutMe: { contains: booleanQuery, mode: "insensitive" },
    });
  }

  const where = { AND: andClauses };

  try {
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        headline: true,
        aboutMe: true,
        location: true,
        skillsJson: true,
        languagesJson: true,
        createdAt: true,
      },
    });

    const candidateUserIds = users.map((u) => u.id);

    // ✅ Join recruiter-specific metadata scoped to recruiterUserId + accountKey
    const metas = candidateUserIds.length
      ? await prisma.recruiterCandidate.findMany({
          where: {
            recruiterUserId,
            accountKey: recruiterAccountKey,
            candidateUserId: { in: candidateUserIds },
          },
          select: {
            candidateUserId: true,
            tags: true,
            notes: true,
            pipelineStage: true,
            lastContacted: true,
            lastSeen: true,
          },
        })
      : [];

    const metaByCandidateId = new Map();
    for (const m of metas) {
      metaByCandidateId.set(m.candidateUserId, m);
    }

    // ✅ OPTIONAL: pull experience from primary resume (if Resume model exists)
    const experienceByUserId = await fetchPrimaryResumeExperience(prisma, candidateUserIds);

    const candidates = users.map((u) => {
      const meta = metaByCandidateId.get(u.id) || null;

      const tagsArr = meta?.tags ? toStringArray(meta.tags) : [];
      const notesText = typeof meta?.notes === "string" ? meta.notes : "";

      const skillsArr = Array.isArray(u.skillsJson) ? u.skillsJson.map(String).filter(Boolean) : [];
      const languagesArr = Array.isArray(u.languagesJson)
        ? u.languagesJson.map(String).filter(Boolean)
        : [];

      return {
        id: u.id,
        userId: u.id,
        name: u.name || "Unnamed",
        email: u.email || null,

        title: u.headline || "",
        currentTitle: u.headline || "",
        role: u.headline || "",
        summary: u.aboutMe || "",
        location: u.location || "",

        // ✅ arrays for UI (modal expects arrays)
        skills: skillsArr,
        languages: languagesArr,

        // match is handled elsewhere (WHY drawer uses deterministic logic)
        match: null,

        // ✅ Experience should come from PRIMARY RESUME, not profile
        experience: experienceByUserId.get(u.id) || [],

        // ✅ Placeholder fields so UI never breaks; wiring can attach real sources
        activity: [],
        journey: [],

        // recruiter-only metadata
        tags: tagsArr,
        notes: notesText,
        pipelineStage: meta?.pipelineStage || null,
        lastContacted: meta?.lastContacted || null,
        lastSeen: meta?.lastSeen || null,
      };
    });

    return res.status(200).json({ candidates });
  } catch (err) {
    console.error("[recruiter/candidates] query error:", err);
    return res.status(500).json({ error: "Failed to load candidates from the database." });
  }
}
