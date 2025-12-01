// pages/api/auth/me.js

import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    // Build a base URL that works on Vercel + local
    const proto =
      req.headers["x-forwarded-proto"] ||
      (process.env.NODE_ENV === "development" ? "http" : "https");
    const host = req.headers.host;
    const baseUrl =
      process.env.NEXTAUTH_URL || `${proto}://${host}`;

    // Ask NextAuth for the current session, forwarding cookies
    const sessionRes = await fetch(`${baseUrl}/api/auth/session`, {
      headers: {
        cookie: req.headers.cookie || "",
      },
    });

    // Not logged in → clean 401 JSON
    if (sessionRes.status === 401) {
      return res.status(401).json({
        ok: false,
        user: null,
      });
    }

    if (!sessionRes.ok) {
      console.error(
        "[api/auth/me] /api/auth/session not ok:",
        sessionRes.status
      );
      return res.status(500).json({
        ok: false,
        error: "Failed to load session",
      });
    }

    const session = await sessionRes.json();

    if (!session?.user?.email) {
      return res.status(401).json({
        ok: false,
        user: null,
      });
    }

    // Look up the full user record
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        image: true,
        avatarUrl: true,
        wallpaperUrl: true,
        bannerMode: true,
        bannerHeight: true,
        bannerFocalY: true,
        role: true,
        plan: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        ok: false,
        user: null,
      });
    }

    return res.status(200).json({
      ok: true,
      user,
    });
  } catch (err) {
    console.error("[api/auth/me] error", err);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
}
