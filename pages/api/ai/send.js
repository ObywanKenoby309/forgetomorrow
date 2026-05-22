// pages/api/ai/send.js
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import jwt from "jsonwebtoken";

function readCookie(req, name) {
  try {
    const raw = req.headers?.cookie || "";
    const parts = raw.split(";").map((p) => p.trim());
    for (const p of parts) {
      if (p.startsWith(name + "="))
        return decodeURIComponent(p.slice(name.length + 1));
    }
    return "";
  } catch {
    return "";
  }
}

async function resolveEffectiveUser(prisma, req, session) {
  const sessionEmail = String(session?.user?.email || "")
    .trim()
    .toLowerCase();
  if (!sessionEmail) return null;

  const isPlatformAdmin = !!session?.user?.isPlatformAdmin;

  let effectiveUserId = null;

  if (isPlatformAdmin) {
    const imp = readCookie(req, "ft_imp");
    if (imp) {
      try {
        const decoded = jwt.verify(
          imp,
          process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production"
        );
        if (decoded && typeof decoded === "object" && decoded.targetUserId) {
          effectiveUserId = String(decoded.targetUserId);
        }
      } catch {
        // ignore invalid/expired cookie
      }
    }
  }

  if (effectiveUserId) {
    const u = await prisma.user.findUnique({
      where: { id: effectiveUserId },
      select: { id: true, role: true, plan: true },
    });
    if (!u?.id) return null;
    if (String(u.role || "") !== "RECRUITER") return null; // recruiter-only impersonation
    return u;
  }

  const u = await prisma.user.findUnique({
    where: { email: sessionEmail },
    select: { id: true, role: true, plan: true },
  });
  return u?.id ? u : null;
}

function buildPlaceholderReply(mode) {
  if (mode === "SEEKER") {
    return (
      "I’m your Seeker Striker. Tell me the outcome you want: apply to a job, strengthen your profile, improve a resume section, prep for an interview, or build a 30/60/90 plan. " +
      "I’ll guide the task step by step and help you finish it."
    );
  }
  if (mode === "COACH") {
    return (
      "I’m your Coach Striker. Tell me the client outcome: session plan, profile review, resume feedback, target strategy, roadmap, or homework. " +
      "I’ll turn the client context into a usable coaching action."
    );
  }
  if (mode === "RECRUITER") {
    return (
      "I’m your Recruiter Striker. Tell me the outcome: evaluate a candidate, refine a search, create targeting, prepare outreach, clean up a JD, or build a screening plan. " +
      "I’ll focus on evidence, risks, validation, and next action."
    );
  }
  return "Tell me the outcome you want and I’ll help you complete the task.";
}

// ----------------------------------------------------------------------------
// ✅ "Brain" wiring (safe + additive)
// - Uses DB history + client context when present
// - If OPENAI_API_KEY exists and the `openai` package is installed, it will generate
// - Otherwise it falls back to your placeholder reply (no breakage)
// ----------------------------------------------------------------------------

function safeJson(obj) {
  try {
    return obj && typeof obj === "object" ? obj : null;
  } catch {
    return null;
  }
}

function coerceStr(v, max = 400) {
  const s = String(v || "");
  if (s.length <= max) return s;
  return s.slice(0, max) + "…";
}

function normalizePathForSurface(context) {
  const ctx = safeJson(context) || {};
  return String(ctx.asPath || ctx.pathname || "").toLowerCase();
}

function compactList(value, maxItems = 8, maxChars = 80) {
  const arr = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,|\n]/g)
      : [];

  return arr
    .map((x) => coerceStr(String(x || "").trim(), maxChars))
    .filter(Boolean)
    .slice(0, maxItems);
}

