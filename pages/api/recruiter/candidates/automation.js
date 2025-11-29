// pages/api/recruiter/candidates/automation.js
// Save & load recruiter candidate automation (daily feed rules)

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

async function getCurrentUser(prisma, session) {
  const email = session?.user?.email;
  if (!email) return null;

  return prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
}

export default async function handler(req, res) {
  const prisma = getPrisma();

  let session;
  try {
    session = await getServerSession(req, res, authOptions);
  } catch (err) {
    console.error("[recruiter/candidates/automation] session error:", err);
  }

  if (!session?.user?.email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const user = await getCurrentUser(prisma, session);
  if (!user?.id) {
    return res.status(404).json({ error: "User not found" });
  }

  const userId = user.id;

  if (req.method === "GET") {
    try {
      const automation = await prisma.recruiterCandidateAutomation.findFirst({
        where: { userId },
      });

      return res.status(200).json({ automation });
    } catch (err) {
      console.error("[recruiter/candidates/automation] GET error:", err);
      return res
        .status(500)
        .json({ error: "Failed to load candidate automation settings." });
    }
  }

  if (req.method === "POST") {
    const { name, enabled, filters } = req.body || {};

    const incomingFilters =
      filters && typeof filters === "object" ? filters : {};

    // Whitelist allowed filter fields (ignore everything else)
    const safeFilters = {
      summaryKeywords:
        typeof incomingFilters.summaryKeywords === "string"
          ? incomingFilters.summaryKeywords
          : null,
      jobTitle:
        typeof incomingFilters.jobTitle === "string"
          ? incomingFilters.jobTitle
          : null,
      workStatus:
        typeof incomingFilters.workStatus === "string"
          ? incomingFilters.workStatus
          : null,
      preferredWorkType:
        typeof incomingFilters.preferredWorkType === "string"
          ? incomingFilters.preferredWorkType
          : null,
      relocate:
        typeof incomingFilters.relocate === "string"
          ? incomingFilters.relocate
          : null,
      skills:
        typeof incomingFilters.skills === "string"
          ? incomingFilters.skills
          : null,
      languages:
        typeof incomingFilters.languages === "string"
          ? incomingFilters.languages
          : null,
    };

    try {
      const existing = await prisma.recruiterCandidateAutomation.findFirst({
        where: { userId },
      });

      let record;
      if (existing) {
        record = await prisma.recruiterCandidateAutomation.update({
          where: { id: existing.id },
          data: {
            name: name || null,
            enabled: Boolean(enabled),
            filters: safeFilters,
          },
        });
      } else {
        record = await prisma.recruiterCandidateAutomation.create({
          data: {
            userId,
            name: name || null,
            enabled: Boolean(enabled),
            filters: safeFilters,
          },
        });
      }

      return res.status(200).json({
        automation: record,
        message: "Automation settings saved.",
      });
    } catch (err) {
      console.error("[recruiter/candidates/automation] POST error:", err);
      return res
        .status(500)
        .json({ error: "Failed to save candidate automation settings." });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method not allowed" });
}
