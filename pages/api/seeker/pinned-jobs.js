// pages/api/seeker/pinned-jobs.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
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

  // POST = unpin a job
  if (req.method === "POST") {
    try {
      const { jobId } = req.body;
      if (!jobId) {
        return res.status(400).json({ error: "jobId required" });
      }

      await prisma.pinnedJob.deleteMany({
        where: {
          userId,
          jobId: Number(jobId),
        },
      });

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("[api/seeker/pinned-jobs] unpin error:", err);
      return res.status(500).json({ error: "Failed to unpin job" });
    }
  }

  // GET = fetch pinned jobs
  if (req.method === "GET") {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;

      const pinnedJobs = await prisma.pinnedJob.findMany({
        where: { userId },
        include: {
          job: {
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
          },
        },
        orderBy: { pinnedAt: "desc" },
        take: limit || undefined,
      });

      const jobs = pinnedJobs.map((p) => ({
        id: p.job.id,
        title: p.job.title,
        company: p.job.company,
        location: p.job.location,
        worksite: p.job.worksite,
        compensation: p.job.compensation,
        type: p.job.type,
        createdAt: p.job.createdAt,
      }));

      return res.status(200).json({ jobs });
    } catch (err) {
      console.error("[api/seeker/pinned-jobs] fetch error:", err);
      return res.status(500).json({ error: "Failed to load pinned jobs" });
    }
  }

  // Method not allowed
  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method not allowed" });
}