function compactObjectLines(label, obj, maxPairs = 12) {
  const data = safeJson(obj);
  if (!data) return "";
  const lines = [];

  for (const [key, value] of Object.entries(data).slice(0, maxPairs)) {
    if (value == null || value === "") continue;

    if (Array.isArray(value)) {
      const list = compactList(value, 8, 70);
      if (list.length) lines.push(`- ${key}: ${list.join(", ")}`);
      continue;
    }

    if (typeof value === "object") {
      const nested = compactObjectLines(key, value, 6);
      if (nested) lines.push(`- ${key}: ${coerceStr(JSON.stringify(value), 280)}`);
      continue;
    }

    lines.push(`- ${key}: ${coerceStr(value, 180)}`);
  }

  if (!lines.length) return "";
  return `${label}:\n${lines.join("\n")}`;
}

function detectSurface(context) {
  const path = normalizePathForSurface(context);

  if (path.includes("/recruiter/candidate-center")) return "recruiter_candidate_center";
  if (path.includes("/recruiter/candidates")) return "internal_candidate_search";
  if (path.includes("/recruiter/explain")) return "external_candidate_compare";
  if (path.includes("/recruiter/pools")) return "talent_pools";
  if (path.includes("/recruiter/jobs") || path.includes("/recruiter/job")) return "recruiter_jobs";
  if (path.includes("/resume/create")) return "resume_builder";
  if (path.includes("/jobs")) return "job_search";
  if (path.includes("/anvil")) return "anvil";
  if (path.includes("/offer") || path.includes("negotiation")) return "offer_negotiation";
  if (path.includes("/coaching") && path.includes("/clients")) return "coaching_client";
  if (path.includes("/coaching")) return "coaching_workspace";
  if (path.includes("/profile") || path.includes("/u/")) return "portfolio_profile";
  if (path.includes("/seeker/messages") || path.includes("/signal")) return "signal_messages";
  if (path.includes("/feed")) return "career_signal_feed";

  return "general_workspace";
}

function buildSurfacePlaybook({ mode, context }) {
  const surface = detectSurface(context);

  const playbooks = {
    recruiter_candidate_center: {
      outcome: "Help the recruiter choose and complete the correct candidate workflow.",
      actions: [
        "Identify whether they need internal discovery, external compare, or talent pool organization.",
        "Route thinking toward the next concrete action, not a generic explanation.",
        "Clarify Discovery Match vs Targeting Match only when relevant.",
      ],
    },
    internal_candidate_search: {
      outcome: "Help the recruiter find, evaluate, compare, and act on ForgeTomorrow candidates.",
      actions: [
        "Use Discovery Match as broad semantic relevance.",
        "Use Targeting Match as stricter qualification / automation-ready scoring.",
        "Help refine search terms, targeting filters, candidate comparison, outreach, and WHY review.",
        "When a candidate is referenced, focus on evidence, risks, interview probes, and next action.",
      ],
    },
    external_candidate_compare: {
      outcome: "Help the recruiter turn an external resume + JD into an evidence-backed candidate read.",
      actions: [
        "Focus on evidence, fit, gaps, risk, and interview validation.",
        "Do not coach the candidate; support recruiter decision-making.",
        "Produce concise screening questions and next-step recommendations when asked.",
      ],
    },
    talent_pools: {
      outcome: "Help the recruiter organize candidates into reusable hiring pipelines.",
      actions: [
        "Suggest pool names, segmentation logic, follow-up timing, and next actions.",
        "Keep talent pool advice tied to recruiter workflow and evidence.",
      ],
    },
    recruiter_jobs: {
      outcome: "Help the recruiter create clearer, fairer, better-structured job posts.",
      actions: [
        "Separate role requirements from company boilerplate.",
        "Identify must-have versus nice-to-have requirements.",
        "Keep job descriptions clean, evidence-oriented, and candidate-readable.",
      ],
    },
    resume_builder: {
      outcome: "Help the seeker complete a stronger resume or application packet.",
      actions: [
        "Give exact section-level improvements.",
        "Preserve truthfulness and do not invent experience.",
        "Tie resume guidance to JD alignment, metrics, proof, and recruiter readability.",
      ],
    },
    job_search: {
      outcome: "Help the seeker evaluate jobs and decide what to do next.",
      actions: [
        "Help interpret fit, risk, missing evidence, and application strategy.",
        "Recommend next action: save, tailor, apply, skip, or research.",
      ],
    },
    anvil: {
      outcome: "Help the user complete career intelligence tasks inside The Anvil.",
      actions: [
        "Identify the active tool: profile development, offer negotiation, growth/pivot, project promotion, or resume/cover.",
        "Guide the user to complete the task with concrete inputs and outputs.",
      ],
    },
    offer_negotiation: {
      outcome: "Help the seeker prepare a grounded, professional offer negotiation strategy.",
      actions: [
        "Clarify leverage, constraints, compensation components, risk, and ask structure.",
        "Produce scripts and decision options when asked.",
      ],
    },
    coaching_client: {
      outcome: "Help the coach turn client evidence into session strategy and next steps.",
      actions: [
        "Focus on client goals, narrative, blockers, roadmap, and homework.",
        "Keep outputs coach-facing unless the user asks for client-facing language.",
      ],
    },
    coaching_workspace: {
      outcome: "Help the coach manage coaching work and produce useful client outputs.",
      actions: [
        "Help structure session plans, feedback, homework, and client strategy.",
      ],
    },
    portfolio_profile: {
      outcome: "Help interpret or improve professional profile/portfolio signal.",
      actions: [
        "Look for clarity, proof, positioning, project evidence, and recruiter readiness.",
        "Recommend portfolio improvements without inventing achievements.",
      ],
    },
    signal_messages: {
      outcome: "Help the user communicate clearly and move the conversation forward.",
      actions: [
        "Draft concise messages only when asked.",
        "Keep tone professional, human, and outcome-oriented.",
      ],
    },
    career_signal_feed: {
      outcome: "Help the user turn posts and network activity into career signal.",
      actions: [
        "Support post ideas, replies, professional positioning, and credibility-building.",
      ],
    },
    general_workspace: {
      outcome: "Help the user complete the current ForgeTomorrow task.",
      actions: [
        "Ask only essential clarifying questions.",
        "Prefer concrete next actions, checklists, or direct outputs.",
      ],
    },
  };

  const selected = playbooks[surface] || playbooks.general_workspace;

  return {
    surface,
    outcome: selected.outcome,
    actions: selected.actions,
  };
}

