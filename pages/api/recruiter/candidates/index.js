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

function toCsv(arr) {
  if (!Array.isArray(arr)) return "";
  return arr
    .map((s) => String(s || "").trim())
    .filter(Boolean)
    .join(", ");
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

// ------------------------------
// Resume.content parsing helpers
// ------------------------------
function safeJsonParse(maybeJsonString) {
  try {
    if (maybeJsonString == null) return null;
    const s = String(maybeJsonString);
    if (!s.trim()) return null;
    const obj = JSON.parse(s);
    return obj && typeof obj === "object" ? obj : null;
  } catch {
    return null;
  }
}

function normalizeDate(v) {
  const s = String(v || "").trim();
  return s || "";
}

function normalizeExperienceItem(x) {
  if (!x || typeof x !== "object") return null;

  const title = String(x.title || x.role || x.position || "").trim();
  const company = String(x.company || x.employer || x.organization || "").trim();

  const startDate =
    normalizeDate(x.startDate || x.start || x.from || x.start_at || x.startAt);
  const endDate =
    normalizeDate(x.endDate || x.end || x.to || x.end_at || x.endAt);

  const description = String(
    x.description || x.summary || x.details || x.notes || ""
  ).trim();

  // Keep only meaningful rows
  if (!title && !company && !description) return null;

  return {
    title,
    company,
    startDate,
    endDate,
    description,
  };
}

// Try multiple likely shapes since Resume.content is a freeform string in DB
function extractExperiencesFromResumeContent(resumeContentString) {
  const parsed = safeJsonParse(resumeContentString);
  if (!parsed) return [];

  // Common shapes we’ve used in ForgeTomorrow:
// 1) { experiences: [...] }
// 2) { payload: { experiences: [...] } }
// 3) { workHistory: [...] } / { experience: [...] }
  const candidates = []
    .concat(Array.isArray(parsed.experiences) ? [parsed.experiences] : [])
    .concat(parsed.payload && Array.isArray(parsed.payload.experiences) ? [parsed.payload.experiences] : [])
    .concat(Array.isArray(parsed.workHistory) ? [parsed.workHistory] : [])
    .concat(Array.isArray(parsed.experience) ? [parsed.experience] : [])
    .concat(parsed.profile && Array.isArray(parsed.profile.workHistory) ? [parsed.profile.workHistory] : []);

  const first = candidates.find((arr) => Array.isArray(arr) && arr.length) || [];
  const normalized = first
    .map(normalizeExperienceItem)
    .filter(Boolean)
    .slice(0, 8);

  return normalized;
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

    // ✅ Pull each candidate's PRIMARY resume so we can show Experience (profile stays clean)
    const resumes = candidateUserIds.length
      ? await prisma.resume.findMany({
          where: {
            userId: { in: candidateUserIds },
            isPrimary: true,
          },
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            userId: true,
            content: true,
            updatedAt: true,
          },
        })
      : [];

    // Map: userId -> latest primary resume row
    const primaryResumeByUserId = new Map();
    for (const r of resumes) {
      if (!primaryResumeByUserId.has(r.userId)) {
        primaryResumeByUserId.set(r.userId, r);
      }
    }

    const candidates = users.map((u) => {
      const meta = metaByCandidateId.get(u.id) || null;

      const tagsArr = meta?.tags ? toStringArray(meta.tags) : [];
      const notesText = typeof meta?.notes === "string" ? meta.notes : "";

      const primaryResume = primaryResumeByUserId.get(u.id) || null;
      const experience = primaryResume?.content
        ? extractExperiencesFromResumeContent(primaryResume.content)
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
        skills: toCsv(u.skillsJson),
        languages: toCsv(u.languagesJson),
        match: null,

        // ✅ Experience pulled from primary resume (if available)
        experience, // array of { title, company, startDate, endDate, description }
        primaryResumeId: primaryResume?.id || null,
        primaryResumeUpdatedAt: primaryResume?.updatedAt || null,

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
