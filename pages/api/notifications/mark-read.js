// pages/api/notifications/mark-read.js
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
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: "Missing id" });

    // Ensure user owns it
    const existing = await prisma.notification.findFirst({
      where: { id: String(id), userId },
      select: { id: true },
    });

    if (!existing) return res.status(404).json({ error: "Not found" });

    const updated = await prisma.notification.update({
      where: { id: String(id) },
      data: { readAt: new Date(), requiresAction: false },
      select: { id: true, readAt: true },
    });

    return res.status(200).json({ ok: true, updated });
  } catch (err) {
    console.error("notifications/mark-read error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
