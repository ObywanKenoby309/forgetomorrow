// pages/api/push/unsubscribe.js
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
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = session.user.id;
    const { endpoint } = req.body || {};

    if (!endpoint) {
      return res.status(400).json({ error: "endpoint is required" });
    }

    await prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[api/push/unsubscribe] error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}