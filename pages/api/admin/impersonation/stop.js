// pages/api/admin/impersonation/stop.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production";

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

function clearCookie(name, opts = {}) {
  const { httpOnly = true, secure = true, sameSite = "Lax", path = "/" } = opts;
  const parts = [
    `${name}=`,
    `Path=${path}`,
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    `SameSite=${sameSite}`,
  ];
  if (secure) parts.push("Secure");
  if (httpOnly) parts.push("HttpOnly");
  return parts.join("; ");
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const isPlatformAdmin = !!session?.user?.isPlatformAdmin;
  if (!isPlatformAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // Try to decode current impersonation cookie so we can audit stop properly
  let impersonatedUserId = null;
  try {
    const token = readCookie(req, "ft_imp");
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded && typeof decoded === "object") {
        impersonatedUserId = decoded.targetUserId || null;
      }
    }
  } catch {
    // ignore
  }

  const actor = await prisma.user.findUnique({
    where: { email: String(session.user.email).toLowerCase().trim() },
    select: { id: true },
  });

  if (actor?.id) {
    await prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        impersonatedUserId: impersonatedUserId || undefined,
        action: "IMPERSONATION_STOP",
        metadata: {},
      },
    });
  }

  // Clear cookies
  setCookie(
    res,
    clearCookie("ft_imp", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      path: "/",
    })
  );

  setCookie(
    res,
    clearCookie("ft_imp_active", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      path: "/",
    })
  );

  return res.status(200).json({ ok: true });
}
