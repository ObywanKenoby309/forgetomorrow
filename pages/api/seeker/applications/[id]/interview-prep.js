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
//
// Translation goal:
//   Raw WHY signal → seeker-facing interview preparation.
//   Do not expose recruiter/hiring-manager framing directly.
//   Translate into: likely validation, how to frame proof, and what story to prepare.

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import { buildExplain } from "@/lib/intelligence/whyEngine";

function safe(value = "") {
  return String(value || "").trim();
}

function safeLower(value = "") {
  return safe(value).toLowerCase();
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

function includesAny(text, terms = []) {
  const t = safeLower(text);
  return terms.some((term) => t.includes(String(term || "").toLowerCase()));
}

function cleanEngineReason(value) {
  const text = safe(value);
  if (!text) return "";

  const lower = text.toLowerCase();
  if (lower.includes("recruiter") || lower.includes("hiring manager") || lower.includes("provided resume text")) {
    return "";
  }

  return text;
}

const LEAD_PATTERNS = [
  "Lead with examples that show",
  "Anchor the conversation with examples that demonstrate",
  "Use early proof that shows",
  "Establish credibility early by highlighting",
];

const STORY_PATTERNS = [
  "Prepare a story where",
  "Be ready to discuss a situation where",
  "Have an example ready that shows how",
  "Think through a real example where",
];

const BRIDGE_PATTERNS = [
  "The goal is not to overclaim — it is to make the connection obvious.",
  "Do not apologize for adjacent experience. Translate it clearly.",
  "The interviewer should not have to infer the connection themselves.",
  "Frame the overlap directly instead of assuming it will be noticed.",
];

function pick(arr = [], seed = "") {
  if (!Array.isArray(arr) || arr.length === 0) return "";
  const s = String(seed || "");
  let total = 0;
  for (let i = 0; i < s.length; i++) total += s.charCodeAt(i);
  return arr[total % arr.length];
}

function capabilityGuidance(label = "") {
  const text = safeLower(label);
  const cleanLabel = safe(label) || "this capability";

  if (includesAny(text, ["customer service", "customer support", "client service", "support", "patron", "service delivery"])) {
    return {
      family: "customer_service",
      validation:
        "The interview is likely to test direct customer-facing issue handling, communication under pressure, de-escalation, and follow-through.",
      bridge:
        "Use an example where you owned a user or customer problem from intake to resolution, especially if expectations were unclear or emotions were high.",
      strength:
        "Lead with support examples that show calm communication, problem ownership, and reliable follow-through—not just task completion.",
      storyPrompt:
        `${pick(STORY_PATTERNS, cleanLabel)} someone needed help, the situation carried pressure or frustration, and you stayed accountable until the issue was resolved.`,
      questionTip:
        "Focus on the customer/user problem, how you clarified need, what you communicated, and how you closed the loop.",
    };
  }

  if (includesAny(text, ["desktop", "technical support", "help desk", "service desk", "endpoint", "device", "hardware", "software", "troubleshooting"])) {
    return {
      family: "technical_support",
      validation:
        "The interview is likely to test troubleshooting discipline, user communication, ticket ownership, escalation judgment, and ability to solve without overcomplicating the issue.",
      bridge:
        "Use a real support example that shows how you diagnosed the issue, communicated with the user, escalated only when appropriate, and documented the result.",
      strength:
        "Lead with examples where you combined technical troubleshooting with reliable service delivery and clear communication.",
      storyPrompt:
        `${pick(STORY_PATTERNS, cleanLabel)} you diagnosed a technical issue, kept the user informed, and drove the issue to resolution or the right escalation path.`,
      questionTip:
        "Be specific about scope, tools, diagnosis steps, escalation judgment, and measurable user or business impact.",
    };
  }

  if (includesAny(text, ["data", "analytics", "bi", "report", "kpi", "metrics", "analysis", "research"])) {
    return {
      family: "analysis",
      validation:
        "The interview is likely to test whether you can turn information into decisions, not just collect or report data.",
      bridge:
        "Use an example where your analysis changed a process, clarified a problem, improved visibility, or helped someone make a better decision.",
      strength:
        "Lead with examples where information capture, KPI review, reporting, or research led to an operational improvement.",
      storyPrompt:
        `${pick(STORY_PATTERNS, cleanLabel)} you used data, research, or pattern recognition to identify a problem and influence what happened next.`,
      questionTip:
        "Explain the question you were trying to answer, the information you used, the pattern you found, and what changed because of it.",
    };
  }

  if (includesAny(text, ["ux", "ui", "design", "user experience", "interface", "usability", "workflow", "friction"])) {
    return {
      family: "ux_ui",
      validation:
        "The interview may be testing whether you understand user friction, workflow clarity, and how people actually experience a tool or process.",
      bridge:
        "If you have improved a process, trained users, documented workflows, or reduced confusion, frame that as user-experience thinking even if your title was not UX/UI.",
      strength:
        "Lead with examples where you made a tool, process, knowledge base, or workflow easier for others to use.",
      storyPrompt:
        `${pick(STORY_PATTERNS, cleanLabel)} you noticed friction in a process or tool and made the experience clearer, faster, or easier for users.`,
      questionTip:
        "Talk about the user problem, the friction you saw, the change you made, and how the experience improved.",
    };
  }

  if (includesAny(text, ["sales", "business development", "revenue", "upsell", "product sales", "account"])) {
    return {
      family: "sales",
      validation:
        "The interview is likely to test whether you can recognize need, communicate value, and influence a decision without sounding transactional.",
      bridge:
        "Use an example where you listened first, identified what the person actually needed, and connected them to the right product, service, or next step.",
      strength:
        "Lead with examples that show consultative communication, not just selling activity.",
      storyPrompt:
        `${pick(STORY_PATTERNS, cleanLabel)} you uncovered a need, explained value clearly, and helped someone choose an appropriate solution.`,
      questionTip:
        "Show how you understood the need, built trust, handled hesitation, and created a useful outcome.",
    };
  }

  if (includesAny(text, ["training", "enablement", "knowledge", "documentation", "manual", "kb", "onboarding", "sme"])) {
    return {
      family: "enablement",
      validation:
        "The interview is likely to test whether you can make knowledge repeatable for others, not just perform the work yourself.",
      bridge:
        "Use an example where you documented a process, trained someone, standardized work, or reduced dependency on tribal knowledge.",
      strength:
        "Lead with examples where your documentation or training helped a team perform more consistently.",
      storyPrompt:
        `${pick(STORY_PATTERNS, cleanLabel)} you turned your knowledge into a process, guide, training, or resource others could use.`,
      questionTip:
        "Explain the gap, what you built, who used it, and how it improved consistency or speed.",
    };
  }

  if (includesAny(text, ["incident", "security", "risk", "compliance", "governance", "vulnerability", "quarantine", "p1", "p2"])) {
    return {
      family: "risk",
      validation:
        "The interview is likely to test judgment under pressure, risk awareness, escalation discipline, and how you communicate when stakes are high.",
      bridge:
        "Use an example where you followed process, escalated appropriately, protected the environment or customer, and kept the right people informed.",
      strength:
        "Lead with examples that show calm judgment, process discipline, and responsible escalation.",
      storyPrompt:
        `${pick(STORY_PATTERNS, cleanLabel)} a situation carried risk, urgency, or potential impact and you handled it responsibly.`,
      questionTip:
        "Focus on what was at risk, what decision you made, who needed to know, and how you protected the outcome.",
    };
  }

  if (includesAny(text, ["project", "deployment", "implementation", "rollout", "lifecycle", "ownership", "delivery"])) {
    return {
      family: "delivery",
      validation:
        "The interview is likely to test whether you can own work through completion, manage moving parts, and keep outcomes on track.",
      bridge:
        "Use an example where you coordinated people, tools, timing, or process details and delivered a completed outcome.",
      strength:
        "Lead with examples that show ownership from planning through execution and follow-through.",
      storyPrompt:
        `${pick(STORY_PATTERNS, cleanLabel)} you owned a project, rollout, or operational change from start to finish.`,
      questionTip:
        "Clarify scope, your role, what changed, obstacles handled, and the result.",
    };
  }

  return {
    family: "general",
    validation:
      `The interview is likely to test practical evidence of ${cleanLabel}, not just familiarity with the phrase.`,
    bridge:
      `Use your closest real example that proves scope, ownership, actions taken, and result connected to ${cleanLabel}.`,
    strength:
      `Lead with a concrete example that shows how you have applied ${cleanLabel} in real work.`,
    storyPrompt:
      `${pick(STORY_PATTERNS, cleanLabel)} you demonstrated your closest real experience with ${cleanLabel}: what happened, what you owned, what you did, and what changed.`,
    questionTip:
      "Answer with a concrete example: context, responsibility, actions, decisions, and measurable result.",
  };
}

function translateGapToPrep(gap) {
  const label = safe(gap?.label || gap?.requirement || gap?.skill || "");
  const rawWhy = safe(gap?.why_missing || gap?.description || "");
  const tier = safe(gap?.tier || "B");
  if (!label) return null;

  const guidance = capabilityGuidance(label);
  const engineReason = cleanEngineReason(rawWhy);

  const prepNote = engineReason
    ? `${engineReason} In the interview, be ready to bridge this with a specific example. ${guidance.bridge}`
    : `${guidance.validation} ${guidance.bridge}`;

  return {
    area: label,
    priority: tier === "A" ? "high" : tier === "B" ? "medium" : "low",
    prepNote,
    storyPrompt: guidance.storyPrompt,
  };
}

function translateStrengthToConfidence(strength) {
  const text = safe(
    typeof strength === "string"
      ? strength
      : strength?.seekerLabel || strength?.label || strength?.text || ""
  );

  if (!text) return null;

  const guidance = capabilityGuidance(text);
  const lead = pick(LEAD_PATTERNS, text);

  const coreStrength = safe(guidance.strength)
    .replace(/^Lead with examples that show\s+/i, "")
    .replace(/^Lead with support examples that show\s+/i, "")
    .replace(/^Lead with examples where\s+/i, "")
    .replace(/^Lead with a concrete example that shows\s+/i, "")
    .replace(/^Lead with\s+/i, "")
    .trim();

  return {
    area: text,
    note:
      `${lead} ${coreStrength.charAt(0).toLowerCase()}${coreStrength.slice(1)} ` +
      "This should be one of your early proof points so the conversation starts from demonstrated strength instead of only reacting to gaps.",
  };
}

function translateTransferableToBridge(signal) {
  const skill = safe(
    typeof signal === "string"
      ? signal
      : signal?.label || signal?.name || signal?.skill || ""
  );

  if (!skill) return null;

  const guidance = capabilityGuidance(skill);
  const bridgePattern = pick(BRIDGE_PATTERNS, skill);

  return {
    skill,
    note:
      `${guidance.bridge} ${bridgePattern} ` +
      "Make the overlap clear through ownership, process familiarity, transferable outcomes, and ramp speed. The point is not to claim identical experience; it is to show why the transition is credible.",
  };
}

function buildQuestionTip(question, type = "") {
  const q = safeLower(question);

  if (includesAny(q, ["competing priorities", "tight deadline", "prioritize", "pressure"])) {
    return "The interviewer is testing judgment under pressure. Explain what mattered most, what you deprioritized, who you communicated with, and what outcome followed.";
  }

  if (includesAny(q, ["process", "improved", "changed", "impact"])) {
    return "Show the before-and-after. Explain the friction you saw, what you changed, who it helped, and how the result was measured or noticed.";
  }

  if (includesAny(q, ["expectations shift", "customer", "needs change", "communicate"])) {
    return "Focus on communication discipline. Show how you clarified the new expectation, reset scope or timeline, and kept trust intact.";
  }

  if (includesAny(q, ["walk me through", "real example", "delivered outcomes"])) {
    const after = question.split(" in ").pop() || "";
    const guidance = capabilityGuidance(after);
    return guidance.questionTip;
  }

  if (type === "behavioral") {
    return "Use STAR, but keep it practical: what was happening, what you owned, what decision you made, what changed, and what the result proved.";
  }

  return "Be specific about tools, scope, ownership, decisions, and measurable outcome. Avoid generic claims—prove the capability with one real example.";
}

function buildInterviewQuestions(whyInterview) {
  if (!whyInterview) return [];

  const behavioral = safeArray(whyInterview.behavioral, 3)
    .map(q => safe(q))
    .filter(Boolean)
    .map(q => ({
      type: "behavioral",
      question: q,
      tip: buildQuestionTip(q, "behavioral"),
    }));

  const roleSpecific = safeArray(whyInterview.occupational || whyInterview.roleSpecific, 3)
    .map(q => safe(q))
    .filter(Boolean)
    .map(q => ({
      type: "role-specific",
      question: q,
      tip: buildQuestionTip(q, "role-specific"),
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

  const transferable = safeArray(why?.skills?.transferable, 6)
    .map(translateTransferableToBridge)
    .filter(Boolean)
    .filter((item, i, self) =>
      i === self.findIndex(t => t.skill.toLowerCase() === item.skill.toLowerCase())
    );

  const interviewQuestions = buildInterviewQuestions(why?.interviewQuestions);

  const storyBankPrompts = prepAreas.length > 0
    ? prepAreas.slice(0, 4).map(p => p.storyPrompt).filter(Boolean)
    : [
        "Prepare a story where you owned a project or problem from start to finish. Focus on scope, decisions, obstacles, and result.",
        "Be ready to discuss a situation where you had to learn quickly, adapt under pressure, and turn that learning into a useful outcome.",
        "Have an example ready that shows how you handled disagreement, changing expectations, or ambiguity without losing professionalism or momentum.",
        "Think through a real example where you solved a complex problem by breaking it down, communicating clearly, and following through.",
      ];

  const company = safe(job?.company) || "the company";
  const title = safe(job?.title) || "the role";

  const universalPrep = [
    {
      area: "Know the company",
      note: `Review ${company}'s mission, product/service, customer base, and recent public-facing updates. You want at least one reason why their work matters to you beyond needing a job.`,
      storyPrompt: null,
    },
    {
      area: "Know the role",
      note: `Read the ${title} description like an interviewer: identify the top 3 responsibilities, the top 3 requirements, and one example you can use for each.`,
      storyPrompt: null,
    },
    {
      area: "Your walk-away conditions",
      note: "Know your minimum acceptable compensation, role scope, schedule/work arrangement, and any deal-breakers before the conversation gets emotional.",
      storyPrompt: null,
    },
    {
      area: "Questions for them",
      note: "Prepare 3-5 questions that reveal expectations, success measures, team structure, and what a strong first 90 days would look like.",
      storyPrompt: null,
    },
  ];

  return { prepAreas, confidenceAreas, transferable, interviewQuestions, storyBankPrompts, universalPrep };
}

const UNIVERSAL_PREP_FALLBACK = [
  {
    area: "Know the company",
    note: "Review the company's mission, services/products, customers, and recent public-facing updates before the interview.",
    storyPrompt: null,
  },
  {
    area: "Know the role",
    note: "Identify the top responsibilities and prepare one proof story for each major requirement.",
    storyPrompt: null,
  },
  {
    area: "Your walk-away conditions",
    note: "Know your minimum acceptable compensation, role scope, schedule/work arrangement, and deal-breakers.",
    storyPrompt: null,
  },
  {
    area: "Questions for them",
    note: "Prepare questions that uncover expectations, success measures, team structure, and first-90-day priorities.",
    storyPrompt: null,
  },
];

const STORY_PROMPTS_FALLBACK = [
  "Prepare a story where you owned a project or problem from start to finish. Focus on scope, decisions, obstacles, and result.",
  "Be ready to discuss a situation where you had to learn quickly, adapt under pressure, and turn that learning into a useful outcome.",
  "Have an example ready that shows how you handled disagreement, changing expectations, or ambiguity without losing professionalism or momentum.",
  "Think through a real example where you solved a complex problem by breaking it down, communicating clearly, and following through.",
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
        id: true,
        status: true,
        jobId: true,
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
      const why = typeof stored === "object" ? stored : JSON.parse(stored);
      const prep = buildPrepPayload(why, app.job);

      return res.status(200).json({
        applicationId: appId,
        job: app.job ? { id: app.job.id, title: app.job.title, company: app.job.company } : null,
        resume: app.resume ? { id: app.resume.id, name: app.resume.name } : null,
        applicationStatus: app.status,
        hasIntelligence: true,
        fromCache: true,
        generatedAt: app.interviewPrep.generatedAt,
        intelligenceNote: "Your prep is powered by ForgeTomorrow alignment intelligence for this application.",
        ...prep,
      });
    }

    // ── Off-platform jobs — universal prep only, no engine ───────────────────
    if (!app.jobId || !app.job) {
      return res.status(200).json({
        applicationId: appId,
        job: null,
        resume: app.resume ? { id: app.resume.id, name: app.resume.name } : null,
        applicationStatus: app.status,
        hasIntelligence: false,
        fromCache: false,
        intelligenceNote: "ForgeTomorrow interview intelligence is available for jobs posted on ForgeTomorrow. For off-platform applications, use the universal prep guide below.",
        prepAreas: [],
        confidenceAreas: [],
        transferable: [],
        interviewQuestions: [],
        storyBankPrompts: STORY_PROMPTS_FALLBACK,
        universalPrep: UNIVERSAL_PREP_FALLBACK,
      });
    }

    // ── Pull resume — application resume first, then primary ─────────────────
    let resumeContent = app.resume?.content || null;
    let resumeId = app.resume?.id || null;
    let resumeName = app.resume?.name || null;

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
      resumeId = primary?.id || null;
      resumeName = primary?.name || null;
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
        result: why,
        resumeText: resumeText.slice(0, 20000),
        jobId: app.jobId,
      },
    });

    const prep = buildPrepPayload(why, app.job);

    return res.status(200).json({
      applicationId: appId,
      job: { id: app.job.id, title: app.job.title, company: app.job.company },
      resume: { id: resumeId, name: resumeName },
      applicationStatus: app.status,
      hasIntelligence: true,
      fromCache: false,
      generatedAt: new Date().toISOString(),
      intelligenceNote: "Your prep is powered by ForgeTomorrow alignment intelligence for this application.",
      ...prep,
    });

  } catch (err) {
    console.error("[api/seeker/applications/[id]/interview-prep] error:", err);
    return res.status(500).json({ error: "Failed to generate interview prep. Please try again." });
  }
}
