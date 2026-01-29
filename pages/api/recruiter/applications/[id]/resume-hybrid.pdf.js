// pages/api/recruiter/applications/[id]/resume-hybrid.pdf.js
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import React from "react";
import { pdf } from "@react-pdf/renderer";

import HybridResumeTemplatePDF from "@/components/resume-form/templates/HybridResumeTemplate.pdf";

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

// ✅ Normalize resume content into the shape the PDF expects
function normalizeResumeData(raw) {
  const data = raw && typeof raw === "object" ? raw : null;
  if (!data) return null;

  const inner =
    (data.data && typeof data.data === "object" && data.data) ||
    (data.resume && typeof data.resume === "object" && data.resume) ||
    data;

  const personalInfo =
    inner.personalInfo && typeof inner.personalInfo === "object" ? inner.personalInfo : {};

  return {
    personalInfo,
    summary: safeString(inner.summary || ""),
    workExperiences: Array.isArray(inner.workExperiences) ? inner.workExperiences : [],
    projects: Array.isArray(inner.projects) ? inner.projects : [],
    educationList: Array.isArray(inner.educationList) ? inner.educationList : [],
    skills: Array.isArray(inner.skills) ? inner.skills : [],
    languages: Array.isArray(inner.languages) ? inner.languages : [],
    certifications: Array.isArray(inner.certifications) ? inner.certifications : [],
    customSections: Array.isArray(inner.customSections) ? inner.customSections : [],
  };
}

function filenameSafe(s) {
  return safeString(s)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
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

    const raw = safeJsonParse(app.resume.content);
    if (!raw) {
      return res.status(400).json({ error: "Resume content is not valid JSON" });
    }

    const resumeData = normalizeResumeData(raw);
    if (!resumeData) {
      return res.status(400).json({ error: "Resume content could not be normalized" });
    }

    const candidateName =
      safeString(app.user?.name).trim() ||
      [safeString(app.user?.firstName).trim(), safeString(app.user?.lastName).trim()].filter(Boolean).join(" ") ||
      "Candidate";

    const fileName = `Resume-Hybrid-${filenameSafe(candidateName).replace(/[^a-z0-9]+/gi, "_")}.pdf`;

    const doc = <HybridResumeTemplatePDF data={resumeData} />;
    const buffer = await pdf(doc).toBuffer();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).send(buffer);
  } catch (e) {
    console.error("resume-hybrid pdf api error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}
