// pages/api/analytics/export.js
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
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
    const days =
      range === "7d" ? 7 : range === "90d" ? 90 : 30;

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

function csvEscape(value) {
  const str = value == null ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

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
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const jobIds = jobs.map((job) => job.id);

    if (!jobIds.length) {
      const emptyCsv = [
        [
          "Job Title",
          "Company",
          "Created At",
          "Views",
          "Applications",
          "Interviews",
          "Offers",
          "Hires",
          "Conversion Rate %",
          "Offer Acceptance Rate %",
        ].join(","),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="recruiter-analytics-${range}.csv"`
      );
      return res.status(200).send(emptyCsv);
    }

    const dateFilter = {
      gte: from,
      lte: to,
    };

    const [views, applications, interviews, offers] = await Promise.all([
      prisma.jobView.findMany({
        where: {
          jobId: { in: jobIds },
          viewedAt: dateFilter,
        },
        select: {
          jobId: true,
        },
      }),
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
        },
      }),
    ]);

    const countsByJob = Object.fromEntries(
      jobIds.map((id) => [
        id,
        {
          views: 0,
          applications: 0,
          interviews: 0,
          offers: 0,
          hires: 0,
        },
      ])
    );

    views.forEach((row) => {
      if (countsByJob[row.jobId]) countsByJob[row.jobId].views += 1;
    });

    applications.forEach((row) => {
      if (countsByJob[row.jobId]) countsByJob[row.jobId].applications += 1;
    });

    interviews.forEach((row) => {
      if (countsByJob[row.jobId]) countsByJob[row.jobId].interviews += 1;
    });

    offers.forEach((row) => {
      if (countsByJob[row.jobId]) {
        countsByJob[row.jobId].offers += 1;
        if (row.accepted) countsByJob[row.jobId].hires += 1;
      }
    });

    const header = [
      "Job Title",
      "Company",
      "Created At",
      "Views",
      "Applications",
      "Interviews",
      "Offers",
      "Hires",
      "Conversion Rate %",
      "Offer Acceptance Rate %",
    ];

    const rows = jobs.map((job) => {
      const stats = countsByJob[job.id] || {
        views: 0,
        applications: 0,
        interviews: 0,
        offers: 0,
        hires: 0,
      };

      const conversionRatePct =
        stats.views > 0
          ? ((stats.applications / stats.views) * 100).toFixed(2)
          : "0.00";

      const offerAcceptanceRatePct =
        stats.offers > 0
          ? ((stats.hires / stats.offers) * 100).toFixed(2)
          : "0.00";

      return [
        csvEscape(job.title),
        csvEscape(job.company),
        csvEscape(job.createdAt?.toISOString?.() || ""),
        stats.views,
        stats.applications,
        stats.interviews,
        stats.offers,
        stats.hires,
        conversionRatePct,
        offerAcceptanceRatePct,
      ].join(",");
    });

    const csv = [header.join(","), ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="recruiter-analytics-${range}.csv"`
    );

    return res.status(200).send(csv);
  } catch (err) {
    console.error("[analytics/export] error:", err);
    return res.status(500).json({
      error: "We had trouble exporting recruiter analytics.",
      detail: err?.message || "Unknown error",
    });
  }
}