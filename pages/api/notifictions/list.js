// pages/api/notifications/list.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: "Not authenticated" });

    const userId = session.user.id;

    const scope = String(req.query?.scope || "SEEKER").toUpperCase();
    const valid = new Set(["SEEKER", "COACH", "RECRUITER"]);
    const scopeSafe = valid.has(scope) ? scope : "SEEKER";

    const limitRaw = Number(req.query?.limit || 50);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 50;

    const includeRead = String(req.query?.includeRead || "0") === "1";

    const where = {
      userId,
      scope: scopeSafe,
      requiresAction: true,
      ...(includeRead ? {} : { readAt: null }),
    };

    const items = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        category: true,
        scope: true,
        entityType: true,
        entityId: true,
        title: true,
        body: true,
        requiresAction: true,
        readAt: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({ ok: true, scope: scopeSafe, items });
  } catch (err) {
    console.error("notifications/list error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
