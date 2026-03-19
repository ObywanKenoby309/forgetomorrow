// pages/api/recruiter/job-postings/[id]/applications/create.js
//
// POST /api/recruiter/job-postings/[id]/applications/create
//
// Allows a recruiter to manually add a candidate to a job posting's
// application pipeline. Three modes:
//
//   Mode A — Existing ForgeTomorrow user (userId provided)
//             Creates Application linked to their User record.
//
//   Mode B — Known ExternalCandidate (externalCandidateId provided)
//             Reuses an existing ExternalCandidate record already in
//             the org's candidate database.
//
//   Mode C — Brand new external candidate (name + optional email/phone)
//             Creates a new ExternalCandidate record for the org first,
//             then creates the Application linked to it.
//
// In all three modes:
//   - source is required (ApplicationSource enum)
//   - Modes B and C use externalCandidateId as the true identity anchor
//     keeping the recruiter's own application history clean.
//   - recruiterNotes carries an audit trail of who added the candidate
//     and how, without requiring a separate table.

import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

// ── Constants ─────────────────────────────────────────────────

const VALID_SOURCES = [
  "FORGETOMORROW",
  "EXTERNAL",
  "REFERRAL",
  "CAREERS",
  "OTHER",
];

const VALID_STATUSES = ["Applied", "Interviewing", "Offers", "ClosedOut"];

// ── Helpers ───────────────────────────────────────────────────

function toInt(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function safeStr(val) {
  if (val === undefined || val === null) return "";
  return String(val).trim();
}

function normalizeSource(s) {
  const v = safeStr(s).toUpperCase();
  return VALID_SOURCES.includes(v) ? v : null;
}

function normalizeStatus(s) {
  const v = safeStr(s);
  if (VALID_STATUSES.includes(v)) return v;
  if (v === "Closed Out") return "ClosedOut";
  return "Applied";
}

function getRecruiterName(user) {
  if (!user) return "Unknown";
  if (user.name) return user.name;
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.email ||
    "Unknown"
  );
}

