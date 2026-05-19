// pages/api/jobs/check-fit.js
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { buildExplain } from "@/lib/intelligence/whyEngine";

function safe(value = "") {
  return String(value || "").trim();
}

function monthKeyUTC() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function safeJsonParse(value) {
  try {
    if (!value) return null;
    if (typeof value === "object") return value;
    if (typeof value !== "string") return null;
    const s = value.trim();
    if (!s) return null;
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function normalizeResumeTemplateData(raw) {
  const parsed = safeJsonParse(raw);
  if (!parsed || typeof parsed !== "object") return null;
  if (parsed.data && typeof parsed.data === "object") return parsed.data;
  if (parsed.resume && typeof parsed.resume === "object") return parsed.resume;
  return parsed;
}

function extractResumeText(resumeData) {
  if (!resumeData || typeof resumeData !== "object") return "";
  const parts = [];
  if (resumeData.summary) parts.push(resumeData.summary);
  if (resumeData.professionalSummary) parts.push(resumeData.professionalSummary);
  const experiences = resumeData.experiences || resumeData.workExperiences || resumeData.experience || [];
  for (const exp of Array.isArray(experiences) ? experiences : []) {
    if (exp?.title) parts.push(exp.title);
    if (exp?.company) parts.push(exp.company);
    if (exp?.description) parts.push(exp.description);
    if (Array.isArray(exp?.highlights)) parts.push(exp.highlights.join(" "));
    if (Array.isArray(exp?.bullets)) parts.push(exp.bullets.join(" "));
  }
  const skills = resumeData.skills || [];
  if (Array.isArray(skills)) parts.push(skills.join(", "));
  const certs = resumeData.certifications || [];
  for (const c of Array.isArray(certs) ? certs : []) {
    if (typeof c === "string") parts.push(c);
    else if (c?.name) parts.push(c.name);
  }
  const edu = resumeData.educationList || resumeData.education || [];
  for (const e of Array.isArray(edu) ? edu : []) {
    if (e?.degree) parts.push(e.degree);
    if (e?.school) parts.push(e.school);
    if (e?.field) parts.push(e.field);
  }
  const projects = resumeData.projects || [];
  for (const p of Array.isArray(projects) ? projects : []) {
    if (p?.title) parts.push(p.title);
    if (p?.description) parts.push(p.description);
  }
  return parts.filter(Boolean).join("\n");
}

async function resolveUserId(session) {
  const directId = session?.user?.id;
  if (directId) return String(directId);
  const email = safe(session?.user?.email).toLowerCase();
  if (!email) return null;
  const u = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return u?.id ? String(u.id) : null;
}

async function enforceJobFitGate(userId) {
  const monthKey = monthKeyUTC();
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { plan: true, resumeAlignFreeUses: true, resumeAlignLastResetMonth: true },
    });
    const plan = String(user?.plan || "FREE").toUpperCase();
    const limit = plan === "FREE" ? 3 : 15;
    const last = safe(user?.resumeAlignLastResetMonth);
    const uses = Number(user?.resumeAlignFreeUses || 0);
    if (last !== monthKey) {
      await tx.user.update({
        where: { id: userId },
        data: { resumeAlignFreeUses: 1, resumeAlignLastResetMonth: monthKey },
      });
      return { allowed: true, remaining: limit - 1, tier: plan, limit };
    }
    if (uses >= limit) return { allowed: false, remaining: 0, tier: plan, limit };
    await tx.user.update({
      where: { id: userId },
      data: { resumeAlignFreeUses: { increment: 1 } },
    });
    return { allowed: true, remaining: Math.max(0, limit - (uses + 1)), tier: plan, limit };
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const userId = await resolveUserId(session);
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const primaryResume =
      (await prisma.resume.findFirst({
        where: { userId, isPrimary: true },
        select: { id: true, content: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      })) ||
      (await prisma.resume.findFirst({
        where: { userId },
        select: { id: true, content: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }));

    const resumeData = normalizeResumeTemplateData(primaryResume?.content);
    if (!resumeData) {
      return res.status(400).json({
        ok: false,
        error: "Primary resume not found or resume content is not valid JSON.",
      });
    }

    const gate = await enforceJobFitGate(userId);
    if (!gate.allowed) {
      return res.status(200).json({
        ok: true,
        upgrade: true,
        text: `Monthly Check My Alignment limit reached (${gate.limit}/month).`,
        remaining: 0,
        limit: gate.limit,
        tier: gate.tier,
      });
    }

    const resumeText = extractResumeText(resumeData);
    if (!resumeText.trim()) {
      return res.status(400).json({
        ok: false,
        error: "Resume content could not be extracted. Please update your primary resume.",
      });
    }

    const jdText = safe(req.body?.jdText || "");
    if (!jdText) {
      return res.status(400).json({ ok: false, error: "Job description is required." });
    }

    // Call WHY engine directly — same engine as External Compare and recruiter packets
    // No HTTP overhead. No derived score. Real capability-based alignment.
    console.log('[check-fit] FULL resumeText:', resumeText);
    const why = buildExplain(resumeText, jdText);

const matchedSignals = Array.isArray(why?.signals?.matched) ? why.signals.matched : [];
const notYetSignals = Array.isArray(why?.signals?.not_yet_demonstrated)
  ? why.signals.not_yet_demonstrated
  : [];

let strengthSentence = '';
const topMatch = matchedSignals[0];

if (topMatch?.seekerLabel || topMatch?.label) {
  strengthSentence = `Your resume shows relevant ${String(
    topMatch.seekerLabel || topMatch.label
  ).toLowerCase()} for this role.`;
}

let gapSentence = '';
const topGap =
  notYetSignals.find((g) => g?.tier === 'A') ||
  notYetSignals.find((g) => g?.tier === 'B') ||
  notYetSignals[0];

if (topGap?.label) {
  gapSentence = `The resume does not yet clearly show direct ${String(topGap.label).toLowerCase()} evidence required by this role.`;
} else if (Array.isArray(why?.gaps) && why.gaps[0]) {
  gapSentence = `The resume does not yet clearly show direct ${String(why.gaps[0]).toLowerCase()} evidence required by this role.`;
}

    return res.status(200).json({
      ok: true,
      remaining: gate.remaining,
      limit: gate.limit,
      tier: gate.tier,
      why,
      strengthSentence,
	  gapSentence,
    });

  } catch (err) {
    console.error("[jobs/check-fit] error", err);
    return res.status(500).json({ ok: false, error: "Failed to run Check My Alignment." });
  }
}