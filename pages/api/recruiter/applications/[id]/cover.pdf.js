// pages/api/recruiter/applications/[id]/cover.pdf.js
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

// react-pdf server renderer
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";

// Your PDF template component
import CoverLetterTemplatePDF from "@/components/cover-letter/CoverLetterTemplatePDF";

function toInt(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function safeString(val) {
  if (val === undefined || val === null) return "";
  return String(val);
}

function tryParseJson(input) {
  if (!input) return null;
  if (typeof input === "object") return input;
  if (typeof input !== "string") return null;

  const s = input.trim();
  if (!s) return null;

  const looksJson =
    (s.startsWith("{") && s.endsWith("}")) || (s.startsWith("[") && s.endsWith("]"));
  if (!looksJson) return null;

  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function pickName(user) {
  if (!user) return "";
  return (
    safeString(user.name).trim() ||
    [safeString(user.firstName).trim(), safeString(user.lastName).trim()].filter(Boolean).join(" ") ||
    ""
  );
}

function filenameSafe(s) {
  return safeString(s)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/**
 * Map application cover content to PDF template data.
 * We support both:
 * - JSON cover payloads (preferred)
 * - plain text cover letters (fallback)
 */
function buildCoverTemplateData({ app, candidateName }) {
  const jobCompany = safeString(app?.job?.company).trim() || "";
  const jobTitle = safeString(app?.job?.title).trim() || "";

  const coverRaw = app?.cover?.content;

  // If cover content is JSON, honor it.
  const parsed = tryParseJson(coverRaw);

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const fullName = safeString(parsed.fullName || parsed.name || candidateName).trim() || candidateName || "Candidate";
    return {
      fullName,
      email: safeString(parsed.email || app?.user?.email || "").trim(),
      phone: safeString(parsed.phone || "").trim(),
      location: safeString(parsed.location || "").trim(),
      portfolio: safeString(parsed.portfolio || parsed.website || "").trim(),

      recipient: safeString(parsed.recipient || "Hiring Manager").trim(),
      company: safeString(parsed.company || jobCompany || "the company").trim(),
      role: safeString(parsed.role || jobTitle || "").trim(),

      greeting: safeString(parsed.greeting || "Dear Hiring Manager,").trim(),

      // If they used opening/body/closing fields
      opening: safeString(parsed.opening || "").trim(),
      body: safeString(parsed.body || parsed.content || "").trim(),
      closing: safeString(parsed.closing || "").trim(),

      signoff: safeString(parsed.signoff || "Sincerely,").trim(),
    };
  }

  // Plain text fallback: treat as body (keep line breaks)
  const plain = safeString(coverRaw).trim();

  return {
    fullName: candidateName || "Candidate",
    email: safeString(app?.user?.email || "").trim(),
    phone: "",
    location: "",
    portfolio: "",

    recipient: "Hiring Manager",
    company: jobCompany || "the company",
    role: jobTitle || "",

    greeting: "Dear Hiring Manager,",
    opening: "",
    body: plain || "",
    closing: "",
    signoff: "Sincerely,",
  };
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
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            accountKey: true,
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
        cover: { select: { id: true, name: true, content: true } },
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

    // Must have cover to generate PDF
    if (!app.cover?.content) {
      return res.status(404).json({ error: "No cover letter found for this application" });
    }

    const candidateName = pickName(app.user) || "Candidate";
    const templateData = buildCoverTemplateData({ app, candidateName });

    const pdfBuffer = await renderToBuffer(
      <CoverLetterTemplatePDF data={templateData} />
    );

    const fileLabel = filenameSafe(candidateName) || "Candidate";
    const fileName = `CoverLetter_${fileLabel}_App${applicationId}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Content-Length", String(pdfBuffer.length));

    return res.status(200).send(pdfBuffer);
  } catch (e) {
    console.error("cover pdf api error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}
