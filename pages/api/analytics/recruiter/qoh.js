// pages/api/analytics/recruiter/qoh.js
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

function recruiterName(user) {
  if (!user) return "Unknown Recruiter";
  if (user.name) return user.name;
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  return user.email || "Unknown Recruiter";
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
    (
      retentionScore * 0.4 +
      managerScore * 0.35 +
      rampScore * 0.25
    ).toFixed(1)
  );

  return {
    composite,
    retentionScore,
    managerScore: Number(managerScore.toFixed(1)),
    rampScore: Number(rampScore.toFixed(1)),
  };
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
    });

    const jobIds = jobs.map((job) => job.id);

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
        },
        building: true,
        minimumRequired: 5,
        recordsCount: 0,
        composite: 0,
        band: "Building",
        components: {
          retention90d: 0,
          managerRating: 0,
          rampDays: 0,
          benchmarkDays: 0,
        },
        byRecruiter: [],
      });
    }

    const qohRecords = await prisma.hireQuality.findMany({
      where: {
        jobId: { in: jobIds },
        createdAt: {
          gte: from,
          lte: to,
        },
      },
      select: {
        id: true,
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

    const recordsCount = qohRecords.length;
    const minimumRequired = 5;

    if (recordsCount < minimumRequired) {
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
        building: true,
        minimumRequired,
        recordsCount,
        composite: 0,
        band: "Building",
        components: {
          retention90d: 0,
          managerRating: 0,
          rampDays: 0,
          benchmarkDays: 0,
        },
        byRecruiter: [],
      });
    }

    const computed = qohRecords.map((record) => ({
      ...record,
      ...computeQoH(record),
    }));

    const retention90dPct = Number(
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

    const composite = Number(
      (
        computed.reduce((sum, record) => sum + record.composite, 0) / computed.length
      ).toFixed(1)
    );

    const recruiterMap = {};

    computed.forEach((record) => {
      if (!recruiterMap[record.recruiterId]) {
        recruiterMap[record.recruiterId] = {
          recruiterId: record.recruiterId,
          recruiterName: recruiterName(record.recruiter),
          scores: [],
        };
      }
      recruiterMap[record.recruiterId].scores.push(record.composite);
    });

    const byRecruiter = Object.values(recruiterMap)
      .map((entry) => {
        const score = Number(
          (
            entry.scores.reduce((sum, value) => sum + value, 0) / entry.scores.length
          ).toFixed(1)
        );

        return {
          recruiterId: entry.recruiterId,
          recruiterName: entry.recruiterName,
          score,
          band: getBand(score),
          recordsCount: entry.scores.length,
        };
      })
      .sort((a, b) => b.score - a.score);

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
      building: false,
      minimumRequired,
      recordsCount,
      composite,
      band: getBand(composite),
      components: {
        retention90d: retention90dPct,
        managerRating: avgManagerRating,
        rampDays: avgRampDays,
        benchmarkDays: avgBenchmarkDays,
      },
      byRecruiter,
    });
  } catch (err) {
    console.error("[analytics/recruiter/qoh] error:", err);
    return res.status(500).json({
      error: "We had trouble loading quality-of-hire analytics.",
      detail: err?.message || "Unknown error",
    });
  }
}