// ── Handler ───────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ── Auth ───────────────────────────────────────────────────
    const session = await getServerSession(req, res, authOptions);
    const sessionUserId = session?.user?.id;
    if (!sessionUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // ── Load recruiter ─────────────────────────────────────────
    const recruiter = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: {
        id:        true,
        name:      true,
        firstName: true,
        lastName:  true,
        email:     true,
        role:      true,
        accountKey: true,
        employee:  true,
        organizationMemberships: {
          select: { accountKey: true },
        },
      },
    });

    if (!recruiter) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const recruiterRole = safeStr(recruiter.role).toUpperCase();
    const isRecruiter   = recruiterRole === "RECRUITER";
    const isStaff       = !!recruiter.employee;

    if (!isRecruiter && !isStaff) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // ── Validate job ID ────────────────────────────────────────
    const jobId = toInt(req.query?.id);
    if (!jobId) {
      return res.status(400).json({ error: "Invalid job ID" });
    }

    // ── Load and authorize job ─────────────────────────────────
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id:         true,
        title:      true,
        company:    true,
        accountKey: true,
        userId:     true,
      },
    });

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const allowedAccountKeys = new Set(
      [
        recruiter.accountKey,
        ...(recruiter.organizationMemberships || []).map((m) => m.accountKey),
      ].filter(Boolean)
    );

    const jobAccountKey   = job.accountKey || null;
    const ownsJob         = job.userId === recruiter.id;
    const sharesAccountKey = jobAccountKey && allowedAccountKeys.has(jobAccountKey);

    if (!ownsJob && !sharesAccountKey && !isStaff) {
      return res.status(403).json({
        error: "Forbidden — you do not have access to this job posting",
      });
    }

    // ── Parse body ─────────────────────────────────────────────
    const body = req.body || {};

    const source = normalizeSource(body.source);
    if (!source) {
      return res.status(400).json({
        error: `source is required. Must be one of: ${VALID_SOURCES.join(", ")}`,
      });
    }

    const status        = normalizeStatus(body.status);
    const recruiterNote = safeStr(body.notes) || null;

    const providedUserId              = safeStr(body.userId)              || null;
    const providedExternalCandidateId = safeStr(body.externalCandidateId) || null;
    const providedName                = safeStr(body.name)                || null;
    const providedEmail               = safeStr(body.email)               || null;
    const providedPhone               = safeStr(body.phone)               || null;
    const providedLinkedin            = safeStr(body.linkedinUrl)         || null;
    const providedHeadline            = safeStr(body.headline)            || null;
    const providedLocation            = safeStr(body.location)            || null;
    const providedCompany             = safeStr(body.company)             || null;

    // ══════════════════════════════════════════════════════════
    // MODE A — Existing ForgeTomorrow user
    // ══════════════════════════════════════════════════════════
    if (providedUserId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: providedUserId },
        select: {
          id:        true,
          name:      true,
          firstName: true,
          lastName:  true,
          email:     true,
        },
      });

      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Prevent duplicate — same user + same job
      const existing = await prisma.application.findUnique({
        where: { user_job_unique: { userId: providedUserId, jobId } },
        select: { id: true },
      });

      if (existing) {
        return res.status(409).json({
          error: "This candidate already has an application for this job",
          applicationId: existing.id,
        });
      }

      const application = await prisma.application.create({
        data: {
          userId:         providedUserId,
          jobId,
          accountKey:     jobAccountKey,
          source,
          status,
          recruiterNotes: buildAuditNote({
            note:    recruiterNote,
            addedBy: getRecruiterName(recruiter),
            mode:    "existing_user",
          }),
          submittedAt: new Date(),
        },
        select: selectWithUser(),
      });

      return res.status(201).json({
        success:     true,
        mode:        "existing_user",
        application: shapeWithUser(application),
      });
    }

    // ══════════════════════════════════════════════════════════
    // MODE B — Known ExternalCandidate (already in org database)
    // ══════════════════════════════════════════════════════════
    if (providedExternalCandidateId) {
      const orgKey = jobAccountKey || recruiter.accountKey;

      const externalCandidate = await prisma.externalCandidate.findFirst({
        where: {
          id:         providedExternalCandidateId,
          accountKey: orgKey || "",
        },
        select: {
          id:       true,
          name:     true,
          email:    true,
          phone:    true,
          headline: true,
          location: true,
        },
      });

      if (!externalCandidate) {
        return res.status(404).json({
          error: "External candidate not found or does not belong to your organization",
        });
      }

      // Prevent duplicate — same external candidate + same job
      const existing = await prisma.application.findFirst({
        where: { externalCandidateId: providedExternalCandidateId, jobId },
        select: { id: true },
      });

      if (existing) {
        return res.status(409).json({
          error: "This external candidate already has an application for this job",
          applicationId: existing.id,
        });
      }

      const application = await prisma.application.create({
        data: {
          // External candidates have no User account.
          // We use the recruiter's userId as the technical DB owner
          // but externalCandidateId is the true identity anchor —
          // the same pattern TalentPoolEntry already uses.
          userId:              recruiter.id,
          jobId,
          accountKey:          jobAccountKey,
          source,
          status,
          externalCandidateId: providedExternalCandidateId,
          recruiterNotes:      buildAuditNote({
            note:    recruiterNote,
            addedBy: getRecruiterName(recruiter),
            mode:    "external_known",
          }),
          submittedAt: new Date(),
        },
        select: selectWithExternal(),
      });

      return res.status(201).json({
        success:     true,
        mode:        "external_known",
        application: shapeWithExternal(application),
      });
    }

    // ══════════════════════════════════════════════════════════
    // MODE C — New external candidate (not yet in org database)
    // ══════════════════════════════════════════════════════════
    if (!providedName) {
      return res.status(400).json({
        error:
          "One of the following is required: " +
          "userId (existing ForgeTomorrow user), " +
          "externalCandidateId (known external candidate), " +
          "or name (new external candidate)",
      });
    }

    const orgAccountKey = jobAccountKey || recruiter.accountKey;
    if (!orgAccountKey) {
      return res.status(400).json({
        error:
          "Cannot create an external candidate — " +
          "no organization account key found for this job or recruiter",
      });
    }

    // Create the ExternalCandidate record for the org.
    // Mirrors exactly what entries.js does when adding to a talent pool.
    const newExternal = await prisma.externalCandidate.create({
      data: {
        accountKey:      orgAccountKey,
        createdByUserId: recruiter.id,
        name:            providedName,
        email:           providedEmail    || null,
        phone:           providedPhone    || null,
        linkedinUrl:     providedLinkedin || null,
        headline:        providedHeadline || null,
        location:        providedLocation || null,
        company:         providedCompany  || null,
        notes:           recruiterNote    || null,
      },
      select: {
        id:       true,
        name:     true,
        email:    true,
        phone:    true,
        headline: true,
        location: true,
        company:  true,
      },
    });

    const application = await prisma.application.create({
      data: {
        userId:              recruiter.id,
        jobId,
        accountKey:          jobAccountKey,
        source,
        status,
        externalCandidateId: newExternal.id,
        recruiterNotes:      buildAuditNote({
          note:    recruiterNote,
          addedBy: getRecruiterName(recruiter),
          mode:    "external_new",
        }),
        submittedAt: new Date(),
      },
      select: selectWithExternal(),
    });

    return res.status(201).json({
      success:           true,
      mode:              "external_new",
      externalCandidate: newExternal,
      application:       shapeWithExternal(application),
    });

  } catch (err) {
    console.error("[recruiter/job-postings/[id]/applications/create] error:", err);
    return res.status(500).json({
      error:  "Failed to add candidate to pipeline.",
      detail: err?.message || "Unknown error",
    });
  }
}

