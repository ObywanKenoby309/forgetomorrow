// pages/api/recruiter/candidates/why.js
// Forge WHY endpoint
// Uses the same Forge intelligence engine as Internal Candidate Search.
// Pulls candidate profile + saved primary resume, falling back to most recently updated saved resume.

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { explainCandidate, orderCandidatesBySignalRelevance } from "@/lib/intelligence/forgeSearchEngine";
import jwt from "jsonwebtoken";

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

async function resolveEffectiveRecruiterId(req, session) {
  const isPlatformAdmin = !!session?.user?.isPlatformAdmin;
  if (!isPlatformAdmin) return null;

  const imp = readCookie(req, "ft_imp");
  if (!imp) return null;

  try {
    const decoded = jwt.verify(
      imp,
      process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production"
    );

    if (decoded && typeof decoded === "object" && decoded.targetUserId) {
      return String(decoded.targetUserId);
    }
  } catch {
    // ignore invalid/expired cookie
  }

  return null;
}

function normStr(v) {
  return String(v || "").trim();
}

function splitCsv(v) {
  return normStr(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function toArrayJson(v) {
  if (Array.isArray(v)) return v.map((x) => String(x || "").trim()).filter(Boolean);
  return [];
}

function dedupeCaseInsensitive(arr) {
  const out = [];
  const seen = new Set();

  for (const raw of Array.isArray(arr) ? arr : []) {
    const t = String(raw || "").trim();
    if (!t) continue;

    const key = t.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(t);
  }

  return out;
}

function toEducationObjects(v) {
  if (Array.isArray(v)) {
    return v
      .map((x) => {
        if (!x || typeof x !== "object") return null;

        return {
          id: x.id ? String(x.id) : null,
          school: x.school ? String(x.school) : "",
          degree: x.degree ? String(x.degree) : "",
          field: x.field ? String(x.field) : "",
          startYear: x.startYear ? String(x.startYear) : "",
          endYear: x.endYear ? String(x.endYear) : "",
        };
      })
      .filter(Boolean);
  }

  if (typeof v === "string") {
    const parsed = safeJsonParse(v);
    if (Array.isArray(parsed)) return toEducationObjects(parsed);
  }

  return [];
}

function getWorkPreferencesObject(v) {
  if (v && typeof v === "object" && !Array.isArray(v)) return v;
  return {};
}

function getPreferredLocationsFromWorkPreferences(workPreferences) {
  const prefs = getWorkPreferencesObject(workPreferences);

  const raw =
    prefs.preferredLocations ??
    prefs.locations ??
    prefs.locationPreferences ??
    prefs.preferredLocation ??
    prefs.location ??
    [];

  if (Array.isArray(raw)) {
    return dedupeCaseInsensitive(
      raw.map((x) => {
        if (typeof x === "string") return x;
        if (x && typeof x === "object") {
          return x.label || x.name || x.value || x.location || "";
        }
        return "";
      })
    );
  }

  if (typeof raw === "string") {
    return dedupeCaseInsensitive(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );
  }

  return [];
}

function getWorkStatusFromWorkPreferences(workPreferences) {
  const prefs = getWorkPreferencesObject(workPreferences);
  return prefs.workStatus || prefs.currentWorkStatus || prefs.status || "";
}

function getPreferredWorkTypeFromWorkPreferences(workPreferences) {
  const prefs = getWorkPreferencesObject(workPreferences);
  return prefs.preferredWorkType || prefs.workType || prefs.employmentType || "";
}

function getRelocateFromWorkPreferences(workPreferences) {
  const prefs = getWorkPreferencesObject(workPreferences);
  return prefs.willingToRelocate ?? prefs.relocate ?? prefs.relocation ?? "";
}

function extractRootFromResumeContent(contentStr) {
  const parsed = typeof contentStr === "string" ? safeJsonParse(contentStr) : null;
  if (!parsed || typeof parsed !== "object") return null;
  return parsed?.data && typeof parsed.data === "object" ? parsed.data : parsed;
}

function extractExperienceFromResumeContent(contentStr) {
  const root = extractRootFromResumeContent(contentStr);
  if (!root || typeof root !== "object") return [];

  const list =
    (Array.isArray(root.workExperiences) && root.workExperiences) ||
    (Array.isArray(root.experiences) && root.experiences) ||
    (Array.isArray(root.experience) && root.experience) ||
    [];

  if (!Array.isArray(list)) return [];

  return list
    .map((exp) => {
      const title = exp?.title || exp?.jobTitle || exp?.role || "";
      const company = exp?.company || "";
      const start = exp?.startDate || exp?.start || "";
      const end = exp?.endDate || exp?.end || "";
      const range = [start, end].filter(Boolean).join(" - ") || exp?.range || "";

      const highlightsRaw =
        exp?.highlights ||
        exp?.bullets ||
        exp?.description ||
        exp?.details ||
        [];

      let highlights = [];

      if (Array.isArray(highlightsRaw)) {
        highlights = highlightsRaw.map((x) => String(x || "").trim()).filter(Boolean);
      } else if (typeof highlightsRaw === "string") {
        highlights = highlightsRaw
          .split(/\r?\n/g)
          .map((x) => String(x || "").trim())
          .filter(Boolean);
      }

      return {
        title: String(title || "").trim(),
        company: String(company || "").trim(),
        range: String(range || "").trim(),
        from: String(start || "").trim(),
        to: String(end || "").trim(),
        highlights,
      };
    })
    .filter((e) => e.title || e.company || e.range || (e.highlights && e.highlights.length));
}

function extractSkillsFromResumeContent(contentStr) {
  const root = extractRootFromResumeContent(contentStr);
  if (!root || typeof root !== "object") return [];

  const skills =
    (Array.isArray(root.skills) && root.skills) ||
    (Array.isArray(root.skillList) && root.skillList) ||
    [];

  return dedupeCaseInsensitive(skills.map((s) => String(s || "").trim()).filter(Boolean));
}

function extractEducationFromResumeContent(contentStr) {
  const root = extractRootFromResumeContent(contentStr);
  if (!root || typeof root !== "object") return [];

  const list =
    (Array.isArray(root.educationList) && root.educationList) ||
    (Array.isArray(root.education) && root.education) ||
    [];

  if (!Array.isArray(list)) return [];

  return list
    .map((edu) => {
      if (typeof edu === "string") return edu;
      if (!edu || typeof edu !== "object") return null;

      return {
        school: edu.school || edu.institution || "",
        degree: edu.degree || "",
        field: edu.field || edu.fieldOfStudy || "",
        startYear: edu.startYear || "",
        endYear: edu.endYear || "",
      };
    })
    .filter(Boolean);
}

function chooseBestResume(resumes) {
  const list = Array.isArray(resumes) ? resumes : [];
  if (!list.length) return null;

  const primary = list.find((r) => r?.isPrimary);
  if (primary) return primary;

  return list[0] || null;
}

function buildFiltersTriggered(filters, job) {
  const f = filters && typeof filters === "object" ? filters : {};

  const triggered = [];

  if (normStr(f.q)) triggered.push(`Name/role: ${normStr(f.q)}`);
  if (normStr(f.location)) triggered.push(`Location: ${normStr(f.location)}`);
  if (normStr(f.bool)) triggered.push(`Boolean: ${normStr(f.bool)}`);
  if (normStr(f.summaryKeywords)) triggered.push(`Summary keywords: ${normStr(f.summaryKeywords)}`);
  if (normStr(f.jobTitle)) triggered.push(`Job title: ${normStr(f.jobTitle)}`);
  if (normStr(f.workStatus)) triggered.push(`Work status: ${normStr(f.workStatus)}`);
  if (normStr(f.preferredWorkType)) triggered.push(`Work type: ${normStr(f.preferredWorkType)}`);
  if (normStr(f.relocate || f.willingToRelocate)) {
    triggered.push(`Relocate: ${normStr(f.relocate || f.willingToRelocate)}`);
  }

  const skills = splitCsv(f.skills);
  const languages = splitCsv(f.languages);
  const education = splitCsv(f.education);

  if (skills.length) triggered.push(`Skills: ${skills.join(", ")}`);
  if (languages.length) triggered.push(`Languages: ${languages.join(", ")}`);
  if (education.length) triggered.push(`Education: ${education.join(", ")}`);

  if (job) triggered.push(`Job context: ${job.title || "Selected job"}`);

  return triggered;
}

function buildForgeCandidate({ candidate, bestResume }) {
  const workPreferencesObj = getWorkPreferencesObject(candidate.workPreferences);

  const profileSkillsArr = dedupeCaseInsensitive(toArrayJson(candidate.skillsJson));
  const resumeSkillsArr = bestResume?.content
    ? extractSkillsFromResumeContent(bestResume.content)
    : [];

  const experience = bestResume?.content
    ? extractExperienceFromResumeContent(bestResume.content)
    : [];

  const profileEducation = toEducationObjects(candidate.educationJson);
  const resumeEducation = bestResume?.content
    ? extractEducationFromResumeContent(bestResume.content)
    : [];

  const preferredLocations = getPreferredLocationsFromWorkPreferences(workPreferencesObj);
  const resolvedWorkStatus = getWorkStatusFromWorkPreferences(workPreferencesObj);
  const resolvedPreferredWorkType = getPreferredWorkTypeFromWorkPreferences(workPreferencesObj);
  const resolvedRelocate = getRelocateFromWorkPreferences(workPreferencesObj);

  return {
    id: candidate.id,
    userId: candidate.id,
    name: candidate.name || "Unnamed",
    email: candidate.email || null,

    title: candidate.headline || "",
    currentTitle: candidate.headline || "",
    role: candidate.headline || "",
    headline: candidate.headline || "",
    summary: candidate.aboutMe || "",

    location: candidate.location || "",

    workPreferences: workPreferencesObj,
    preferredLocations,
    workStatus: resolvedWorkStatus,
    preferredWorkType: resolvedPreferredWorkType,
    willingToRelocate: resolvedRelocate,

    skills: profileSkillsArr.length > 0 ? profileSkillsArr : resumeSkillsArr,
    skillsProfile: profileSkillsArr,
    skillsResume: resumeSkillsArr,
    skillsSource:
      profileSkillsArr.length > 0 && resumeSkillsArr.length > 0
        ? "profile+primary_resume"
        : profileSkillsArr.length > 0
        ? "profile"
        : resumeSkillsArr.length > 0
        ? "primary_resume"
        : "none",

    education: resumeEducation.length > 0 ? resumeEducation : profileEducation,
    languages: toArrayJson(candidate.languagesJson),
    experience,

    resumeId: bestResume?.id || null,
    resumeSource: bestResume?.isPrimary ? "primary" : bestResume?.id ? "latest_saved" : "none",
    resumeUpdatedAt: bestResume?.updatedAt || null,
  };
}

function toWhyResponse({ forgeCandidate, filters, job }) {
  const ranked = orderCandidatesBySignalRelevance([forgeCandidate], filters || {}, {
    minScore: 0,
  });

  const scored = ranked?.[0] || forgeCandidate;
  const explained = explainCandidate(scored, filters || {});

  const matchedEvidence = Array.isArray(scored.matchEvidence) ? scored.matchEvidence : [];
  const matchedReasons = Array.isArray(scored.matchReasons) ? scored.matchReasons : [];
  const matchedGaps = Array.isArray(scored.matchGaps) ? scored.matchGaps : [];

  const firstName = normStr(scored.name).split(" ")[0] || "Candidate";
  const summary =
    explained?.summary && explained.summary !== "No strong signal was detected for the current recruiter search."
      ? `${firstName}: ${explained.summary}`
      : `${firstName} aligns based on visible profile and saved primary resume signals.`;

  const reasons = matchedEvidence.length
    ? matchedEvidence.map((item) => ({
        requirement: item.label || item.type || "Signal",
        evidence: [
          {
            text: item.text || "Signal found.",
            source: item.type || "Forge Brain",
          },
        ],
        points: item.points,
      }))
    : Array.isArray(explained?.reasons)
    ? explained.reasons
    : [];

  const trajectory = Array.isArray(scored.experience)
    ? scored.experience
        .slice(0, 8)
        .map((exp) => ({
          title: exp.title || "",
          company: exp.company || "",
          from: exp.from || exp.start || "",
          to: exp.to || exp.end || "",
        }))
        .filter((t) => t.title || t.company)
    : [];

  return {
    score: typeof scored.match === "number" ? scored.match : explained?.score ?? null,
    summary,
    reasons: reasons.slice(0, 12),

    skills: {
      matched: Array.isArray(scored.skills) ? scored.skills.slice(0, 24) : [],
      gaps: matchedGaps.slice(0, 24),
      transferable: [],
    },

    trajectory,
    filters_triggered: buildFiltersTriggered(filters, job),

    matchTier: scored.matchTier || explained?.tier || null,
    matchReasons: matchedReasons,
    matchEvidence: matchedEvidence,
    matchGaps: matchedGaps,

    resumeId: scored.resumeId || null,
    resumeSource: scored.resumeSource || "none",
    resumeUpdatedAt: scored.resumeUpdatedAt || null,
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

  const impersonatedRecruiterId = await resolveEffectiveRecruiterId(req, session);
  void impersonatedRecruiterId;

  try {
    const { candidateId, jobId = null, filters = null } = req.body || {};

    if (!candidateId) {
      return res.status(400).json({ error: "Missing candidateId" });
    }

    const candidate = await prisma.user.findUnique({
      where: { id: candidateId },
      select: {
        id: true,
        name: true,
        email: true,
        headline: true,
        aboutMe: true,
        location: true,
        workPreferences: true,
        skillsJson: true,
        languagesJson: true,
        educationJson: true,
      },
    });

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    const resumes = await prisma.resume.findMany({
      where: { userId: candidateId },
      select: {
        id: true,
        userId: true,
        content: true,
        updatedAt: true,
        isPrimary: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    const bestResume = chooseBestResume(resumes);

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

    const effectiveFilters =
      filters && typeof filters === "object"
        ? {
            ...filters,
            jobTitle: normStr(filters.jobTitle) || normStr(job?.title) || "",
            summaryKeywords: normStr(filters.summaryKeywords),
          }
        : {
            jobTitle: normStr(job?.title),
          };

    const forgeCandidate = buildForgeCandidate({ candidate, bestResume });
    const explain = toWhyResponse({ forgeCandidate, filters: effectiveFilters, job });

    return res.status(200).json(explain);
  } catch (err) {
    console.error("[WHY] error:", err);
    return res.status(500).json({ error: "WHY explanation failed." });
  }
}
