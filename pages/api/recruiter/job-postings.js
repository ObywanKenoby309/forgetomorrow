// pages/api/recruiter/job-postings.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production";

function readCookie(req, name) {
  try {
    const raw = req.headers?.cookie || "";
    const parts = raw.split(";").map((p) => p.trim());
    for (const p of parts) {
      if (p.startsWith(name + "="))
        return decodeURIComponent(p.slice(name.length + 1));
    }
    return "";
  } catch {
    return "";
  }
}

async function resolveEffectiveRecruiter(req, session) {
  const sessionEmail = String(session?.user?.email || "")
    .trim()
    .toLowerCase();
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

function shapeJob(job, { lite = false } = {}) {
  const seekerMeta = buildSeekerMeta(job);

  const base = {
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

    // template support
    isTemplate: Boolean(job.isTemplate),
    templateName: job.templateName || null,

    // These may be undefined on this model; that’s fine.
    origin: job.origin,
    source: job.source,
    publishedat: job.publishedat,
  };

  if (lite) {
    // keep it small for dropdowns
    return {
      id: base.id,
      title: base.title,
      company: base.company,
      worksite: base.worksite,
      location: base.location,
      type: base.type,
      compensation: base.compensation,
      description: base.description,
      status: base.status,
      isTemplate: base.isTemplate,
      templateName: base.templateName,
      createdAt: base.createdAt,
    };
  }

  return {
    ...base,
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

  // Impersonation-aware effective user + org key (NO FALLBACK)
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
      const kind = String(req.query?.kind || "jobs"); // "jobs" | "templates" | "all"
      const lite = String(req.query?.lite || "") === "1";

      const where = { accountKey: recruiterAccountKey };

      if (kind === "templates") {
        where.isTemplate = true;
      } else if (kind === "jobs") {
        where.isTemplate = false;
      } // "all" returns everything

      const jobs = await prisma.job.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      const rows = jobs.map((j) => shapeJob(j, { lite }));
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

        // template support
        isTemplate = false,
        templateName = null,

        // allow overwrite when saving template by same name
        overwrite = false,
      } = req.body || {};

      const templateFlag = Boolean(isTemplate);
      const templateNameClean = safeText(templateName, "").trim();
      const overwriteFlag =
        overwrite === true ||
        String(overwrite || "").toLowerCase() === "true" ||
        String(overwrite || "") === "1";

      if (!title || !company || !worksite || !location || !description) {
        return res.status(400).json({
          error:
            "Missing required fields (title, company, worksite, location, description).",
        });
      }

      if (templateFlag && !templateNameClean) {
        return res.status(400).json({
          error: "Template name is required when saving a template.",
        });
      }

      // if templateName already exists in this org, require overwrite=true
      if (templateFlag) {
        const existingTpl = await prisma.job.findFirst({
          where: {
            accountKey: recruiterAccountKey,
            isTemplate: true,
            templateName: templateNameClean,
          },
          select: { id: true },
        });

        if (existingTpl?.id) {
          if (!overwriteFlag) {
            return res.status(409).json({
              error:
                "A template with this name already exists. Confirm overwrite to replace it.",
              existingTemplateId: existingTpl.id,
            });
          }

          const updatedTpl = await prisma.job.update({
            where: { id: existingTpl.id },
            data: {
              title: safeText(title),
              company: safeText(company),
              worksite: safeText(worksite),
              location: safeText(location),
              type: safeText(type, ""),
              compensation: safeText(compensation, ""),
              description: safeText(description),

              // templates are always Draft for safety
              status: "Draft",
              urgent: false,

              isTemplate: true,
              templateName: templateNameClean,

              // keep org scope enforced
              accountKey: recruiterAccountKey,

              // treat saver as last editor
              userId: effectiveUserId,
            },
          });

          return res.status(200).json({ job: shapeJob(updatedTpl) });
        }
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

          // templates are always Draft for safety
          status: templateFlag ? "Draft" : status,
          urgent: templateFlag ? false : Boolean(urgent),

          // creator is the effective user (impersonated target if active)
          userId: effectiveUserId,

          // ALWAYS enforce org scope from DB user (ignore session/body)
          accountKey: recruiterAccountKey,

          // template columns
          isTemplate: templateFlag,
          templateName: templateFlag ? templateNameClean : null,
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

        // template support
        templateName,
      } = req.body || {};

      if (!id) {
        return res.status(400).json({ error: "Job id is required." });
      }

      // Ensure job is in THIS org (not just owned by user)
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

          status: existing.isTemplate ? "Draft" : nextStatus,
          urgent:
            existing.isTemplate
              ? false
              : typeof urgent === "boolean"
              ? urgent
              : existing.urgent,

          // allow renaming template (safe)
          templateName:
            templateName !== undefined
              ? safeText(templateName, "").trim() || null
              : existing.templateName,
        },
      });

      return res.status(200).json({ job: shapeJob(updated) });
    }

    // ✅ NEW: DELETE for templates (org-scoped; templates only)
    if (req.method === "DELETE") {
      const { id } = req.body || {};

      if (!id) {
        return res.status(400).json({ error: "Job id is required." });
      }

      const existing = await prisma.job.findFirst({
        where: { id: Number(id), accountKey: recruiterAccountKey },
        select: { id: true, isTemplate: true, templateName: true, title: true },
      });

      if (!existing) {
        return res.status(404).json({
          error: "Job not found or not in this recruiter account.",
        });
      }

      if (!existing.isTemplate) {
        return res.status(400).json({
          error: "Only templates can be deleted from this view.",
        });
      }

      await prisma.job.delete({
        where: { id: existing.id },
      });

      return res.status(200).json({
        ok: true,
        deletedId: existing.id,
      });
    }

    res.setHeader("Allow", "GET,POST,PATCH,DELETE");
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
