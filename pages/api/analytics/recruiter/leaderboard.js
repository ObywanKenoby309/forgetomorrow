// pages/api/analytics/recruiter/leaderboard.js
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
        recruiters: [],
      });
    }

    const jobIds = jobs.map((job) => job.id);

    const dateFilter = {
      gte: from,
      lte: to,
    };

    const [applications, interviews, offers] = await Promise.all([
      prisma.application.findMany({
        where: {
          jobId: { in: jobIds },
          appliedAt: dateFilter,
        },
        select: {
          jobId: true,
        },
      }),
      prisma.interview.findMany({
        where: {
          jobId: { in: jobIds },
          scheduledAt: dateFilter,
        },
        select: {
          jobId: true,
        },
      }),
      prisma.offer.findMany({
        where: {
          jobId: { in: jobIds },
          receivedAt: dateFilter,
        },
        select: {
          jobId: true,
          accepted: true,
          receivedAt: true,
        },
      }),
    ]);

    const jobMap = Object.fromEntries(jobs.map((job) => [job.id, job]));

    const recruiterMap = {};

    function getRecruiterName(user) {
      if (!user) return "Unknown Recruiter";
      if (user.name) return user.name;
      const combined = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
      if (combined) return combined;
      return user.email || "Unknown Recruiter";
    }

    function ensureRecruiter(job) {
      const recruiterKey = job.userId;

      if (!recruiterMap[recruiterKey]) {
        recruiterMap[recruiterKey] = {
          recruiterId: recruiterKey,
          recruiterName: getRecruiterName(job.user),
          totalJobs: 0,
          totalApplications: 0,
          totalInterviews: 0,
          totalOffers: 0,
          totalHires: 0,
          avgTimeToFillDays: 0,
          conversionRatePct: 0,
          offerAcceptanceRatePct: 0,
          pipelineVelocity: 0,
          _timeToFillSamples: [],
        };
      }

      return recruiterMap[recruiterKey];
    }

    jobs.forEach((job) => {
      const recruiter = ensureRecruiter(job);
      recruiter.totalJobs += 1;
    });

    applications.forEach((row) => {
      const job = jobMap[row.jobId];
      if (!job) return;
      const recruiter = ensureRecruiter(job);
      recruiter.totalApplications += 1;
    });

    interviews.forEach((row) => {
      const job = jobMap[row.jobId];
      if (!job) return;
      const recruiter = ensureRecruiter(job);
      recruiter.totalInterviews += 1;
    });

    offers.forEach((row) => {
      const job = jobMap[row.jobId];
      if (!job) return;
      const recruiter = ensureRecruiter(job);
      recruiter.totalOffers += 1;

      if (row.accepted) {
        recruiter.totalHires += 1;
        const diffDays = (row.receivedAt.getTime() - job.createdAt.getTime()) / msPerDay;
        if (Number.isFinite(diffDays) && diffDays >= 0) {
          recruiter._timeToFillSamples.push(diffDays);
        }
      }
    });

    const recruiters = Object.values(recruiterMap)
      .map((recruiter) => {
        const avgTimeToFillDays = recruiter._timeToFillSamples.length
          ? Number(
              (
                recruiter._timeToFillSamples.reduce((sum, value) => sum + value, 0) /
                recruiter._timeToFillSamples.length
              ).toFixed(1)
            )
          : 0;

        const conversionRatePct =
          recruiter.totalApplications > 0
            ? Number(((recruiter.totalHires / recruiter.totalApplications) * 100).toFixed(2))
            : 0;

        const offerAcceptanceRatePct =
          recruiter.totalOffers > 0
            ? Number(((recruiter.totalHires / recruiter.totalOffers) * 100).toFixed(2))
            : 0;

        const pipelineVelocity =
          recruiter.totalJobs > 0
            ? Number((recruiter.totalApplications / recruiter.totalJobs).toFixed(2))
            : 0;

        return {
          recruiterId: recruiter.recruiterId,
          recruiterName: recruiter.recruiterName,
          totalJobs: recruiter.totalJobs,
          totalApplications: recruiter.totalApplications,
          totalInterviews: recruiter.totalInterviews,
          totalOffers: recruiter.totalOffers,
          totalHires: recruiter.totalHires,
          avgTimeToFillDays,
          conversionRatePct,
          offerAcceptanceRatePct,
          pipelineVelocity,
        };
      })
      .sort((a, b) => {
        if (b.totalHires !== a.totalHires) return b.totalHires - a.totalHires;
        if (b.totalInterviews !== a.totalInterviews) return b.totalInterviews - a.totalInterviews;
        return b.totalApplications - a.totalApplications;
      });

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
      recruiters,
    });
  } catch (err) {
    console.error("[analytics/recruiter/leaderboard] error:", err);
    return res.status(500).json({
      error: "We had trouble loading recruiter leaderboard analytics.",
      detail: err?.message || "Unknown error",
    });
  }
}