// pages/api/recruiter/candidates/notes.js
// Update recruiter-only notes for a candidate (Option A)
// Stores notes in RecruiterCandidate using (recruiterUserId, candidateUserId, accountKey)
// ✅ Impersonation-aware: resolves effective recruiter via ft_imp cookie (Platform Admin only)

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import jwt from "jsonwebtoken";

let prisma;
function getPrisma() {
  if (!prisma) prisma = new PrismaClient();
  return prisma;
}

function asString(v) {
  const s = typeof v === "string" ? v : String(v || "");
  return s.trim();
}

function readCookie(req, name) {
  try {
    const raw = req.headers?.cookie || "";
    const parts = raw.split(";").map((p) => p.trim());
    for (const p of parts) {
      if (p.startsWith(name + "=")) return decodeURIComponent(p.slice(name.length + 1));
    }
    return "";
  } catch {
    return "";
  }
}

async function resolveEffectiveRecruiter(prisma, req, session) {
  const sessionEmail = String(session?.user?.email || "").trim().toLowerCase();
  if (!sessionEmail) return null;

  const isPlatformAdmin = !!session?.user?.isPlatformAdmin;
  let effectiveUserId = null;

  if (isPlatformAdmin) {
    const imp = readCookie(req, "ft_imp");
    if (imp) {
      try {
        const decoded = jwt.verify(imp, process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production");
        if (decoded && typeof decoded === "object" && decoded.targetUserId) {
          effectiveUserId = String(decoded.targetUserId);
        }
      } catch {
        // ignore
      }
    }
  }

  if (effectiveUserId) {
    const u = await prisma.user.findUnique({
      where: { id: effectiveUserId },
      select: { id: true, email: true, accountKey: true },
    });
    return u?.id ? u : null;
  }

  const u = await prisma.user.findUnique({
    where: { email: sessionEmail },
    select: { id: true, email: true, accountKey: true },
  });
  return u?.id ? u : null;
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

  // ✅ Impersonation-aware recruiter identity
  const recruiter = await resolveEffectiveRecruiter(prisma, req, session);

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
