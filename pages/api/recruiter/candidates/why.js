// pages/api/recruiter/candidates/why.js
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normStr(v) {
  return String(v || "").trim();
}

function splitCsv(v) {
  return normStr(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function lc(s) {
  return String(s || "").toLowerCase();
}

function includesCI(hay, needle) {
  const h = lc(hay);
  const n = lc(needle);
  if (!h || !n) return false;
  return h.includes(n);
}

function uniq(arr) {
  return Array.from(new Set((arr || []).filter(Boolean)));
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Deterministic WHY builder (works for: manual filters, automation filters, optional jobId)
function buildExplain({ candidate, job, filters }) {
  const headline = normStr(candidate.headline);
  const aboutMe = normStr(candidate.aboutMe);
  const location = normStr(candidate.location);
  const candSkills = Array.isArray(candidate.skillsJson) ? candidate.skillsJson : [];
  const candLang = Array.isArray(candidate.languagesJson) ? candidate.languagesJson : [];

  const f = filters && typeof filters === "object" ? filters : {};
  const fQ = normStr(f.q);
  const fLoc = normStr(f.location);
  const fBool = normStr(f.bool);
  const fSummaryKeywords = normStr(f.summaryKeywords);
  const fJobTitle = normStr(f.jobTitle);
  const fSkills = splitCsv(f.skills);
  const fLanguages = splitCsv(f.languages);

  const jobTitle = job ? normStr(job.title) : "";
  const jobDesc = job ? normStr(job.description) : "";

  const triggered = [];
  if (fQ) triggered.push(`Name/role: ${fQ}`);
  if (fLoc) triggered.push(`Location: ${fLoc}`);
  if (fBool) triggered.push(`Boolean: ${fBool}`);
  if (fSummaryKeywords) triggered.push(`Summary keywords: ${fSummaryKeywords}`);
  if (fJobTitle) triggered.push(`Job title: ${fJobTitle}`);
  if (fSkills.length) triggered.push(`Skills: ${fSkills.join(", ")}`);
  if (fLanguages.length) triggered.push(`Languages: ${fLanguages.join(", ")}`);
  if (job) triggered.push(`Job context: ${jobTitle || "Selected job"}`);

  const reasons = [];

  // Role/title alignment
  const titleNeedle = fJobTitle || jobTitle || fQ;
  if (titleNeedle && (includesCI(headline, titleNeedle) || includesCI(aboutMe, titleNeedle))) {
    reasons.push({
      requirement: `Title/role alignment: ${titleNeedle}`,
      evidence: [
        headline ? { text: `Headline: ${headline}`, source: "Profile" } : null,
        includesCI(aboutMe, titleNeedle)
          ? { text: `About: contains "${titleNeedle}"`, source: "Profile" }
          : null,
      ].filter(Boolean),
    });
  }

  // Location
  if (fLoc && includesCI(location, fLoc)) {
    reasons.push({
      requirement: `Location match: ${fLoc}`,
      evidence: [{ text: `Location: ${location}`, source: "Profile" }],
    });
  }

  // Summary keywords (aboutMe)
  if (fSummaryKeywords && includesCI(aboutMe, fSummaryKeywords)) {
    reasons.push({
      requirement: `Keyword match: ${fSummaryKeywords}`,
      evidence: [{ text: `About: contains "${fSummaryKeywords}"`, source: "Profile" }],
    });
  }

  // Boolean placeholder behavior matches index.js (searched in aboutMe)
  if (fBool && includesCI(aboutMe, fBool)) {
    reasons.push({
      requirement: `Boolean intent found: ${fBool}`,
      evidence: [{ text: `About: contains "${fBool}"`, source: "Profile" }],
    });
  }

  // Skills
  let matchedSkills = [];
  let gapSkills = [];

  if (fSkills.length) {
    const candSkillsLC = candSkills.map(lc);
    matchedSkills = fSkills.filter((s) => candSkillsLC.includes(lc(s)));
    gapSkills = fSkills.filter((s) => !candSkillsLC.includes(lc(s)));

    reasons.push({
      requirement: `Skills matched (${matchedSkills.length}/${fSkills.length})`,
      evidence: [
        matchedSkills.length
          ? { text: `Matched: ${matchedSkills.join(", ")}`, source: "Skills" }
          : { text: `Requested: ${fSkills.join(", ")}`, source: "Skills" },
      ],
    });
  } else if (job && jobDesc && candSkills.length) {
    const hits = candSkills.filter((s) => includesCI(jobDesc, s));
    if (hits.length) {
      matchedSkills = uniq(hits).slice(0, 12);
      reasons.push({
        requirement: `Skills aligned with job description`,
        evidence: [{ text: `Job mentions: ${matchedSkills.join(", ")}`, source: "Job + Skills" }],
      });
    }
  } else if (candSkills.length) {
    matchedSkills = candSkills.slice(0, 8);
    reasons.push({
      requirement: `Skills present in profile`,
      evidence: [{ text: `Listed: ${matchedSkills.join(", ")}`, source: "Skills" }],
    });
  }

  // Languages
  if (fLanguages.length) {
    const candLangLC = candLang.map(lc);
    const matchedLang = fLanguages.filter((s) => candLangLC.includes(lc(s)));
    if (matchedLang.length) {
      reasons.push({
        requirement: `Language match`,
        evidence: [{ text: `Matched: ${matchedLang.join(", ")}`, source: "Profile" }],
      });
    }
  }

  // Score = alignment with recruiter intent (filters/job). No job = intent score.
  const checks = [];
  if (fLoc) checks.push(includesCI(location, fLoc) ? 1 : 0);
  if (fSummaryKeywords) checks.push(includesCI(aboutMe, fSummaryKeywords) ? 1 : 0);
  if (fBool) checks.push(includesCI(aboutMe, fBool) ? 1 : 0);
  if (fJobTitle) checks.push(includesCI(headline, fJobTitle) || includesCI(aboutMe, fJobTitle) ? 1 : 0);
  if (fQ) checks.push(includesCI(candidate.name, fQ) || includesCI(headline, fQ) || includesCI(aboutMe, fQ) ? 1 : 0);

  let skillScore = null;
  if (fSkills.length) {
    skillScore = matchedSkills.length / fSkills.length;
  }

  const base = checks.length ? checks.reduce((a, b) => a + b, 0) / checks.length : 0;
  const weighted = skillScore == null ? base : base * 0.4 + skillScore * 0.6;

  const score = clamp(Math.round(weighted * 100), 0, 100);

  const firstName = normStr(candidate.name).split(" ")[0] || "Candidate";
  const summaryBits = [];
  if (fSkills.length) summaryBits.push(`${matchedSkills.length}/${fSkills.length} requested skills`);
  if (fLoc) summaryBits.push(includesCI(location, fLoc) ? "location matches" : "location differs");
  if (fJobTitle || jobTitle) summaryBits.push("role/title signal present");
  if (!summaryBits.length && candSkills.length) summaryBits.push("profile signals present");

  const summary = `${firstName} aligns based on ${summaryBits.join(", ")}.`;

  return {
    score,
    summary,
    reasons: reasons.slice(0, 10),
    skills: {
      matched: matchedSkills.slice(0, 24),
      gaps: gapSkills.slice(0, 24),
      transferable: [],
    },
    trajectory: [],
    filters_triggered: triggered,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const { candidateId, jobId = null, filters = null } = req.body || {};

    if (!candidateId) {
      return res.status(400).json({ error: "Missing candidateId" });
    }

    // IMPORTANT: candidate list is sourced from User table
    const candidate = await prisma.user.findUnique({
      where: { id: candidateId },
      select: {
        id: true,
        name: true,
        headline: true,
        aboutMe: true,
        location: true,
        skillsJson: true,
        languagesJson: true,
      },
    });

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    let job = null;
    if (jobId) {
      job = await prisma.job.findUnique({
        where: { id: jobId },
        select: { id: true, title: true, description: true },
      });

      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
    }

    const explain = buildExplain({ candidate, job, filters });
    return res.status(200).json(explain);
  } catch (err) {
    console.error("[WHY] error:", err);
    return res.status(500).json({ error: "WHY explanation failed." });
  }
}
