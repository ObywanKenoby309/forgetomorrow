// pages/api/notifications/mark-all-read.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: "Not authenticated" });

    const userId = session.user.id;

    const scope = String(req.body?.scope || req.query?.scope || "SEEKER").toUpperCase();
    const valid = new Set(["SEEKER", "COACH", "RECRUITER"]);
    const scopeSafe = valid.has(scope) ? scope : "SEEKER";

    const result = await prisma.notification.updateMany({
      where: {
        userId,
        scope: scopeSafe,
        requiresAction: true,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return res.status(200).json({ ok: true, scope: scopeSafe, updatedCount: result.count });
  } catch (err) {
    console.error("notifications/mark-all-read error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}