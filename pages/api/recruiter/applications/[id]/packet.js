// pages/api/recruiter/applications/[id]/packet.js
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

function toInt(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function safeString(val) {
  if (val === undefined || val === null) return "";
  return String(val);
}

function normalizeQuestions(qs) {
  if (!qs) return [];
  if (Array.isArray(qs)) return qs;
  return [];
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!prisma) {
      return res.status(500).json({ error: "Prisma client not initialized" });
    }

    // ✅ SERVER SESSION ONLY (NO localStorage / client session)
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const applicationId = toInt(req.query.id);
    if (!applicationId) return res.status(400).json({ error: "Invalid application id" });

    // Pull the caller's org access (accountKey + memberships)
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

    // Recruiter or internal staff only
    const viewerRole = safeString(viewer.role).toUpperCase();
    const isRecruiter = viewerRole === "RECRUITER";
    const isStaff = !!viewer.employee;

    if (!isRecruiter && !isStaff) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const allowedAccountKeys = new Set(
      [viewer.accountKey, ...(viewer.organizationMemberships || []).map((m) => m.accountKey)].filter(Boolean)
    );

    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            accountKey: true,
            additionalQuestions: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        resume: { select: { id: true, name: true, content: true } },
        cover: { select: { id: true, name: true, content: true } },
        consent: {
          select: {
            termsAccepted: true,
            emailUpdatesAccepted: true,
            signatureName: true,
            signedAt: true,
            consentTextVersion: true,
          },
        },
        answers: {
          select: {
            questionKey: true,
            value: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: "asc" },
        },
        assessment: {
          select: {
            result: true,
            score: true,
            model: true,
            modelVersion: true,
            generatedAt: true,
            updatedAt: true,
          },
        },

        // IMPORTANT: intentionally NOT including selfId here.
      },
    });

    if (!app) return res.status(404).json({ error: "Not found" });

    const appAccountKey = app.accountKey || app.job?.accountKey || null;

    // Recruiters must be org-scoped (staff can bypass for support)
    if (!appAccountKey && !isStaff) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // If the application is org-scoped, enforce org access
    if (appAccountKey && !allowedAccountKeys.has(appAccountKey)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Build "Additional Questions" labels from Job.additionalQuestions (if present)
    const jobQs = normalizeQuestions(app.job?.additionalQuestions);
    const labelByKey = new Map();
    for (const q of jobQs) {
      const key = safeString(q?.key).trim();
      const label = safeString(q?.label).trim();
      if (key && label && !labelByKey.has(key)) labelByKey.set(key, label);
    }

    const additionalAnswers = (app.answers || [])
      .filter((a) => labelByKey.has(safeString(a.questionKey)))
      .map((a) => {
        const key = safeString(a.questionKey);
        return {
          questionKey: key,
          label: labelByKey.get(key) || null,
          value: a.value,
        };
      });

    // Packet order per your rule:
    // Cover -> Resume -> Additional Questions -> Consent -> FT Assessment
    return res.status(200).json({
      application: {
        id: app.id,
        status: app.status,
        submittedAt: app.submittedAt,
        appliedAt: app.appliedAt,
        updatedAt: app.updatedAt,
        accountKey: appAccountKey,
      },
      job: app.job
        ? {
            id: app.job.id,
            title: app.job.title,
            company: app.job.company,
          }
        : null,
      candidate: {
        id: app.user?.id || null,
        name:
          app.user?.name || [app.user?.firstName, app.user?.lastName].filter(Boolean).join(" ") || null,
        email: app.user?.email || null,
      },

      // Packet sections
      cover: app.cover ? { id: app.cover.id, name: app.cover.name, content: app.cover.content } : null,
      resume: app.resume ? { id: app.resume.id, name: app.resume.name, content: app.resume.content } : null,

      additionalQuestions: additionalAnswers, // [] if none
      consent: app.consent
        ? {
            termsAccepted: !!app.consent.termsAccepted,
            emailUpdatesAccepted: !!app.consent.emailUpdatesAccepted,
            signatureName: app.consent.signatureName || null,
            signedAt: app.consent.signedAt || null,
            consentTextVersion: app.consent.consentTextVersion || null,
          }
        : null,

      forgeAssessment: app.assessment
        ? {
            score: app.assessment.score ?? null,
            model: app.assessment.model || null,
            modelVersion: app.assessment.modelVersion || null,
            generatedAt: app.assessment.generatedAt || null,
            result: app.assessment.result,
          }
        : null,

      // Explicitly confirm self-id is not in recruiter packet payload
      selfIdentification: null,
    });
  } catch (e) {
    console.error("packet api error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}
