// pages/api/jobs/check-fit.js
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

function safe(value = "") {
  return String(value || "").trim();
}

function monthKeyUTC() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
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

function normalizeCompareText(value) {
  return safe(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanHammerPayload(payload) {
  if (!payload || typeof payload !== "object") return payload;

  const structured =
    payload.structured && typeof payload.structured === "object"
      ? { ...payload.structured }
      : null;

  if (!structured) return payload;

  const tips = Array.isArray(payload.tips) ? payload.tips : [];

  const positiveCandidates = [
    structured?.strongestSignal,
    structured?.strongestAlignment,
    tips[0],
  ];

  if (Array.isArray(structured?.improvementActions)) {
    for (const action of structured.improvementActions) {
      if (action?.positiveSignal) positiveCandidates.push(action.positiveSignal);
    }
  }

  const strongest = positiveCandidates.map(safe).find(Boolean);
  const strongestKey = normalizeCompareText(strongest);

  if (strongestKey) {
    const rawSignalGaps = Array.isArray(structured.signalGaps)
      ? structured.signalGaps
      : [];

    const filteredSignalGaps = rawSignalGaps.filter(
      (gap) => normalizeCompareText(gap) !== strongestKey
    );

    structured.signalGaps = filteredSignalGaps;

    if (normalizeCompareText(structured.primaryGap) === strongestKey) {
      structured.primaryGap = filteredSignalGaps[0] || "";
    }

    if (normalizeCompareText(structured.biggestGap) === strongestKey) {
      structured.biggestGap = filteredSignalGaps[0] || structured.primaryGap || "";
    }
  }

  return {
    ...payload,
    structured,
  };
}

async function resolveUserId(session) {
  const directId = session?.user?.id;
  if (directId) return String(directId);

  const email = safe(session?.user?.email).toLowerCase();
  if (!email) return null;

  const u = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  return u?.id ? String(u.id) : null;
}

async function enforceJobFitGate(userId) {
  const monthKey = monthKeyUTC();

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        resumeAlignFreeUses: true,
        resumeAlignLastResetMonth: true,
      },
    });

    const plan = String(user?.plan || "FREE").toUpperCase();
    const limit = plan === "FREE" ? 3 : 15;

    const last = safe(user?.resumeAlignLastResetMonth);
    const uses = Number(user?.resumeAlignFreeUses || 0);

    if (last !== monthKey) {
      await tx.user.update({
        where: { id: userId },
        data: {
          resumeAlignFreeUses: 1,
          resumeAlignLastResetMonth: monthKey,
        },
      });

      return {
        allowed: true,
        remaining: limit - 1,
        tier: plan,
        limit,
      };
    }

    if (uses >= limit) {
      return {
        allowed: false,
        remaining: 0,
        tier: plan,
        limit,
      };
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        resumeAlignFreeUses: { increment: 1 },
      },
    });

    return {
      allowed: true,
      remaining: Math.max(0, limit - (uses + 1)),
      tier: plan,
      limit,
    };
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const userId = await resolveUserId(session);

    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const primaryResume =
      (await prisma.resume.findFirst({
        where: { userId, isPrimary: true },
        select: { id: true, content: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      })) ||
      (await prisma.resume.findFirst({
        where: { userId },
        select: { id: true, content: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }));

    const resumeData = normalizeResumeTemplateData(primaryResume?.content);

    if (!resumeData) {
      return res.status(400).json({
        ok: false,
        error: "Primary resume not found or resume content is not valid JSON.",
      });
    }

    const gate = await enforceJobFitGate(userId);

    if (!gate.allowed) {
      return res.status(200).json({
        ok: true,
        upgrade: true,
        text: `Monthly Check My Alignment limit reached (${gate.limit}/month).`,
        structured: null,
        remaining: 0,
        limit: gate.limit,
        tier: gate.tier,
      });
    }

    const origin =
      process.env.NEXTAUTH_URL ||
      `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}`;

    const atsResponse = await fetch(`${origin}/api/ats-coach`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: req.headers.cookie || "",
      },
      body: JSON.stringify({
        jdText: req.body?.jdText || "",
        resumeData,
        context: { section: "overview", keyword: null },
        missing: {},
        jobMeta: req.body?.jobMeta || null,
        attemptCount: 1,
        internalBypassGate: true,
      }),
    });

    const contentType = atsResponse.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await atsResponse.json()
      : { ok: false, error: await atsResponse.text() };

    if (!atsResponse.ok || !data?.ok) {
      return res.status(502).json({
        ok: false,
        error: data?.error || "Hammer alignment request failed.",
      });
    }

    return res.status(200).json({
      ok: true,
      remaining: gate.remaining,
      limit: gate.limit,
      tier: gate.tier,
      hammer: cleanHammerPayload(data),
    });
  } catch (err) {
    console.error("[jobs/check-fit] error", err);

    return res.status(500).json({
      ok: false,
      error: "Failed to run Check My Alignment.",
    });
  }
}
