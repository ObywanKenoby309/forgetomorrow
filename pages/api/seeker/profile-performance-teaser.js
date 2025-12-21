// pages/api/seeker/profile-performance-teaser.js
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

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Profile views last 7 days (targetId = user.id)
    const viewsLast7 = await prisma.profileView.count({
      where: {
        targetId: userId,
        createdAt: { gte: sevenDaysAgo },
      },
    });

    // Search appearances last 7 days — assuming you have a model or log for this
    // If not yet implemented, we'll default to 0 for now
    const searchAppearancesLast7 = 0; // Replace with real query when ready

    // Simple completion % calculation (example logic — adjust to your actual fields)
    const profileFields = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        headline: true,
        aboutMe: true,
        skillsJson: true,
        avatarUrl: true,
        location: true,
        // Add more fields as needed
      },
    });

    const filledFields = [
      profileFields.headline,
      profileFields.aboutMe,
      profileFields.skillsJson,
      profileFields.avatarUrl,
      profileFields.location,
    ].filter(Boolean).length;

    const completionPercent = Math.round((filledFields / 5) * 100);

    return res.status(200).json({
      viewsLast7,
      searchAppearancesLast7,
      completionPercent,
    });

  } catch (err) {
    console.error("[api/seeker/profile-performance-teaser] error:", err);
    return res.status(500).json({ error: "Failed to load profile performance data" });
  }
}