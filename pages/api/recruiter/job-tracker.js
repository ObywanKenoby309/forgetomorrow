// pages/api/recruiter/job-tracker.js

import { getServerSession } from "next-auth/next";
// ✅ Use the same authOptions as the NextAuth route
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = session.user.id;

    // Get the user (mainly to confirm they exist; we won't rely on accountKey yet)
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        // accountKey: true, // we’re not using this yet in the query to avoid DB mismatches
      },
    });

    if (!dbUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // ─────────────────────────────────────────────────────────────
    // Scope: for MVP, just jobs owned by this user.
    // We’ll add org-level (accountKey) later once migrations are 100% in sync.
    // ─────────────────────────────────────────────────────────────
    const baseJobWhere = { userId: dbUser.id };

    // Active jobs = status "Open" only (no drafts, no closed/filled)
    const activeJobWhere = {
      ...baseJobWhere,
      status: "Open",
    };

    const now = new Date();
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1) Load active jobs with related events
    const activeJobs = await prisma.job.findMany({
      where: activeJobWhere,
      include: {
        applications: {
          select: {
            id: true,
            userId: true,
            appliedAt: true,
          },
        },
        views: {
          select: {
            id: true,
            viewedAt: true,
          },
        },
        interviews: {
          select: {
            id: true,
            scheduledAt: true,
          },
        },
        offers: {
          select: {
            id: true,
            receivedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 2) Summary metrics
    const openJobsCount = activeJobs.length;

    let totalApplicants = 0;
    const activeCandidateIds = new Set();

    activeJobs.forEach((job) => {
      totalApplicants += job.applications.length;
      job.applications.forEach((app) => {
        if (app.userId) activeCandidateIds.add(app.userId);
      });
    });

    const activeCandidates = activeCandidateIds.size;

    // 3) Avg time-to-fill across Closed/Filled jobs
    const filledJobs = await prisma.job.findMany({
      where: {
        ...baseJobWhere,
        status: { in: ["Closed", "Filled"] },
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    let avgTimeToFillDays = null;
    if (filledJobs.length > 0) {
      const totalDays = filledJobs.reduce((sum, job) => {
        const created = job.createdAt;
        const filled = job.updatedAt || job.createdAt;
        const diffMs = filled.getTime() - created.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        return sum + diffDays;
      }, 0);

      avgTimeToFillDays = Math.round(totalDays / filledJobs.length);
    }

    // 4) Per-job rows
    const jobs = activeJobs.map((job) => {
      const views = job.views.length;
      const applies = job.applications.length;

      const newApplicants = job.applications.filter(
        (app) => app.appliedAt && app.appliedAt >= since24h
      ).length;

      const lastAppAt = job.applications.reduce(
        (latest, app) =>
          !latest || app.appliedAt > latest ? app.appliedAt : latest,
        null
      );
      const lastInterviewAt = job.interviews.reduce(
        (latest, iv) =>
          !latest || iv.scheduledAt > latest ? iv.scheduledAt : latest,
        null
      );
      const lastOfferAt = job.offers.reduce(
        (latest, offer) =>
          !latest || offer.receivedAt > latest ? offer.receivedAt : latest,
        null
      );

      let lastActivityDate =
        lastAppAt || lastInterviewAt || lastOfferAt || job.updatedAt || job.createdAt;

      const lastActivity =
        lastActivityDate instanceof Date
          ? lastActivityDate.toISOString().split("T")[0]
          : null;

      return {
        id: job.id,
        title: job.title,
        location: job.location,
        status: job.status || "Open",
        views,
        applies,
        newApplicants,
        lastActivity,
      };
    });

    const summary = {
      openJobs: openJobsCount,
      totalApplicants,
      activeCandidates,
      avgTimeToFillDays,
    };

    return res.status(200).json({
      summary,
      jobs,
    });
  } catch (err) {
    console.error("[API] /api/recruiter/job-tracker error:", err);

    // 🔍 TEMP: surface details so we can debug from the browser if needed
    return res.status(500).json({
      error: "Failed to load recruiter job tracker.",
      message: err?.message || null,
      code: err?.code || null,
      meta: err?.meta || null,
    });
  }
}
