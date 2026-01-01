// pages/api/auth/me.js
import { getServerSession } from "next-auth";
import { authOptions } from "./[...nextauth]";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production";

function getCookie(req, name) {
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
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1) Prefer NextAuth session if present
    const session = await getServerSession(req, res, authOptions);
    const sessionEmail = session?.user?.email ? String(session.user.email).toLowerCase() : "";

    // 2) Fallback: custom auth cookie set by /api/auth/verify-email
    let cookieEmail = "";
    if (!sessionEmail) {
      const token = getCookie(req, "auth");
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          if (decoded && decoded.email) cookieEmail = String(decoded.email).toLowerCase();
        } catch {
          cookieEmail = "";
        }
      }
    }

    const email = sessionEmail || cookieEmail;
    if (!email) {
      return res.status(401).json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ user: null });
    }

    // Strip sensitive fields
    const {
      passwordHash,
      mfaSecret,
      stripeCustomerId,
      stripeSubscriptionId,
      ...safeUser
    } = user;

    return res.status(200).json({ user: safeUser });
  } catch (err) {
    console.error("[api/auth/me] error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
