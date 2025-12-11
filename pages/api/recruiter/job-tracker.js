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

    const safeJobs = Array.isArray(activeJobs) ? activeJobs : [];

    // ─────────────────────────────────────────────────────────────
    // 2) Summary metrics for active jobs
    // ─────────────────────────────────────────────────────────────
    const openJobsCount = safeJobs.length;

    let totalApplicants = 0;
    const activeCandidateIds = new Set();

    safeJobs.forEach((job) => {
      const apps = Array.isArray(job.applications) ? job.applications : [];
      totalApplicants += apps.length;
      apps.forEach((app) => {
        if (app.userId) activeCandidateIds.add(app.userId);
      });
    });

    const activeCandidates = activeCandidateIds.size;

    // ─────────────────────────────────────────────────────────────
    // 3) Avg time-to-fill across "Closed"/"Filled" jobs
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
    if (Array.isArray(filledJobs) && filledJobs.length > 0) {
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
    const jobs = safeJobs.map((job) => {
      const viewsArr = Array.isArray(job.views) ? job.views : [];
      const appsArr = Array.isArray(job.applications) ? job.applications : [];
      const interviewsArr = Array.isArray(job.interviews) ? job.interviews : [];
      const offersArr = Array.isArray(job.offers) ? job.offers : [];

      const views = viewsArr.length;
      const applies = appsArr.length;

      const newApplicants = appsArr.filter(
        (app) => app.appliedAt && app.appliedAt >= since24h
      ).length;

      // Last activity = latest of app / interview / offer / job update
      const lastAppAt = appsArr.reduce(
        (latest, app) =>
          !latest || app.appliedAt > latest ? app.appliedAt : latest,
        null
      );
      const lastInterviewAt = interviewsArr.reduce(
        (latest, iv) =>
          !latest || iv.scheduledAt > latest ? iv.scheduledAt : latest,
        null
      );
      const lastOfferAt = offersArr.reduce(
        (latest, offer) =>
          !latest || offer.receivedAt > latest ? offer.receivedAt : latest,
        null
      );

      const lastActivityDate =
        lastAppAt ||
        lastInterviewAt ||
        lastOfferAt ||
        job.updatedAt ||
        job.createdAt;

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
    // Expose the actual error message so we can see it in the Network tab
    return res.status(500).json({
      error:
        err?.message ||
        "Failed to load recruiter job tracker (no additional error message).",
    });
  }
}
