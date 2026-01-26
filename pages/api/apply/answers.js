// pages/api/apply/answers.js
import { prisma } from "@/lib/prisma";
import { getClientSession } from "@/lib/auth-client";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const session = await getClientSession(req);
    const userId = session?.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { applicationId, answers } = req.body || {};
    const appId = Number(applicationId);
    if (!appId) return res.status(400).json({ error: "Missing applicationId" });

    const app = await prisma.application.findUnique({
      where: { id: appId },
      select: { id: true, userId: true },
    });

    if (!app) return res.status(404).json({ error: "Application not found" });
    if (app.userId !== userId) return res.status(403).json({ error: "Forbidden" });

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

    if (ops.length === 0) {
      return res.status(200).json({ ok: true });
    }

    await prisma.$transaction(ops);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
