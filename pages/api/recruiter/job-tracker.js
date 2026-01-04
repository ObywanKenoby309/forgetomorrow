// pages/api/recruiter/job-tracker.js

import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production";

function readCookie(req, name) {
  try {
    const raw = req.headers?.cookie || "";
    const parts = raw.split(";").map((p) => p.trim());
    for (const p of parts) {
      if (p.startsWith(name + "=")) return decodeURIComponent(p.slice(name.length + 1));
    }
    return "";
  } catch {
    return "";
  }
}

async function resolveEffectiveRecruiter(req, session) {
  const sessionEmail = String(session?.user?.email || "").trim().toLowerCase();
  if (!sessionEmail) return null;

  const isPlatformAdmin = !!session?.user?.isPlatformAdmin;

  let effectiveUserId = null;

  if (isPlatformAdmin) {
    const imp = readCookie(req, "ft_imp");
    if (imp) {
      try {
        const decoded = jwt.verify(imp, JWT_SECRET);
        if (decoded && typeof decoded === "object" && decoded.targetUserId) {
          effectiveUserId = String(decoded.targetUserId);
        }
      } catch {
        // ignore invalid/expired cookie
      }
    }
  }

  if (effectiveUserId) {
    const u = await prisma.user.findUnique({
      where: { id: effectiveUserId },
      select: { id: true, email: true, accountKey: true },
    });
    return u?.id ? u : null;
  }

  const u = await prisma.user.findUnique({
    where: { email: sessionEmail },
    select: { id: true, email: true, accountKey: true },
  });
  return u?.id ? u : null;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // ✅ Impersonation-aware + org scope (NO FALLBACK)
    const effective = await resolveEffectiveRecruiter(req, session);

    if (!effective?.id) {
      return res.status(404).json({ error: "User not found" });
    }
    if (!effective.accountKey) {
      return res.status(404).json({ error: "accountKey not found" });
    }

    const recruiterAccountKey = effective.accountKey;

    // ✅ Org scope: for MVP, jobs in this accountKey (ALL creators)
    const baseJobWhere = { accountKey: recruiterAccountKey };

    // Active jobs = status "Open" only
    const activeJobWhere = {
      ...baseJobWhere,
      status: "Open",
    };

    const now = new Date();
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1) Load active jobs with related events
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

    // 2) Summary metrics
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

    // 3) Avg time-to-fill across Closed/Filled jobs (org scope)
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

    // 4) Per-job rows
    const jobs = activeJobs.map((job) => {
      const views = job.views.length;
      const applies = job.applications.length;

      const newApplicants = job.applications.filter(
        (app) => app.appliedAt && app.appliedAt >= since24h
      ).length;

      const lastAppAt = job.applications.reduce(
        (latest, app) => (!latest || app.appliedAt > latest ? app.appliedAt : latest),
        null
      );
      const lastInterviewAt = job.interviews.reduce(
        (latest, iv) => (!latest || iv.scheduledAt > latest ? iv.scheduledAt : latest),
        null
      );
      const lastOfferAt = job.offers.reduce(
        (latest, offer) => (!latest || offer.receivedAt > latest ? offer.receivedAt : latest),
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

    const summary = {
      openJobs: openJobsCount,
      totalApplicants,
      activeCandidates,
      avgTimeToFillDays,
    };

    return res.status(200).json({ summary, jobs });
  } catch (err) {
    console.error("[API] /api/recruiter/job-tracker error:", err);

    return res.status(500).json({
      error: "Failed to load recruiter job tracker.",
      message: err?.message || null,
      code: err?.code || null,
      meta: err?.meta || null,
    });
  }
}
