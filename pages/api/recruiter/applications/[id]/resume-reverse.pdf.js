// pages/api/recruiter/applications/[id]/resume-reverse.pdf.js
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { pdf } from "@react-pdf/renderer";

import ReverseResumeTemplatePDF from "@/components/resume-form/templates/ReverseResumeTemplate.pdf";

function toInt(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function safeString(val) {
  if (val === undefined || val === null) return "";
  return String(val);
}

function safeJsonParse(maybeJson) {
  if (!maybeJson) return null;
  if (typeof maybeJson === "object") return maybeJson;

  const s = String(maybeJson).trim();
  if (!s) return null;

  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Server session only (NO localStorage / browser session)
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const applicationId = toInt(req.query.id);
    if (!applicationId) {
      return res.status(400).json({ error: "Invalid application id" });
    }

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
      select: {
        id: true,
        accountKey: true,
        job: { select: { id: true, title: true, company: true, accountKey: true } },
        user: { select: { id: true, name: true, firstName: true, lastName: true, email: true } },
        resume: { select: { id: true, name: true, content: true } },
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

    if (!app.resume?.content) {
      return res.status(404).json({ error: "Resume not found" });
    }

    const resumeData = safeJsonParse(app.resume.content);
    if (!resumeData) {
      return res.status(400).json({ error: "Resume content is not valid JSON" });
    }

    const candidateName =
      app.user?.name ||
      [app.user?.firstName, app.user?.lastName].filter(Boolean).join(" ") ||
      "Candidate";

    const fileName = `Resume-Reverse-${candidateName.replace(/[^a-z0-9]+/gi, "_")}.pdf`;

    const doc = <ReverseResumeTemplatePDF data={resumeData} />;
    const buffer = await pdf(doc).toBuffer();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).send(buffer);
  } catch (e) {
    console.error("resume-reverse pdf api error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}
