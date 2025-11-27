// pages/api/recruiter/candidates/notes.js
// Update candidate notes (single text field)

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

  const { candidateId, notes } = req.body || {};
  const id = Number(candidateId);

  if (!id || Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid candidateId." });
  }

  try {
    const updated = await prisma.candidate.update({
      where: { id },
      data: { notes: notes || "" },
    });

    return res.status(200).json({ candidate: updated });
  } catch (err) {
    console.error("[recruiter/candidates/notes] update error:", err);
    return res
      .status(500)
      .json({ error: "Failed to update candidate notes." });
  }
}