function buildModeOutcomeRules(mode) {
  if (mode === "SEEKER") {
    return [
      "Outcome style:",
      "- Do not merely explain. Help the seeker complete the task.",
      "- Prefer: exact next step, specific edits, scripts, checklists, decision guidance, and tool direction.",
      "- When the user is applying for a job, resume/JD fit leads; portfolio/profile supports.",
      "- If the user asks what to do next, give the next best action immediately.",
    ].join("\n");
  }

  if (mode === "COACH") {
    return [
      "Outcome style:",
      "- Do not merely explain. Help the coach produce client-ready strategy, session structure, homework, or review notes.",
      "- Translate career intelligence into coaching actions.",
      "- Separate coach-facing observations from client-facing language when useful.",
      "- Keep the coach in control; provide structure they can use immediately.",
    ].join("\n");
  }

  if (mode === "RECRUITER") {
    return [
      "Outcome style:",
      "- Do not merely explain. Help the recruiter complete recruiter work: evaluate, compare, shortlist, message, structure jobs, or build targeting.",
      "- For internal search, portfolio/profile signal leads; primary resume supports.",
      "- For application/JD evaluation, resume evidence leads; profile/portfolio supports.",
      "- Never present AI as the hiring decision-maker. Give evidence, risks, validation prompts, and next actions.",
    ].join("\n");
  }

  return [
    "Outcome style:",
    "- Help the user complete the current task with practical next actions.",
  ].join("\n");
}


