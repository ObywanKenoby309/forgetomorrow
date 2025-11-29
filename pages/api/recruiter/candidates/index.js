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
  const relocateQuery = (willingToRelocate || "").toString().trim();
  const skillsQuery = (skills || "").toString().trim();
  const languagesQuery = (languages || "").toString().trim();

  const where = {};
  const andClauses = [];

  // Manual search by name / role / summary (allowed)
  if (nameRoleQuery) {
    where.OR = [
      { name: { contains: nameRoleQuery, mode: "insensitive" } },
      { role: { contains: nameRoleQuery, mode: "insensitive" } },
      { summary: { contains: nameRoleQuery, mode: "insensitive" } },
    ];
  }

  // Location filter
  if (locationQuery) {
    andClauses.push({
      location: {
        contains: locationQuery,
        mode: "insensitive",
      },
    });
  }

  // Summary keywords → summary
  if (summaryKeywordsQuery) {
    andClauses.push({
      summary: {
        contains: summaryKeywordsQuery,
        mode: "insensitive",
      },
    });
  }

  // Job title → role/title/currentTitle
  if (jobTitleQuery) {
    andClauses.push({
      OR: [
        { role: { contains: jobTitleQuery, mode: "insensitive" } },
        { title: { contains: jobTitleQuery, mode: "insensitive" } },
        { currentTitle: { contains: jobTitleQuery, mode: "insensitive" } },
      ],
    });
  }

  // Work status
  if (workStatusQuery) {
    andClauses.push({
      workStatus: {
        contains: workStatusQuery,
        mode: "insensitive",
      },
    });
  }

  // Preferred work type
  if (preferredWorkTypeQuery) {
    andClauses.push({
      preferredWorkType: {
        contains: preferredWorkTypeQuery,
        mode: "insensitive",
      },
    });
  }

  // Willing to relocate (values like "yes", "no", "maybe")
  if (relocateQuery) {
    andClauses.push({
      willingToRelocate: relocateQuery.toLowerCase(),
    });
  }

  // Skills (comma-separated; ALL terms must be present)
  if (skillsQuery) {
    const skillTerms = skillsQuery
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const term of skillTerms) {
      andClauses.push({
        skills: {
          contains: term,
          mode: "insensitive",
        },
      });
    }
  }

  // Languages (comma-separated; ALL terms must be present)
  if (languagesQuery) {
    const languageTerms = languagesQuery
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const term of languageTerms) {
      andClauses.push({
        languages: {
          contains: term,
          mode: "insensitive",
        },
      });
    }
  }

  // Boolean query placeholder — future: parse Boolean search.
  // For now, if present, we simply search it in summary.
  if (booleanQuery) {
    andClauses.push({
      summary: {
        contains: booleanQuery,
        mode: "insensitive",
      },
    });
  }

  if (andClauses.length) {
    where.AND = andClauses;
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
