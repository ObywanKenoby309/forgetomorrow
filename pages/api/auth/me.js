// pages/api/auth/me.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";
import prisma from "@/lib/prisma";

export default async function handler(req, res) {
  // Only allow GET for now
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    // Not logged in → clean 401 JSON (no HTML error page)
    if (!session || !session.user || !session.user.email) {
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
