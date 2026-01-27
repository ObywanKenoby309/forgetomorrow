// pages/api/recruiter/job-postings/[id]/applications.js
import prisma from "@/lib/prisma";
import { getClientSession } from "@/lib/auth-client";

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

    const session = await getClientSession(req);
    const userId = session?.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const jobId = toInt(req.query.id);
    if (!jobId) return res.status(400).json({ error: "Invalid job id" });

    // Viewer access
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
        accountKey: true,
        isTemplate: true,
        status: true,
      },
    });

    if (!job) return res.status(404).json({ error: "Not found" });

    // Safety: applicants list is for real jobs, not templates
    if (job.isTemplate) {
      return res.status(400).json({ error: "Templates do not have applicants" });
    }

    // Enforce org access if job is org-scoped
    if (job.accountKey && !allowedAccountKeys.has(job.accountKey)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const applications = await prisma.application.findMany({
      where: { jobId: jobId },
      select: {
        id: true,
        status: true,
        appliedAt: true,
        submittedAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        resumeId: true,
        coverId: true,
      },
      orderBy: { appliedAt: "desc" },
    });

    const mapped = (applications || []).map((a) => {
      const candidateName =
        a.user?.name ||
        [a.user?.firstName, a.user?.lastName].filter(Boolean).join(" ") ||
        null;

      return {
        id: a.id, // application id
        status: a.status,
        appliedAt: a.appliedAt,
        submittedAt: a.submittedAt,
        updatedAt: a.updatedAt,
        candidateUserId: a.user?.id || null,
        candidateName,
        candidateEmail: a.user?.email || null,
        hasResume: !!a.resumeId,
        hasCover: !!a.coverId,
      };
    });

    return res.status(200).json({
      job: {
        id: job.id,
        title: job.title,
        company: job.company,
        worksite: job.worksite,
        location: job.location,
        status: job.status,
      },
      applications: mapped,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("job applicants api error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}
