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

    // Hard-coded limit for the preview card (we'll always request ?limit=4 from frontend)
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 4;
    const safeLimit = isNaN(limit) || limit < 1 ? 4 : Math.min(limit, 20); // cap at 20 just in case

    // Get ids of jobs the user has already applied to
    const appliedJobIds = await prisma.application.findMany({
      where: { userId },
      select: { jobId: true },
    });
    const appliedIds = new Set(appliedJobIds.map(a => a.jobId));

    // Fetch newest jobs, excluding applied ones
    const jobs = await prisma.job.findMany({
      where: {
        id: { notIn: Array.from(appliedIds) },
      },
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