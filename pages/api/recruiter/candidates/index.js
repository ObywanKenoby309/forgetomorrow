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

  const { q = "", location = "", bool = "" } = req.query || {};

  const nameRoleQuery = (q || "").toString().trim();
  const locationQuery = (location || "").toString().trim();
  const booleanQuery = (bool || "").toString().trim();

  const where = {};

  if (nameRoleQuery) {
    where.OR = [
      { name: { contains: nameRoleQuery, mode: "insensitive" } },
      { role: { contains: nameRoleQuery, mode: "insensitive" } },
      { summary: { contains: nameRoleQuery, mode: "insensitive" } },
    ];
  }

  if (locationQuery) {
    where.location = {
      contains: locationQuery,
      mode: "insensitive",
    };
  }

  // Boolean query placeholder — future: parse Boolean search.
  // For now, if present, we simply search it in summary.
  if (booleanQuery) {
    where.AND = (where.AND || []).concat([
      {
        summary: {
          contains: booleanQuery,
          mode: "insensitive",
        },
      },
    ]);
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
