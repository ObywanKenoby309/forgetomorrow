// pages/api/recruiter/job-postings/[id]/applications/[applicationId].js
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]";

function toInt(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function safeString(val) {
  if (val === undefined || val === null) return "";
  return String(val);
}

const ALLOWED_STATUSES = new Set(["Applied", "Interviewing", "Offers", "ClosedOut"]);

// Light guardrail to avoid accidental mega-pastes
const MAX_NOTES_LEN = 8000;

export default async function handler(req, res) {
  try {
    if (req.method !== "PATCH") {
      res.setHeader("Allow", ["PATCH"]);
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!prisma) {
      return res.status(500).json({ error: "Prisma client not initialized" });
    }

    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // ✅ IMPORTANT: slug is [id] at the job-postings level
    const jobId = toInt(req.query.id);
    if (!jobId) return res.status(400).json({ error: "Invalid job id" });

    const applicationId = toInt(req.query.applicationId);
    if (!applicationId) return res.status(400).json({ error: "Invalid application id" });

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
        accountKey: true,
      },
    });

    if (!job) return res.status(404).json({ error: "Job not found" });

    const jobAccountKey = job.accountKey || null;
    if (jobAccountKey && !allowedAccountKeys.has(jobAccountKey)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const body = req.body || {};

    // Allow PATCH for status and/or recruiterNotes
    const hasStatus = Object.prototype.hasOwnProperty.call(body, "status");
    const hasRecruiterNotes = Object.prototype.hasOwnProperty.call(body, "recruiterNotes");

    if (!hasStatus && !hasRecruiterNotes) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    let nextStatus = null;
    if (hasStatus) {
      nextStatus = safeString(body.status).trim();

      // allow UI to send "Closed Out" label, normalize to enum
      if (nextStatus === "Closed Out") nextStatus = "ClosedOut";

      if (!ALLOWED_STATUSES.has(nextStatus)) {
        return res.status(400).json({
          error: `Invalid status. Allowed: ${Array.from(ALLOWED_STATUSES).join(", ")}`,
        });
      }
    }

    let nextRecruiterNotes = null;
    if (hasRecruiterNotes) {
      // recruiterNotes can be null to clear, or string
      if (body.recruiterNotes === null) {
        nextRecruiterNotes = null;
      } else {
        const s = safeString(body.recruiterNotes);
        if (s.length > MAX_NOTES_LEN) {
          return res.status(400).json({ error: `recruiterNotes too long (max ${MAX_NOTES_LEN})` });
        }
        nextRecruiterNotes = s;
      }
    }

    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      select: {
        id: true,
        jobId: true,
        accountKey: true,
        status: true,
        userId: true,
        submittedAt: true,
        appliedAt: true,
        updatedAt: true,
      },
    });

    if (!app) return res.status(404).json({ error: "Application not found" });
    if (app.jobId !== jobId) return res.status(400).json({ error: "Application does not belong to this job" });

    const appAccountKey = app.accountKey || jobAccountKey || null;
    if (appAccountKey && !allowedAccountKeys.has(appAccountKey)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const data = {};
    if (hasStatus) data.status = nextStatus;
    if (hasRecruiterNotes) data.recruiterNotes = nextRecruiterNotes;

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data,
      select: {
        id: true,
        status: true,
        recruiterNotes: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({ ok: true, application: updated });
  } catch (e) {
    console.error("[recruiter move application stage] error:", e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}