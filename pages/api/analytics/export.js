// pages/api/analytics/export.js
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const QOH_MINIMUM_REQUIRED = 5;

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

function csvEscape(value) {
  const str = value == null ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(header, rows) {
  return [header.join(","), ...rows.map((row) => row.map(csvEscape).join(","))].join("\n");
}

function recruiterName(user, fallbackId = "") {
  if (!user) return fallbackId || "Unknown Recruiter";
  if (user.name) return user.name;
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  return user.email || fallbackId || "Unknown Recruiter";
}

function getBand(score) {
  if (score >= 80) return "Exceptional";
  if (score >= 60) return "Strong";
  if (score >= 40) return "Developing";
  return "Poor";
}

function computeQoH({ retention90d, managerRating, rampDays, benchmarkDays }) {
  const retentionScore = retention90d ? 100 : 0;
  const managerScore =
    typeof managerRating === "number" && Number.isFinite(managerRating)
      ? Math.max(0, Math.min(100, (managerRating / 5) * 100))
      : 0;

  const safeBenchmark =
    typeof benchmarkDays === "number" && benchmarkDays > 0 ? benchmarkDays : null;

  const safeRamp =
    typeof rampDays === "number" && rampDays >= 0 ? rampDays : null;

  const rampScore =
    safeBenchmark && safeRamp != null
      ? Math.max(0, Math.min(100, ((safeBenchmark - safeRamp) / safeBenchmark) * 100))
      : 0;

  const composite = Number(
    (retentionScore * 0.4 + managerScore * 0.35 + rampScore * 0.25).toFixed(1)
  );

  return {
    composite,
    retentionScore,
    managerScore: Number(managerScore.toFixed(1)),
    rampScore: Number(rampScore.toFixed(1)),
  };
}

async function getScopedJobs({
  userId,
  userRole,
  recruiterId,
  companyId,
  jobId,
}) {
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

  return prisma.job.findMany({
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
}

async function getScopedEvents(jobIds, dateFilter) {
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
        receivedAt: true,
      },
    }),
  ]);

  return { views, applications, interviews, offers };
}

function buildCountsByJob(jobIds, views, applications, interviews, offers) {
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

  return countsByJob;
}

