// pages/api/recruiter/job-postings.js

import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

async function requireRecruiterSession(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email || !session.user.id) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }

  // Optional: basic role gate — only recruiters & admins can use this endpoint
  const role = (session.user /** as any */)?.role || "SEEKER";
  if (!["RECRUITER", "ADMIN"].includes(String(role))) {
    res.status(403).json({ error: "Insufficient permissions" });
    return null;
  }

  return session;
}

// Derived seeker-facing meta from status
function buildSeekerMeta(job) {
  const status = job.status || "Draft";

  let seekerVisible = false;
  let allowNewApplications = false;
  let seekerBanner = "";

  if (status === "Draft") {
    seekerVisible = false;
  } else if (status === "Open") {
    seekerVisible = true;
    allowNewApplications = true;
  } else if (status === "Reviewing") {
    seekerVisible = true;
    allowNewApplications = false;
    seekerBanner =
      "This employer is now reviewing applicants. Thank you to those who applied.";
  } else if (status === "Closed") {
    // still visible to recruiter, hidden from seeker feed (jobs page handles timing)
    seekerVisible = false;
    allowNewApplications = false;
    seekerBanner =
      "This posting is now closed. Stay tuned for future opportunities.";
  }

  return { seekerVisible, allowNewApplications, seekerBanner };
}

function shapeJob(job) {
  const seekerMeta = buildSeekerMeta(job);

  return {
    id: job.id,
    title: job.title,
    company: job.company,
    worksite: job.worksite,
    location: job.location,
    status: job.status,
    urgent: job.urgent,
    views: job.viewsCount,
    applications: job.applicationsCount,
    type: job.type,
    compensation: job.compensation,
    description: job.description,
    accountKey: job.accountKey,
    createdAt: job.createdAt,
    // These may be undefined on this model; that’s fine.
    origin: job.origin,
    source: job.source,
    publishedat: job.publishedat,
    // 🔸 Seeker-facing meta (derived only, no DB fields required)
    seekerVisible: seekerMeta.seekerVisible,
    allowNewApplications: seekerMeta.allowNewApplications,
    seekerBanner: seekerMeta.seekerBanner,
  };
}

// Helper to avoid writing `null` into text columns
function safeText(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

export default async function handler(req, res) {
  const session = await requireRecruiterSession(req, res);
  if (!session) return;

  const userId = session.user.id;
  const accountKey = (session.user /** as any */).accountKey || null;

  try {
    if (req.method === "GET") {
      // Fetch all jobs owned by this user (later we can expand to account-level)
      const jobs = await prisma.job.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      const rows = jobs.map(shapeJob);

      return res.status(200).json({ jobs: rows });
    }

    if (req.method === "POST") {
      const {
        title,
        company,
        worksite,
        location,
        type,
        compensation,
        description,
        status = "Draft",
        urgent = false,
      } = req.body || {};

      if (!title || !company || !worksite || !location || !description) {
        return res.status(400).json({
          error:
            "Missing required fields (title, company, worksite, location, description).",
        });
      }

      const job = await prisma.job.create({
        data: {
          title: safeText(title),
          company: safeText(company),
          worksite: safeText(worksite),
          location: safeText(location),
          type: safeText(type, ""),                 // no null
          compensation: safeText(compensation, ""), // no null
          description: safeText(description),
          status,
          urgent: Boolean(urgent),
          userId,
          accountKey, // 🔸 tie posting to the account/org
          // createdAt / updatedAt handled by Prisma / DB
        },
      });

      return res.status(201).json({
        job: shapeJob(job),
      });
    }

    if (req.method === "PATCH") {
      const {
        id,
        status,
        urgent,
        title,
        company,
        worksite,
        location,
        type,
        compensation,
        description,
      } = req.body || {};

      if (!id) {
        return res.status(400).json({ error: "Job id is required." });
      }

      // Ensure the job belongs to the current user (basic multitenant guard)
      const existing = await prisma.job.findFirst({
        where: { id: Number(id), userId },
      });

      if (!existing) {
        return res
          .status(404)
          .json({ error: "Job not found or not owned by this recruiter." });
      }

      const nextStatus = status ?? existing.status;

      const updated = await prisma.job.update({
        where: { id: existing.id },
        data: {
          title:
            title !== undefined ? safeText(title) : existing.title,
          company:
            company !== undefined ? safeText(company) : existing.company,
          worksite:
            worksite !== undefined ? safeText(worksite) : existing.worksite,
          location:
            location !== undefined ? safeText(location) : existing.location,
          type:
            type !== undefined ? safeText(type, "") : existing.type,
          compensation:
            compensation !== undefined
              ? safeText(compensation, "")
              : existing.compensation,
          description:
            description !== undefined
              ? safeText(description)
              : existing.description,
          status: nextStatus,
          urgent:
            typeof urgent === "boolean" ? urgent : existing.urgent,
          // origin/source/publishedat NOT written here – those fields
          // don’t exist on this model and are handled elsewhere.
        },
      });

      return res.status(200).json({
        job: shapeJob(updated),
      });
    }

    res.setHeader("Allow", "GET,POST,PATCH");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[api/recruiter/job-postings] error:", err);
    return res.status(500).json({
      error: "Unexpected error while handling recruiter job postings.",
      detail: err?.message || null,
      code: err?.code || null,
      meta: err?.meta || null,
    });
  }
}
