// pages/api/cron/recruiter-candidate-feed.js
// Cron endpoint: runs recruiter candidate automations against Candidate table.
//
// IMPORTANT: Protect this route with CRON_SECRET in production.

import { PrismaClient } from "@prisma/client";

let prisma;
function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

function buildWhereFromFilters(filters = {}) {
  const where = {};

  const summaryKeywords = (filters.summaryKeywords || "").trim();
  const jobTitle = (filters.jobTitle || "").trim();
  const workStatus = (filters.workStatus || "").trim();
  const preferredWorkType = (filters.preferredWorkType || "").trim();
  const relocate = (filters.relocate || "").trim();
  const skills = (filters.skills || "").trim();
  const languages = (filters.languages || "").trim();

  const andClauses = [];

  // Summary text search
  if (summaryKeywords) {
    andClauses.push({
      summary: {
        contains: summaryKeywords, // 👈 no mode
      },
    });
  }

  // Job title across role/title/currentTitle
  if (jobTitle) {
    andClauses.push({
      OR: [
        {
          role: {
            contains: jobTitle, // 👈 no mode
          },
        },
        {
          title: {
            contains: jobTitle, // 👈 no mode
          },
        },
        {
          currentTitle: {
            contains: jobTitle, // 👈 no mode
          },
        },
      ],
    });
  }

  // Work status — exact match
  if (workStatus) {
    andClauses.push({
      workStatus: {
        equals: workStatus,
      },
    });
  }

  // Preferred work type
  if (preferredWorkType) {
    andClauses.push({
      preferredWorkType: {
        contains: preferredWorkType, // 👈 no mode
      },
    });
  }

  // Relocation preference
  if (relocate) {
    andClauses.push({
      willingToRelocate: {
        contains: relocate, // 👈 no mode
      },
    });
  }

  // Skills text search
  if (skills) {
    andClauses.push({
      skills: {
        contains: skills, // 👈 no mode
      },
    });
  }

  // Languages text search
  if (languages) {
    andClauses.push({
      languages: {
        contains: languages, // 👈 no mode
      },
    });
  }

  if (andClauses.length) {
    where.AND = andClauses;
  }

  return where;
}

export default async function handler(req, res) {
  const prisma = getPrisma();

  // Simple protection: require CRON_SECRET match if set
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const token =
      req.query.token ||
      req.headers["x-cron-secret"] ||
      req.headers["x-cron-token"];

    if (token !== secret) {
      return res.status(401).json({ error: "Unauthorized cron caller." });
    }
  }

  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const automations = await prisma.recruiterCandidateAutomation.findMany({
      where: { enabled: true },
      include: { user: true },
    });

    const now = new Date();
    const results = [];

    for (const auto of automations) {
      const filters = auto.filters || {};
      const where = buildWhereFromFilters(filters);

      // Tenant isolation if accountKey is used
      if (auto.user.accountKey) {
        where.user = {
          accountKey: auto.user.accountKey,
        };
      }

      const matches = await prisma.candidate.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 50, // cap per run to avoid overload
      });

      // Update lastRunAt
      await prisma.recruiterCandidateAutomation.update({
        where: { id: auto.id },
        data: { lastRunAt: now },
      });

      results.push({
        automationId: auto.id,
        recruiterId: auto.userId,
        name: auto.name,
        filters,
        matchCount: matches.length,
        candidates: matches.map((c) => ({
          id: c.id,
          name: c.name,
          role: c.role,
          location: c.location,
          match: c.match,
        })),
      });
    }

    return res.status(200).json({
      ranAt: now.toISOString(),
      automationCount: automations.length,
      results,
    });
  } catch (err) {
    console.error("[cron/recruiter-candidate-feed] error:", err);

    // 🔍 TEMP: surface the real error so we can debug
    return res.status(500).json({
      error: "Candidate feed cron run failed unexpectedly.",
      details: String(err?.message || err),
      stack: err?.stack || null,
    });
  }
}
