// pages/api/notifications/unread-count.js
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

    const count = await prisma.notification.count({
      where: {
        userId,
        scope: scopeSafe,
        readAt: null,
        requiresAction: true,
      },
    });

    return res.status(200).json({ ok: true, scope: scopeSafe, count, hasUnread: count > 0 });
  } catch (err) {
    console.error("notifications/unread-count error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
