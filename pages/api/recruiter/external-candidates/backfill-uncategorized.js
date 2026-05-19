// pages/api/recruiter/external-candidates/backfill-uncategorized.js
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

async function ensureUncategorizedPool({ accountKey, userId }) {
  const existing = await prisma.talentPool.findFirst({
    where: { accountKey, name: "Uncategorized" },
    select: { id: true },
  });

  if (existing?.id) return existing;

  return prisma.talentPool.create({
    data: {
      accountKey,
      createdByUserId: userId,
      name: "Uncategorized",
      purpose: "Default intake pool for uncategorized external candidates.",
      tags: ["uncategorized", "external"],
    },
    select: { id: true },
  });
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ error: "Method not allowed" });
    }

    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const viewer = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, accountKey: true },
    });

    if (!viewer?.accountKey) {
      return res.status(400).json({ error: "Missing accountKey" });
    }

    const accountKey = viewer.accountKey;
    const pool = await ensureUncategorizedPool({ accountKey, userId });

    const candidates = await prisma.externalCandidate.findMany({
      where: { accountKey },
      select: {
        id: true,
        name: true,
        headline: true,
        location: true,
        notes: true,
      },
    });

    let created = 0;
    let skipped = 0;

    for (const candidate of candidates) {
      const existingEntry = await prisma.talentPoolEntry.findFirst({
        where: {
          accountKey,
          externalCandidateId: candidate.id,
        },
        select: { id: true },
      });

      if (existingEntry?.id) {
        skipped++;
        continue;
      }

      await prisma.talentPoolEntry.create({
        data: {
          accountKey,
          poolId: pool.id,
          externalCandidateId: candidate.id,
          candidateName: candidate.name || "External Candidate",
          candidateHeadline: candidate.headline || null,
          candidateLocation: candidate.location || null,
          source: "External",
          status: "Warm",
          fit: "",
          reasons: [],
          notes: candidate.notes || "",
          lastRoleConsidered: "",
        },
      });

      created++;
    }

    return res.status(200).json({
      ok: true,
      poolId: pool.id,
      totalExternalCandidates: candidates.length,
      created,
      skipped,
    });
  } catch (err) {
    console.error("[backfill-uncategorized] error:", err);

    return res.status(500).json({
      error: "Backfill failed.",
      message: err?.message || String(err),
      code: err?.code || null,
      name: err?.name || null,
    });
  }
}