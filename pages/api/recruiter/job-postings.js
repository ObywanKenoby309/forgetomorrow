// pages/api/recruiter/job-postings.js

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

  // Default: real logged-in user
  let effectiveUserId = null;

  // If platform admin + impersonation cookie exists, use targetUserId
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
      select: { id: true, email: true, role: true, accountKey: true },
    });
    return u?.id ? u : null;
  }

  const u = await prisma.user.findUnique({
    where: { email: sessionEmail },
    select: { id: true, email: true, role: true, accountKey: true },
  });
  return u?.id ? u : null;
}

async function requireRecruiterSession(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }

  // Optional basic role gate — allow Recruiter/Admin/Platform Admin
  const role = String(session.user?.role || "SEEKER");
  const isPlatformAdmin = !!session.user?.isPlatformAdmin;

  if (!isPlatformAdmin && !["RECRUITER", "ADMIN"].includes(role)) {
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
    userId: job.userId,
    createdAt: job.createdAt,

    // These may be undefined on this model; that’s fine.
    origin: job.origin,
    source: job.source,
    publishedat: job.publishedat,

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

  // ✅ Impersonation-aware effective user + org key (NO FALLBACK)
  const effective = await resolveEffectiveRecruiter(req, session);

  if (!effective?.id) {
    return res.status(404).json({ error: "User not found" });
  }
  if (!effective.accountKey) {
    return res.status(404).json({ error: "accountKey not found" });
  }

  const effectiveUserId = effective.id;
  const recruiterAccountKey = effective.accountKey;

  try {
    if (req.method === "GET") {
      // ✅ Org scope: ALL jobs for this org (not just creator)
      const jobs = await prisma.job.findMany({
        where: { accountKey: recruiterAccountKey },
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
          type: safeText(type, ""),
          compensation: safeText(compensation, ""),
          description: safeText(description),
          status,
          urgent: Boolean(urgent),

          // ✅ creator is the effective user (impersonated target if active)
          userId: effectiveUserId,

          // ✅ ALWAYS enforce org scope from DB user (ignore session/body)
          accountKey: recruiterAccountKey,
        },
      });

      return res.status(201).json({ job: shapeJob(job) });
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

      // ✅ Ensure job is in THIS org (not just owned by user)
      const existing = await prisma.job.findFirst({
        where: { id: Number(id), accountKey: recruiterAccountKey },
      });

      if (!existing) {
        return res.status(404).json({
          error: "Job not found or not in this recruiter account.",
        });
      }

      const nextStatus = status ?? existing.status;

      const updated = await prisma.job.update({
        where: { id: existing.id },
        data: {
          title: title !== undefined ? safeText(title) : existing.title,
          company: company !== undefined ? safeText(company) : existing.company,
          worksite:
            worksite !== undefined ? safeText(worksite) : existing.worksite,
          location:
            location !== undefined ? safeText(location) : existing.location,
          type: type !== undefined ? safeText(type, "") : existing.type,
          compensation:
            compensation !== undefined
              ? safeText(compensation, "")
              : existing.compensation,
          description:
            description !== undefined
              ? safeText(description)
              : existing.description,
          status: nextStatus,
          urgent: typeof urgent === "boolean" ? urgent : existing.urgent,
        },
      });

      return res.status(200).json({ job: shapeJob(updated) });
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
