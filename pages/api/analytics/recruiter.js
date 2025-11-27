// pages/api/analytics/recruiter.js
// Recruiter Analytics — SQL-backed via Prisma
//
// - Uses Job, Application, JobView, Interview, Offer
// - Scoped to the logged-in recruiter (Job.userId = session.user.id)
// - Supports range (7d, 30d, 90d, custom)
// - Returns same shape as Phase 1 mock (kpis, funnel, sources, recruiterActivity)

import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

let prisma;
function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

function getDateRange(range, from, to) {
  const now = new Date();
  let start = new Date();
  let end = new Date(now);

  const DAY = 24 * 60 * 60 * 1000;

  if (range === "7d") {
    start = new Date(now.getTime() - 7 * DAY);
  } else if (range === "30d") {
    start = new Date(now.getTime() - 30 * DAY);
  } else if (range === "90d") {
    start = new Date(now.getTime() - 90 * DAY);
  } else if (range === "custom") {
    if (from) {
      const parsedFrom = new Date(from);
      if (!Number.isNaN(parsedFrom.getTime())) {
        start = parsedFrom;
      }
    } else {
      start = new Date(now.getTime() - 30 * DAY);
    }

    if (to) {
      const parsedTo = new Date(to);
      if (!Number.isNaN(parsedTo.getTime())) {
        end = parsedTo;
        end.setHours(23, 59, 59, 999);
      }
    }
  } else {
    // default to last 30 days
    start = new Date(now.getTime() - 30 * DAY);
  }

  return { start, end };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const prisma = getPrisma();

  const {
    range = "30d",
    jobId = "all",
    recruiterId = "all", // reserved for future multi-recruiter views
    from,
    to,
  } = req.query || {};

  // Require authentication — analytics are private to recruiters
  let session;
  try {
    session = await getServerSession(req, res, authOptions);
  } catch (err) {
    console.error("[analytics/recruiter] getServerSession error:", err);
  }

  if (!session?.user?.id) {
    return res.status(401).json({
      error: "UNAUTHENTICATED",
      message: "You must be signed in to view recruiter analytics.",
    });
  }

  const recruiterUserId = session.user.id;
  const { start, end } = getDateRange(range, from, to);

  // Optional numeric jobId filter (Filters UI will evolve later)
  const jobIdNum =
    jobId && jobId !== "all" && !Number.isNaN(Number(jobId))
      ? Number(jobId)
      : null;

  try {
    // ─────────────────────────────────────────────────────────────
    // Base filters
    // ─────────────────────────────────────────────────────────────
    const timeFilter = { gte: start, lte: end };

    const jobWhere = {
      userId: recruiterUserId,
      ...(jobIdNum ? { id: jobIdNum } : {}),
    };

    // ─────────────────────────────────────────────────────────────
    // Views
    // ─────────────────────────────────────────────────────────────
    const totalViews = await prisma.jobView.count({
      where: {
        viewedAt: timeFilter,
        job: jobWhere,
      },
    });

    // ─────────────────────────────────────────────────────────────
    // Applications
    // ─────────────────────────────────────────────────────────────
    const applications = await prisma.application.findMany({
      where: {
        appliedAt: timeFilter,
        job: jobWhere,
      },
      include: {
        job: {
          select: { id: true },
        },
      },
    });
    const totalApplies = applications.length;

    // ─────────────────────────────────────────────────────────────
    // Interviews
    // ─────────────────────────────────────────────────────────────
    const interviews = await prisma.interview.findMany({
      where: {
        scheduledAt: timeFilter,
        job: jobWhere,
      },
      include: {
        job: { select: { id: true } },
      },
    });
    const totalInterviews = interviews.length;

    // ─────────────────────────────────────────────────────────────
    // Offers
    // ─────────────────────────────────────────────────────────────
    const offers = await prisma.offer.findMany({
      where: {
        receivedAt: timeFilter,
        job: jobWhere,
      },
      include: {
        job: {
          select: { id: true, createdAt: true },
        },
      },
    });
    const totalOffers = offers.length;
    const totalHires = offers.filter((o) => o.accepted === true).length;

    // ─────────────────────────────────────────────────────────────
    // Avg time-to-fill (days)
    // Uses job.createdAt → offer.receivedAt
    // ─────────────────────────────────────────────────────────────
    const diffsDays = offers
      .map((o) => {
        if (!o.job?.createdAt || !o.receivedAt) return null;
        const ms =
          new Date(o.receivedAt).getTime() -
          new Date(o.job.createdAt).getTime();
        return ms > 0 ? ms / (1000 * 60 * 60 * 24) : null;
      })
      .filter((d) => d != null);

    const avgTimeToFillDays =
      diffsDays.length > 0
        ? +(diffsDays.reduce((a, b) => a + b, 0) / diffsDays.length).toFixed(1)
        : 0;

    // ─────────────────────────────────────────────────────────────
    // Funnel
    //
    // We don’t currently track separate “clicks” in Prisma,
    // so we use views as the base and real counts for later stages.
    // ─────────────────────────────────────────────────────────────
    const clicks = totalViews; // placeholder derived from real views
    const funnel = [
      { stage: "Views", value: totalViews },
      { stage: "Clicks", value: clicks },
      { stage: "Applies", value: totalApplies },
      { stage: "Interviews", value: totalInterviews },
      { stage: "Offers", value: totalOffers },
      { stage: "Hires", value: totalHires },
    ];

    // ─────────────────────────────────────────────────────────────
    // Source breakdown
    //
    // Today all recruiter-managed flows are “Forge” sourced.
    // Once we add tracking on Application/Job for source, we’ll expand this.
    // ─────────────────────────────────────────────────────────────
    const sources =
      totalApplies > 0
        ? [{ name: "Forge", value: totalApplies }]
        : [];

    // ─────────────────────────────────────────────────────────────
    // Recruiter activity timeline
    //
    // Approximate:
    //   messages  ~ applications per week
    //   responses ~ interviews per week
    // ─────────────────────────────────────────────────────────────
    const weeks = 8;
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const endTime = end.getTime();
    const startTime = endTime - (weeks - 1) * WEEK_MS;
    const buckets = Array.from({ length: weeks }).map((_, i) => ({
      week: `W${i + 1}`,
      messages: 0,
      responses: 0,
    }));

    const assignToBucket = (date) => {
      const t = new Date(date).getTime();
      if (Number.isNaN(t) || t < startTime || t > endTime) return null;
      const idx = Math.floor((t - startTime) / WEEK_MS);
      if (idx < 0 || idx >= weeks) return null;
      return idx;
    };

    applications.forEach((a) => {
      const idx = assignToBucket(a.appliedAt);
      if (idx != null) {
        buckets[idx].messages += 1;
      }
    });

    interviews.forEach((iv) => {
      const idx = assignToBucket(iv.scheduledAt);
      if (idx != null) {
        buckets[idx].responses += 1;
      }
    });

    const recruiterActivity = buckets;

    // ─────────────────────────────────────────────────────────────
    // Conversion
    // ─────────────────────────────────────────────────────────────
    const conversionRatePct =
      totalViews > 0
        ? +((totalApplies / totalViews) * 100).toFixed(2)
        : 0;

    return res.status(200).json({
      meta: {
        range,
        jobId,
        recruiterId,
        from: from || null,
        to: to || null,
        refreshedAt: new Date().toISOString(),
        source: "sql",
      },
      kpis: {
        totalViews,
        totalApplies,
        avgTimeToFillDays,
        conversionRatePct,
      },
      funnel,
      sources,
      recruiterActivity,
    });
  } catch (err) {
    console.error("[analytics/recruiter] error:", err);
    return res.status(500).json({
      error: "RECRUITER_ANALYTICS_ERROR",
      message:
        "We had trouble loading recruiter analytics. Contact Support if communication is not provided within 30 minutes.",
      meta: {
        range,
        jobId,
        recruiterId,
        from: from || null,
        to: to || null,
        refreshedAt: new Date().toISOString(),
        source: "sql",
      },
    });
  }
}
