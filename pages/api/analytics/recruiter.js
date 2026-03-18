// pages/api/analytics/recruiter.js
// Recruiter Analytics — Phase 2: SQL-backed (Prisma)
//
// Uses real data from the Prisma DB:
//   - Job, Application, JobView, Interview, Offer
// and respects:
//   - time range (7d / 30d / 90d / custom)
//   - jobId
//   - recruiterId
//   - companyId
//
// NOTE: No synthetic data. All metrics are derived from real rows.
// If there is no data yet, return zeros and empty charts.

import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function getQueryValue(value, fallback = "") {
  if (Array.isArray(value)) return value[0] ?? fallback;
  if (typeof value === "string") return value;
  return fallback;
}

function parseRange(range, fromStr, toStr) {
  const now = new Date();
  let from = null;
  let to = now;

  if (range === "custom" && fromStr && toStr) {
    const f = new Date(fromStr);
    const t = new Date(toStr);

    if (!Number.isNaN(f.getTime()) && !Number.isNaN(t.getTime())) {
      f.setHours(0, 0, 0, 0);
      t.setHours(23, 59, 59, 999);
      from = f;
      to = t;
    }
  } else {
    const days =
      range === "7d" ? 7 : range === "90d" ? 90 : 30; // default: 30d
    from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    from.setHours(0, 0, 0, 0);
    to = now;
  }

  if (!from) {
    from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    from.setHours(0, 0, 0, 0);
  }

  if (from > to) {
    const tmp = from;
    from = to;
    to = tmp;
  }

  return { from, to };
}

const msPerDay = 24 * 60 * 60 * 1000;

function buildWeeklyBuckets(from, to) {
  const diffDays = Math.max(
    1,
    Math.round((to.getTime() - from.getTime()) / msPerDay)
  );
  const weeks = Math.min(8, Math.max(1, Math.ceil(diffDays / 7)));

  const buckets = [];
  for (let i = 0; i < weeks; i++) {
    buckets.push({
      week: `W${i + 1}`,
      messages: 0,
      responses: 0,
    });
  }
  return buckets;
}

function bucketIndexForDate(from, to, date, bucketCount) {
  const totalMs = to.getTime() - from.getTime();
  if (totalMs <= 0) return 0;

  const offsetMs = date.getTime() - from.getTime();
  const ratio = Math.min(Math.max(offsetMs / totalMs, 0), 0.9999);

  return Math.min(bucketCount - 1, Math.floor(ratio * bucketCount));
}

