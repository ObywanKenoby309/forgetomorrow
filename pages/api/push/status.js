// pages/api/push/status.js
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
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const count = await prisma.pushSubscription.count({
      where: { userId: session.user.id },
    });

    return res.status(200).json({ subscribed: count > 0, deviceCount: count });
  } catch (err) {
    console.error("[api/push/status] error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}