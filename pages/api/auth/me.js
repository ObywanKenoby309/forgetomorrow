// pages/api/auth/me.js

import { prisma } from "@/lib/prisma"; // ⬅️ changed from default import

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const proto =
      req.headers["x-forwarded-proto"] ||
      (process.env.NODE_ENV === "development" ? "http" : "https");
    const host = req.headers.host;
    const baseUrl =
      process.env.NEXTAUTH_URL || `${proto}://${host}`;

    const sessionRes = await fetch(`${baseUrl}/api/auth/session`, {
      headers: {
        cookie: req.headers.cookie || "",
      },
    });

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
