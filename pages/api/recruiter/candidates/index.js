// pages/api/recruiter/candidates/index.js
// List recruiter candidates from Prisma (main DB) — LIVE from User table
// + join recruiter-specific metadata (notes/tags/pipelineStage/skills) from RecruiterCandidate (Option A)
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

function toArrayJson(v) {
  if (Array.isArray(v)) return v.map((x) => String(x || "").trim()).filter(Boolean);
  return [];
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
  // - data.workExperiences (your actual data)
  // - data.experiences (legacy)
  // - data.experience (legacy)
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

      // If we don't have one yet, take it.
      if (!existing) {
        bestResumeByUserId.set(r.userId, r);
        continue;
      }

      // If existing isn't primary but this one is, prefer this one.
      if (!existing.isPrimary && r.isPrimary) {
        bestResumeByUserId.set(r.userId, r);
        continue;
      }

      // If both are same "primary-ness", keep the latest (resumes already ordered desc,
      // so existing will usually be newer; but keep a safe compare anyway)
      const a = existing?.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
      const b = r?.updatedAt ? new Date(r.updatedAt).getTime() : 0;
      if (b > a) bestResumeByUserId.set(r.userId, r);
    }

    const candidates = users.map((u) => {
      const meta = metaByCandidateId.get(u.id) || null;

      const tagsArr = meta?.tags ? toStringArray(meta.tags) : [];
      const notesText = typeof meta?.notes === "string" ? meta.notes : "";

      // ✅ Skills: profile skills injected, recruiter skills override if saved
      const profileSkillsArr = toArrayJson(u.skillsJson);
      const recruiterSkillsArr = meta?.skills ? toStringArray(meta.skills) : [];
      const effectiveSkillsArr =
        recruiterSkillsArr.length > 0 ? recruiterSkillsArr : profileSkillsArr;

      const bestResume = bestResumeByUserId.get(u.id) || null;
      const experience = bestResume?.content
        ? extractExperienceFromResumeContent(bestResume.content)
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

        // ✅ what the modal should display/edit
        skills: effectiveSkillsArr,
        // optional: transparency/debug
        skillsProfile: profileSkillsArr,
        skillsSource: recruiterSkillsArr.length > 0 ? "recruiter" : "profile",

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