function buildForgeIntelligenceGlossary() {
  return [
    "ForgeTomorrow intelligence definitions:",
    "- Discovery Match is NOT external candidate matching.",
    "- Discovery Match is the broader internal candidate discovery score used in Internal Candidate Search.",
    "- Discovery Match helps recruiters find candidates who may fit based on semantic relevance, adjacent-role logic, profile/portfolio signal, primary resume support, skills, preferences, and visible platform evidence.",
    "- Targeting Match is NOT external candidate matching.",
    "- Targeting Match is the stricter qualification score used when recruiter targeting filters, saved automation, or precision workflows are active.",
    "- Targeting Match is more conservative because it evaluates closer fit against explicit recruiter criteria such as title, skills, status, location, education, languages, work preferences, and saved targeting rules.",
    "- External Compare is a separate recruiter workflow for uploaded/pasted external resumes and job descriptions.",
    "- Internal Candidate Search, Targeting Match, and External Compare must not be described as the same thing.",
    "- If asked to explain Discovery vs Targeting, answer with the ForgeTomorrow definitions above and keep it short.",
  ].join("\\n");
}

function buildWorkspaceIntelligence(context) {
  const ctx = safeJson(context) || {};
  const blocks = [];

  const surface = buildSurfacePlaybook({ mode: String(ctx.mode || "").toUpperCase(), context });
  blocks.push(
    [
      "Workspace intelligence:",
      `- surface: ${surface.surface}`,
      `- desired outcome: ${surface.outcome}`,
      "- recommended operating actions:",
      ...surface.actions.map((a) => `  - ${a}`),
    ].join("\n")
  );

  const activeObjects = [
    ["Active candidate", ctx.activeCandidate || ctx.candidate || ctx.candidateContext],
    ["Active job", ctx.activeJob || ctx.job || ctx.jobContext],
    ["Active resume", ctx.activeResume || ctx.resume || ctx.resumeContext],
    ["Active portfolio/profile", ctx.activePortfolio || ctx.portfolio || ctx.profileContext],
    ["Active search", ctx.activeSearch || ctx.search || ctx.searchContext],
    ["Active targeting filters", ctx.activeTargetingFilters || ctx.targetingFilters || ctx.filters],
    ["Active ATS / Hammer signal", ctx.activeATS || ctx.ats || ctx.hammerContext],
    ["Active WHY / explainability signal", ctx.activeWhy || ctx.why || ctx.explainability],
    ["Active coaching client", ctx.activeClient || ctx.client || ctx.clientContext],
    ["Active Anvil tool", ctx.activeTool || ctx.tool || ctx.anvilTool],
  ];

  for (const [label, obj] of activeObjects) {
    const block = compactObjectLines(label, obj, 14);
    if (block) blocks.push(block);
  }

  if (ctx.selectedText) {
    blocks.push(`Selected text:\n${coerceStr(ctx.selectedText, 1200)}`);
  }

  return blocks.filter(Boolean).join("\n\n");
}

function buildStrikerOperatingSystem(mode, context) {
  const playbook = buildSurfacePlaybook({ mode, context });
  const workspace = buildWorkspaceIntelligence(context);
  const modeOutcomeRules = buildModeOutcomeRules(mode);

  return [
    "ForgeTomorrow Striker operating system:",
    "- You are not a generic chatbot.",
    "- You are an outcome-focused workspace assistant inside ForgeTomorrow.",
    "- Your job is to help the user finish the task in front of them.",
    "- Use ForgeTomorrow language and product concepts naturally.",
    "- Be direct, practical, and specific.",
    "- Do not over-explain unless the user asks for depth.",
    "- Prefer one strong recommendation over a menu of weak options.",
    "- If context is missing, say exactly what is missing and give the next best action anyway.",
    "- Do not invent facts, candidate evidence, profile data, resume content, scores, or database state.",
    `Current surface: ${playbook.surface}`,
    `Current outcome: ${playbook.outcome}`,
    buildForgeIntelligenceGlossary(),
    modeOutcomeRules,
    workspace ? `\n${workspace}` : "",
  ].filter(Boolean).join("\n");
}

