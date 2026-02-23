// pages/api/ai/send.js
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import jwt from "jsonwebtoken";

let prisma;
function getPrisma() {
  if (!prisma) prisma = new PrismaClient();
  return prisma;
}

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

async function resolveEffectiveUser(prisma, req, session) {
  const sessionEmail = String(session?.user?.email || "").trim().toLowerCase();
  if (!sessionEmail) return null;

  const isPlatformAdmin = !!session?.user?.isPlatformAdmin;

  let effectiveUserId = null;

  if (isPlatformAdmin) {
    const imp = readCookie(req, "ft_imp");
    if (imp) {
      try {
        const decoded = jwt.verify(imp, process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production");
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
      "Got it. I’m your Seeker Buddy. For now, I’m in DB-wired mode (AI generation is next). " +
      "Tell me what you’re working on: resume alignment, applications pipeline, profile upgrades, incentives, or a 30/60/90 plan."
    );
  }
  if (mode === "COACH") {
    return (
      "Got it. I’m your Coach Buddy. DB wiring is live; AI generation is next. " +
      "Tell me the client goal and what you want to produce (resume feedback, roadmap, interview prep, session plan)."
    );
  }
  if (mode === "RECRUITER") {
    return (
      "Got it. I’m your Recruiter Buddy. DB wiring is live; AI generation is next. " +
      "Tell me what you’re doing: JD cleanup, candidate evaluation, pipeline steps, or explainability packet prep."
    );
  }
  return "Got it. DB wiring is live; AI generation is next.";
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

// ✅ NEW: Strict mode guardrails (no site paths needed)
function buildModeGuardrails(mode) {
  if (mode === "SEEKER") {
    return [
      "Hard rules:",
      "- You are helping a job seeker execute job search tasks.",
      "- You MAY give resume improvement guidance, JD alignment steps, application strategy, interview prep, and profile improvement.",
      "- You MUST NOT act as a hiring decision-maker or give recruiter-side pipeline instructions as if the user is the recruiter.",
      "- If the user is asking to evaluate a candidate for hiring, tell them to switch to Recruiter Buddy.",
    ].join("\n");
  }

  if (mode === "COACH") {
    return [
      "Hard rules:",
      "- You are helping a coach support a client with structured outputs (plans, feedback, session structure).",
      "- You MAY translate tool outputs into coaching actions and homework.",
      "- You MUST NOT make recruiter-side hiring decisions.",
      "- If the user is asking how to apply personally, suggest switching to Seeker Buddy unless they are explicitly coaching a client.",
    ].join("\n");
  }

  if (mode === "RECRUITER") {
    return [
      "Hard rules:",
      "- You are helping a recruiter make hiring decisions and run recruiter workflows.",
      "- You MAY discuss resumes only as evaluation artifacts (evidence, gaps, interview probes).",
      "- You MUST NOT coach the user on how to write or optimize THEIR OWN resume, how to apply for jobs, or job-seeker outreach strategy.",
      "- If the user is asking for job-seeker resume/application coaching, tell them to switch to Seeker Buddy.",
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

  const seekerHit = seekerSignals.some((s) => text.includes(s));
  const recruiterHit = recruiterSignals.some((s) => text.includes(s));

  if (threadMode === "RECRUITER" && seekerHit && !recruiterHit) {
    return {
      handoffTo: "SEEKER",
      reply:
        "This question is job-seeker coaching (resume/application execution). " +
        "Please switch to **Seeker Buddy** so I can help you improve your resume and apply strategically.",
    };
  }

  if (threadMode === "SEEKER" && recruiterHit && !seekerHit) {
    return {
      handoffTo: "RECRUITER",
      reply:
        "This question is recruiter decision support (candidate evaluation/pipeline). " +
        "Please switch to **Recruiter Buddy** so I can help you assess evidence, gaps, and next steps.",
    };
  }

  // Coach stays flexible; we only handoff if it’s very obvious
  if (threadMode === "COACH" && recruiterHit && !seekerHit) {
    return {
      handoffTo: "RECRUITER",
      reply:
        "This looks like recruiter-side candidate decisioning. " +
        "Please switch to **Recruiter Buddy** for evaluation/pipeline guidance.",
    };
  }

  if (threadMode === "COACH" && seekerHit && !recruiterHit) {
    // Coach can still support a client, but if it reads like personal seeker execution, handoff
    return {
      handoffTo: "SEEKER",
      reply:
        "If this is your personal job search (resume/applications), switch to **Seeker Buddy**. " +
        "If you’re coaching a client, tell me: 'Coaching a client' and the goal, and I’ll stay in Coach mode.",
    };
  }

  return null;
}

function buildSystemPrompt(mode, context) {
  const base =
    "You are ForgeTomorrow's in-platform AI Buddy. " +
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

  const pageLine = pageBits.length ? `Client context: ${pageBits.join(" | ")}` : "Client context: (none)";

  // ✅ NEW: append guardrails (no path mapping needed)
  const guardrails = buildModeGuardrails(mode);

  return [base, modeLine, pageLine, guardrails].join("\n");
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
      temperature: 0.3,
      max_tokens: 350,
    });

    const text = resp?.choices?.[0]?.message?.content;
    const out = String(text || "").trim();
    return out || null;
  } catch (e) {
    console.error("[ai/send] OpenAI generation error:", e?.message || e);
    return null;
  }
}

async function generateAssistantReply({ threadMode, context, threadId, prisma, lastUserContent }) {
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

  const history = Array.isArray(recent) ? recent.map((m) => ({ role: m.role, content: m.content })) : [];

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
  const prisma = getPrisma();

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