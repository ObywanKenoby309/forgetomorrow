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

<<<<<<< HEAD
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
=======
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
>>>>>>> 6ee98c0 (Add privacy delete user data system)
      },
    });
  }

<<<<<<< HEAD
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
=======
  if (jobTitle) {
    andClauses.push({
      OR: [
        { role: { contains: jobTitle, mode: "insensitive" } },
        { title: { contains: jobTitle, mode: "insensitive" } },
        { currentTitle: { contains: jobTitle, mode: "insensitive" } },
>>>>>>> 6ee98c0 (Add privacy delete user data system)
      ],
    });
  }

<<<<<<< HEAD
  // Work status — exact match
  if (workStatus) {
    andClauses.push({
      workStatus: {
        equals: workStatus,
=======
  if (workStatus) {
    andClauses.push({
      workStatus: {
        contains: workStatus,
        mode: "insensitive",
>>>>>>> 6ee98c0 (Add privacy delete user data system)
      },
    });
  }

<<<<<<< HEAD
  // Preferred work type
  if (preferredWorkType) {
    andClauses.push({
      preferredWorkType: {
        contains: preferredWorkType, // 👈 no mode
=======
  if (preferredWorkType) {
    andClauses.push({
      preferredWorkType: {
        contains: preferredWorkType,
        mode: "insensitive",
>>>>>>> 6ee98c0 (Add privacy delete user data system)
      },
    });
  }

<<<<<<< HEAD
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
=======
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
>>>>>>> 6ee98c0 (Add privacy delete user data system)
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
<<<<<<< HEAD

=======
>>>>>>> 6ee98c0 (Add privacy delete user data system)
    if (token !== secret) {
      return res.status(401).json({ error: "Unauthorized cron caller." });
    }
  }

  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
<<<<<<< HEAD
    const automations = await prisma.recruiterCandidateAutomation.findMany({
      where: { enabled: true },
      include: { user: true },
    });
=======
    const automations =
      await prisma.recruiterCandidateAutomation.findMany({
        where: { enabled: true },
        include: { user: true },
      });
>>>>>>> 6ee98c0 (Add privacy delete user data system)

    const now = new Date();
    const results = [];

    for (const auto of automations) {
<<<<<<< HEAD
      const filters = auto.filters || {};
      const where = buildWhereFromFilters(filters);

      // Tenant isolation if accountKey is used
      if (auto.user.accountKey) {
=======
      const filters = (auto.filters || {});
      const where = buildWhereFromFilters(filters);

      // Only match candidates from the same account/tenant if you're using accountKey
      if (auto.user?.accountKey) {
>>>>>>> 6ee98c0 (Add privacy delete user data system)
        where.user = {
          accountKey: auto.user.accountKey,
        };
      }

      const matches = await prisma.candidate.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 50, // cap per run to avoid overload
      });

<<<<<<< HEAD
      // Update lastRunAt
=======
      // Update lastRunAt for observability
>>>>>>> 6ee98c0 (Add privacy delete user data system)
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

<<<<<<< HEAD
=======
    // For now we just return JSON; later we can persist to a "feed" table or send notifications.
>>>>>>> 6ee98c0 (Add privacy delete user data system)
    return res.status(200).json({
      ranAt: now.toISOString(),
      automationCount: automations.length,
      results,
    });
  } catch (err) {
    console.error("[cron/recruiter-candidate-feed] error:", err);
<<<<<<< HEAD

    // 🔍 TEMP: surface the real error so we can debug
    return res.status(500).json({
      error: "Candidate feed cron run failed unexpectedly.",
      details: String(err?.message || err),
      stack: err?.stack || null,
    });
=======
    return res
      .status(500)
      .json({ error: "Candidate feed cron run failed unexpectedly." });
>>>>>>> 6ee98c0 (Add privacy delete user data system)
  }
}