// ✅ NEW: Strict mode guardrails (no site paths needed)
function buildModeGuardrails(mode) {
  if (mode === "SEEKER") {
    return [
      "Hard rules:",
      "- You are helping a job seeker execute job search tasks.",
      "- You MAY give resume improvement guidance, JD alignment steps, application strategy, interview prep, and profile improvement.",
      "- You MUST NOT write, rewrite, standardize, or generate job descriptions for posting (JD creation is recruiter-side work).",
      "- You MUST NOT act as a hiring decision-maker or give recruiter-side pipeline instructions as if the user is the recruiter.",
      "- If the user is asking to evaluate a candidate for hiring, tell them to switch to Recruiter Striker.",
    ].join("\n");
  }

  if (mode === "COACH") {
    return [
      "Hard rules:",
      "- You are helping a coach support a client with structured outputs (plans, feedback, session structure).",
      "- You MAY translate tool outputs into coaching actions and homework.",
      "- You MUST NOT make recruiter-side hiring decisions.",
      "- If the user is asking how to apply personally, suggest switching to Seeker Striker unless they are explicitly coaching a client.",
    ].join("\n");
  }

  if (mode === "RECRUITER") {
    return [
      "Hard rules:",
      "- You are helping a recruiter make hiring decisions and run recruiter workflows.",
      "- You MAY discuss resumes only as evaluation artifacts (evidence, gaps, interview probes).",
      "- You MUST NOT coach the user on how to write or optimize THEIR OWN resume, how to apply for jobs, or job-seeker outreach strategy.",
      "- If the user is asking for job-seeker resume/application coaching, tell them to switch to Seeker Striker.",
    ].join("\n");
  }

  return [
    "Hard rules:",
    "- Stay in the current mode and do not cross into another persona’s responsibilities.",
  ].join("\n");
}

// ✅ NEW: Simple handoff detection (no mapping; keyword-based)
function detectHandoff({ threadMode, content }) {
  const text = String(content || "").toLowerCase();

  // ✅ JD-building / job-posting asks (recruiter-side)
  const jdBuildSignals = [
    "write a job description",
    "create a job description",
    "build a job description",
    "generate a job description",
    "rewrite this job description",
    "clean up this job description",
    "standardize this job description",
    "jd template",
    "job description template",
    "job posting",
    "post this job",
    "create a posting",
    "requirements section",
    "responsibilities section",
  ];

  // seeker-ish asks (resume writing / applying)
  const seekerSignals = [
    "my resume",
    "update my resume",
    "rewrite my resume",
    "tailor my resume",
    "cover letter",
    "how do i apply",
    "apply for",
    "job search",
    "ats",
    "interview prep",
    "what should i say",
    "follow up",
    "recruiter message",
  ];

  // recruiter-ish asks (evaluate candidate / move to interview)
  const recruiterSignals = [
    "this candidate",
    "move to interview",
    "should we interview",
    "should we hire",
    "reject",
    "advance",
    "pipeline stage",
    "talent pool",
    "shortlist",
    "compare candidates",
    "job req",
    "job requirements",
    "screening",
  ];

  const jdBuildHit = jdBuildSignals.some((s) => text.includes(s));
  const seekerHit = seekerSignals.some((s) => text.includes(s));
  const recruiterHit = recruiterSignals.some((s) => text.includes(s));

  // ✅ If SEEKER asks to create/clean/standardize a JD or job posting → force Recruiter
  if (threadMode === "SEEKER" && jdBuildHit) {
    return {
      handoffTo: "RECRUITER",
      reply:
        "Creating/cleaning a job description for posting is recruiter-side work. " +
        "Please switch to **Recruiter Striker** so I can help you structure the JD and requirements correctly.",
    };
  }

  if (threadMode === "RECRUITER" && seekerHit && !recruiterHit) {
    return {
      handoffTo: "SEEKER",
      reply:
        "This question is job-seeker coaching (resume/application execution). " +
        "Please switch to **Seeker Striker** so I can help you improve your resume and apply strategically.",
    };
  }

  if (threadMode === "SEEKER" && recruiterHit && !seekerHit) {
    return {
      handoffTo: "RECRUITER",
      reply:
        "This question is recruiter decision support (candidate evaluation/pipeline). " +
        "Please switch to **Recruiter Striker** so I can help you assess evidence, gaps, and next steps.",
    };
  }

  // Coach stays flexible; we only handoff if it’s very obvious
  if (threadMode === "COACH" && recruiterHit && !seekerHit) {
    return {
      handoffTo: "RECRUITER",
      reply:
        "This looks like recruiter-side candidate decisioning. " +
        "Please switch to **Recruiter Striker** for evaluation/pipeline guidance.",
    };
  }

  if (threadMode === "COACH" && seekerHit && !recruiterHit) {
    // Coach can still support a client, but if it reads like personal seeker execution, handoff
    return {
      handoffTo: "SEEKER",
      reply:
        "If this is your personal job search (resume/applications), switch to **Seeker Striker**. " +
        "If you’re coaching a client, tell me: 'Coaching a client' and the goal, and I’ll stay in Coach mode.",
    };
  }

  return null;
}

