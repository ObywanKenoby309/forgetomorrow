// pages/api/seeker/applications/[id]/interview-prep.js
//
// Seeker Interview Prep — powered by ForgeTomorrow WHY engine.
//
// Access model:
//   ALL paid seekers → unlimited (no gate — naturally rate-limited by interview stage)
//   On-platform jobs only (app.jobId must exist)
//   Off-platform jobs → universal prep only, no engine run
//
// Storage model:
//   First call  → run buildExplain() → persist to SeekerInterviewPrep → return
//   Any re-visit → read from SeekerInterviewPrep → return immediately (no engine)
//   Deleted when Application is deleted (cascade)

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import { buildExplain } from "@/lib/intelligence/whyEngine";

function safe(value = "") {
  return String(value || "").trim();
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

function safeArray(val, limit = 10) {
  if (Array.isArray(val)) return val.filter(Boolean).slice(0, limit);
  return [];
}

function translateGapToPrep(gap) {
  const label = safe(gap?.label || gap?.requirement || gap?.skill || "");
  const why   = safe(gap?.why_missing || gap?.description || "");
  const tier  = safe(gap?.tier || "B");
  if (!label) return null;

  const safeWhy = (why && !why.toLowerCase().includes("recruiter") && !why.toLowerCase().includes("hiring manager"))
    ? why
    : `Be ready to speak to your experience with ${label} using a specific example.`;

  return {
    area:        label,
    priority:    tier === "A" ? "high" : tier === "B" ? "medium" : "low",
    prepNote:    safeWhy,
    storyPrompt: `Think of a time you worked with ${label}. What was your role, what did you do, and what was the result?`,
  };
}

function translateStrengthToConfidence(strength) {
  const text = safe(
    typeof strength === "string"
      ? strength
      : strength?.seekerLabel || strength?.label || strength?.text || ""
  );
  if (!text) return null;
  return {
    area: text,
    note: "Your application shows strong evidence here. Don't wait to be asked — lead with it.",
  };
}

function buildInterviewQuestions(whyInterview) {
  if (!whyInterview) return [];
  const behavioral   = safeArray(whyInterview.behavioral, 3).map(q => ({
    type: "behavioral",    question: safe(q), tip: "Use the STAR format: Situation, Task, Action, Result.",
  }));
  const roleSpecific = safeArray(whyInterview.occupational || whyInterview.roleSpecific, 3).map(q => ({
    type: "role-specific", question: safe(q), tip: "Be specific about tools, scope, and measurable outcomes.",
  }));
  return [...behavioral, ...roleSpecific].filter(q => q.question);
}

function buildPrepPayload(why, job) {
  const rawGaps = safeArray(why?.signals?.not_yet_demonstrated, 8)
    .concat(safeArray(why?.gaps, 6));

  const prepAreas = rawGaps
    .map(translateGapToPrep)
    .filter(Boolean)
    .filter((item, i, self) =>
      i === self.findIndex(t => t.area.toLowerCase() === item.area.toLowerCase())
    );

  const rawStrengths = safeArray(why?.signals?.matched, 6)
    .concat(safeArray(why?.strengths, 5));

  const confidenceAreas = rawStrengths
    .map(translateStrengthToConfidence)
    .filter(Boolean)
    .filter((item, i, self) =>
      i === self.findIndex(t => t.area.toLowerCase() === item.area.toLowerCase())
    )
    .slice(0, 5);

  const transferable = safeArray(why?.skills?.transferable, 6).map(s => ({
    skill: safe(typeof s === "string" ? s : s?.label || s?.name || ""),
    note:  "You have adjacent experience here. Bridge it explicitly — don't assume the interviewer will connect the dots.",
  })).filter(s => s.skill);

  const interviewQuestions = buildInterviewQuestions(why?.interviewQuestions);

  const storyBankPrompts = prepAreas.length > 0
    ? prepAreas.slice(0, 4).map(p => p.storyPrompt).filter(Boolean)
    : [
        "Tell me about a project where you had full ownership. What was the scope, what did you do, what was the result?",
        "Describe a time you had to learn something new quickly under pressure. How did you approach it?",
        "Tell me about a time you disagreed with a decision. How did you handle it?",
        "What's the most complex problem you've solved in a role like this? Walk me through it.",
      ];

  const universalPrep = [
    { area: "Know the company",          note: `Research ${safe(job?.company) || "the company"}'s mission, recent news, products, and culture before the interview.`, storyPrompt: null },
    { area: "Know the role",             note: `Review every requirement in the ${safe(job?.title) || "job"} description. Be ready to speak to each one.`,            storyPrompt: null },
    { area: "Your walk-away conditions", note: "Know your minimum acceptable offer before you go in — compensation, role scope, work arrangement.",                    storyPrompt: null },
    { area: "Questions for them",        note: "Prepare 3-5 questions that show you've thought seriously about the role. Skip anything answered on their website.",    storyPrompt: null },
  ];

  return { prepAreas, confidenceAreas, transferable, interviewQuestions, storyBankPrompts, universalPrep };
}

const UNIVERSAL_PREP_FALLBACK = [
  { area: "Know the company",          note: "Research their mission, recent news, products, and culture.",     storyPrompt: null },
  { area: "Know the role",             note: "Review every requirement in the job description.",                storyPrompt: null },
  { area: "Your walk-away conditions", note: "Know your minimum acceptable offer before you go in.",            storyPrompt: null },
  { area: "Questions for them",        note: "Prepare 3-5 questions that show you've thought about the role.", storyPrompt: null },
];

const STORY_PROMPTS_FALLBACK = [
  "Tell me about a project where you had full ownership. What was the scope, what did you do, what was the result?",
  "Describe a time you had to learn something new quickly under pressure.",
  "Tell me about a time you disagreed with a decision. How did you handle it?",
  "What's the most complex problem you've solved in a role like this?",
];

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email && !session?.user?.id) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const userId = await resolveUserId(session);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const appId = Number(req.query.id);
  if (!Number.isFinite(appId)) {
    return res.status(400).json({ error: "Invalid application id" });
  }

  try {
    const app = await prisma.application.findFirst({
      where: { id: appId, userId },
      select: {
        id:     true,
        status: true,
        jobId:  true,
        job: {
          select: { id: true, title: true, company: true, description: true },
        },
        resume: {
          select: { id: true, name: true, content: true },
        },
        interviewPrep: {
          select: { id: true, result: true, generatedAt: true },
        },
      },
    });

    if (!app) return res.status(404).json({ error: "Application not found" });

    // ── Stored result — return immediately, no engine call ───────────────────
    if (app.interviewPrep?.result) {
      const stored = app.interviewPrep.result;
      const why    = typeof stored === "object" ? stored : JSON.parse(stored);
      const prep   = buildPrepPayload(why, app.job);

      return res.status(200).json({
        applicationId:     appId,
        job:               app.job ? { id: app.job.id, title: app.job.title, company: app.job.company } : null,
        resume:            app.resume ? { id: app.resume.id, name: app.resume.name } : null,
        applicationStatus: app.status,
        hasIntelligence:   true,
        fromCache:         true,
        generatedAt:       app.interviewPrep.generatedAt,
        intelligenceNote:  "Your prep is powered by ForgeTomorrow alignment intelligence for this application.",
        ...prep,
      });
    }

    // ── Off-platform jobs — universal prep only, no engine ───────────────────
    if (!app.jobId || !app.job) {
      return res.status(200).json({
        applicationId:     appId,
        job:               null,
        resume:            app.resume ? { id: app.resume.id, name: app.resume.name } : null,
        applicationStatus: app.status,
        hasIntelligence:   false,
        fromCache:         false,
        intelligenceNote:  "ForgeTomorrow interview intelligence is available for jobs posted on ForgeTomorrow. For off-platform applications, use the universal prep guide below.",
        prepAreas:          [],
        confidenceAreas:    [],
        transferable:       [],
        interviewQuestions: [],
        storyBankPrompts:   STORY_PROMPTS_FALLBACK,
        universalPrep:      UNIVERSAL_PREP_FALLBACK,
      });
    }

    // ── Pull resume — application resume first, then primary ─────────────────
    let resumeContent = app.resume?.content || null;
    let resumeId      = app.resume?.id      || null;
    let resumeName    = app.resume?.name    || null;

    if (!resumeContent) {
      const primary = await prisma.resume.findFirst({
        where: { userId, isPrimary: true },
        select: { id: true, name: true, content: true },
        orderBy: { updatedAt: "desc" },
      }) || await prisma.resume.findFirst({
        where: { userId },
        select: { id: true, name: true, content: true },
        orderBy: { updatedAt: "desc" },
      });
      resumeContent = primary?.content || null;
      resumeId      = primary?.id      || null;
      resumeName    = primary?.name    || null;
    }

    if (!resumeContent) {
      return res.status(400).json({ error: "No resume found. Add your primary resume before generating interview prep." });
    }

    const resumeData = normalizeResumeTemplateData(resumeContent);
    if (!resumeData) {
      return res.status(400).json({ error: "Resume content could not be parsed." });
    }

    const resumeText = extractResumeText(resumeData);
    if (!resumeText.trim()) {
      return res.status(400).json({ error: "Resume appears to be empty. Please update your resume and try again." });
    }

    const jdText = safe(app.job.description);
    if (!jdText) {
      return res.status(400).json({ error: "Job description not available for this posting." });
    }

    // ── Run WHY engine — same engine powering recruiter packets ──────────────
    const why = buildExplain(resumeText, jdText);

    // ── Persist permanently ──────────────────────────────────────────────────
    await prisma.seekerInterviewPrep.create({
      data: {
        applicationId: appId,
        result:        why,
        resumeText:    resumeText.slice(0, 20000),
        jobId:         app.jobId,
      },
    });

    const prep = buildPrepPayload(why, app.job);

    return res.status(200).json({
      applicationId:     appId,
      job:               { id: app.job.id, title: app.job.title, company: app.job.company },
      resume:            { id: resumeId, name: resumeName },
      applicationStatus: app.status,
      hasIntelligence:   true,
      fromCache:         false,
      generatedAt:       new Date().toISOString(),
      intelligenceNote:  "Your prep is powered by ForgeTomorrow alignment intelligence for this application.",
      ...prep,
    });

  } catch (err) {
    console.error("[api/seeker/applications/[id]/interview-prep] error:", err);
    return res.status(500).json({ error: "Failed to generate interview prep. Please try again." });
  }
}