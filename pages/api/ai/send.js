// pages/api/ai/send.js
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import jwt from "jsonwebtoken";
import {
  buildStrikerContextPacket,
  summarizeContextPacket,
} from "@/lib/ai/strikerContextBuilders";
import {
  detectStrikerIntent,
  buildOperationalGuidance,
  buildRouteSystemHint,
  detectMappedHandoff,
} from "@/lib/ai/strikerRoutes";
import {
  getSurfacePlaybook,
} from "@/lib/ai/strikerSiteMap";
import {
  ROLE_IDENTITY,
  buildGuardRailBlock,
  PLATFORM_PRINCIPLES,
  FORGE_GLOSSARY,
} from "@/lib/ai/strikerWorkflowMap";

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
  const ctx = buildStrikerContextPacket(context || {});
  return ctx.surface || "general_workspace";
}

function buildSurfacePlaybook({ mode, context }) {
  const ctx = buildStrikerContextPacket(context || {});
  const surface = ctx.surface || "general_workspace";
  const playbook = getSurfacePlaybook?.(surface) || {};

  return {
    surface,
    outcome: playbook.outcome || "Help the user complete the current ForgeTomorrow task.",
    actions: Array.isArray(playbook.actions)
      ? playbook.actions
      : ["Ask only essential clarifying questions.", "Prefer concrete next actions, checklists, or direct outputs."],
    forwardTo: Array.isArray(playbook.forwardTo) ? playbook.forwardTo : [],
    guardRails: Array.isArray(playbook.guardRails) ? playbook.guardRails : [],
  };
}

function buildModeOutcomeRules(mode) {
  const normalized = String(mode || "").toUpperCase();
  const identity = ROLE_IDENTITY?.[normalized];

  const base = [
    "Outcome style:",
    "- Do not merely explain. Help the user complete the task.",
    "- Prefer exact next steps, concrete outputs, decision guidance, and tool direction.",
    "- Use ForgeTomorrow-specific paths, tools, and workflow language.",
    "- If context is missing, name what is missing and give the next best action anyway.",
  ];

  if (identity?.persona) base.push(`- Persona: ${identity.persona}`);
  if (identity?.mindset) base.push(`- Mindset: ${identity.mindset}`);
  if (identity?.notA) base.push(`- Not: ${identity.notA}`);

  return base.join("\n");
}


function buildForgeIntelligenceGlossary() {
  const glossary = FORGE_GLOSSARY || {};
  const lines = [
    "ForgeTomorrow intelligence definitions:",
    glossary["Discovery Match"] ? `- Discovery Match: ${glossary["Discovery Match"]}` : "- Discovery Match is broader internal candidate discovery, not external matching.",
    glossary["Targeting Match"] ? `- Targeting Match: ${glossary["Targeting Match"]}` : "- Targeting Match is stricter internal qualification, not external matching.",
    glossary["External Compare"] ? `- External Compare: ${glossary["External Compare"]}` : "- External Compare is separate recruiter workflow for external resumes/JDs.",
  ];

  return lines.join("\n");
}

function buildWorkspaceIntelligence(context) {
  const ctx = buildStrikerContextPacket(context || {});
  const blocks = [];

  const surface = buildSurfacePlaybook({ mode: String(ctx.mode || "").toUpperCase(), context: ctx });
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
    Array.isArray(PLATFORM_PRINCIPLES) && PLATFORM_PRINCIPLES.length
      ? `Platform principles:\n${PLATFORM_PRINCIPLES.slice(0, 12).map((p) => `- ${p}`).join("\n")}`
      : "",
    modeOutcomeRules,
    workspace ? `\n${workspace}` : "",
  ].filter(Boolean).join("\n");
}

// ✅ NEW: Strict mode guardrails (no site paths needed)
function buildModeGuardrails(mode) {
  const normalized = String(mode || "").toUpperCase();
  const block = buildGuardRailBlock?.(normalized);
  if (block) return block;

  return [
    "Hard rules:",
    "- Stay in the current mode and do not cross into another persona’s responsibilities.",
    "- Do not invent facts, evidence, scores, database state, or user data.",
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

  const ctx = buildStrikerContextPacket(context || {});
  const pageBits = [
    ctx?.pathname ? `pathname=${coerceStr(ctx.pathname, 200)}` : "",
    ctx?.asPath ? `asPath=${coerceStr(ctx.asPath, 200)}` : "",
    ctx?.mode ? `clientMode=${coerceStr(ctx.mode, 40)}` : "",
    ctx?.surface ? `surface=${coerceStr(ctx.surface, 80)}` : "",
    summarizeContextPacket(ctx) ? `workspace=${coerceStr(summarizeContextPacket(ctx), 500)}` : "",
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
  const normalizedContext = buildStrikerContextPacket(context || {});
  const route = detectStrikerIntent({
    message: lastUserContent,
    mode: threadMode,
    context: normalizedContext,
  });

  const operationalReply = buildOperationalGuidance({
    route,
    mode: threadMode,
    context: normalizedContext,
    message: lastUserContent,
  });

  if (operationalReply) return operationalReply;

  // ✅ Forge-specific direct answers BEFORE generic model generation
  const direct = buildDirectForgeAnswer({ threadMode, content: lastUserContent, context: normalizedContext });
  if (direct) return direct;

  // ✅ mapped handoff guardrail BEFORE generic generation
  const mappedHandoff = detectMappedHandoff({ threadMode, content: lastUserContent });
  if (mappedHandoff?.reply) return mappedHandoff.reply;

  // ✅ legacy fallback handoff guardrail
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
    context: {
      ...(normalizedContext || {}),
      route,
      routeHint: buildRouteSystemHint({ route, context: normalizedContext, mode: threadMode }),
    },
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

  // ✅ optional client context (page awareness, chrome, workspace intelligence, etc.)
  const rawContext = body.context && typeof body.context === "object" ? body.context : null;
  const context = rawContext ? buildStrikerContextPacket(rawContext) : null;

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