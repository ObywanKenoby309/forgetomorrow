// pages/api/admin/impersonation/start.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production";

function cleanEmail(v) {
  return String(v || "").trim().toLowerCase();
}

function cleanText(v) {
  return String(v || "").trim();
}

function setCookie(res, cookie) {
  const prev = res.getHeader("Set-Cookie");
  if (!prev) {
    res.setHeader("Set-Cookie", cookie);
  } else if (Array.isArray(prev)) {
    res.setHeader("Set-Cookie", [...prev, cookie]);
  } else {
    res.setHeader("Set-Cookie", [prev, cookie]);
  }
}

function buildCookie(name, value, opts = {}) {
  const {
    httpOnly = true,
    secure = true,
    sameSite = "Lax",
    path = "/",
    maxAge = 60 * 60, // 1 hour
  } = opts;

  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (path) parts.push(`Path=${path}`);
  if (typeof maxAge === "number") parts.push(`Max-Age=${maxAge}`);
  if (sameSite) parts.push(`SameSite=${sameSite}`);
  if (secure) parts.push("Secure");
  if (httpOnly) parts.push("HttpOnly");
  return parts.join("; ");
}

// ✅ Ticket validation helpers
function isNoTicket(reason) {
  return reason === "NO-TICKET";
}

function isLikelyTicketId(reason) {
  // Prisma CUIDs are lowercase alphanumeric and long
  return /^[a-z0-9]{20,}$/i.test(reason);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Auth
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // Must be platform admin
  const isPlatformAdmin = !!session?.user?.isPlatformAdmin;
  if (!isPlatformAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const targetEmail = cleanEmail(req.body?.email);
  if (!targetEmail) {
    return res.status(400).json({ error: "Missing email" });
  }

  // ✅ UPDATED: reason validation (ticket id OR NO-TICKET)
  const reason = cleanText(req.body?.reason);
  if (!reason || (!isNoTicket(reason) && !isLikelyTicketId(reason))) {
    return res.status(400).json({
      error: "Reason must be a valid ticket ID or NO-TICKET",
    });
  }

  // Resolve actor + target
  const actor = await prisma.user.findUnique({
    where: { email: cleanEmail(session.user.email) },
    select: { id: true, email: true },
  });

  if (!actor?.id) {
    return res.status(404).json({ error: "Actor not found" });
  }

  const target = await prisma.user.findUnique({
    where: { email: targetEmail },
    select: { id: true, email: true, role: true, plan: true, accountKey: true },
  });

  if (!target?.id) {
    return res.status(404).json({ error: "Target user not found" });
  }

  // Create impersonation token (1 hour)
  const token = jwt.sign(
    {
      type: "impersonation",
      actorUserId: actor.id,
      targetUserId: target.id,
      targetEmail: target.email,
      reason,
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  // HttpOnly cookie used by server-side auth checks
  setCookie(
    res,
    buildCookie("ft_imp", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      path: "/",
      maxAge: 60 * 60,
    })
  );

  // UI flag cookie (NOT HttpOnly)
  setCookie(
    res,
    buildCookie("ft_imp_active", "1", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      path: "/",
      maxAge: 60 * 60,
    })
  );

  // Audit
  await prisma.auditLog.create({
    data: {
      actorUserId: actor.id,
      impersonatedUserId: target.id,
      action: "IMPERSONATION_START",
      metadata: {
        targetEmail: target.email,
        targetRole: target.role,
        targetPlan: target.plan,
        targetAccountKey: target.accountKey || null,
        reason,
      },
    },
  });

  return res.status(200).json({
    ok: true,
    target: { id: target.id, email: target.email },
  });
}
