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

// Reuse the same semantics as the recruiter candidates list endpoint,
// but based solely on the stored automation.filters.
function buildWhereFromFilters(filters = {}) {
  const f = filters || {};

  const summaryKeywords = (f.summaryKeywords || "").trim();
  const jobTitle = (f.jobTitle || "").trim();
  const workStatus = (f.workStatus || "").trim();
  const preferredWorkType = (f.preferredWorkType || "").trim();
  const relocate = (f.relocate || "").trim();
  const skills = (f.skills || "").trim();
  const languages = (f.languages || "").trim();

  const where = {};
  const andClauses = [];

  if (summaryKeywords) {
    andClauses.push({
      summary: {
        contains: summaryKeywords,
        mode: "insensitive",
      },
    });
  }

  if (jobTitle) {
    andClauses.push({
      OR: [
        { role: { contains: jobTitle, mode: "insensitive" } },
        { title: { contains: jobTitle, mode: "insensitive" } },
        { currentTitle: { contains: jobTitle, mode: "insensitive" } },
      ],
    });
  }

  if (workStatus) {
    andClauses.push({
      workStatus: {
        contains: workStatus,
        mode: "insensitive",
      },
    });
  }

  if (preferredWorkType) {
    andClauses.push({
      preferredWorkType: {
        contains: preferredWorkType,
        mode: "insensitive",
      },
    });
  }

  if (relocate) {
    // We normalize relocate as a simple lowercase string in filters,
    // so we match on exact lowercase value here.
    andClauses.push({
      willingToRelocate: relocate.toLowerCase(),
    });
  }

  if (skills) {
    const skillTerms = skills
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

  if (languages) {
    const languageTerms = languages
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
    const automations =
      await prisma.recruiterCandidateAutomation.findMany({
        where: { enabled: true },
        include: { user: true },
      });

    const now = new Date();
    const results = [];

    for (const auto of automations) {
      const filters = (auto.filters || {});
      const where = buildWhereFromFilters(filters);

      // Only match candidates from the same account/tenant if you're using accountKey
      if (auto.user?.accountKey) {
        where.user = {
          accountKey: auto.user.accountKey,
        };
      }

      const matches = await prisma.candidate.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 50, // cap per run to avoid overload
      });

      // Update lastRunAt for observability
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

    // For now we just return JSON; later we can persist to a "feed" table or send notifications.
    return res.status(200).json({
      ranAt: now.toISOString(),
      automationCount: automations.length,
      results,
    });
  } catch (err) {
    console.error("[cron/recruiter-candidate-feed] error:", err);
    return res
      .status(500)
      .json({ error: "Candidate feed cron run failed unexpectedly." });
  }
}
