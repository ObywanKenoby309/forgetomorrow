// pages/api/seeker/recommended-jobs.js
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

    // Hard-coded limit for the preview card
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 4;
    const safeLimit = isNaN(limit) || limit < 1 ? 4 : Math.min(limit, 20);

    // Get ids of jobs the user has already applied to
    const appliedJobIds = await prisma.application.findMany({
      where: { userId },
      select: { jobId: true },
    });

    // Filter out null/undefined jobId and make clean array
    const appliedIds = appliedJobIds
      .map(a => a.jobId)
      .filter(id => id != null);

    // Build where clause only if there are valid IDs to exclude
    const whereClause = {};
    if (appliedIds.length > 0) {
      whereClause.id = { notIn: appliedIds };
    }

    // Fetch newest jobs, excluding applied ones
    const jobs = await prisma.job.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        worksite: true,
        compensation: true,
        type: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: safeLimit,
    });

    return res.status(200).json({ jobs });
  } catch (err) {
    console.error("[api/seeker/recommended-jobs] error:", err);
    return res.status(500).json({ error: "Failed to load recommended jobs" });
  }
}