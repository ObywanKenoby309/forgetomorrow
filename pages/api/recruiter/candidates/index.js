// pages/api/recruiter/candidates/index.js
// List recruiter candidates from Prisma (main DB)

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";

let prisma;
function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
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
  const willingToRelocateQuery = (willingToRelocate || "").toString().trim();
  const skillsRaw = (skills || "").toString().trim();
  const languagesRaw = (languages || "").toString().trim();

  const skillTokens = skillsRaw
    ? skillsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const languageTokens = languagesRaw
    ? languagesRaw.split(",").map((l) => l.trim()).filter(Boolean)
    : [];

  const where = {};

  // Basic name / role / summary search (card-level)
  if (nameRoleQuery) {
    where.OR = [
      { name: { contains: nameRoleQuery, mode: "insensitive" } },
      { role: { contains: nameRoleQuery, mode: "insensitive" } },
      { title: { contains: nameRoleQuery, mode: "insensitive" } },
      { currentTitle: { contains: nameRoleQuery, mode: "insensitive" } },
      { summary: { contains: nameRoleQuery, mode: "insensitive" } },
    ];
  }

  // Location filter
  if (locationQuery) {
    where.location = {
      contains: locationQuery,
      mode: "insensitive",
    };
  }

  // Boolean query placeholder — future: parse Boolean search syntax.
  // For now, we simply search it in summary + skills.
  if (booleanQuery) {
    where.AND = (where.AND || []).concat([
      {
        OR: [
          {
            summary: {
              contains: booleanQuery,
              mode: "insensitive",
            },
          },
          {
            skills: {
              contains: booleanQuery,
              mode: "insensitive",
            },
          },
        ],
      },
    ]);
  }

  // ─────────────────────────────────────────────
  // SAFE PROFILE-BASED FILTERS ONLY
  // We intentionally DO NOT filter on:
  // - hobbies / interests
  // - previous employers
  // - birthdays / age proxies
  // - pronouns or gender-related fields
  // Names are only used via the generic q search above.
  // ─────────────────────────────────────────────

  // Summary keywords → search summary + skills
  if (summaryKeywordsQuery) {
    where.AND = (where.AND || []).concat([
      {
        OR: [
          {
            summary: {
              contains: summaryKeywordsQuery,
              mode: "insensitive",
            },
          },
          {
            skills: {
              contains: summaryKeywordsQuery,
              mode: "insensitive",
            },
          },
        ],
      },
    ]);
  }

  // Job title → role / title / currentTitle
  if (jobTitleQuery) {
    where.AND = (where.AND || []).concat([
      {
        OR: [
          {
            role: {
              contains: jobTitleQuery,
              mode: "insensitive",
            },
          },
          {
            title: {
              contains: jobTitleQuery,
              mode: "insensitive",
            },
          },
          {
            currentTitle: {
              contains: jobTitleQuery,
              mode: "insensitive",
            },
          },
        ],
      },
    ]);
  }

  // Current work status (exact match)
  if (workStatusQuery) {
    where.AND = (where.AND || []).concat([
      {
        workStatus: {
          equals: workStatusQuery,
        },
      },
    ]);
  }

  // Preferred work type (exact match)
  if (preferredWorkTypeQuery) {
    where.AND = (where.AND || []).concat([
      {
        preferredWorkType: {
          equals: preferredWorkTypeQuery,
        },
      },
    ]);
  }

  // Willing to relocate (exact match)
  if (willingToRelocateQuery) {
    where.AND = (where.AND || []).concat([
      {
        willingToRelocate: {
          equals: willingToRelocateQuery,
        },
      },
    ]);
  }

  // Skills: every token must appear somewhere in skills text
  if (skillTokens.length > 0) {
    const skillClauses = skillTokens.map((token) => ({
      skills: {
        contains: token,
        mode: "insensitive",
      },
    }));

    where.AND = (where.AND || []).concat(skillClauses);
  }

  // Languages: every token must appear somewhere in languages text
  if (languageTokens.length > 0) {
    const languageClauses = languageTokens.map((token) => ({
      languages: {
        contains: token,
        mode: "insensitive",
      },
    }));

    where.AND = (where.AND || []).concat(languageClauses);
  }

  try {
    const candidates = await prisma.candidate.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ candidates });
  } catch (err) {
    console.error("[recruiter/candidates] query error:", err);
    // Sev-1 style: front-end will surface a clear message.
    return res
      .status(500)
      .json({ error: "Failed to load candidates from the database." });
  }
}
