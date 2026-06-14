// pages/api/ai/thread.js
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

function normalizeMode(input) {
  const raw = String(input || "").trim().toLowerCase();
  if (raw === "seeker") return "SEEKER";
  if (raw === "coach") return "COACH";
  if (raw === "recruiter") return "RECRUITER";
  return "";
}

// Policy: impersonation allowed ONLY for recruiter accounts (via SD ticket process)
// Implementation: only Platform Admin + ft_imp cookie + target user role RECRUITER.
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
      select: { id: true, email: true, role: true, plan: true },
    });

    // ✅ HARD RULE: only impersonate recruiters
    if (!u?.id) return null;
    if (String(u.role || "") !== "RECRUITER") return null;

    return u;
  }

  const u = await prisma.user.findUnique({
    where: { email: sessionEmail },
    select: { id: true, email: true, role: true, plan: true },
  });

  return u?.id ? u : null;
}

export default async function handler(req, res) {
  let session;
  try {
    session = await getServerSession(req, res, authOptions);
  } catch (err) {
    console.error("[ai/thread] session error:", err);
  }

  if (!session?.user?.email) return res.status(401).json({ error: "Not authenticated" });

  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Mode can come from query string (GET) or request body (POST reset)
  const mode = normalizeMode(req.query?.mode || req.body?.mode);
  if (!mode) return res.status(400).json({ error: "Invalid mode" });

  const user = await resolveEffectiveUser(prisma, req, session);
  if (!user?.id) return res.status(404).json({ error: "User not found" });

  // Paid tiers only (NO seeker free gets buddies)
  if (String(user.plan || "") === "FREE") {
    return res.status(403).json({ error: "AI Buddies require a paid plan." });
  }

  // ✅ NEW CHAT / RESET THREAD
  if (req.method === "POST") {
    const action = String(req.body?.action || "").trim().toLowerCase();

    if (action !== "reset") {
      return res.status(400).json({ error: "Invalid action" });
    }

    try {
      await prisma.aiThread.updateMany({
        where: {
          userId: user.id,
          mode,
        },
        data: {
          mode: `${mode}_ARCHIVED_${Date.now()}`,
          updatedAt: new Date(),
        },
      });

      const newThread = await prisma.aiThread.create({
        data: {
          userId: user.id,
          mode,
        },
        select: {
          id: true,
          mode: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.status(200).json({
        ok: true,
        thread: newThread,
      });
    } catch (err) {
      console.error("[ai/thread] RESET error:", err);
      return res.status(500).json({ error: "Failed to reset AI thread." });
    }
  }

  try {
    const thread = await prisma.aiThread.upsert({
      where: { userId_mode_unique: { userId: user.id, mode } },
      update: { updatedAt: new Date() },
      create: { userId: user.id, mode },
      select: { id: true, mode: true, createdAt: true, updatedAt: true },
    });

    return res.status(200).json({ thread });
  } catch (err) {
    console.error("[ai/thread] GET error:", err);
    return res.status(500).json({ error: "Failed to load AI thread." });
  }
}