// ── Prisma selects ────────────────────────────────────────────

function selectWithUser() {
  return {
    id:             true,
    status:         true,
    source:         true,
    appliedAt:      true,
    submittedAt:    true,
    recruiterNotes: true,
    user: {
      select: {
        id:        true,
        name:      true,
        firstName: true,
        lastName:  true,
        email:     true,
      },
    },
  };
}

function selectWithExternal() {
  return {
    id:                  true,
    status:              true,
    source:              true,
    appliedAt:           true,
    submittedAt:         true,
    recruiterNotes:      true,
    externalCandidateId: true,
    externalCandidate: {
      select: {
        id:       true,
        name:     true,
        email:    true,
        phone:    true,
        headline: true,
        location: true,
      },
    },
  };
}

// ── Response shapers ──────────────────────────────────────────

function shapeWithUser(a) {
  const name =
    a.user?.name ||
    [a.user?.firstName, a.user?.lastName].filter(Boolean).join(" ").trim() ||
    "Candidate";

  return {
    id:             a.id,
    status:         a.status,
    source:         a.source,
    appliedAt:      a.appliedAt,
    submittedAt:    a.submittedAt,
    recruiterNotes: a.recruiterNotes,
    candidate: {
      id:    a.user?.id    || null,
      name,
      email: a.user?.email || null,
      type:  "user",
    },
  };
}

function shapeWithExternal(a) {
  return {
    id:             a.id,
    status:         a.status,
    source:         a.source,
    appliedAt:      a.appliedAt,
    submittedAt:    a.submittedAt,
    recruiterNotes: a.recruiterNotes,
    candidate: {
      id:       a.externalCandidate?.id       || null,
      name:     a.externalCandidate?.name     || "External Candidate",
      email:    a.externalCandidate?.email    || null,
      phone:    a.externalCandidate?.phone    || null,
      headline: a.externalCandidate?.headline || null,
      location: a.externalCandidate?.location || null,
      type:     "external",
    },
  };
}

// ── Audit note builder ────────────────────────────────────────
// Writes a human-readable trail into recruiterNotes so there is
// always a record of who added this candidate and how.
// No extra table required — clean and queryable if needed later.

function buildAuditNote({ note, addedBy, mode }) {
  const modeLabel = {
    existing_user:  "added from ForgeTomorrow user search",
    external_known: "added from existing external candidate record",
    external_new:   "added as a new external candidate",
  }[mode] || "manually added";

  const lines = [
    `Manually added to pipeline by ${addedBy} — ${modeLabel}.`,
  ];

  if (note) {
    lines.push(`Recruiter note: ${note}`);
  }

  return lines.join("\n");
}