function buildSystemPrompt(mode, context) {
  const base =
    "You are ForgeTomorrow's in-platform AI Striker. " +
    "Be concise, practical, and action-oriented. " +
    "Do not mention internal implementation details. " +
    "When page context is provided, tailor guidance to that surface.";

  const modeLine =
    mode === "SEEKER"
      ? "Mode: SEEKER. Help the user execute job search tasks inside ForgeTomorrow: resumes, applications, profile, 30/60/90."
      : mode === "COACH"
        ? "Mode: COACH. Help the coach support a client with structured outputs: plans, feedback, session structure."
        : mode === "RECRUITER"
          ? "Mode: RECRUITER. Help recruiter workflows: job templates, candidate review, pipeline steps, explainability."
          : `Mode: ${String(mode || "UNKNOWN")}.`;

  const ctx = safeJson(context) || {};
  const pageBits = [
    ctx?.pathname ? `pathname=${coerceStr(ctx.pathname, 200)}` : "",
    ctx?.asPath ? `asPath=${coerceStr(ctx.asPath, 200)}` : "",
    ctx?.mode ? `clientMode=${coerceStr(ctx.mode, 40)}` : "",
  ].filter(Boolean);

  const pageLine = pageBits.length
    ? `Client context: ${pageBits.join(" | ")}`
    : "Client context: (none)";

  const guardrails = buildModeGuardrails(mode);
  const strikerOperatingSystem = buildStrikerOperatingSystem(mode, context);

  return [
    base,
    modeLine,
    pageLine,
    guardrails,
    strikerOperatingSystem,
  ].join("\n\n");
}

function toOpenAiMessages(mode, systemPrompt, history) {
  // history: [{ role, content }]
  // Normalize into chat format
  const msgs = [{ role: "system", content: systemPrompt }];

  for (const m of history || []) {
    const r = String(m?.role || "");
    const c = String(m?.content || "");
    if (!c) continue;

    if (r === "assistant") msgs.push({ role: "assistant", content: c });
    else if (r === "user") msgs.push({ role: "user", content: c });
    // ignore "system" rows from DB for now (none expected)
  }

  return msgs;
}

async function tryGenerateWithOpenAI({ mode, context, history }) {
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) return null;

  // Dynamic import so builds don't explode if `openai` isn't installed yet.
  let OpenAI;
  try {
    const mod = await import("openai");
    OpenAI = mod?.default || mod?.OpenAI || null;
  } catch {
    return null;
  }
  if (!OpenAI) return null;

  const client = new OpenAI({ apiKey });

  const systemPrompt = buildSystemPrompt(mode, context);
  const messages = toOpenAiMessages(mode, systemPrompt, history);

  const model = String(process.env.OPENAI_MODEL || "gpt-4o-mini").trim();

  try {
    const resp = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.25,
      max_tokens: 700,
    });

    const text = resp?.choices?.[0]?.message?.content;
    const out = String(text || "").trim();
    return out || null;
  } catch (e) {
    console.error("[ai/send] OpenAI generation error:", e?.message || e);
    return null;
  }
}