function csvResponse(res, filename, header, rows) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.status(200).send(buildCsv(header, rows));
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
    const report = getQueryValue(req.query?.report, "overview");
    const jobId = getQueryValue(req.query?.jobId, "all");
    const recruiterId = getQueryValue(req.query?.recruiterId, "all");
    const companyId = getQueryValue(req.query?.companyId, "all");
    const fromStr = getQueryValue(req.query?.from, "");
    const toStr = getQueryValue(req.query?.to, "");

    const { from, to } = parseRange(range, fromStr, toStr);
    const dateFilter = { gte: from, lte: to };

    const jobs = await getScopedJobs({
      userId,
      userRole,
      recruiterId,
      companyId,
      jobId,
    });

    const jobIds = jobs.map((job) => job.id);
    const jobsById = Object.fromEntries(jobs.map((job) => [job.id, job]));

    const safeReport = [
      "overview",
      "funnel",
      "sources",
      "recruiters",
      "timeToFill",
      "qualityOfHire",
      "talentIntel",
    ].includes(report)
      ? report
      : "overview";

    if (!jobIds.length) {
      if (safeReport === "funnel") {
        return csvResponse(
          res,
          `recruiter-analytics-funnel-${range}.csv`,
          ["Stage", "Count", "Conversion From Previous Stage %", "Conversion From Top %"],
          [
            ["Views", 0, "0.00", "0.00"],
            ["Applications", 0, "0.00", "0.00"],
            ["Interviews", 0, "0.00", "0.00"],
            ["Offers", 0, "0.00", "0.00"],
            ["Hires", 0, "0.00", "0.00"],
          ]
        );
      }

      if (safeReport === "sources") {
        return csvResponse(
          res,
          `recruiter-analytics-sources-${range}.csv`,
          ["Source", "Applications", "Interviews", "Offers", "Hires", "Apply to Interview %", "Apply to Hire %"],
          [["ForgeTomorrow", 0, 0, 0, 0, "0.00", "0.00"]]
        );
      }

      if (safeReport === "recruiters") {
        return csvResponse(
          res,
          `recruiter-analytics-recruiters-${range}.csv`,
          [
            "Recruiter",
            "Jobs Owned",
            "Applications",
            "Interviews",
            "Offers",
            "Hires",
            "Apply to Hire %",
            "Avg Time to Fill Days",
            "Pipeline Velocity",
          ],
          []
        );
      }

      if (safeReport === "timeToFill") {
        return csvResponse(
          res,
          `recruiter-analytics-time-to-fill-${range}.csv`,
          ["Job Title", "Recruiter", "Company", "Created Date", "Filled Date", "Days to Fill"],
          []
        );
      }

      if (safeReport === "qualityOfHire") {
        return csvResponse(
          res,
          `recruiter-analytics-quality-of-hire-${range}.csv`,
          [
            "Recruiter",
            "Records",
            "Composite Score",
            "Band",
            "90d Retention %",
            "Avg Manager Rating",
            "Avg Ramp Days",
            "Avg Benchmark Days",
          ],
          [["Insufficient Data", 0, 0, "Insufficient Data", "0.0", "0.0", "0.0", "0.0"]]
        );
      }

      if (safeReport === "talentIntel") {
        return csvResponse(
          res,
          `recruiter-analytics-talent-intel-${range}.csv`,
          ["Metric", "Value", "Notes"],
          [
            ["Apply to Interview %", "0.0", "No applications in selected period"],
            ["Apply to Hire %", "0.0", "No hires in selected period"],
            ["Avg Time to Fill Days", "0.0", "No filled jobs in selected period"],
            ["Applications", 0, "Current period total"],
            ["Interviews", 0, "Current period total"],
            ["Hires", 0, "Current period total"],
          ]
        );
      }

      return csvResponse(
        res,
        `recruiter-analytics-overview-${range}.csv`,
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
        ],
        []
      );
    }

    const { views, applications, interviews, offers } = await getScopedEvents(jobIds, dateFilter);
    const countsByJob = buildCountsByJob(jobIds, views, applications, interviews, offers);

    if (safeReport === "overview") {
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
          stats.views > 0 ? ((stats.applications / stats.views) * 100).toFixed(2) : "0.00";

        const offerAcceptanceRatePct =
          stats.offers > 0 ? ((stats.hires / stats.offers) * 100).toFixed(2) : "0.00";

        return [
          job.title,
          job.company,
          job.createdAt?.toISOString?.() || "",
          stats.views,
          stats.applications,
          stats.interviews,
          stats.offers,
          stats.hires,
          conversionRatePct,
          offerAcceptanceRatePct,
        ];
      });

      const totals = jobs.reduce(
        (acc, job) => {
          const stats = countsByJob[job.id] || {
            views: 0,
            applications: 0,
            interviews: 0,
            offers: 0,
            hires: 0,
          };
          acc.views += stats.views;
          acc.applications += stats.applications;
          acc.interviews += stats.interviews;
          acc.offers += stats.offers;
          acc.hires += stats.hires;
          return acc;
        },
        { views: 0, applications: 0, interviews: 0, offers: 0, hires: 0 }
      );

      rows.push([
        "TOTALS",
        "",
        "",
        totals.views,
        totals.applications,
        totals.interviews,
        totals.offers,
        totals.hires,
        totals.views > 0 ? ((totals.applications / totals.views) * 100).toFixed(2) : "0.00",
        totals.offers > 0 ? ((totals.hires / totals.offers) * 100).toFixed(2) : "0.00",
      ]);

      return csvResponse(res, `recruiter-analytics-overview-${range}.csv`, header, rows);
    }

    if (safeReport === "funnel") {
      const viewsCount = views.length;
      const appliesCount = applications.length;
      const interviewsCount = interviews.length;
      const offersCount = offers.length;
      const hiresCount = offers.filter((offer) => offer.accepted).length;

      const stages = [
        { stage: "Views", count: viewsCount },
        { stage: "Applications", count: appliesCount },
        { stage: "Interviews", count: interviewsCount },
        { stage: "Offers", count: offersCount },
        { stage: "Hires", count: hiresCount },
      ];

      const header = ["Stage", "Count", "Conversion From Previous Stage %", "Conversion From Top %"];
      const topCount = stages[0].count || 0;

      const rows = stages.map((item, index) => {
        const previous = index === 0 ? item.count : stages[index - 1].count;
        const fromPrevious =
          previous > 0 ? ((item.count / previous) * 100).toFixed(2) : "0.00";
        const fromTop = topCount > 0 ? ((item.count / topCount) * 100).toFixed(2) : "0.00";

        return [item.stage, item.count, fromPrevious, fromTop];
      });

      return csvResponse(res, `recruiter-analytics-funnel-${range}.csv`, header, rows);
    }

    if (safeReport === "sources") {
      const totalApplications = applications.length;
      const totalInterviews = interviews.length;
      const totalOffers = offers.length;
      const totalHires = offers.filter((offer) => offer.accepted).length;

      const header = [
        "Source",
        "Applications",
        "Interviews",
        "Offers",
        "Hires",
        "Apply to Interview %",
        "Apply to Hire %",
      ];

      const rows = [
        [
          "ForgeTomorrow",
          totalApplications,
          totalInterviews,
          totalOffers,
          totalHires,
          totalApplications > 0 ? ((totalInterviews / totalApplications) * 100).toFixed(2) : "0.00",
          totalApplications > 0 ? ((totalHires / totalApplications) * 100).toFixed(2) : "0.00",
        ],
        [
          "TOTALS",
          totalApplications,
          totalInterviews,
          totalOffers,
          totalHires,
          totalApplications > 0 ? ((totalInterviews / totalApplications) * 100).toFixed(2) : "0.00",
          totalApplications > 0 ? ((totalHires / totalApplications) * 100).toFixed(2) : "0.00",
        ],
      ];

      return csvResponse(res, `recruiter-analytics-sources-${range}.csv`, header, rows);
    }

    if (safeReport === "recruiters") {
      const recruiterMap = {};

      jobs.forEach((job) => {
        if (!recruiterMap[job.userId]) {
          recruiterMap[job.userId] = {
            recruiterId: job.userId,
            recruiterName: recruiterName(job.user, job.userId),
            totalJobs: 0,
            totalApplications: 0,
            totalInterviews: 0,
            totalOffers: 0,
            totalHires: 0,
            timeToFillSamples: [],
          };
        }
        recruiterMap[job.userId].totalJobs += 1;
      });

      applications.forEach((row) => {
        const job = jobsById[row.jobId];
        if (!job || !recruiterMap[job.userId]) return;
        recruiterMap[job.userId].totalApplications += 1;
      });

      interviews.forEach((row) => {
        const job = jobsById[row.jobId];
        if (!job || !recruiterMap[job.userId]) return;
        recruiterMap[job.userId].totalInterviews += 1;
      });

      offers.forEach((row) => {
        const job = jobsById[row.jobId];
        if (!job || !recruiterMap[job.userId]) return;

        recruiterMap[job.userId].totalOffers += 1;

        if (row.accepted) {
          recruiterMap[job.userId].totalHires += 1;
          const diffDays =
            (new Date(row.receivedAt).getTime() - new Date(job.createdAt).getTime()) / MS_PER_DAY;
          if (Number.isFinite(diffDays) && diffDays >= 0) {
            recruiterMap[job.userId].timeToFillSamples.push(Number(diffDays.toFixed(1)));
          }
        }
      });

      const rows = Object.values(recruiterMap)
        .map((entry) => {
          const avgTimeToFillDays = entry.timeToFillSamples.length
            ? Number(
                (
                  entry.timeToFillSamples.reduce((sum, value) => sum + value, 0) /
                  entry.timeToFillSamples.length
                ).toFixed(1)
              )
            : 0;

          const applyToHirePct =
            entry.totalApplications > 0
              ? ((entry.totalHires / entry.totalApplications) * 100).toFixed(2)
              : "0.00";

          const pipelineVelocity =
            entry.totalJobs > 0
              ? (entry.totalApplications / entry.totalJobs).toFixed(2)
              : "0.00";

          return [
            entry.recruiterName,
            entry.totalJobs,
            entry.totalApplications,
            entry.totalInterviews,
            entry.totalOffers,
            entry.totalHires,
            applyToHirePct,
            avgTimeToFillDays,
            pipelineVelocity,
          ];
        })
        .sort((a, b) => Number(b[5]) - Number(a[5]));

      const totals = rows.reduce(
        (acc, row) => {
          acc.jobs += Number(row[1]);
          acc.applications += Number(row[2]);
          acc.interviews += Number(row[3]);
          acc.offers += Number(row[4]);
          acc.hires += Number(row[5]);
          acc.timeToFill += Number(row[7]);
          acc.velocity += Number(row[8]);
          return acc;
        },
        { jobs: 0, applications: 0, interviews: 0, offers: 0, hires: 0, timeToFill: 0, velocity: 0 }
      );

      rows.push([
        "TOTALS / AVERAGES",
        totals.jobs,
        totals.applications,
        totals.interviews,
        totals.offers,
        totals.hires,
        totals.applications > 0 ? ((totals.hires / totals.applications) * 100).toFixed(2) : "0.00",
        rows.length > 0 ? (totals.timeToFill / rows.length).toFixed(1) : "0.0",
        rows.length > 0 ? (totals.velocity / rows.length).toFixed(2) : "0.00",
      ]);

      return csvResponse(
        res,
        `recruiter-analytics-recruiters-${range}.csv`,
        [
          "Recruiter",
          "Jobs Owned",
          "Applications",
          "Interviews",
          "Offers",
          "Hires",
          "Apply to Hire %",
          "Avg Time to Fill Days",
          "Pipeline Velocity",
        ],
        rows
      );
    }

    if (safeReport === "timeToFill") {
      const acceptedOffers = offers.filter((offer) => offer.accepted);

      const earliestAcceptedByJob = {};
      acceptedOffers.forEach((offer) => {
        const current = earliestAcceptedByJob[offer.jobId];
        if (!current || new Date(offer.receivedAt).getTime() < new Date(current.receivedAt).getTime()) {
          earliestAcceptedByJob[offer.jobId] = offer;
        }
      });

      const rows = jobs
        .map((job) => {
          const accepted = earliestAcceptedByJob[job.id];
          if (!accepted) return null;

          const daysToFill = Number(
            (
              (new Date(accepted.receivedAt).getTime() - new Date(job.createdAt).getTime()) /
              MS_PER_DAY
            ).toFixed(1)
          );

          if (!Number.isFinite(daysToFill) || daysToFill < 0) return null;

          return [
            job.title,
            recruiterName(job.user, job.userId),
            job.company,
            new Date(job.createdAt).toISOString(),
            new Date(accepted.receivedAt).toISOString(),
            daysToFill,
          ];
        })
        .filter(Boolean)
        .sort((a, b) => Number(a[5]) - Number(b[5]));

      if (rows.length > 0) {
        const values = rows.map((row) => Number(row[5]));
        const avg = (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
        rows.push(["AVERAGE", "", "", "", "", avg]);
      }

      return csvResponse(
        res,
        `recruiter-analytics-time-to-fill-${range}.csv`,
        ["Job Title", "Recruiter", "Company", "Created Date", "Filled Date", "Days to Fill"],
        rows
      );
    }

    if (safeReport === "qualityOfHire") {
      const qohRecords = await prisma.hireQuality.findMany({
        where: {
          jobId: { in: jobIds },
          createdAt: dateFilter,
        },
        select: {
          recruiterId: true,
          retention90d: true,
          managerRating: true,
          rampDays: true,
          benchmarkDays: true,
          recruiter: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (qohRecords.length < QOH_MINIMUM_REQUIRED) {
        return csvResponse(
          res,
          `recruiter-analytics-quality-of-hire-${range}.csv`,
          [
            "Recruiter",
            "Records",
            "Composite Score",
            "Band",
            "90d Retention %",
            "Avg Manager Rating",
            "Avg Ramp Days",
            "Avg Benchmark Days",
          ],
          [[
            "Insufficient Data",
            qohRecords.length,
            0,
            "Insufficient Data",
            "0.0",
            "0.0",
            "0.0",
            "0.0",
          ]]
        );
      }

      const byRecruiter = {};

      qohRecords.forEach((record) => {
        if (!byRecruiter[record.recruiterId]) {
          byRecruiter[record.recruiterId] = {
            recruiterName: recruiterName(record.recruiter, record.recruiterId),
            records: [],
          };
        }
        byRecruiter[record.recruiterId].records.push(record);
      });

      const rows = Object.values(byRecruiter)
        .map((entry) => {
          const computed = entry.records.map((record) => ({
            ...record,
            ...computeQoH(record),
          }));

          const composite = Number(
            (
              computed.reduce((sum, record) => sum + record.composite, 0) / computed.length
            ).toFixed(1)
          );

          const retentionPct = Number(
            (
              (computed.filter((record) => record.retention90d === true).length / computed.length) *
              100
            ).toFixed(1)
          );

          const managerRatings = computed
            .map((record) => record.managerRating)
            .filter((value) => typeof value === "number" && Number.isFinite(value));

          const avgManagerRating = managerRatings.length
            ? Number(
                (
                  managerRatings.reduce((sum, value) => sum + value, 0) / managerRatings.length
                ).toFixed(1)
              )
            : 0;

          const rampValues = computed
            .map((record) => record.rampDays)
            .filter((value) => typeof value === "number" && Number.isFinite(value));

          const avgRampDays = rampValues.length
            ? Number(
                (
                  rampValues.reduce((sum, value) => sum + value, 0) / rampValues.length
                ).toFixed(1)
              )
            : 0;

          const benchmarkValues = computed
            .map((record) => record.benchmarkDays)
            .filter((value) => typeof value === "number" && Number.isFinite(value));

          const avgBenchmarkDays = benchmarkValues.length
            ? Number(
                (
                  benchmarkValues.reduce((sum, value) => sum + value, 0) / benchmarkValues.length
                ).toFixed(1)
              )
            : 0;

          return [
            entry.recruiterName,
            computed.length,
            composite,
            getBand(composite),
            retentionPct,
            avgManagerRating,
            avgRampDays,
            avgBenchmarkDays,
          ];
        })
        .sort((a, b) => Number(b[2]) - Number(a[2]));

      const totalRecords = rows.reduce((sum, row) => sum + Number(row[1]), 0);
      const avgComposite =
        rows.length > 0
          ? (
              rows.reduce((sum, row) => sum + Number(row[2]), 0) / rows.length
            ).toFixed(1)
          : "0.0";
      const avgRetention =
        rows.length > 0
          ? (
              rows.reduce((sum, row) => sum + Number(row[4]), 0) / rows.length
            ).toFixed(1)
          : "0.0";
      const avgManager =
        rows.length > 0
          ? (
              rows.reduce((sum, row) => sum + Number(row[5]), 0) / rows.length
            ).toFixed(1)
          : "0.0";
      const avgRamp =
        rows.length > 0
          ? (
              rows.reduce((sum, row) => sum + Number(row[6]), 0) / rows.length
            ).toFixed(1)
          : "0.0";
      const avgBenchmark =
        rows.length > 0
          ? (
              rows.reduce((sum, row) => sum + Number(row[7]), 0) / rows.length
            ).toFixed(1)
          : "0.0";

      rows.push([
        "TOTALS / AVERAGES",
        totalRecords,
        avgComposite,
        getBand(Number(avgComposite)),
        avgRetention,
        avgManager,
        avgRamp,
        avgBenchmark,
      ]);

      return csvResponse(
        res,
        `recruiter-analytics-quality-of-hire-${range}.csv`,
        [
          "Recruiter",
          "Records",
          "Composite Score",
          "Band",
          "90d Retention %",
          "Avg Manager Rating",
          "Avg Ramp Days",
          "Avg Benchmark Days",
        ],
        rows
      );
    }

    const totalViews = views.length;
    const totalApplications = applications.length;
    const totalInterviews = interviews.length;
    const totalOffers = offers.length;
    const totalHires = offers.filter((offer) => offer.accepted).length;

    const talentRows = [
      [
        "Apply to Interview %",
        totalApplications > 0 ? ((totalInterviews / totalApplications) * 100).toFixed(2) : "0.00",
        "Applications converting into interviews in selected period",
      ],
      [
        "Apply to Hire %",
        totalApplications > 0 ? ((totalHires / totalApplications) * 100).toFixed(2) : "0.00",
        "Applications converting into hires in selected period",
      ],
      [
        "Offer Acceptance %",
        totalOffers > 0 ? ((totalHires / totalOffers) * 100).toFixed(2) : "0.00",
        "Offers converting into accepted hires in selected period",
      ],
      [
        "Avg Time to Fill Days",
        avgTimeToFill.toFixed ? avgTimeToFill.toFixed(1) : String(avgTimeToFill),
        "Average filled-role close time for selected period",
      ],
      ["Views", totalViews, "Current period total"],
      ["Applications", totalApplications, "Current period total"],
      ["Interviews", totalInterviews, "Current period total"],
      ["Offers", totalOffers, "Current period total"],
      ["Hires", totalHires, "Current period total"],
    ];

    return csvResponse(
      res,
      `recruiter-analytics-talent-intel-${range}.csv`,
      ["Metric", "Value", "Notes"],
      talentRows
    );
  } catch (err) {
    console.error("[analytics/export] error:", err);
    return res.status(500).json({
      error: "We had trouble exporting recruiter analytics.",
      detail: err?.message || "Unknown error",
    });
  }
}