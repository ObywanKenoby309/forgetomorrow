// pages/api/auth/me.js
import { getServerSession } from "next-auth";
import { authOptions } from "./[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user || !session.user.email) {
      return res.status(401).json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
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
