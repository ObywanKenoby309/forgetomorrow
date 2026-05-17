// pages/api/jobs/alignment.js
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { rankJobsBySeekerAlignment } from "@/lib/intelligence/forgeJobMatchEngine";
import { classifySignals, overallVerdict, signalScoreToPercent } from '@/lib/intelligence/profileSignalShared';

function safeJsonParse(value) {
  try {
    if (!value || typeof value !== "string") return null;
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    return value
      .split(/[,|]/g)
      .map((x) => String(x || "").trim())
      .filter(Boolean);
  }
  return [];
}

function extractResumeContext(resume) {
  const parsed = safeJsonParse(resume?.content);
  const root = parsed?.data && typeof parsed.data === "object" ? parsed.data : parsed || {};

  return {
    resumeId: resume?.id || null,
    summary: root.summary || root.professionalSummary || "",
    skills: toArray(root.skills),
    experience: Array.isArray(root.experiences)
      ? root.experiences
      : Array.isArray(root.workExperiences)
      ? root.workExperiences
      : Array.isArray(root.experience)
      ? root.experience
      : [],
    projects: Array.isArray(root.projects) ? root.projects : [],
    certifications: Array.isArray(root.certifications) ? root.certifications : [],
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const jobs = Array.isArray(req.body?.jobs) ? req.body.jobs : [];

  if (!jobs.length) {
    return res.status(200).json({ alignments: {}, jobs: [] });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: String(session.user.email).toLowerCase() },
      select: {
        id: true,
        name: true,
        headline: true,
        aboutMe: true,
        location: true,
        workPreferences: true,
        skillsJson: true,
        languagesJson: true,
        educationJson: true,
        certificationsJson: true,
        projectsJson: true,
        profileVisibility: true,
      },
    });

    if (!user?.id) {
      return res.status(404).json({ error: "User not found" });
    }

    const primaryResume =
      (await prisma.resume.findFirst({
        where: { userId: user.id, isPrimary: true },
        select: { id: true, content: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      })) ||
      (await prisma.resume.findFirst({
        where: { userId: user.id },
        select: { id: true, content: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }));

    const seekerContext = {
      userId: user.id,
      name: user.name || "",
      headline: user.headline || "",
      summary: user.aboutMe || "",
      location: user.location || "",
      workPreferences:
        user.workPreferences && typeof user.workPreferences === "object"
          ? user.workPreferences
          : {},
      skills: toArray(user.skillsJson),
      languages: toArray(user.languagesJson),
      education: toArray(user.educationJson),
      resume: extractResumeContext(primaryResume),
    };

// Compute profile signal score once for this seeker
    const profileSignalData = {
      headline: user.headline || "",
      aboutMe: user.aboutMe || "",
      skills: toArray(user.skillsJson),
      languages: toArray(user.languagesJson),
      education: toArray(user.educationJson),
      certifications: toArray(user.certificationsJson),
      projects: toArray(user.projectsJson),
      workPreferences: user.workPreferences && typeof user.workPreferences === "object"
        ? user.workPreferences : {},
      profileVisibility: user.profileVisibility || "",
      hasResume: Boolean(primaryResume?.id),
      primaryResume: primaryResume?.id ? { id: primaryResume.id } : null,
    };
    const profileSignals = classifySignals(profileSignalData);
    const profileVerdict = overallVerdict(profileSignals);
    const profileSignalScore = signalScoreToPercent(profileVerdict);
    const profileSignalLabel = profileVerdict?.label || null;
    const profileSignalBreakdown = {
      proven: profileVerdict?.proven ?? 0,
      partial: profileVerdict?.partial ?? 0,
      missing: profileVerdict?.missing ?? 0,
      priority: profileVerdict?.priority
        ? { label: profileVerdict.priority.label, gapReason: profileVerdict.priority.gapReason }
        : null,
      signals: profileSignals.map(s => ({
        key: s.key,
        label: s.label,
        status: s.status,
        gapReason: s.gapReason,
      })),
    };

    const alignedJobs = rankJobsBySeekerAlignment(jobs, seekerContext);

    const alignments = {};
    for (const job of alignedJobs) {
      if (!job?.id) continue;
      alignments[job.id] = {
        score: job.match,
        source: job.matchSource,
        tier: job.matchTier,
        reasons: job.alignmentReasons || [],
        evidence: job.alignmentEvidence || [],
        gaps: job.alignmentGaps || [],
      };
    }

    return res.status(200).json({
      alignments,
      jobs: alignedJobs,
      profileSignalScore,
      profileSignalLabel,
      profileSignalBreakdown,
    });
  } catch (err) {
    console.error("[jobs/alignment] error:", err);
    return res.status(500).json({ error: "Failed to calculate job alignment." });
  }
}