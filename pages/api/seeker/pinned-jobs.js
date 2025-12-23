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

  // POST = pin (with or without jobId)
  if (req.method === "POST") {
    try {
      const { jobId, title, company, location, url } = req.body;

      const data = { userId };

      if (jobId) {
        const numericJobId = Number(jobId);

        const existing = await prisma.pinnedJob.findFirst({
          where: { userId, jobId: numericJobId },
        });

        if (existing) {
          return res
            .status(200)
            .json({ success: true, pinned: existing, message: "Already pinned" });
        }

        data.jobId = numericJobId;

        const pinned = await prisma.pinnedJob.create({ data });
        return res.status(200).json({ success: true, pinned });
      }

      // Manual pin
      if (!title || !company) {
        return res
          .status(400)
          .json({ error: "title and company required for manual pin" });
      }

      data.title = title;
      data.company = company;
      data.location = location || "";
      data.url = url || "";

      const existing = await prisma.pinnedJob.findFirst({
        where: {
          userId,
          jobId: null,
          title: data.title,
          company: data.company,
          url: data.url,
        },
      });

      if (existing) {
        return res
          .status(200)
          .json({ success: true, pinned: existing, message: "Already pinned" });
      }

      const pinned = await prisma.pinnedJob.create({ data });
      return res.status(200).json({ success: true, pinned });
    } catch (err) {
      console.error("[api/seeker/pinned-jobs] pin error:", err);
      if (err?.code === "P2002") {
        return res.status(200).json({ success: true, message: "Already pinned" });
      }
      return res.status(500).json({ error: "Failed to pin job" });
    }
  }

  // DELETE = unpin (supports job pins and manual pins)
  if (req.method === "DELETE") {
    try {
      const { jobId, pinnedId } = req.body || {};

      if (!jobId && !pinnedId) {
        return res.status(400).json({ error: "jobId or pinnedId required" });
      }

      if (pinnedId) {
        const result = await prisma.pinnedJob.deleteMany({
          where: { userId, id: Number(pinnedId) },
        });

        if (!result.count) {
          return res.status(404).json({ error: "Pinned job not found" });
        }

        return res.status(200).json({ success: true });
      }

      const result = await prisma.pinnedJob.deleteMany({
        where: { userId, jobId: Number(jobId) },
      });

      if (!result.count) {
        return res.status(404).json({ error: "Pinned job not found" });
      }

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
        // IMPORTANT: stable pinned row id
        pinnedId: p.id,
        // If this is a real Job pin, jobId will exist
        jobId: p.jobId || null,

        title: p.job?.title || p.title || "Untitled role",
        company: p.job?.company || p.company || "Unknown company",
        location: p.job?.location || p.location || "",
        worksite: p.job?.worksite || "",
        compensation: p.job?.compensation || "",
        type: p.job?.type || "",
        createdAt: p.job?.createdAt || p.pinnedAt,
        pinnedAt: p.pinnedAt,
        url: p.url || "",
      }));

      return res.status(200).json({ jobs });
    } catch (err) {
      console.error("[api/seeker/pinned-jobs] fetch error:", err);
      return res.status(500).json({ error: "Failed to load pinned jobs" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).json({ error: "Method not allowed" });
}
