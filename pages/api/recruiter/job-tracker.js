// pages/api/recruiter/job-tracker.js

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
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

    // Fetch the recruiter user to get accountKey (tenant/org scope)
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        accountKey: true,
      },
    });

    if (!dbUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // ─────────────────────────────────────────────────────────────
    // Scope: org-level if accountKey present; else user-owned jobs
    // ─────────────────────────────────────────────────────────────
    const baseJobWhere = dbUser.accountKey
      ? { accountKey: dbUser.accountKey }
      : { userId: dbUser.id };

    // Active jobs = status "Open" only (no drafts, no closed/filled)
    const activeJobWhere = {
      ...baseJobWhere,
      status: "Open",
    };

    // ─────────────────────────────────────────────────────────────
    // 1) Load active jobs with related events (views, apps, etc.)
    // ─────────────────────────────────────────────────────────────
    const now = new Date();
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

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

    // ─────────────────────────────────────────────────────────────
    // 2) Summary metrics for active jobs
    // ─────────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────────
    // 3) Avg time-to-fill across "Closed"/"Filled" jobs
    //    (Job createdAt → updatedAt, as a simple first pass)
    // ─────────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────────
    // 4) Build per-job rows for the tracker table
    // ─────────────────────────────────────────────────────────────
    const jobs = activeJobs.map((job) => {
      const views = job.views.length;
      const applies = job.applications.length;

      const newApplicants = job.applications.filter(
        (app) => app.appliedAt && app.appliedAt >= since24h
      ).length;

      // Last activity = latest of app / interview / offer / job update
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

    // ─────────────────────────────────────────────────────────────
    // 5) Final payload
    // ─────────────────────────────────────────────────────────────
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
    return res
      .status(500)
      .json({ error: "Failed to load recruiter job tracker." });
  }
}
