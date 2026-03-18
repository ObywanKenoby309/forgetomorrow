// pages/api/analytics/recruiter/time-to-fill.js
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

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
    const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
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

    const jobs = await prisma.job.findMany({
      where: jobWhere,
      select: {
        id: true,
        title: true,
        company: true,
        createdAt: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!jobs.length) {
      return res.status(200).json({
        meta: {
          range,
          jobId,
          recruiterId,
          companyId,
          from: from.toISOString(),
          to: to.toISOString(),
          refreshedAt: new Date().toISOString(),
        },
        summary: {
          avgTimeToFillDays: 0,
          medianTimeToFillDays: 0,
          fastestFillDays: 0,
          slowestFillDays: 0,
          filledJobs: 0,
        },
        jobs: [],
      });
    }

    const jobIds = jobs.map((job) => job.id);

    const offersAccepted = await prisma.offer.findMany({
      where: {
        jobId: { in: jobIds },
        accepted: true,
        receivedAt: {
          gte: from,
          lte: to,
        },
      },
      select: {
        jobId: true,
        receivedAt: true,
      },
    });

    const acceptedByJob = {};
    offersAccepted.forEach((offer) => {
      if (!acceptedByJob[offer.jobId]) {
        acceptedByJob[offer.jobId] = [];
      }
      acceptedByJob[offer.jobId].push(offer);
    });

    function recruiterName(user) {
      if (!user) return "Unknown Recruiter";
      if (user.name) return user.name;
      const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
      if (full) return full;
      return user.email || "Unknown Recruiter";
    }

    const rows = jobs
      .map((job) => {
        const acceptedOffers = acceptedByJob[job.id] || [];
        if (!acceptedOffers.length) return null;

        const firstAccepted = acceptedOffers.sort(
          (a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
        )[0];

        const diffDays = (new Date(firstAccepted.receivedAt).getTime() - new Date(job.createdAt).getTime()) / msPerDay;

        if (!Number.isFinite(diffDays) || diffDays < 0) return null;

        return {
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          recruiterId: job.userId,
          recruiterName: recruiterName(job.user),
          daysToFill: Number(diffDays.toFixed(1)),
          createdAt: job.createdAt,
          filledAt: firstAccepted.receivedAt,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.daysToFill - b.daysToFill);

    const filledJobs = rows.length;
    const values = rows.map((row) => row.daysToFill);

    const avgTimeToFillDays = filledJobs
      ? Number((values.reduce((sum, value) => sum + value, 0) / filledJobs).toFixed(1))
      : 0;

    const medianTimeToFillDays = filledJobs
      ? (() => {
          const sorted = [...values].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          if (sorted.length % 2 === 0) {
            return Number((((sorted[mid - 1] + sorted[mid]) / 2)).toFixed(1));
          }
          return Number(sorted[mid].toFixed(1));
        })()
      : 0;

    const fastestFillDays = filledJobs ? Number(Math.min(...values).toFixed(1)) : 0;
    const slowestFillDays = filledJobs ? Number(Math.max(...values).toFixed(1)) : 0;

    return res.status(200).json({
      meta: {
        range,
        jobId,
        recruiterId,
        companyId,
        from: from.toISOString(),
        to: to.toISOString(),
        refreshedAt: new Date().toISOString(),
      },
      summary: {
        avgTimeToFillDays,
        medianTimeToFillDays,
        fastestFillDays,
        slowestFillDays,
        filledJobs,
      },
      jobs: rows,
    });
  } catch (err) {
    console.error("[analytics/recruiter/time-to-fill] error:", err);
    return res.status(500).json({
      error: "We had trouble loading time-to-fill analytics.",
      detail: err?.message || "Unknown error",
    });
  }
}