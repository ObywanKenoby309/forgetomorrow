// pages/api/recruiter/candidates/index.js
// List recruiter candidates from Prisma (main DB) — LIVE from User table
// + join recruiter-specific metadata (notes/tags/pipelineStage/skills) from RecruiterCandidate (Option A)
// ✅ Impersonation-aware: resolves effective recruiter via ft_imp cookie (Platform Admin only)

import { PrismaClient, Prisma } from "@prisma/client";
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

function toArrayJson(v) {
  if (Array.isArray(v)) return v.map((x) => String(x || "").trim()).filter(Boolean);
  return [];
}

function dedupeCaseInsensitive(arr) {
  const out = [];
  const seen = new Set();
  for (const raw of Array.isArray(arr) ? arr : []) {
    const t = String(raw || "").trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
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

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

// Attempts to map your Resume.content payload into modal-friendly experience items.
function extractExperienceFromResumeContent(contentStr) {
  const parsed = typeof contentStr === "string" ? safeJsonParse(contentStr) : null;
  if (!parsed || typeof parsed !== "object") return [];

  // ✅ Your resume content is saved as: { template: "...", data: { ... } }
  const root = parsed?.data && typeof parsed.data === "object" ? parsed.data : parsed;

  // ✅ Support your builder shapes:
  const list =
    (Array.isArray(root.workExperiences) && root.workExperiences) ||
    (Array.isArray(root.experiences) && root.experiences) ||
    (Array.isArray(root.experience) && root.experience) ||
    [];

  if (!Array.isArray(list)) return [];

  return list
    .map((exp) => {
      const title = exp?.title || exp?.jobTitle || exp?.role || "";
      const company = exp?.company || "";
      const start = exp?.startDate || exp?.start || "";
      const end = exp?.endDate || exp?.end || "";
      const range = [start, end].filter(Boolean).join(" - ") || exp?.range || "";

      const highlightsRaw =
        exp?.highlights ||
        exp?.bullets ||
        exp?.description ||
        exp?.details ||
        [];

      let highlights = [];
      if (Array.isArray(highlightsRaw)) {
        highlights = highlightsRaw.map((x) => String(x || "").trim()).filter(Boolean);
      } else if (typeof highlightsRaw === "string") {
        const s = highlightsRaw.trim();
        highlights = s
          ? s.split("\n").map((x) => String(x || "").trim()).filter(Boolean)
          : [];
      }

      return {
        title: String(title || "").trim(),
        company: String(company || "").trim(),
        range: String(range || "").trim(),
        highlights,
      };
    })
    .filter((e) => e.title || e.company || e.range || (e.highlights && e.highlights.length));
}

// ✅ Extract skills from resume content (profile first; resume fallback only when profile is empty)
function extractSkillsFromResumeContent(contentStr) {
  const parsed = typeof contentStr === "string" ? safeJsonParse(contentStr) : null;
  if (!parsed || typeof parsed !== "object") return [];

  const root = parsed?.data && typeof parsed.data === "object" ? parsed.data : parsed;

  // Your builder saves skills at data.skills (array of strings)
  const skills = Array.isArray(root.skills) ? root.skills : [];
  return dedupeCaseInsensitive(skills.map((s) => String(s || "").trim()).filter(Boolean));
}

// ✅ Education normalization: we store educationJson as array of objects.
// This returns sanitized objects (never "[object Object]" strings).
function toEducationObjects(v) {
  // already an array of objects
  if (Array.isArray(v)) {
    return v
      .map((x) => {
        if (!x || typeof x !== "object") return null;
        return {
          id: x.id ? String(x.id) : null,
          school: x.school ? String(x.school) : "",
          degree: x.degree ? String(x.degree) : "",
          field: x.field ? String(x.field) : "",
          startYear: x.startYear ? String(x.startYear) : "",
          endYear: x.endYear ? String(x.endYear) : "",
        };
      })
      .filter(Boolean);
  }

  // JSON string support (defensive)
  if (typeof v === "string") {
    const parsed = safeJsonParse(v);
    if (Array.isArray(parsed)) return toEducationObjects(parsed);
  }

  return [];
}

// ✅ Education query parsing
// - UI sometimes sends "AS in Microsoft Engineering" as ONE string
// - We normalize that into multiple terms so education search only matches inside educationJson.
// - We also normalize degree shorthand: "AS" should match "Associate" and "Associate's".
function parseEducationTerms(input) {
  const raw = String(input || "").trim();
  if (!raw) return [];

  // Normalize common "X in Y" single-string pattern into multi-term search
  // Example: "AS in Microsoft Support Engineering" -> ["AS", "Microsoft Support Engineering"]
  let normalized = raw;

  // If no commas were used, but " in " exists, split on " in "
  // Keep it conservative: only split on the first occurrence.
  if (!normalized.includes(",") && /\s+in\s+/i.test(normalized)) {
    const parts = normalized.split(/\s+in\s+/i).map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      normalized = parts.join(", ");
    }
  }

  // Primary split remains comma-based
  const terms = normalized
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Expand shorthand degree synonyms (kept tight and specific to avoid over-broad matches)
  const expanded = [];
  for (const t of terms) {
    const tl = t.toLowerCase();

    // AS / A.S. -> Associate / Associate's
    if (tl === "as" || tl === "a.s." || tl === "a.s" || tl === "assoc" || tl === "associates") {
      expanded.push(t);
      expanded.push("Associate");
      expanded.push("Associate's");
      continue;
    }

    // AA / A.A. -> Associate / Associate's
    if (tl === "aa" || tl === "a.a." || tl === "a.a") {
      expanded.push(t);
      expanded.push("Associate");
      expanded.push("Associate's");
      continue;
    }

    expanded.push(t);
  }

  return dedupeCaseInsensitive(expanded).slice(0, 10);
}

// ✅ Education search helper (Postgres JSON/JSONB array-of-objects)
// AND across terms; within each term, OR across school/degree/field/startYear/endYear
async function findUserIdsByEducationTerms(prisma, terms) {
  const cleaned = (terms || [])
    .map((t) => String(t || "").trim())
    .filter(Boolean)
    .slice(0, 10);

  if (!cleaned.length) return [];

  // ✅ CRITICAL: cast to jsonb so this works whether the column is JSON or JSONB
  const perTermExists = cleaned.map((term) => {
    const like = `%${term}%`;
    return Prisma.sql`
      EXISTS (
        SELECT 1
        FROM jsonb_array_elements("User"."educationJson"::jsonb) AS e
        WHERE
          (e->>'school') ILIKE ${like}
          OR (e->>'degree') ILIKE ${like}
          OR (e->>'field') ILIKE ${like}
          OR (e->>'startYear') ILIKE ${like}
          OR (e->>'endYear') ILIKE ${like}
      )
    `;
  });

  const rows = await prisma.$queryRaw(
    Prisma.sql`
      SELECT "id"
      FROM "User"
      WHERE
        "deletedAt" IS NULL
        AND "educationJson" IS NOT NULL
        AND jsonb_typeof("educationJson"::jsonb) = 'array'
        AND ${Prisma.join(perTermExists, Prisma.sql` AND `)}
    `
  );

  // rows is array of { id: '...' }
  return Array.isArray(rows) ? rows.map((r) => String(r.id)).filter(Boolean) : [];
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
    education = "",
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
  const educationQuery = (education || "").toString().trim();

  // Recruiter discovery is LIVE and only includes:
  // - PUBLIC profiles
  // - RECRUITERS_ONLY profiles
  // Private profiles are excluded instantly.
  //
  // ✅ IMPORTANT FIX:
  // Legacy `isProfilePublic` must never override explicit `profileVisibility: PRIVATE`.
  // We only honor `isProfilePublic` when `profileVisibility` is NULL (legacy accounts).
  const andClauses = [
    { deletedAt: null },
    {
      OR: [
        { profileVisibility: { in: ["PUBLIC", "RECRUITERS_ONLY"] } },
        {
          AND: [
            { isProfilePublic: true },
            { profileVisibility: { not: "PRIVATE" } },
          ],
        },
      ],
    },
  ];

  if (nameRoleQuery) {
    andClauses.push({
      OR: [
        { name: { contains: nameRoleQuery, mode: "insensitive" } },
        { headline: { contains: nameRoleQuery, mode: "insensitive" } },
        { aboutMe: { contains: nameRoleQuery, mode: "insensitive" } },
      ],
    });
  }

  if (locationQuery) {
    andClauses.push({
      location: { contains: locationQuery, mode: "insensitive" },
    });
  }

  if (summaryKeywordsQuery) {
    andClauses.push({
      aboutMe: { contains: summaryKeywordsQuery, mode: "insensitive" },
    });
  }

  if (jobTitleQuery) {
    andClauses.push({
      headline: { contains: jobTitleQuery, mode: "insensitive" },
    });
  }

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
  }

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

  // ✅ FIXED: education keyword filter for array-of-objects JSON/JSONB
  // AND across parsed terms (comma-separated; also supports "X in Y" -> ["X","Y"])
  if (educationQuery) {
    const terms = parseEducationTerms(educationQuery);

    try {
      const matchedUserIds = await findUserIdsByEducationTerms(prisma, terms);

      // No matches -> return empty quickly (avoids full scan + useless joins)
      if (!matchedUserIds.length) {
        return res.status(200).json({ candidates: [] });
      }

      andClauses.push({
        id: { in: matchedUserIds },
      });
    } catch (e) {
      console.error("[recruiter/candidates] education search error:", e);
      // If education search fails, do not silently return wrong data
      return res.status(500).json({ error: "Failed to search candidates by education." });
    }
  }

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
        educationJson: true,
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
            skills: true,
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

    // ✅ Pull resumes for these users:
    // Prefer isPrimary, but if none exists, use the most recently updated resume.
    const resumes = candidateUserIds.length
      ? await prisma.resume.findMany({
          where: { userId: { in: candidateUserIds } },
          select: { userId: true, content: true, updatedAt: true, isPrimary: true },
          orderBy: { updatedAt: "desc" },
        })
      : [];

    const bestResumeByUserId = new Map();
    for (const r of resumes) {
      const existing = bestResumeByUserId.get(r.userId);

      if (!existing) {
        bestResumeByUserId.set(r.userId, r);
        continue;
      }

      if (!existing.isPrimary && r.isPrimary) {
        bestResumeByUserId.set(r.userId, r);
        continue;
      }

      const a = existing?.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
      const b = r?.updatedAt ? new Date(r.updatedAt).getTime() : 0;
      if (b > a) bestResumeByUserId.set(r.userId, r);
    }

    const candidates = users.map((u) => {
      const meta = metaByCandidateId.get(u.id) || null;

      const tagsArr = meta?.tags ? toStringArray(meta.tags) : [];
      const notesText = typeof meta?.notes === "string" ? meta.notes : "";

      const bestResume = bestResumeByUserId.get(u.id) || null;

      // ✅ Experience (leave as-is — already working)
      const experience = bestResume?.content
        ? extractExperienceFromResumeContent(bestResume.content)
        : [];

      // ✅ Skills baseline:
      // 1) profile skills first
      // 2) if profile empty, fallback to resume skills (primary else latest)
      const profileSkillsArr = dedupeCaseInsensitive(toArrayJson(u.skillsJson));
      const resumeSkillsArr = bestResume?.content
        ? extractSkillsFromResumeContent(bestResume.content)
        : [];

      const baselineSkillsArr =
        profileSkillsArr.length > 0 ? profileSkillsArr : resumeSkillsArr;

      // ✅ Recruiter curated skills for team view (add/remove via interview)
      // If recruiter has saved skills, that becomes the effective list.
      const recruiterSkillsArr = meta?.skills ? toStringArray(meta.skills) : [];
      const effectiveSkillsArr =
        recruiterSkillsArr.length > 0 ? recruiterSkillsArr : baselineSkillsArr;

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

        // ✅ what the modal should display/edit
        skills: effectiveSkillsArr,

        // ✅ education returns objects (consistent with profile storage)
        education: toEducationObjects(u.educationJson),

        // optional: transparency/debug
        skillsBaseline: baselineSkillsArr,
        skillsProfile: profileSkillsArr,
        skillsResume: resumeSkillsArr,
        skillsSource:
          recruiterSkillsArr.length > 0
            ? "recruiter"
            : profileSkillsArr.length > 0
            ? "profile"
            : resumeSkillsArr.length > 0
            ? "resume"
            : "none",

        // keep languages as array for the modal
        languages: toArrayJson(u.languagesJson),

        // ✅ Experience from resume (primary if set, otherwise latest)
        experience,

        // recruiter-only metadata
        tags: tagsArr,
        notes: notesText,
        pipelineStage: meta?.pipelineStage || null,
        lastContacted: meta?.lastContacted || null,
        lastSeen: meta?.lastSeen || null,

        match: null,
      };
    });

    return res.status(200).json({ candidates });
  } catch (err) {
    console.error("[recruiter/candidates] query error:", err);
    return res.status(500).json({ error: "Failed to load candidates from the database." });
  }
}
