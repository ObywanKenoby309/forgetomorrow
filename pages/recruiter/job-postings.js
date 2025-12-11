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
    seekerVisible = false; // will still be available to recruiter, just not shown in seeker feed
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
    // 🔸 Seeker-facing meta (derived only, no DB fields required)
    seekerVisible: seekerMeta.seekerVisible,
    allowNewApplications: seekerMeta.allowNewApplications,
    seekerBanner: seekerMeta.seekerBanner,
  };
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
          title,
          company,
          worksite,
          location,
          type: type || null,
          compensation: compensation || null,
          description,
          status,
          urgent: Boolean(urgent),
          userId,
          accountKey, // 🔸 tie posting to the account/org
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

      const updated = await prisma.job.update({
        where: { id: existing.id },
        data: {
          title: title ?? existing.title,
          company: company ?? existing.company,
          worksite: worksite ?? existing.worksite,
          location: location ?? existing.location,
          type: type ?? existing.type,
          compensation: compensation ?? existing.compensation,
          description: description ?? existing.description,
          status: status ?? existing.status,
          urgent: typeof urgent === "boolean" ? urgent : existing.urgent,
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
    });
  }
}
