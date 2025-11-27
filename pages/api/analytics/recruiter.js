// pages/api/analytics/recruiter.js
// Recruiter Analytics — Phase 2: SQL-backed (Prisma)
//
// Uses real data from the Prisma SQLite DB:
//   - Job, Application, JobView, Interview, Offer
// and respects:
//   - time range (7d / 30d / 90d / custom)
//   - jobId (currently only "all" used by UI; future: specific job IDs)
//   - recruiterId (future: per-recruiter view; for now, non-admins see only their own jobs)
//   - companyId (future: per-company; for now, "all" behaves like "all companies")
//
// NOTE: No random synthetic data anymore. All metrics are derived
// from real rows in your Prisma DB. If there is no data yet, you
// simply see zeros and empty charts.

import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function parseRange(range, fromStr, toStr) {
  const now = new Date();
  let from = null;
  let to = now;

  if (range === "custom" && fromStr && toStr) {
    const f = new Date(fromStr);
    const t = new Date(toStr);
    if (!Number.isNaN(f.getTime()) && !Number.isNaN(t.getTime())) {
      from = f;
      to = t;
    }
  } else {
    const days =
      range === "7d" ? 7 : range === "90d" ? 90 : 30; // default: 30d
    from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  if (!from) {
    // Fallback: last 30 days
    from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Ensure from <= to
  if (from > to) {
    const tmp = from;
    from = to;
    to = tmp;
  }

  return { from, to };
}

const msPerDay = 24 * 60 * 60 * 1000;

// Build simple weekly buckets between from/to for activity chart
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
  return Math.min(
    bucketCount - 1,
    Math.floor(ratio * bucketCount)
  );
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
    const userRole = (session.user.role || "SEEKER").toString();

    const {
      range = "30d",
      jobId = "all",
      recruiterId = "all",
      companyId = "all",
      from: fromStr,
      to: toStr,
    } = req.query || {};

    const { from, to } = parseRange(range, fromStr, toStr);

    // ── Job scope (which jobs are we allowed to see?) ─────────
    const jobWhere = {};

    // Recruiter filter (future: real per-recruiter dropdown)
    if (recruiterId !== "all") {
      jobWhere.userId = recruiterId.toString();
    } else if (userRole !== "ADMIN") {
      // Non-admins only see their own jobs
      jobWhere.userId = userId;
    }

    // Company filter (future: org/tenant support)
    if (companyId !== "all") {
      jobWhere.company = companyId.toString();
    }

    // Optional: restrict by jobId when UI sends specific IDs later
    if (jobId !== "all") {
      const parsed = parseInt(jobId, 10);
      if (!Number.isNaN(parsed)) {
        jobWhere.id = parsed;
      }
    }

    // We always evaluate events within the time window
    const dateFilter = {
      gte: from,
      lte: to,
    };

    // Fetch jobs in scope
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
    const jobsById = jobs.reduce((acc, j) => {
      acc[j.id] = j;
      return acc;
    }, {});

    // If no jobs, we still return a fully-formed response with zeros
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
          avgTimeToFillDays: 0,
          conversionRatePct: 0,
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

    // ── Real counts from Prisma ────────────────────────────────

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

    // For now, "clicks" ≈ "job detail views".
    // Once we have a dedicated track_clicks table, we will swap this
    // to that source — but this is still 100% real data today.
    const clicks = totalViews;

    const hiresCount = offersAccepted.length;

    const conversionRatePct =
      totalViews > 0
        ? Number(((totalApplies / totalViews) * 100).toFixed(2))
        : 0;

    // Average time-to-fill (in days) based on accepted offers
    let avgTimeToFillDays = 0;
    if (offersAccepted.length) {
      const diffs = offersAccepted
        .map((o) => {
          const job = jobsById[o.jobId];
          if (!job) return null;
          const diffMs = o.receivedAt.getTime() - job.createdAt.getTime();
          return diffMs / msPerDay;
        })
        .filter((x) => x != null && Number.isFinite(x));

      if (diffs.length) {
        const sum = diffs.reduce((acc, v) => acc + v, 0);
        avgTimeToFillDays = Number((sum / diffs.length).toFixed(1));
      }
    }

    // ── Funnel (all real derived counts) ───────────────────────
    const funnel = [
      { stage: "Views", value: totalViews },
      { stage: "Clicks", value: clicks },
      { stage: "Applies", value: totalApplies },
      { stage: "Interviews", value: interviewsCount },
      { stage: "Offers", value: offers.length },
      { stage: "Hires", value: hiresCount },
    ];

    // ── Source breakdown ───────────────────────────────────────
    // Application model currently has no "source" field.
    // Until we add that, all applies are treated as "Forge".
    const sources =
      totalApplies > 0
        ? [{ name: "Forge", value: totalApplies }]
        : [];

    // ── Recruiter activity (weekly buckets) ────────────────────
    // For now:
    //   messages  → applications
    //   responses → interviews
    const buckets = buildWeeklyBuckets(from, to);

    if (buckets.length) {
      const apps = await prisma.application.findMany({
        where: {
          jobId: { in: jobIds },
          appliedAt: dateFilter,
        },
        select: { appliedAt: true },
      });

      const interviews = await prisma.interview.findMany({
        where: {
          jobId: { in: jobIds },
          scheduledAt: dateFilter,
        },
        select: { scheduledAt: true },
      });

      apps.forEach((a) => {
        const idx = bucketIndexForDate(
          from,
          to,
          a.appliedAt,
          buckets.length
        );
        buckets[idx].messages += 1;
      });

      interviews.forEach((i) => {
        const idx = bucketIndexForDate(
          from,
          to,
          i.scheduledAt,
          buckets.length
        );
        buckets[idx].responses += 1;
      });
    }

    const recruiterActivity = buckets;

    // ── Final payload ──────────────────────────────────────────
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
      error:
        "We had trouble loading recruiter analytics. If this persists for more than 30 minutes, please contact Support.",
    });
  }
}
