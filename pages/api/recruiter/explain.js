// pages/api/recruiter/explain.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

/**
 * Deterministic (non-LLM) explainability v1:
 * - Extract keywords from JD + resume
 * - Compute simple overlap score
 * - Build "reasons" with evidence sentences
 * - Return a shape compatible with your WHY drawer expectations
 * - Best-effort persist to RecruiterExplainRun (only if model exists + migration applied)
 */

const STOPWORDS = new Set([
  "a","an","and","are","as","at","be","but","by","for","from","has","have","had","he","her","his","i","if","in","into",
  "is","it","its","me","my","of","on","or","our","ours","she","so","than","that","the","their","them","then","there",
  "these","they","this","those","to","too","up","us","was","we","were","what","when","where","which","who","why","will",
  "with","you","your","yours",
  // common filler in resumes/JDs
  "responsible","responsibilities","required","requirements","preferred","ability","experience","including","ensure","work",
  "team","teams","using","use","used","within","across","support","manage","management","leading","lead","strong","skills",
  "knowledge","excellent","communication","collaborate","collaboration",
]);

function normalizeText(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function splitSentences(text) {
  const t = normalizeText(text);
  if (!t) return [];
  // Simple sentence split; good enough for v1
  return t
    .split(/(?<=[.!?])\s+|\n+/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function tokenize(text) {
  const t = normalizeText(text).toLowerCase();
  if (!t) return [];
  // Keep letters/numbers/+/# (for C++, C#, etc)
  const raw = t.match(/[a-z0-9+#]{2,}/g) || [];
  const tokens = raw
    .map((w) => w.trim())
    .filter(Boolean)
    .filter((w) => w.length >= 3 || w === "c#" || w === "c++")
    .filter((w) => !STOPWORDS.has(w));
  return tokens;
}

function uniq(arr) {
  return Array.from(new Set((arr || []).filter(Boolean)));
}

function topNByFrequency(tokens, n = 18) {
  const freq = new Map();
  for (const t of tokens) freq.set(t, (freq.get(t) || 0) + 1);
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
    .slice(0, n);
}

function overlapScore(jdKeywords, resumeKeywords) {
  const jd = new Set(jdKeywords);
  const rs = new Set(resumeKeywords);
  if (jd.size === 0) return 0;

  let hit = 0;
  for (const k of jd) if (rs.has(k)) hit += 1;

  // simple % with a slight curve to avoid 0/100 extremes
  const pct = Math.round((hit / jd.size) * 100);
  return Math.max(0, Math.min(100, pct));
}

function pickEvidenceForKeyword(keyword, resumeSentences, max = 2) {
  const k = String(keyword || "").toLowerCase();
  if (!k) return [];
  const hits = [];
  for (const s of resumeSentences) {
    const sl = s.toLowerCase();
    if (sl.includes(k)) {
      hits.push({
        text: s.length > 220 ? `${s.slice(0, 217)}…` : s,
        source: "Resume",
      });
      if (hits.length >= max) break;
    }
  }
  return hits;
}

function buildExplain(resumeText, jobDescription) {
  const resume = normalizeText(resumeText);
  const jd = normalizeText(jobDescription);

  const resumeTokens = tokenize(resume);
  const jdTokens = tokenize(jd);

  const jdTop = topNByFrequency(jdTokens, 18);
  const resumeTop = topNByFrequency(resumeTokens, 24);

  const score = overlapScore(jdTop, resumeTop);

  const resumeSentences = splitSentences(resume);

  const matched = jdTop.filter((k) => resumeTop.includes(k));
  const gaps = jdTop.filter((k) => !resumeTop.includes(k));

  const reasons = matched.slice(0, 8).map((k) => {
    const evidence = pickEvidenceForKeyword(k, resumeSentences, 2);
    return {
      requirement: `Keyword match: ${k}`,
      evidence: evidence.length
        ? evidence
        : [{ text: `Matched keyword "${k}" detected in resume text.`, source: "Resume" }],
    };
  });

  const strengths = matched.slice(0, 10);
  const gapsTop = gaps.slice(0, 10);

  const summaryParts = [];
  summaryParts.push(`Detected ${matched.length} of the top ${jdTop.length} JD signals in the resume.`);
  if (matched.length) summaryParts.push(`Top overlaps: ${matched.slice(0, 5).join(", ")}.`);
  if (gapsTop.length) summaryParts.push(`Not found: ${gapsTop.slice(0, 5).join(", ")}.`);
  const summary = summaryParts.join(" ");

  // Very light interview prompt generation (deterministic)
  const behavioral = [
    "Tell me about a time you had to handle competing priorities under a tight deadline.",
    "Describe a situation where you improved a process or workflow—what was the impact?",
    "How do you approach stakeholder communication when expectations change?",
  ];

  const occupational = []
    .concat(
      matched.slice(0, 3).map((k) => `Walk me through your hands-on experience with ${k}.`),
      gapsTop.slice(0, 2).map((k) => `How would you ramp up quickly on ${k} if needed?`)
    )
    .slice(0, 6);

  return {
    score,
    summary,
    reasons,
    skills: {
      matched: strengths,
      gaps: gapsTop,
      transferable: [],
    },
    trajectory: [],
    filters_triggered: [],
    strengths,
    gaps: gapsTop,
    interviewQuestions: { behavioral, occupational },
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
  // If Prisma client doesn't yet have the model (migration not applied), skip silently.
  if (!prisma || !prisma.recruiterExplainRun) return;

  try {
    await prisma.recruiterExplainRun.create({
      data: {
        recruiterUserId,
        accountKey: accountKey || "UNKNOWN",
        jobId: jobId || null,
        applicationId: applicationId || null,
        candidateUserId: candidateUserId || null,
        externalName: externalName || null,
        externalEmail: externalEmail || null,
        jobDescriptionText,
        resumeText,
        score: typeof result?.score === "number" ? result.score : null,
        summary: result?.summary || null,
        result,
      },
    });
  } catch (e) {
    // Don’t break the endpoint if persistence fails.
    console.error("[RecruiterExplain] persist failed (safe to ignore pre-migration):", e);
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

  const { resumeText, jobDescription, jobId, applicationId, candidateUserId, externalName, externalEmail } =
    req.body || {};

  if (!resumeText || !jobDescription) {
    return res.status(400).json({ error: "Missing resumeText or jobDescription" });
  }

  const recruiterUserId = session?.user?.id;
  if (!recruiterUserId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Pull accountKey from session first; fall back to DB lookup (keeps it consistent across pages)
  let accountKey = session?.user?.accountKey || null;

  if (!accountKey) {
    try {
      const u = await prisma.user.findUnique({
        where: { id: recruiterUserId },
        select: { accountKey: true },
      });
      accountKey = u?.accountKey || null;
    } catch (e) {
      console.error("[RecruiterExplain] accountKey lookup failed:", e);
    }
  }

  // Build deterministic explainability output (no LLM)
  const result = buildExplain(resumeText, jobDescription);

  // Best-effort persist (won’t break if model/migration not ready)
  await bestEffortPersistRun({
    recruiterUserId,
    accountKey,
    jobDescriptionText: normalizeText(jobDescription),
    resumeText: normalizeText(resumeText),
    result,
    jobId: jobId ?? null,
    applicationId: applicationId ?? null,
    candidateUserId: candidateUserId ?? null,
    externalName: externalName ?? null,
    externalEmail: externalEmail ?? null,
  });

  return res.status(200).json(result);
}
