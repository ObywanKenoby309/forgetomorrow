// pages/api/settings/notifications.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

async function getCurrentUser(req, res) {
  const session = await getServerSession(req, res, authOptions);
  const sessionUser = session?.user || {};

  if (sessionUser.id) {
    const user = await prisma.user.findUnique({
      where: { id: String(sessionUser.id) },
      select: { id: true },
    });

    if (user?.id) return user;
  }

  if (sessionUser.email) {
    const user = await prisma.user.findUnique({
      where: { email: String(sessionUser.email).toLowerCase() },
      select: { id: true },
    });

    if (user?.id) return user;
  }

  return null;
}

export default async function handler(req, res) {
  if (!["GET", "PATCH"].includes(req.method)) {
    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const user = await getCurrentUser(req, res);

    if (!user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (req.method === "GET") {
      const settings = await prisma.userNotificationSettings.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id },
        select: {
          emailUpdates: true,
          updatedAt: true,
        },
      });

      return res.status(200).json({ settings });
    }

    const body = req.body || {};
    const nextEmailUpdates =
      typeof body.emailUpdates === "boolean" ? body.emailUpdates : null;

    if (nextEmailUpdates === null) {
      return res.status(400).json({ error: "emailUpdates must be a boolean." });
    }

    const settings = await prisma.userNotificationSettings.upsert({
      where: { userId: user.id },
      update: { emailUpdates: nextEmailUpdates },
      create: {
        userId: user.id,
        emailUpdates: nextEmailUpdates,
      },
      select: {
        emailUpdates: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({ settings });
  } catch (err) {
    console.error("[api/settings/notifications] error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