function buildDirectForgeAnswer({ threadMode, content, context }) {
  const text = String(content || "").toLowerCase();

  const asksDiscoveryTargeting =
    (text.includes("discovery match") || text.includes("discover match")) &&
    text.includes("targeting match");

  if (asksDiscoveryTargeting) {
    return (
      "On this page, **Discovery Match** is the broader internal candidate discovery score. " +
      "It helps recruiters find people who may fit by using semantic relevance, adjacent-role logic, portfolio/profile signal, primary resume support, skills, and visible preferences.\\n\\n" +
      "**Targeting Match** is stricter. It is used for precision filters, saved automation, and repeatable recruiter workflows, so it weighs explicit criteria more tightly: title, skills, status, location, education, languages, work preferences, and targeting rules.\\n\\n" +
      "So the difference is simple: **Discovery helps you find possible fits. Targeting helps you qualify precise fits.**"
    );
  }

  return null;
}

async function generateAssistantReply({
  threadMode,
  context,
  threadId,
  prisma,
  lastUserContent,
}) {
  // ✅ Forge-specific direct answers BEFORE generic model generation
  const direct = buildDirectForgeAnswer({ threadMode, content: lastUserContent, context });
  if (direct) return direct;

  // ✅ NEW: handoff guardrail BEFORE any generation
  const handoff = detectHandoff({ threadMode, content: lastUserContent });
  if (handoff?.reply) return handoff.reply;

  // Pull recent history from DB (includes the latest user message already inserted)
  const recent = await prisma.aiMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true, createdAt: true },
    take: 40,
  });

  const history = Array.isArray(recent)
    ? recent.map((m) => ({ role: m.role, content: m.content }))
    : [];

  const generated = await tryGenerateWithOpenAI({
    mode: threadMode,
    context,
    history,
  });

  if (generated) return generated;

  // Fallback (always works)
  return buildPlaceholderReply(threadMode);
}

export default async function handler(req, res) {
  let session;
  try {
    session = await getServerSession(req, res, authOptions);
  } catch (err) {
    console.error("[ai/send] session error:", err);
  }

  if (!session?.user?.email) return res.status(401).json({ error: "Not authenticated" });

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await resolveEffectiveUser(prisma, req, session);
  if (!user?.id) return res.status(404).json({ error: "User not found" });

  if (String(user.plan || "") === "FREE") {
    return res.status(403).json({ error: "AI Buddies require a paid plan." });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const threadId = String(body.threadId || "").trim();
  const content = String(body.content || "").trim();

  // ✅ optional client context (page awareness, chrome, etc.)
  const context = body.context && typeof body.context === "object" ? body.context : null;

  if (!threadId) return res.status(400).json({ error: "Missing threadId" });
  if (!content) return res.status(400).json({ error: "Missing content" });
  if (content.length > 4000) return res.status(400).json({ error: "Message too long (max 4000)." });

  try {
    // ensure thread belongs to effective user; read mode for reply
    const thread = await prisma.aiThread.findFirst({
      where: { id: threadId, userId: user.id },
      select: { id: true, mode: true },
    });
    if (!thread?.id) return res.status(404).json({ error: "Thread not found" });

    // 1) Persist the user message immediately (DB-first)
    await prisma.aiMessage.create({
      data: {
        threadId,
        role: "user",
        content,
        // store context on the user message
        metadata: context || undefined,
      },
    });

    // 2) Generate assistant reply using DB history + context (brain)
    const reply = await generateAssistantReply({
      threadMode: thread.mode,
      context,
      threadId,
      prisma,
      // ✅ NEW: pass the last user content for router checks
      lastUserContent: content,
    });

    // 3) Persist assistant message + bump thread
    await prisma.$transaction([
      prisma.aiMessage.create({
        data: {
          threadId,
          role: "assistant",
          content: reply,
          // If you want the same context echoed on assistant rows for debugging/analytics
          metadata: context || undefined,
        },
      }),
      prisma.aiThread.update({
        where: { id: threadId },
        data: { updatedAt: new Date() },
      }),
    ]);

    const messages = await prisma.aiMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
      select: { id: true, role: true, content: true, createdAt: true, metadata: true },
      take: 200,
    });

    return res.status(200).json({ messages });
  } catch (err) {
    console.error("[ai/send] POST error:", err);
    return res.status(500).json({ error: "Failed to send message." });
  }
}