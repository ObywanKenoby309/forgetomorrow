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

  if (!threadId) return res.status(400).json({ error: "Missing threadId" });
  if (!content) return res.status(400).json({ error: "Missing content" });
  if (content.length > 4000) return res.status(400).json({ error: "Message too long (max 4000)." });

  try {
    // ensure thread belongs to effective user; read mode for placeholder reply
    const thread = await prisma.aiThread.findFirst({
      where: { id: threadId, userId: user.id },
      select: { id: true, mode: true },
    });
    if (!thread?.id) return res.status(404).json({ error: "Thread not found" });

    const reply = buildPlaceholderReply(thread.mode);

    await prisma.$transaction([
      prisma.aiMessage.create({
        data: {
          threadId,
          role: "user",
          content,
        },
      }),
      prisma.aiMessage.create({
        data: {
          threadId,
          role: "assistant",
          content: reply,
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
      select: { id: true, role: true, content: true, createdAt: true },
      take: 200,
    });

    return res.status(200).json({ messages });
  } catch (err) {
    console.error("[ai/send] POST error:", err);
    return res.status(500).json({ error: "Failed to send message." });
  }
}