// pages/api/recruiter/candidates/index.js
// List recruiter candidates from Prisma (main DB) — LIVE from User table
// + join recruiter-specific metadata (notes/tags/pipelineStage/skills) from RecruiterCandidate
// + REAL match ranking from Render recruiter candidate engine
// ✅ Impersonation-aware: resolves effective recruiter via ft_imp cookie (Platform Admin only)

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import jwt from "jsonwebtoken";

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

async function resolveEffectiveRecruiter(prismaClient, req, session) {
  const sessionEmail = String(session?.user?.email || "").trim().toLowerCase();
  if (!sessionEmail) return null;

  const isPlatformAdmin = !!session?.user?.isPlatformAdmin;
  let effectiveUserId = null;

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
    const u = await prismaClient.user.findUnique({
      where: { id: effectiveUserId },
      select: { id: true, email: true, accountKey: true },
    });
    return u?.id ? u : null;
  }

  const u = await prismaClient.user.findUnique({
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

function extractExperienceFromResumeContent(contentStr) {
  const parsed = typeof contentStr === "string" ? safeJsonParse(contentStr) : null;
  if (!parsed || typeof parsed !== "object") return [];

  const root = parsed?.data && typeof parsed.data === "object" ? parsed.data : parsed;

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

function extractSkillsFromResumeContent(contentStr) {
  const parsed = typeof contentStr === "string" ? safeJsonParse(contentStr) : null;
  if (!parsed || typeof parsed !== "object") return [];

  const root = parsed?.data && typeof parsed.data === "object" ? parsed.data : parsed;
  const skills = Array.isArray(root.skills) ? root.skills : [];
  return dedupeCaseInsensitive(skills.map((s) => String(s || "").trim()).filter(Boolean));
}

function toEducationObjects(v) {
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

  if (typeof v === "string") {
    const parsed = safeJsonParse(v);
    if (Array.isArray(parsed)) return toEducationObjects(parsed);
  }

  return [];
}

function parseEducationTerms(input) {
  const raw = String(input || "").trim();
  if (!raw) return [];

  let normalized = raw;

  if (!normalized.includes(",") && /\s+in\s+/i.test(normalized)) {
    const parts = normalized.split(/\s+in\s+/i).map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      normalized = parts.join(", ");
    }
  }

  const terms = normalized
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const expanded = [];
  for (const t of terms) {
    const tl = t.toLowerCase();

    if (tl === "as" || tl === "a.s." || tl === "a.s" || tl === "assoc" || tl === "associates") {
      expanded.push(t);
      expanded.push("Associate");
      expanded.push("Associate's");
      continue;
    }

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

async function findUserIdsByEducationTerms(prismaClient, terms) {
  const cleaned = (terms || [])
    .map((t) => String(t || "").trim())
    .filter(Boolean)
    .slice(0, 10);

  if (!cleaned.length) return [];

  const perTermExists = cleaned.map((term) => {
    const like = `%${term}%`;
    return Prisma.sql`
      EXISTS (
        SELECT 1
        FROM jsonb_array_elements("users"."educationJson"::jsonb) AS e
        WHERE
          (e->>'school') ILIKE ${like}
          OR (e->>'degree') ILIKE ${like}
          OR (e->>'field') ILIKE ${like}
          OR (e->>'startYear') ILIKE ${like}
          OR (e->>'endYear') ILIKE ${like}
      )
    `;
  });

  const rows = await prismaClient.$queryRaw(
    Prisma.sql`
      SELECT "id"
      FROM "users"
      WHERE
        "deletedAt" IS NULL
        AND "educationJson" IS NOT NULL
        AND jsonb_typeof("educationJson"::jsonb) = 'array'
        AND ${Prisma.join(perTermExists, Prisma.sql` AND `)}
    `
  );

  return Array.isArray(rows) ? rows.map((r) => String(r.id)).filter(Boolean) : [];
}

function buildRenderPayload(query) {
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
  } = query || {};

  return {
    q: String(q || "").trim(),
    location: String(location || "").trim(),
    bool: String(bool || "").trim(),
    summaryKeywords: String(summaryKeywords || "").trim(),
    jobTitle: String(jobTitle || "").trim(),
    workStatus: String(workStatus || "").trim(),
    preferredWorkType: String(preferredWorkType || "").trim(),
    relocate: String(willingToRelocate || "").trim(),
    skills: String(skills || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    languages: String(languages || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    education: String(education || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    limit: 100,
    offset: 0,
  };
}

async function fetchRenderMatches(payload) {
  const baseUrl = process.env.SEARCH_SERVICE_URL;
  if (!baseUrl) {
    throw new Error("Missing SEARCH_SERVICE_URL");
  }

  const headers = {
    "Content-Type": "application/json",
  };

  if (process.env.SEARCH_SERVICE_API_KEY) {
    headers["x-api-key"] = process.env.SEARCH_SERVICE_API_KEY;
  }

  const res = await fetch(`${baseUrl}/recruiter/candidates/match`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Render recruiter match failed (${res.status}): ${text || "Unknown error"}`);
  }

  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  let session;
  try {
    session = await getServerSession(req, res, authOptions);
  } catch (err) {
    console.error("[recruiter/candidates] session error:", err);
  }

  if (!session?.user?.email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

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

  const nameRoleQuery = String(q || "").trim();
  const locationQuery = String(location || "").trim();
  const booleanQuery = String(bool || "").trim();
  const summaryKeywordsQuery = String(summaryKeywords || "").trim();
  const jobTitleQuery = String(jobTitle || "").trim();
  const workStatusQuery = String(workStatus || "").trim();
  const preferredWorkTypeQuery = String(preferredWorkType || "").trim();
  const relocateQuery = String(willingToRelocate || "").trim();
  const skillsQuery = String(skills || "").trim();
  const languagesQuery = String(languages || "").trim();
  const educationQuery = String(education || "").trim();

  try {
    // ─────────────────────────────────────────────────────────────
    // 1) Get ranked candidate ids + match scores from Render
    // ─────────────────────────────────────────────────────────────
    const renderPayload = buildRenderPayload(req.query);
    const renderResponse = await fetchRenderMatches(renderPayload);

    const renderCandidates = Array.isArray(renderResponse?.candidates)
      ? renderResponse.candidates
      : [];

    if (!renderCandidates.length) {
      return res.status(200).json({ candidates: [] });
    }

    const renderIdOrder = renderCandidates.map((c) => String(c.id));
    const renderById = new Map(
      renderCandidates.map((c) => [String(c.id), c])
    );

    // ─────────────────────────────────────────────────────────────
    // 2) Privacy / visibility filters still enforced locally
    // ─────────────────────────────────────────────────────────────
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
      {
        id: { in: renderIdOrder },
      },
    ];

    if (educationQuery) {
      const terms = parseEducationTerms(educationQuery);
      try {
        const matchedUserIds = await findUserIdsByEducationTerms(prisma, terms);
        if (!matchedUserIds.length) {
          return res.status(200).json({ candidates: [] });
        }
        andClauses.push({
          id: { in: matchedUserIds },
        });
      } catch (e) {
        console.error("[recruiter/candidates] education search error:", e);
        return res.status(500).json({ error: "Failed to search candidates by education." });
      }
    }

    // Optional local guards remain for fields that exist locally.
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

    if (booleanQuery) {
      andClauses.push({
        aboutMe: { contains: booleanQuery, mode: "insensitive" },
      });
    }

    const where = { AND: andClauses };

    // ─────────────────────────────────────────────────────────────
    // 3) Load local candidate records
    // ─────────────────────────────────────────────────────────────
    const users = await prisma.user.findMany({
      where,
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

    const resumes = candidateUserIds.length
      ? await prisma.resume.findMany({
          where: { userId: { in: candidateUserIds } },
          select: { id: true, userId: true, content: true, updatedAt: true, isPrimary: true },
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

    const userById = new Map(users.map((u) => [String(u.id), u]));

    // Preserve Render ranking order
    const orderedUsers = renderIdOrder
      .map((id) => userById.get(String(id)))
      .filter(Boolean);

    const candidates = orderedUsers.map((u) => {
      const meta = metaByCandidateId.get(u.id) || null;
      const renderCandidate = renderById.get(String(u.id)) || null;

      const tagsArr = meta?.tags ? toStringArray(meta.tags) : [];
      const notesText = typeof meta?.notes === "string" ? meta.notes : "";

      const bestResume = bestResumeByUserId.get(u.id) || null;

      const experience = bestResume?.content
        ? extractExperienceFromResumeContent(bestResume.content)
        : [];

      const profileSkillsArr = dedupeCaseInsensitive(toArrayJson(u.skillsJson));
      const resumeSkillsArr = bestResume?.content
        ? extractSkillsFromResumeContent(bestResume.content)
        : [];

      const baselineSkillsArr =
        profileSkillsArr.length > 0 ? profileSkillsArr : resumeSkillsArr;

      const recruiterSkillsArr = meta?.skills ? toStringArray(meta.skills) : [];
      const effectiveSkillsArr =
        recruiterSkillsArr.length > 0 ? recruiterSkillsArr : baselineSkillsArr;

      return {
        id: u.id,
        userId: u.id,
        name: u.name || renderCandidate?.name || "Unnamed",
        email: u.email || renderCandidate?.email || null,
        title: u.headline || renderCandidate?.headline || "",
        currentTitle: u.headline || renderCandidate?.currentTitle || "",
        role: u.headline || renderCandidate?.role || "",
        summary: u.aboutMe || renderCandidate?.summary || "",
        location: u.location || renderCandidate?.location || "",

        skills: effectiveSkillsArr,
        education: toEducationObjects(u.educationJson),

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

        languages: toArrayJson(u.languagesJson),
        experience,

        tags: tagsArr,
        notes: notesText,
        pipelineStage: meta?.pipelineStage || renderCandidate?.pipelineStage || null,
        lastContacted: meta?.lastContacted || null,
        lastSeen: meta?.lastSeen || null,

        resumeId: bestResume?.id || null,

        match:
          typeof renderCandidate?.match === "number"
            ? renderCandidate.match
            : null,
      };
    });

    return res.status(200).json({ candidates });
  } catch (err) {
    console.error("[recruiter/candidates] query error:", err);
    return res.status(500).json({ error: "Failed to load candidates from the database." });
  }
}