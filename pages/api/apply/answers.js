// pages/api/apply/answers.js
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production";

function getCookie(req, name) {
  try {
    const raw = req.headers?.cookie || "";
    const parts = raw.split(";").map((p) => p.trim());
    for (const p of parts) {
      if (p.startsWith(name + "=")) {
        return decodeURIComponent(p.slice(name.length + 1));
      }
    }
    return null;
  } catch {
    return null;
  }
}

function normalizeEmail(v) {
  const s = String(v || "").toLowerCase().trim();
  return s || null;
}

async function getAuthedUserId(req, res) {
  // 1) NextAuth session (server-side)
  const session = await getServerSession(req, res, authOptions);
  const sid = session?.user?.id;
  if (sid) return sid;

  // 2) JWT cookie fallback (if you use an "auth" cookie)
  const token = getCookie(req, "auth");
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = normalizeEmail(decoded?.email);
    if (!email) return null;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return user?.id || null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const userId = await getAuthedUserId(req, res);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { applicationId, answers } = req.body || {};
    const appId = Number(applicationId);
    if (!appId) return res.status(400).json({ error: "Missing applicationId" });

    const app = await prisma.application.findUnique({
      where: { id: appId },
      select: { id: true, userId: true },
    });

    if (!app) return res.status(404).json({ error: "Application not found" });
    if (app.userId !== userId)
      return res.status(403).json({ error: "Forbidden" });

    const safeAnswers = Array.isArray(answers) ? answers : [];
    if (safeAnswers.length === 0) {
      // No-op is allowed (client sometimes calls early)
      return res.status(200).json({ ok: true });
    }

    const ops = safeAnswers
      .filter((a) => a && typeof a === "object")
      .map((a) => ({
        questionKey: String(a.questionKey || "").trim(),
        value: a.value ?? null,
      }))
      .filter((a) => a.questionKey.length > 0)
      .map((a) =>
        prisma.applicationAnswer.upsert({
          where: {
            applicationId_questionKey: {
              applicationId: appId,
              questionKey: a.questionKey,
            },
          },
          update: { value: a.value },
          create: { applicationId: appId, questionKey: a.questionKey, value: a.value },
        })
      );

    if (ops.length === 0) return res.status(200).json({ ok: true });

    await prisma.$transaction(ops);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
