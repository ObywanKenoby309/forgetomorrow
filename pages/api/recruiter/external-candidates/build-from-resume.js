// pages/api/recruiter/external-candidates/build-from-resume.js
// Parses a pasted resume text + WHY result into an ExternalCandidate record.
// Creates the record in the recruiter's org scope and returns it.
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

function safeString(val) {
  if (!val) return "";
  return String(val).trim();
}

function extractNameFromResume(text) {
  if (!text) return null;
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  const first = lines[0];
  if (!first) return null;
  if (first.length > 60) return null;
  if (/[@|•|·|\d{3}]/.test(first)) return null;
  if (/resume|curriculum|cv|summary/i.test(first)) return null;
  return first;
}

function extractEmailFromResume(text) {
  if (!text) return null;
  const match = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
}

function extractPhoneFromResume(text) {
  if (!text) return null;
  const match = text.match(/(\+?1?\s?)?(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/);
  return match ? match[0].trim() : null;
}

function extractLocationFromResume(text) {
  if (!text) return null;
  const match = text.match(/([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}(\s+\d{5})?)/);
  return match ? match[0].trim() : null;
}

function extractHeadlineFromResume(text) {
  if (!text) return null;
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  let nameFound = false;
  for (const line of lines) {
    if (!nameFound) { nameFound = true; continue; }
    if (line.length < 10 || line.length > 120) continue;
    if (/[@|\d{3}-\d{3}]/.test(line)) continue;
    if (/resume|curriculum|cv/i.test(line)) continue;
    return line;
  }
  return null;
}

function extractCompanyFromResume(text) {
  if (!text) return null;
  const patterns = [
    /(?:at|@)\s+([A-Z][a-zA-Z\s&,\.]+?)(?:\s*[•·|,\n])/,
    /([A-Z][a-zA-Z\s&,\.]{2,40})\s*[•·|]\s*(?:Present|20\d\d)/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function buildNotesFromWhy(whyResult) {
  if (!whyResult) return null;
  const parts = [];
  if (whyResult.summary) parts.push(`Alignment summary: ${whyResult.summary}`);
  if (typeof whyResult.score === "number") parts.push(`Alignment score: ${whyResult.score}%`);
  if (Array.isArray(whyResult.strengths) && whyResult.strengths.length) {
    parts.push(`Strengths: ${whyResult.strengths.slice(0, 5).join(", ")}`);
  }
  if (Array.isArray(whyResult.gaps) && whyResult.gaps.length) {
    parts.push(`Gaps: ${whyResult.gaps.slice(0, 3).join(", ")}`);
  }
  return parts.join("\n") || null;
}

async function ensureUncategorizedPool({ accountKey, userId }) {
  const existing = await prisma.talentPool.findFirst({
    where: { accountKey, name: "Uncategorized" },
    select: { id: true, name: true },
  });

  if (existing?.id) return existing;

  return prisma.talentPool.create({
    data: {
      accountKey,
      createdByUserId: userId,
      name: "Uncategorized",
      purpose: "Default intake pool for candidates not yet categorized.",
      tags: ["uncategorized", "intake"],
    },
    select: { id: true, name: true },
  });
}

async function ensureUncategorizedPoolEntry({
  accountKey,
  poolId,
  candidate,
  notes,
  whyResult,
}) {
  if (!candidate?.id) return null;

  const existing = await prisma.talentPoolEntry.findFirst({
    where: {
      accountKey,
      poolId,
      externalCandidateId: candidate.id,
    },
    select: { id: true, poolId: true },
  });

  if (existing?.id) return existing;

  const reasons = [];
  if (Array.isArray(whyResult?.strengths) && whyResult.strengths.length) {
    reasons.push(...whyResult.strengths.slice(0, 3).map((s) => String(s || "").trim()).filter(Boolean));
  }

  return prisma.talentPoolEntry.create({
    data: {
      accountKey,
      poolId,
      externalCandidateId: candidate.id,
      candidateName: candidate.name || "External Candidate",
      candidateHeadline: candidate.headline || null,
      candidateLocation: candidate.location || null,
      source: "External",
      status: "Uncategorized",
      fit: typeof whyResult?.score === "number" ? `${whyResult.score}% alignment` : null,
      lastRoleConsidered: null,
      reasons: reasons.length ? reasons : null,
      notes: notes || null,
    },
    select: { id: true, poolId: true },
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const viewer = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, accountKey: true, employee: true },
  });

  if (!viewer) return res.status(401).json({ error: "Unauthorized" });

  const viewerRole = String(viewer.role || "").toUpperCase();
  const isRecruiter = viewerRole === "RECRUITER";
  const isStaff = !!viewer.employee;

  if (!isRecruiter && !isStaff) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const accountKey = viewer.accountKey;
  if (!accountKey && !isStaff) {
    return res.status(400).json({ error: "No organization account found." });
  }

  const { resumeText, whyResult } = req.body || {};

  if (!safeString(resumeText)) {
    return res.status(400).json({ error: "Resume text is required." });
  }

  try {
    const name = extractNameFromResume(resumeText) || "External Candidate";
    const email = extractEmailFromResume(resumeText) || null;
    const phone = extractPhoneFromResume(resumeText) || null;
    const location = extractLocationFromResume(resumeText) || null;
    const headline = extractHeadlineFromResume(resumeText) || null;
    const company = extractCompanyFromResume(resumeText) || null;
    const notes = buildNotesFromWhy(whyResult);

    // Dedupe by email within org
    if (email && accountKey) {
      const existing = await prisma.externalCandidate.findFirst({
        where: { accountKey, email },
        select: { id: true, name: true, email: true },
      });
      if (existing) {
        const effectiveAccountKey = accountKey || "STAFF";
        const pool = await ensureUncategorizedPool({ accountKey: effectiveAccountKey, userId });
        const entry = await ensureUncategorizedPoolEntry({
          accountKey: effectiveAccountKey,
          poolId: pool.id,
          candidate: existing,
          notes,
          whyResult,
        });

        return res.status(200).json({
          candidate: existing,
          pool,
          entry,
          existed: true,
          message: `External candidate with email ${email} already exists in your database and is available in Uncategorized.`,
        });
      }
    }

    const candidate = await prisma.externalCandidate.create({
      data: {
        accountKey: accountKey || "STAFF",
        createdByUserId: userId,
        name,
        email,
        phone,
        location,
        headline,
        company,
        notes,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        location: true,
        headline: true,
        company: true,
        notes: true,
        createdAt: true,
      },
    });

    const effectiveAccountKey = accountKey || "STAFF";
    const pool = await ensureUncategorizedPool({ accountKey: effectiveAccountKey, userId });
    const entry = await ensureUncategorizedPoolEntry({
      accountKey: effectiveAccountKey,
      poolId: pool.id,
      candidate,
      notes,
      whyResult,
    });

    return res.status(200).json({
      candidate,
      pool,
      entry,
      existed: false,
      message: `${name} has been added to your external candidate database and placed in Uncategorized.`,
    });
  } catch (err) {
    console.error("[build-from-resume] error:", err);
    return res.status(500).json({ error: "Failed to create external candidate profile." });
  }
}