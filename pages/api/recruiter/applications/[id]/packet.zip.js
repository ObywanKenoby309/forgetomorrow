// pages/api/recruiter/applications/[id]/packet.zip.js
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

import React from "react";
import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import JSZip from "jszip";

import CoverLetterTemplatePDF from "@/components/cover-letter/CoverLetterTemplatePDF";
import HybridResumeTemplatePDF from "@/components/resume-form/templates/HybridResumeTemplate.pdf";
import ReverseResumeTemplatePDF from "@/components/resume-form/templates/ReverseResumeTemplate.pdf";

function toInt(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function safeString(val) {
  if (val === undefined || val === null) return "";
  return String(val);
}

function filenameSafe(s) {
  return safeString(s)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
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

function pickName(user) {
  if (!user) return "";
  return (
    safeString(user.name).trim() ||
    [safeString(user.firstName).trim(), safeString(user.lastName).trim()].filter(Boolean).join(" ") ||
    ""
  );
}

function normalizeQuestions(qs) {
  if (!qs) return [];
  if (Array.isArray(qs)) return qs;
  return [];
}

/**
 * Map application cover content to PDF template data.
 * Supports:
 * - JSON cover payloads (preferred)
 * - plain text cover letters (fallback)
 */
function buildCoverTemplateData({ app, candidateName }) {
  const jobCompany = safeString(app?.job?.company).trim() || "";
  const jobTitle = safeString(app?.job?.title).trim() || "";

  const coverRaw = app?.cover?.content;
  const parsed = tryParseJson(coverRaw);

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const fullName =
      safeString(parsed.fullName || parsed.name || candidateName).trim() ||
      candidateName ||
      "Candidate";

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

      opening: safeString(parsed.opening || "").trim(),
      body: safeString(parsed.body || parsed.content || "").trim(),
      closing: safeString(parsed.closing || "").trim(),

      signoff: safeString(parsed.signoff || "Sincerely,").trim(),
    };
  }

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

// ──────────────────────────────────────────────────────────────
// Additional Info PDF (server-side, recruiter-safe)
// Includes: Standard Questions (placeholder for now), Additional Questions,
// Consent, ForgeTomorrow Assessment. Self-ID excluded.
// ──────────────────────────────────────────────────────────────
const aiStyles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#111827", lineHeight: 1.4 },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 6 },
  subtitle: { fontSize: 10, color: "#6b7280", marginBottom: 16 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 14,
    marginBottom: 6,
    textTransform: "uppercase",
    color: "#111827",
  },
  row: { marginBottom: 8 },
  qLabel: { fontSize: 10, fontWeight: "bold", marginBottom: 2 },
  qValue: { fontSize: 10, color: "#111827" },
  muted: { color: "#6b7280" },
  pre: { fontSize: 9, color: "#111827" },
  divider: { marginTop: 10, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
});

