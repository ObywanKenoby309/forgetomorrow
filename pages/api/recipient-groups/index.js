// pages/api/recipient-groups/index.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

  const userId = session.user.id;
  const accountKey = session.user.accountKey || null;

  // GET — list groups for this user + org
  if (req.method === "GET") {
    const { persona = "recruiter" } = req.query;

    try {
      const groups = await prisma.recipientGroup.findMany({
        where: {
          persona,
          OR: [
            { userId },
            ...(accountKey ? [{ accountKey }] : []),
          ],
        },
        orderBy: { createdAt: "desc" },
      });

      return res.status(200).json({ groups });
    } catch (err) {
      console.error("[recipient-groups GET]", err);
      return res.status(500).json({ error: "Failed to load recipient groups" });
    }
  }

  // POST — create a new group
  if (req.method === "POST") {
    const { name, memberIds, persona = "recruiter" } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: "Name is required" });
    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ error: "At least one member is required" });
    }

    try {
      const group = await prisma.recipientGroup.create({
        data: {
          userId,
          accountKey,
          persona,
          name: name.trim(),
          memberIds: memberIds.filter(Boolean).map(String),
        },
      });

      return res.status(201).json({ group });
    } catch (err) {
      console.error("[recipient-groups POST]", err);
      return res.status(500).json({ error: "Failed to create recipient group" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}