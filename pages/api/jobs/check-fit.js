pages/api/jobs/check-fit.js
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
        jobAlignFreeUses: true,
        jobAlignLastResetMonth: true,
      },
    });

    const plan = String(user?.plan || "FREE").toUpperCase();
    const limit = plan === "FREE" ? 3 : 15;

    const last = safe(user?.jobAlignLastResetMonth);
    const uses = Number(user?.jobAlignFreeUses || 0);

    if (last !== monthKey) {
      await tx.user.update({
        where: { id: userId },
        data: {
          jobAlignFreeUses: 1,
          jobAlignLastResetMonth: monthKey,
        },
      });

      return {
        allowed: true,
        remaining: limit - 1,
        tier: plan,
      };
    }

    if (uses >= limit) {
      return {
        allowed: false,
        remaining: 0,
        tier: plan,
      };
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        jobAlignFreeUses: { increment: 1 },
      },
    });

    return {
      allowed: true,
      remaining: Math.max(0, limit - (uses + 1)),
      tier: plan,
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

    const gate = await enforceJobFitGate(userId);

    if (!gate.allowed) {
      const limitText = gate.tier === "FREE" ? "3" : "15";

      return res.status(200).json({
        ok: true,
        upgrade: true,
        text: `Monthly Check My Alignment limit reached (${limitText}/month).`,
        structured: null,
        remaining: 0,
      });
    }

    const origin =
      process.env.NEXTAUTH_URL ||
      `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}`;

    const atsResponse = await fetch(`${origin}/api/ats-coach`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: req.headers.cookie || "",
      },
      body: JSON.stringify({
        jdText: req.body?.jdText || "",
        resumeData: req.body?.resumeData || {},
        context: { section: "overview" },
        jobMeta: req.body?.jobMeta || null,
        attemptCount: 1,
        internalBypassGate: true,
      }),
    });

    const data = await atsResponse.json();

    return res.status(200).json({
      ok: true,
      remaining: gate.remaining,
      hammer: data,
    });
  } catch (err) {
    console.error("[jobs/check-fit] error", err);

    return res.status(500).json({
      ok: false,
      error: "Failed to run Check My Alignment.",
    });
  }
}
