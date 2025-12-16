// pages/api/recruiter/candidates/index.js
// List recruiter candidates from Prisma (main DB) — LIVE from User table (no stale Candidate snapshot)

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";

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

  // IMPORTANT:
  // Recruiter discovery is LIVE and only includes:
  // - PUBLIC profiles
  // - RECRUITERS_ONLY profiles
  // Private profiles are excluded instantly.
  //
  // Back-compat:
  // - If older rows only use isProfilePublic, keep those visible when true.
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
  // NOTE: Prisma supports JSON path filters on PostgreSQL.
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
  // Using skillsJson / languagesJson arrays directly (LIVE).
  // NOTE: This is exact-match on array values ("Leadership" must exist as a discrete item).
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

    // Map Users -> candidate-shaped objects expected by UI
    const candidates = users.map((u) => ({
      id: u.id, // keep stable id for UI
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
      tags: [],
      notes: "",
    }));

    return res.status(200).json({ candidates });
  } catch (err) {
    console.error("[recruiter/candidates] query error:", err);
    return res
      .status(500)
      .json({ error: "Failed to load candidates from the database." });
  }
}
