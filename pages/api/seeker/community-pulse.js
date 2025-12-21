// pages/api/seeker/community-pulse.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = user.id;

    // Top posts: newest with highest likes (simple for MVP)
    const topPosts = await prisma.feedPost.findMany({
      take: 4,
      orderBy: [{ likes: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        authorName: true,
        content: true,
        likes: true,
        createdAt: true,
      },
    });

    // User's recent activity: their posts only for now (MVP)
    const myActivity = await prisma.feedPost.findMany({
      where: { authorId: userId },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        content: true,
        likes: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      topPosts,
      myActivity,
    });

  } catch (err) {
    console.error("[api/seeker/community-pulse] error:", err);
    return res.status(500).json({ error: "Failed to load community pulse" });
  }
}