function AdditionalInfoPDF({
  candidateName,
  candidateEmail,
  jobTitle,
  jobCompany,
  standardQuestions,
  additionalQuestions,
  consent,
  forgeAssessment,
}) {
  const std = Array.isArray(standardQuestions) ? standardQuestions : [];
  const addl = Array.isArray(additionalQuestions) ? additionalQuestions : [];

  return (
    <Document>
      <Page size="LETTER" style={aiStyles.page}>
        <Text style={aiStyles.title}>Candidate Additional Information</Text>
        <Text style={aiStyles.subtitle}>
          {candidateName || "Candidate"}
          {candidateEmail ? ` • ${candidateEmail}` : ""}
          {jobTitle || jobCompany ? ` • ${jobTitle || "Role"} at ${jobCompany || "Company"}` : ""}
        </Text>

        <View style={aiStyles.divider} />

        <Text style={aiStyles.sectionTitle}>Standard Questions</Text>
        {std.length ? (
          std.map((q, i) => (
            <View key={`std-${i}`} style={aiStyles.row}>
              <Text style={aiStyles.qLabel}>{safeString(q.label || q.key || "Question")}</Text>
              <Text style={aiStyles.qValue}>
                {safeString(q.value) ? safeString(q.value) : "Not provided"}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[aiStyles.qValue, aiStyles.muted]}>
            Not collected yet. This section will populate after we ship the standard questions page.
          </Text>
        )}

        <Text style={aiStyles.sectionTitle}>Additional Questions</Text>
        {addl.length ? (
          addl.map((a, i) => (
            <View key={`addl-${i}`} style={aiStyles.row}>
              <Text style={aiStyles.qLabel}>{safeString(a.label || a.questionKey || "Question")}</Text>
              <Text style={aiStyles.qValue}>
                {typeof a.value === "string" ? a.value : JSON.stringify(a.value)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[aiStyles.qValue, aiStyles.muted]}>No additional questions answered.</Text>
        )}

        <Text style={aiStyles.sectionTitle}>Consent and Acknowledgement</Text>
        {consent ? (
          <View>
            <View style={aiStyles.row}>
              <Text style={aiStyles.qLabel}>Terms accepted</Text>
              <Text style={aiStyles.qValue}>{consent.termsAccepted ? "Yes" : "No"}</Text>
            </View>
            <View style={aiStyles.row}>
              <Text style={aiStyles.qLabel}>Status updates</Text>
              <Text style={aiStyles.qValue}>{consent.emailUpdatesAccepted ? "Yes" : "No"}</Text>
            </View>
            <View style={aiStyles.row}>
              <Text style={aiStyles.qLabel}>Signature</Text>
              <Text style={aiStyles.qValue}>{consent.signatureName || "Not provided"}</Text>
            </View>
            <View style={aiStyles.row}>
              <Text style={aiStyles.qLabel}>Signed at</Text>
              <Text style={aiStyles.qValue}>{consent.signedAt ? String(consent.signedAt) : "Not provided"}</Text>
            </View>
            {consent.consentTextVersion ? (
              <View style={aiStyles.row}>
                <Text style={aiStyles.qLabel}>Consent text version</Text>
                <Text style={aiStyles.qValue}>{String(consent.consentTextVersion)}</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <Text style={[aiStyles.qValue, aiStyles.muted]}>No consent record found.</Text>
        )}

        <Text style={aiStyles.sectionTitle}>ForgeTomorrow Assessment</Text>
        {forgeAssessment ? (
          <View>
            <View style={aiStyles.row}>
              <Text style={aiStyles.qLabel}>Model</Text>
              <Text style={aiStyles.qValue}>
                {forgeAssessment.model || "Unknown"}
                {forgeAssessment.modelVersion ? ` (${forgeAssessment.modelVersion})` : ""}
              </Text>
            </View>
            <View style={aiStyles.row}>
              <Text style={aiStyles.qLabel}>Score</Text>
              <Text style={aiStyles.qValue}>
                {forgeAssessment.score === null || forgeAssessment.score === undefined
                  ? "Not provided"
                  : String(forgeAssessment.score)}
              </Text>
            </View>
            <View style={aiStyles.row}>
              <Text style={aiStyles.qLabel}>Generated at</Text>
              <Text style={aiStyles.qValue}>
                {forgeAssessment.generatedAt ? String(forgeAssessment.generatedAt) : "Not provided"}
              </Text>
            </View>

            <View style={aiStyles.row}>
              <Text style={aiStyles.qLabel}>Result</Text>
              <Text style={aiStyles.pre}>{JSON.stringify(forgeAssessment.result, null, 2)}</Text>
            </View>

            <View style={aiStyles.divider} />
            <Text style={[aiStyles.qValue, aiStyles.muted]}>
              Self-identification answers are not included in recruiter packets.
            </Text>
          </View>
        ) : (
          <Text style={[aiStyles.qValue, aiStyles.muted]}>Not generated yet.</Text>
        )}
      </Page>
    </Document>
  );
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
        // selfId intentionally excluded
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

    const candidateName = pickName(app.user) || "Candidate";
    const candidateEmail = safeString(app.user?.email).trim() || "";

    // Additional questions label map from job.additionalQuestions
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

    const consent = app.consent
      ? {
          termsAccepted: !!app.consent.termsAccepted,
          emailUpdatesAccepted: !!app.consent.emailUpdatesAccepted,
          signatureName: app.consent.signatureName || null,
          signedAt: app.consent.signedAt || null,
          consentTextVersion: app.consent.consentTextVersion || null,
        }
      : null;

    const forgeAssessment = app.assessment
      ? {
          score: app.assessment.score ?? null,
          model: app.assessment.model || null,
          modelVersion: app.assessment.modelVersion || null,
          generatedAt: app.assessment.generatedAt || null,
          result: app.assessment.result,
        }
      : null;

    // Resume data (JSON required for the PDF templates)
    if (!app.resume?.content) {
      return res.status(404).json({ error: "Resume not found" });
    }

    const resumeData = safeJsonParse(app.resume.content);
    if (!resumeData) {
      return res.status(400).json({ error: "Resume content is not valid JSON" });
    }

    // Build ZIP
    const zip = new JSZip();

    const safeCandidateLabel = filenameSafe(candidateName) || "Candidate";
    const safeJobLabel = filenameSafe(app.job?.title) || "Role";
    const base = `App${applicationId}_${safeCandidateLabel}_${safeJobLabel}`;

    // 1) Cover PDF (optional)
    if (app.cover?.content) {
      const coverTemplateData = buildCoverTemplateData({ app, candidateName });
      const coverDoc = <CoverLetterTemplatePDF data={coverTemplateData} />;
      const coverBuf = await pdf(coverDoc).toBuffer();
      zip.file(`01_CoverLetter_${base}.pdf`, coverBuf);
    }

    // 2) Hybrid resume
    {
      const hybridDoc = <HybridResumeTemplatePDF data={resumeData} />;
      const hybridBuf = await pdf(hybridDoc).toBuffer();
      zip.file(`02_Resume_Hybrid_${base}.pdf`, hybridBuf);
    }

    // 3) Reverse resume
    {
      const reverseDoc = <ReverseResumeTemplatePDF data={resumeData} />;
      const reverseBuf = await pdf(reverseDoc).toBuffer();
      zip.file(`03_Resume_Reverse_${base}.pdf`, reverseBuf);
    }

    // 4) Additional Info packet PDF
    {
      // Standard questions are not built yet -> placeholder section stays empty for now.
      const standardQuestions = []; // will populate after the new standard questions page ships

      const addInfoDoc = (
        <AdditionalInfoPDF
          candidateName={candidateName}
          candidateEmail={candidateEmail}
          jobTitle={safeString(app.job?.title).trim()}
          jobCompany={safeString(app.job?.company).trim()}
          standardQuestions={standardQuestions}
          additionalQuestions={additionalAnswers}
          consent={consent}
          forgeAssessment={forgeAssessment}
        />
      );

      const addInfoBuf = await pdf(addInfoDoc).toBuffer();
      zip.file(`04_Candidate_Additional_Info_${base}.pdf`, addInfoBuf);
    }

    // Finalize ZIP
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

    const zipName = `ApplicationPacket_${base}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).send(zipBuffer);
  } catch (e) {
    console.error("packet.zip api error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}
