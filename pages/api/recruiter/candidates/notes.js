// pages/api/recruiter/candidates/notes.js
// Update recruiter-only notes for a candidate (Option A)
// Stores notes in RecruiterCandidate using (recruiterUserId, candidateUserId, accountKey)

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";

let prisma;
function getPrisma() {
  if (!prisma) prisma = new PrismaClient();
  return prisma;
}

function asString(v) {
  const s = typeof v === "string" ? v : String(v || "");
  return s.trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const prisma = getPrisma();

  let session;
  try {
    session = await getServerSession(req, res, authOptions);
  } catch (err) {
    console.error("[recruiter/candidates/notes] session error:", err);
  }

  if (!session?.user?.email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const recruiter = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, accountKey: true },
  });

  if (!recruiter?.id || !recruiter.accountKey) {
    return res.status(404).json({ error: "Recruiter or accountKey not found" });
  }

  const { candidateId, notes } = req.body || {};
  const candidateUserId = asString(candidateId);

  if (!candidateUserId) {
    return res.status(400).json({ error: "Invalid candidateId." });
  }

  // Ensure candidate exists
  const candidateUser = await prisma.user.findUnique({
    where: { id: candidateUserId },
    select: { id: true },
  });

  if (!candidateUser?.id) {
    return res.status(404).json({ error: "Candidate user not found." });
  }

  try {
    const updated = await prisma.recruiterCandidate.upsert({
      where: {
        recruiterUserId_candidateUserId_accountKey: {
          recruiterUserId: recruiter.id,
          candidateUserId,
          accountKey: recruiter.accountKey,
        },
      },
      create: {
        recruiterUserId: recruiter.id,
        candidateUserId,
        accountKey: recruiter.accountKey,
        notes: typeof notes === "string" ? notes : String(notes || ""),
        tags: [],
      },
      update: {
        notes: typeof notes === "string" ? notes : String(notes || ""),
      },
    });

    return res.status(200).json({ recruiterCandidate: updated });
  } catch (err) {
    console.error("[recruiter/candidates/notes] upsert error:", err);
    return res.status(500).json({ error: "Failed to update candidate notes." });
  }
}