// ──────────────────────────────────────────────────────────────
// Handler
// ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = session.user.id;
    const userRole = String(session.user.role || "SEEKER");

    const range = getQueryValue(req.query?.range, "30d");
    const jobId = getQueryValue(req.query?.jobId, "all");
    const recruiterId = getQueryValue(req.query?.recruiterId, "all");
    const companyId = getQueryValue(req.query?.companyId, "all");
    const fromStr = getQueryValue(req.query?.from, "");
    const toStr = getQueryValue(req.query?.to, "");

    const { from, to } = parseRange(range, fromStr, toStr);

    // ── Job scope ──────────────────────────────────────────────
    const jobWhere = {};

    if (recruiterId !== "all") {
      jobWhere.userId = recruiterId;
    } else if (userRole !== "ADMIN") {
      jobWhere.userId = userId;
    }

    if (companyId !== "all") {
      jobWhere.company = companyId;
    }

    if (jobId !== "all") {
      const parsed = parseInt(jobId, 10);
      if (!Number.isNaN(parsed)) {
        jobWhere.id = parsed;
      }
    }

    const dateFilter = {
      gte: from,
      lte: to,
    };

    const jobs = await prisma.job.findMany({
      where: jobWhere,
      select: {
        id: true,
        title: true,
        company: true,
        createdAt: true,
      },
    });

    const jobIds = jobs.map((j) => j.id);
    const jobsById = jobs.reduce((acc, job) => {
      acc[job.id] = job;
      return acc;
    }, {});

    if (!jobIds.length) {
      return res.status(200).json({
        meta: {
          range,
          jobId,
          recruiterId,
          companyId,
          from: from.toISOString(),
          to: to.toISOString(),
          refreshedAt: new Date().toISOString(),
          source: "SQL",
        },
        kpis: {
          totalViews: 0,
          totalApplies: 0,
          totalInterviews: 0,
          totalHires: 0,
          avgTimeToFillDays: 0,
          conversionRatePct: 0,
          offerAcceptanceRatePct: 0,
        },
        funnel: [
          { stage: "Views", value: 0 },
          { stage: "Clicks", value: 0 },
          { stage: "Applies", value: 0 },
          { stage: "Interviews", value: 0 },
          { stage: "Offers", value: 0 },
          { stage: "Hires", value: 0 },
        ],
        sources: [],
        recruiterActivity: [],
      });
    }

    // ── Real counts ────────────────────────────────────────────
    const [totalViews, totalApplies, interviewsCount, offers, offersAccepted] =
      await Promise.all([
        prisma.jobView.count({
          where: {
            jobId: { in: jobIds },
            viewedAt: dateFilter,
          },
        }),
        prisma.application.count({
          where: {
            jobId: { in: jobIds },
            appliedAt: dateFilter,
          },
        }),
        prisma.interview.count({
          where: {
            jobId: { in: jobIds },
            scheduledAt: dateFilter,
          },
        }),
        prisma.offer.findMany({
          where: {
            jobId: { in: jobIds },
            receivedAt: dateFilter,
          },
          select: {
            jobId: true,
            receivedAt: true,
            accepted: true,
          },
        }),
        prisma.offer.findMany({
          where: {
            jobId: { in: jobIds },
            accepted: true,
            receivedAt: dateFilter,
          },
          select: {
            jobId: true,
            receivedAt: true,
          },
        }),
      ]);

    // For now, clicks ≈ job detail views.
    const clicks = totalViews;
    const hiresCount = offersAccepted.length;

    const conversionRatePct =
      totalViews > 0
        ? Number(((totalApplies / totalViews) * 100).toFixed(2))
        : 0;

    const offerAcceptanceRatePct =
      offers.length > 0
        ? Number(((offersAccepted.length / offers.length) * 100).toFixed(2))
        : 0;

    let avgTimeToFillDays = 0;
    if (offersAccepted.length) {
      const diffs = offersAccepted
        .map((offer) => {
          const job = jobsById[offer.jobId];
          if (!job) return null;
          const diffMs = offer.receivedAt.getTime() - job.createdAt.getTime();
          return diffMs / msPerDay;
        })
        .filter((value) => value != null && Number.isFinite(value));

      if (diffs.length) {
        const sum = diffs.reduce((acc, value) => acc + value, 0);
        avgTimeToFillDays = Number((sum / diffs.length).toFixed(1));
      }
    }

    // ── Funnel ─────────────────────────────────────────────────
    const funnel = [
      { stage: "Views", value: totalViews },
      { stage: "Clicks", value: clicks },
      { stage: "Applies", value: totalApplies },
      { stage: "Interviews", value: interviewsCount },
      { stage: "Offers", value: offers.length },
      { stage: "Hires", value: hiresCount },
    ];

    // ── Source breakdown ───────────────────────────────────────
    // Application currently has no source field yet.
    const sources =
      totalApplies > 0
        ? [{ name: "ForgeTomorrow", value: totalApplies }]
        : [];

    // ── Recruiter activity ─────────────────────────────────────
    // For now:
    //   messages  → applications
    //   responses → interviews
    const buckets = buildWeeklyBuckets(from, to);

    if (buckets.length) {
      const [applications, interviews] = await Promise.all([
        prisma.application.findMany({
          where: {
            jobId: { in: jobIds },
            appliedAt: dateFilter,
          },
          select: { appliedAt: true },
        }),
        prisma.interview.findMany({
          where: {
            jobId: { in: jobIds },
            scheduledAt: dateFilter,
          },
          select: { scheduledAt: true },
        }),
      ]);

      applications.forEach((application) => {
        const idx = bucketIndexForDate(from, to, application.appliedAt, buckets.length);
        buckets[idx].messages += 1;
      });

      interviews.forEach((interview) => {
        const idx = bucketIndexForDate(from, to, interview.scheduledAt, buckets.length);
        buckets[idx].responses += 1;
      });
    }

    const recruiterActivity = buckets;

    return res.status(200).json({
      meta: {
        range,
        jobId,
        recruiterId,
        companyId,
        from: from.toISOString(),
        to: to.toISOString(),
        refreshedAt: new Date().toISOString(),
        source: "SQL",
      },
      kpis: {
        totalViews,
        totalApplies,
        totalInterviews: interviewsCount,
        totalHires: hiresCount,
        avgTimeToFillDays,
        conversionRatePct,
        offerAcceptanceRatePct,
      },
      funnel,
      sources,
      recruiterActivity,
    });
  } catch (err) {
    console.error("[analytics/recruiter] error:", err);
    return res.status(500).json({
      error:
        "We had trouble loading recruiter analytics. If this persists for more than 30 minutes, please contact Support.",
    });
  }
}