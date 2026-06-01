// pages/api/recruiter/explain.js
// Recruiter External Compare API — now wired to the canonical ForgeTomorrow WHY engine.
// WHY engine is the single source of truth for alignment scoring across seeker + recruiter surfaces.

import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from "@/lib/prisma";
import { buildExplain } from "@/lib/intelligence/whyEngine";

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeWhyResult(result) {
  const safeResult = result && typeof result === "object" ? result : {};

  const score =
    typeof safeResult.score === "number"
      ? safeResult.score
      : typeof safeResult.match?.score === "number"
        ? safeResult.match.score
        : null;

  const summary =
    typeof safeResult.summary === "string" && safeResult.summary.trim()
      ? safeResult.summary
      : typeof safeResult.match?.summary === "string"
        ? safeResult.match.summary
        : "Analysis complete.";

  return {
    ...safeResult,
    score,
    summary,
    strengths: Array.isArray(safeResult.strengths) ? safeResult.strengths : [],
    gaps: Array.isArray(safeResult.gaps) ? safeResult.gaps : [],
    reasons: Array.isArray(safeResult.reasons) ? safeResult.reasons : [],
    skills: {
      matched: Array.isArray(safeResult.skills?.matched) ? safeResult.skills.matched : [],
      gaps: Array.isArray(safeResult.skills?.gaps) ? safeResult.skills.gaps : [],
      transferable: Array.isArray(safeResult.skills?.transferable)
        ? safeResult.skills.transferable
        : Array.isArray(safeResult.signals?.transferable)
          ? safeResult.signals.transferable
          : [],
    },
    signals: {
      required: Array.isArray(safeResult.signals?.required) ? safeResult.signals.required : [],
      matched: Array.isArray(safeResult.signals?.matched) ? safeResult.signals.matched : [],
      not_yet_demonstrated: Array.isArray(safeResult.signals?.not_yet_demonstrated)
        ? safeResult.signals.not_yet_demonstrated
        : [],
      context_not_yet_demonstrated: Array.isArray(safeResult.signals?.context_not_yet_demonstrated)
        ? safeResult.signals.context_not_yet_demonstrated
        : [],
      transferable: Array.isArray(safeResult.signals?.transferable)
        ? safeResult.signals.transferable
        : [],
    },
    interviewQuestions: {
      behavioral: Array.isArray(safeResult.interviewQuestions?.behavioral)
        ? safeResult.interviewQuestions.behavioral
        : [],
      occupational: Array.isArray(safeResult.interviewQuestions?.occupational)
        ? safeResult.interviewQuestions.occupational
        : [],
    },
    match: {
      ...(safeResult.match && typeof safeResult.match === "object" ? safeResult.match : {}),
      score,
      summary,
    },
  };
}

async function bestEffortPersistRun({
  recruiterUserId,
  accountKey,
  jobDescriptionText,
  resumeText,
  result,
  jobId = null,
  applicationId = null,
  candidateUserId = null,
  externalName = null,
  externalEmail = null,
}) {
  if (!prisma || !prisma.recruiterExplainRun) return;

  try {
    return await prisma.recruiterExplainRun.create({
  data: {
    recruiterUserId,
    accountKey: accountKey || "UNKNOWN",
    jobId: jobId || null,
    applicationId: applicationId || null,
    candidateUserId: candidateUserId || null,
    externalName: externalName || null,
    externalEmail: externalEmail || null,
    jobDescription: jobDescriptionText || "",
    resumeText,
    score: typeof result?.score === "number" ? result.score : null,
    summary: result?.summary || null,
    result,
  },
});
  } catch (error) {
    console.error("[RecruiterExplain] persist failed (safe to ignore pre-migration):", error);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const {
    resumeText,
    jobDescription,
    jobId,
    applicationId,
    candidateUserId,
    externalName,
    externalEmail,
  } = req.body || {};

  if (!resumeText || !jobDescription) {
    return res.status(400).json({ error: "Missing resumeText or jobDescription" });
  }

  const recruiterUserId = session?.user?.id;
  if (!recruiterUserId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let accountKey = session?.user?.accountKey || null;

  if (!accountKey) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: recruiterUserId },
        select: { accountKey: true },
      });
      accountKey = user?.accountKey || null;
    } catch (error) {
      console.error("[RecruiterExplain] accountKey lookup failed:", error);
    }
  }

  const normalizedResumeText = normalizeText(resumeText);
  const normalizedJobDescription = normalizeText(jobDescription);

  const result = normalizeWhyResult(
    buildExplain(normalizedResumeText, normalizedJobDescription)
  );

  const savedRun = await bestEffortPersistRun({
    recruiterUserId,
    accountKey,
    jobDescriptionText: normalizedJobDescription,
    resumeText: normalizedResumeText,
    result,
    jobId: jobId ?? null,
    applicationId: applicationId ?? null,
    candidateUserId: candidateUserId ?? null,
    externalName: externalName ?? null,
    externalEmail: externalEmail ?? null,
  });

  return res.status(200).json({
  ...result,
  explainRunId: savedRun?.id || null,
});
}
