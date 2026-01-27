// pages/api/recruiter/job-postings/[id]/applications.js
import prismaDefault, { prisma as prismaNamed } from "@/lib/prisma";
import { getClientSession } from "@/lib/auth-client";

const prisma = prismaDefault || prismaNamed;

function toInt(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function safeString(val) {
  if (val === undefined || val === null) return "";
  return String(val);
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!prisma) {
      // This is the #1 “it works locally but 500 in prod” failure.
      return res.status(500).json({ error: "Prisma client not initialized" });
    }

    const session = await getClientSession(req);
    const userId = session?.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const jobId = toInt(req.query.id);
    if (!jobId) return res.status(400).json({ error: "Invalid job id" });

    const viewer = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        accountKey: true,
        employee: true,
        organizationMemberships: { select: { accountKey: true } },
      },
    });

    if (!viewer) return res.status(401).json({ error: "Unauthorized" });

    const viewerRole = safeString(viewer.role).toUpperCase();
    const isRecruiter = viewerRole === "RECRUITER";
    const isStaff = !!viewer.employee;

    if (!isRecruiter && !isStaff) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const allowedAccountKeys = new Set(
      [viewer.accountKey, ...(viewer.organizationMemberships || []).map((m) => m.accountKey)].filter(Boolean)
    );

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        company: true,
        worksite: true,
        location: true,
        type: true,
        compensation: true,
        description: true,
        status: true,
        urgent: true,
        accountKey: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!job) return res.status(404).json({ error: "Job not found" });

    const jobAccountKey = job.accountKey || null;
    if (jobAccountKey && !allowedAccountKeys.has(jobAccountKey)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const applications = await prisma.application.findMany({
      where: { jobId },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        appliedAt: true,
        updatedAt: true,
        accountKey: true,
        resumeId: true,
        coverId: true,
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
      orderBy: [{ submittedAt: "desc" }, { appliedAt: "desc" }, { updatedAt: "desc" }],
    });

    return res.status(200).json({
      job: {
        id: job.id,
        title: job.title,
        company: job.company,
        worksite: job.worksite,
        location: job.location,
        type: job.type,
        compensation: job.compensation,
        status: job.status,
        urgent: job.urgent,
        accountKey: jobAccountKey,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      },
      applications: (applications || []).map((a) => ({
        id: a.id,
        status: a.status,
        submittedAt: a.submittedAt || null,
        appliedAt: a.appliedAt || null,
        updatedAt: a.updatedAt || null,
        accountKey: a.accountKey || jobAccountKey || null,
        resumeId: a.resumeId || null,
        coverId: a.coverId || null,
        candidate: {
          id: a.user?.id || null,
          name: a.user?.name || [a.user?.firstName, a.user?.lastName].filter(Boolean).join(" ") || null,
          email: a.user?.email || null,
        },
      })),
    });
  } catch (e) {
    // Make the error observable in prod without leaking internals
    console.error("[job applicants api] error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}
