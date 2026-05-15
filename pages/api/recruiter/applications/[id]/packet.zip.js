// pages/api/recruiter/applications/[id]/packet.zip.js
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

import React from "react";
import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import JSZip from "jszip";

import CoverLetterTemplatePDF from "@/components/cover-letter/CoverLetterTemplatePDF";
import HybridResumeTemplatePDF from "@/components/resume-form/templates/HybridResumeTemplate.pdf.js";
import ReverseResumeTemplatePDF from "@/components/resume-form/templates/ReverseResumeTemplate.pdf.js";

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

function normalizeResumeTemplateData(raw) {
  const parsed = safeJsonParse(raw);
  if (!parsed || typeof parsed !== "object") return null;

  if (parsed.data && typeof parsed.data === "object") return parsed.data;
  if (parsed.resume && typeof parsed.resume === "object") return parsed.resume;

  return parsed;
}

function asArray(v) {
  if (Array.isArray(v)) return v.filter(Boolean);
  const parsed = safeJsonParse(v);
  return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
}

function calculateProfileSignalScore({ profile, additionalQuestions = [] }) {
  let score = 0;

  if (safeString(profile?.headline).trim()) score += 10;
  if (safeString(profile?.aboutMe).trim().length >= 120) score += 15;
  if (asArray(profile?.skills).length >= 5) score += 15;
  if (asArray(profile?.projects).length >= 1) score += 15;
  if (asArray(profile?.certifications).length >= 1) score += 8;
  if (asArray(profile?.education).length >= 1) score += 7;
  if (asArray(profile?.languages).length >= 1) score += 5;

  const prefs = profile?.workPreferences || {};
  const prefCount = [
    prefs.workStatus,
    prefs.workType || prefs.preferredWorkType,
    prefs.schedule,
    prefs.willingToRelocate,
    prefs.startDate || prefs.earliestStartDate,
    ...(Array.isArray(prefs.locations) ? prefs.locations : []),
  ].filter(Boolean).length;

  if (prefCount >= 3) score += 10;
  else if (prefCount >= 1) score += 5;

  if (additionalQuestions.length >= 1) score += 10;
  if (additionalQuestions.length >= 2) score += 5;

  return Math.min(100, Math.max(0, score));
}

function calculateOverallForgeScore({ resumeScore, profileSignalScore }) {
  const hasResume = typeof resumeScore === "number" && Number.isFinite(resumeScore);
  const hasProfile = typeof profileSignalScore === "number" && Number.isFinite(profileSignalScore);

  if (hasResume && hasProfile) {
    return Math.round((resumeScore * 0.55) + (profileSignalScore * 0.45));
  }

  if (hasResume) return Math.round(resumeScore);
  if (hasProfile) return Math.round(profileSignalScore);
  return null;
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
scoreColor: { color: "#16A34A" },
  projectCard: { backgroundColor: "#F9FAFB", borderRadius: 4, padding: "10 12", marginBottom: 6, borderLeftWidth: 3, borderLeftColor: "#FF7043" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
  chip: { backgroundColor: "#F3F4F6", borderRadius: 3, padding: "3 8" },
  twoCol: { flexDirection: "row", gap: 20, marginBottom: 20 },
  prefBox: { backgroundColor: "#F9FAFB", borderRadius: 6, padding: "12 14" },
  prefLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  pageHdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: "#FF7043" },
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
  workPreferences,
}) {

  const std = Array.isArray(standardQuestions) ? standardQuestions : [];
  const addl = Array.isArray(additionalQuestions) ? additionalQuestions : [];
  const prefs = workPreferences && typeof workPreferences === "object" ? workPreferences : {};
  const preferenceRows = [
  ["Status", prefs.workStatus],
  ["Work type", prefs.workType || prefs.preferredWorkType],
  ["Schedule", prefs.schedule],
  ["Willing to relocate", prefs.willingToRelocate],
  ["Preferred locations", Array.isArray(prefs.locations) ? prefs.locations.join(", ") : prefs.locations],
  ["Earliest start", prefs.startDate || prefs.earliestStartDate],
].filter(([, value]) => value !== undefined && value !== null && String(value).trim());


  return (
    <Document>
      <Page size="LETTER" style={aiStyles.page}>
        <Text style={aiStyles.title}>Candidate Interview Intake</Text>
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

<Text style={aiStyles.sectionTitle}>Work Preferences and Availability</Text>
{preferenceRows.length ? (
  preferenceRows.map(([label, value], i) => (
    <View key={`pref-${i}`} style={aiStyles.row}>
      <Text style={aiStyles.qLabel}>{label}</Text>
      <Text style={aiStyles.qValue}>{String(value)}</Text>
    </View>
  ))
) : (
  <Text style={[aiStyles.qValue, aiStyles.muted]}>
    No work preferences or availability details provided.
  </Text>
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

function FullCandidateIntelligencePDF({
  candidateName,
  candidateEmail,
  profile,
  job,
  forgeAssessment,
  whyResult,
}) {
  const skills = Array.isArray(profile?.skills) ? profile.skills : safeJsonParse(profile?.skills) || [];
  const projects = Array.isArray(profile?.projects) ? profile.projects : safeJsonParse(profile?.projects) || [];
  const education = Array.isArray(profile?.education) ? profile.education : safeJsonParse(profile?.education) || [];
  const certifications = Array.isArray(profile?.certifications) ? profile.certifications : safeJsonParse(profile?.certifications) || [];
  const languages = Array.isArray(profile?.languages) ? profile.languages : safeJsonParse(profile?.languages) || [];
  const additionalQuestions = Array.isArray(profile?.additionalQuestions) ? profile.additionalQuestions : [];

  const why = whyResult || forgeAssessment?.result || null;
  const resumeIntelligenceScore =
  whyResult?.resumeScore ??
  whyResult?.score ??
  forgeAssessment?.resumeScore ??
  forgeAssessment?.score ??
  null;

const profileSignalScore =
  whyResult?.profileScore ??
  forgeAssessment?.profileScore ??
  calculateProfileSignalScore({
    profile,
    additionalQuestions: profile?.additionalQuestions || [],
  });

const overallSignalScore =
  whyResult?.overallScore ??
  forgeAssessment?.overallScore ??
  calculateOverallForgeScore({
    resumeScore: resumeIntelligenceScore,
    profileSignalScore,
  });
  const whySummary = whyResult?.summary || why?.summary || null;
  const whyStrengths = Array.isArray(why?.strengths) ? why.strengths : [];
  const whyGaps = Array.isArray(why?.gaps) ? why.gaps : [];
  const whyTransferable = Array.isArray(why?.skills?.transferable) ? why.skills.transferable : [];
  const whyReasons = Array.isArray(why?.reasons) ? why.reasons : [];
  const whyInterview = why?.interviewQuestions || null;
  const workPrefs = profile?.workPreferences || {};

  const scoreColor =
  overallSignalScore === null
    ? "#6B7280"
    : overallSignalScore >= 75
    ? "#16A34A"
    : overallSignalScore >= 50
    ? "#D97706"
    : "#DC2626";

  return (
    <Document>
      {/* COVER PAGE */}
      <Page size="LETTER" style={{ padding: 0, fontFamily: "Helvetica", backgroundColor: "#0D1B2A" }}>
        <View style={{ height: 8, backgroundColor: "#FF7043" }} />
        <View style={{ padding: 48 }}>
          <Text style={{ fontSize: 10, color: "#FF7043", fontWeight: "bold", letterSpacing: 1, marginBottom: 48 }}>FORGETOMORROW</Text>
          <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.50)", letterSpacing: 2, marginBottom: 16 }}>CANDIDATE ALIGNMENT REVIEW</Text>
          <Text style={{ fontSize: 32, fontWeight: "bold", color: "#FFFFFF", marginBottom: 8 }}>{candidateName}</Text>
          {profile?.headline ? <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginBottom: 4 }}>{profile.headline}</Text> : null}
          {candidateEmail ? <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.40)", marginBottom: 32 }}>{candidateEmail}</Text> : null}
          <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.12)", marginBottom: 32 }} />
          <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.40)", marginBottom: 6, letterSpacing: 0.5 }}>ROLE APPLIED FOR</Text>
          <Text style={{ fontSize: 16, color: "#FF7043", fontWeight: "bold", marginBottom: 4 }}>{job?.title || "Position"}</Text>
          {job?.company ? <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.50)", marginBottom: 32 }}>{job.company}</Text> : null}
          {overallSignalScore !== null ? (
            <View style={{ marginTop: 48 }}>
              <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.40)", marginBottom: 8, letterSpacing: 0.5 }}>FORGETOMORROW OVERALL SIGNAL SCORE</Text>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
  <Text style={{ fontSize: 52, fontWeight: "bold", color: scoreColor, lineHeight: 1 }}>
    {overallSignalScore}
  </Text>
  <Text style={{ fontSize: 18, fontWeight: "bold", color: scoreColor, marginBottom: 6 }}>
    %
  </Text>
</View>
                <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.50)" }}>
                  {overallSignalScore >= 75 ? "Strong Match" : overallSignalScore >= 50 ? "Moderate Match" : "Emerging Match"}
                </Text>
              </View>
            </View>
          ) : null}
          <View style={{ position: "absolute", bottom: 24, left: 48, right: 48 }}>
            <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginBottom: 12 }} />
            <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", lineHeight: 1.6 }}>
              Confidential. For authorized recruiter use only. ForgeTomorrow signal analysis is AI-assisted and not a hiring decision. Self-identification excluded.
            </Text>
          </View>
        </View>
      </Page>

      {/* PAGE 2: Forge Intelligence Review */}
      <Page size="LETTER" style={aiStyles.page}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: "#FF7043" }}>
          <Text style={{ fontSize: 14, fontWeight: "bold", color: "#0D1B2A" }}>Forge Intelligence Review</Text>
          <Text style={{ fontSize: 9, color: "#9CA3AF" }}>{candidateName} • ForgeTomorrow</Text>
        </View>

        {overallSignalScore !== null ? (
          <View style={{ backgroundColor: "#F9FAFB", borderRadius: 6, padding: "16 20", marginBottom: 20, borderLeftWidth: 4, borderLeftColor: scoreColor }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 8 }}>
              <Text style={{ fontSize: 40, fontWeight: "bold", color: scoreColor, lineHeight: 1 }}>{overallSignalScore}%</Text>
              <View>
                <Text style={{ fontSize: 13, fontWeight: "bold", color: "#0D1B2A" }}>
                  {overallSignalScore >= 75 ? "Strong Match" : overallSignalScore >= 50 ? "Moderate Match" : "Emerging Match"}
                </Text>
                <Text style={{ fontSize: 9, color: "#6B7280" }}>ForgeTomorrow Alignment Score</Text>
              </View>
            </View>
            {whySummary ? <Text style={{ fontSize: 10, color: "#374151", lineHeight: 1.6 }}>{whySummary}</Text> : null}
          </View>
        ) : (
          <View style={{ backgroundColor: "#F9FAFB", borderRadius: 6, padding: "12 16", marginBottom: 20 }}>
            <Text style={{ fontSize: 10, color: "#6B7280" }}>Run the alignment score from the applicant pipeline to populate this section.</Text>
          </View>
        )}

<View style={{ flexDirection: "row", gap: 16, marginBottom: 20 }}>
  <View style={{ flex: 1, backgroundColor: "#F9FAFB", borderRadius: 6, padding: "14 16", borderLeftWidth: 4, borderLeftColor: "#FF7043" }}>
    <Text style={{ fontSize: 8, color: "#6B7280", marginBottom: 4 }}>RESUME INTELLIGENCE SCORE</Text>
	<Text style={{ fontSize: 34, fontWeight: "bold", color: "#0D1B2A", marginBottom: 18, }}>
      {resumeIntelligenceScore ?? "--"}
    </Text>

    <Text style={{ fontSize: 9, color: "#6B7280", lineHeight: 1.6 }}>
      Resume evidence, alignment, gaps, and transferable skill signal.
    </Text>
  </View>

  <View style={{ flex: 1, backgroundColor: "#F9FAFB", borderRadius: 6, padding: "14 16", borderLeftWidth: 4, borderLeftColor: "#16A34A" }}>
    <Text style={{ fontSize: 8, color: "#6B7280", marginBottom: 4 }}>PROFILE & PORTFOLIO SIGNAL</Text>
	<View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 18 }}>
  <Text style={{ fontSize: 34, fontWeight: "bold", color: "#0D1B2A" }}>
    {profileSignalScore ?? "--"}
  </Text>

  <Text style={{ fontSize: 14, fontWeight: "bold", color: "#0D1B2A", marginLeft: 2, marginBottom: 3 }}>
    %
  </Text>
</View>
    <Text style={{ fontSize: 9, color: "#6B7280", lineHeight: 1.6 }}>
      Profile depth, projects, preferences, credentials, and recruiter response signal.
    </Text>
  </View>
</View>

        {(whyStrengths.length > 0 || whyGaps.length > 0) ? (
          <View style={{ flexDirection: "row", gap: 16, marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, fontWeight: "bold", color: "#16A34A", marginBottom: 8, letterSpacing: 0.5 }}>STRENGTHS</Text>
              {whyStrengths.map((s, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#16A34A", marginTop: 3, marginRight: 8, flexShrink: 0 }} />
                  <Text style={{ fontSize: 9, color: "#374151", flex: 1, lineHeight: 1.5 }}>{s}</Text>
                </View>
              ))}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, fontWeight: "bold", color: "#DC2626", marginBottom: 8, letterSpacing: 0.5 }}>GAPS</Text>
              {whyGaps.map((g, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 6 }}>
                  <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#DC2626", marginTop: 3, marginRight: 8, flexShrink: 0 }} />
                  <Text style={{ fontSize: 9, color: "#374151", flex: 1, lineHeight: 1.5 }}>{g}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {whyTransferable.length > 0 ? (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#D97706", marginBottom: 8, letterSpacing: 0.5 }}>TRANSFERABLE SIGNALS</Text>
            {whyTransferable.map((t, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 6 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#D97706", marginTop: 3, marginRight: 8, flexShrink: 0 }} />
                <Text style={{ fontSize: 9, color: "#374151", flex: 1, lineHeight: 1.5 }}>{t}</Text>
              </View>
            ))}
          </View>
        ) : null}

<View style={{ marginBottom: 20 }}>
  <Text
    style={{
      fontSize: 10,
      fontWeight: "bold",
      color: "#0D1B2A",
      marginBottom: 8,
      letterSpacing: 0.5,
    }}
  >
    PROFILE & PORTFOLIO SIGNALS
  </Text>

  {[
    {
      label: "Professional Identity",
      status:
        profile?.headline && profile?.headline.length > 30
          ? "Strong"
          : "Needs Improvement",
      explanation:
        profile?.headline && profile?.headline.length > 30
          ? "Candidate positioning and professional identity are clearly communicated."
          : "Profile headline lacks enough positioning clarity for recruiters.",
    },

    {
      label: "Professional Narrative",
      status:
        profile?.aboutMe && profile?.aboutMe.length > 250
          ? "Strong"
          : "Partial",
      explanation:
        profile?.aboutMe && profile?.aboutMe.length > 250
          ? "Candidate summary provides meaningful context, direction, and value signal."
          : "Professional summary exists but could better explain measurable value and positioning.",
    },

    {
      label: "Project & Portfolio Credibility",
      status:
        projects.length >= 2
          ? "Strong"
          : projects.length >= 1
          ? "Moderate"
          : "Limited",
      explanation:
        projects.length >= 2
          ? "Projects provide visible proof of execution and applied experience."
          : projects.length >= 1
          ? "Some portfolio signal exists, but depth is limited."
          : "No visible project or portfolio proof detected.",
    },

    {
      label: "Recruiter Readiness",
      status:
        additionalQuestions.length > 0
          ? "Strong"
          : "Moderate",
      explanation:
        additionalQuestions.length > 0
          ? "Candidate provided additional employer-specific context and intent."
          : "Limited employer-specific context available.",
    },
  ].map((signal, i) => {
    const color =
      signal.status === "Strong"
        ? "#16A34A"
        : signal.status === "Moderate" || signal.status === "Partial"
        ? "#D97706"
        : "#DC2626";

    return (
      <View
        key={i}
        style={{
          backgroundColor: "#F9FAFB",
          borderRadius: 4,
          padding: "8 12",
          marginBottom: 6,
          borderLeftWidth: 3,
          borderLeftColor: color,
        }}
      >
        <Text
          style={{
            fontSize: 9,
            fontWeight: "bold",
            color: "#0D1B2A",
            marginBottom: 3,
          }}
        >
          {signal.label} · {signal.status}
        </Text>

        <Text
          style={{
            fontSize: 8,
            color: "#6B7280",
            lineHeight: 1.45,
          }}
        >
          {signal.explanation}
        </Text>
      </View>
    );
  })}
</View>

<View
  style={{
    backgroundColor: "#F9FAFB",
    borderRadius: 6,
    padding: "16 20",
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#2563EB",
  }}
>
  <Text
  style={{
    fontSize: 10,
    fontWeight: "bold",
    color: "#0D1B2A",
    marginBottom: 10,
    letterSpacing: 0.5,
  }}
>
  EXECUTIVE SIGNAL INTERPRETATION
</Text>

<View
  style={{
    backgroundColor: "#FFF7ED",
    borderRadius: 6,
    padding: "14 16",
    borderLeftWidth: 4,
    borderLeftColor: "#FF7043",
    marginBottom: 14,
  }}
>
  <Text
    style={{
      fontSize: 10,
      color: "#7C2D12",
      lineHeight: 1.8,
      fontWeight: "bold",
      marginBottom: 8,
    }}
  >
    Resume alignment alone may undersell this candidate’s broader operational capability.
  </Text>

  <Text
    style={{
      fontSize: 9,
      color: "#374151",
      lineHeight: 1.7,
    }}
  >
    ForgeTomorrow evaluates candidate viability using both direct alignment evidence and adjacent execution signal.
    This review incorporates transferable leadership capability, demonstrated operational ownership, communication
    strength, recruiter-readiness, portfolio credibility, and role-adjacent experience that traditional ATS systems
    often fail to interpret accurately.
  </Text>
</View>

<View style={{ marginBottom: 8 }}>
  <Text style={{ fontSize: 9, color: "#374151", lineHeight: 1.7 }}>
    • Resume intelligence reflects direct role-alignment evidence and transferable execution signal.
  </Text>

  <Text style={{ fontSize: 9, color: "#374151", lineHeight: 1.7 }}>
    • Profile & portfolio signal reflects project credibility, positioning strength, recruiter confidence, and overall professional depth.
  </Text>

  <Text style={{ fontSize: 9, color: "#374151", lineHeight: 1.7 }}>
    • Overall candidate signal represents the combined likelihood that the candidate can perform successfully within the target role environment.
  </Text>
</View>

  <Text
    style={{
      fontSize: 10,
      color: "#374151",
      lineHeight: 1.7,
    }}
  >
    ForgeTomorrow evaluates more than keyword overlap. This review
    considers whether the candidate demonstrates evidence of likely
    success through adjacent experience, leadership signal,
    demonstrated execution, project credibility, communication strength,
    and role-aligned professional positioning.
  </Text>
</View>

<View style={{ marginTop: 14 }}>
  {[
    resumeIntelligenceScore >= 70
      ? "Strong resume evidence supporting role alignment."
      : resumeIntelligenceScore >= 50
      ? "Resume shows partial alignment with opportunities for stronger positioning."
      : "Resume alignment alone may undersell the candidate’s broader capabilities.",

    profileSignalScore >= 70
      ? "Profile and portfolio depth strengthen recruiter confidence."
      : profileSignalScore >= 50
      ? "Profile contains supporting signals that improve overall evaluation."
      : "Limited portfolio or profile depth reduces visible recruiter signal.",

    whyTransferable.length > 0
      ? "Transferable skills and adjacent experience expand role-fit potential."
      : "Direct transferable signal evidence was limited in this review.",

    additionalQuestions?.length > 0
      ? "Candidate responses to employer questions contributed additional context."
      : "No additional employer-response context was available for scoring.",
  ].map((line, i) => (
    <View
      key={i}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 6,
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: "#2563EB",
          marginTop: 4,
          marginRight: 8,
          flexShrink: 0,
        }}
      />

      <Text
        style={{
          fontSize: 9,
          color: "#374151",
          flex: 1,
          lineHeight: 1.6,
        }}
      >
        {line}
      </Text>
    </View>
  ))}
</View>

        {whyReasons.length > 0 ? (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0D1B2A", marginBottom: 8, letterSpacing: 0.5 }}>SIGNAL BREAKDOWN</Text>
            {whyReasons.slice(0, 6).map((r, i) => (
              <View key={i} style={{ backgroundColor: "#F9FAFB", borderRadius: 4, padding: "8 12", marginBottom: 6 }}>
                <Text style={{ fontSize: 9, fontWeight: "bold", color: "#0D1B2A", marginBottom: 4 }}>{r.requirement}</Text>
                {Array.isArray(r.evidence) && r.evidence.slice(0, 2).map((ev, j) => (
                  <Text key={j} style={{ fontSize: 8, color: "#6B7280", lineHeight: 1.4 }}>
                    {ev.text}{ev.source ? ` · ${ev.source}` : ""}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {whyInterview ? (
          <View>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0D1B2A", marginBottom: 8, letterSpacing: 0.5 }}>SUGGESTED INTERVIEW QUESTIONS</Text>
            {Array.isArray(whyInterview.behavioral) && whyInterview.behavioral.slice(0, 2).map((q, i) => (
              <View key={`b${i}`} style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 8, color: "#9CA3AF", marginBottom: 2 }}>BEHAVIORAL</Text>
                <Text style={{ fontSize: 9, color: "#374151", lineHeight: 1.5 }}>{q}</Text>
              </View>
            ))}
            {Array.isArray(whyInterview.occupational) && whyInterview.occupational.slice(0, 2).map((q, i) => (
              <View key={`o${i}`} style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 8, color: "#9CA3AF", marginBottom: 2 }}>ROLE-SPECIFIC</Text>
                <Text style={{ fontSize: 9, color: "#374151", lineHeight: 1.5 }}>{q}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Page>

      {/* PAGE 3: CANDIDATE PROFILE */}
      <Page size="LETTER" style={aiStyles.page}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: "#FF7043" }}>
          <Text style={{ fontSize: 14, fontWeight: "bold", color: "#0D1B2A" }}>Candidate Profile</Text>
          <Text style={{ fontSize: 9, color: "#9CA3AF" }}>{candidateName} • ForgeTomorrow</Text>
        </View>

        {profile?.aboutMe ? (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0D1B2A", marginBottom: 6, letterSpacing: 0.5 }}>PROFESSIONAL SUMMARY</Text>
            <Text style={{ fontSize: 10, color: "#374151", lineHeight: 1.7 }}>{profile.aboutMe}</Text>
          </View>
        ) : null}

        {skills.length > 0 ? (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0D1B2A", marginBottom: 8, letterSpacing: 0.5 }}>SKILLS</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
              {skills.map((s, i) => (
                <View key={i} style={{ backgroundColor: "#F3F4F6", borderRadius: 3, padding: "3 8" }}>
                  <Text style={{ fontSize: 8, color: "#374151" }}>{typeof s === "string" ? s : s?.name}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ flexDirection: "row", gap: 20, marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            {certifications.length > 0 ? (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0D1B2A", marginBottom: 8, letterSpacing: 0.5 }}>CERTIFICATIONS</Text>
                {certifications.map((c, i) => (
                  <Text key={i} style={{ fontSize: 9, color: "#374151", marginBottom: 4 }}>• {typeof c === "string" ? c : c?.name}</Text>
                ))}
              </View>
            ) : null}
            {languages.length > 0 ? (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0D1B2A", marginBottom: 8, letterSpacing: 0.5 }}>LANGUAGES</Text>
                <Text style={{ fontSize: 9, color: "#374151" }}>{languages.join(" • ")}</Text>
              </View>
            ) : null}
            {education.length > 0 ? (
              <View>
                <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0D1B2A", marginBottom: 8, letterSpacing: 0.5 }}>EDUCATION</Text>
                {education.map((e, i) => (
                  <View key={i} style={{ marginBottom: 6 }}>
                    <Text style={{ fontSize: 9, fontWeight: "bold", color: "#374151" }}>{[e?.degree, e?.field].filter(Boolean).join(" in ")}</Text>
                    {e?.school ? <Text style={{ fontSize: 8, color: "#9CA3AF" }}>{e.school}</Text> : null}
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        {projects.length > 0 ? (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0D1B2A", marginBottom: 8, letterSpacing: 0.5 }}>PORTFOLIO & PROJECTS</Text>
            {projects.slice(0, 6).map((p, i) => (
              <View key={i} style={{ backgroundColor: "#F9FAFB", borderRadius: 4, padding: "10 12", marginBottom: 6, borderLeftWidth: 3, borderLeftColor: "#FF7043" }}>
                <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0D1B2A", marginBottom: 3 }}>
                  {typeof p === "string" ? `Project ${i + 1}` : safeString(p?.name || p?.title || `Project ${i + 1}`)}
                </Text>
                {(p?.notes || p?.description) ? (
                  <Text style={{ fontSize: 9, color: "#6B7280", lineHeight: 1.5 }}>{safeString(p?.notes || p?.description)}</Text>
                ) : null}
                {p?.url ? <Text style={{ fontSize: 8, color: "#FF7043", marginTop: 3 }}>{p.url}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        <View style={{ borderTopWidth: 1, borderTopColor: "#E5E7EB", paddingTop: 8, marginTop: 16 }}>
          <Text style={{ fontSize: 8, color: "#9CA3AF", lineHeight: 1.5 }}>
            ForgeTomorrow Candidate Alignment Reviews are for recruiter decision support only. AI-assisted signal analysis reflects available profile data at export time. Self-identification answers excluded.
          </Text>
        </View>
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
    description: true,
  },
},
        user: {
  select: {
    id: true,
    name: true,
    firstName: true,
    lastName: true,
    email: true,
    headline: true,
    aboutMe: true,
    skillsJson: true,
    languagesJson: true,
    educationJson: true,
    certificationsJson: true,
    projectsJson: true,
    workPreferences: true,
    profileVisibility: true,
    location: true,
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

    const resumeData = normalizeResumeTemplateData(app.resume.content);
    if (!resumeData) {
      return res.status(400).json({ error: "Resume content is not valid JSON" });
    }

// Fetch most recent WHY explain run for this application
    let whyResult = null;
    try {
      const explainRun = await prisma.recruiterExplainRun.findFirst({
        where: { applicationId: applicationId },
        orderBy: { createdAt: "desc" },
        select: { result: true, score: true, summary: true },
      });
      if (explainRun?.result) {
        whyResult = {
          ...(typeof explainRun.result === "object" ? explainRun.result : {}),
          score: explainRun.score ?? null,
          summary: explainRun.summary || null,
        };
      }
    } catch (e) {
      console.warn("[packet.zip] WHY fetch failed:", e?.message);
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
  workPreferences={app.user?.workPreferences || {}}
/>
      );

      const addInfoBuf = await pdf(addInfoDoc).toBuffer();
      zip.file(`04_Candidate_Additional_Info_${base}.pdf`, addInfoBuf);
    }

// 5) ForgeTomorrow Candidate Alignment Review
    {
      const profile = {
  headline: app.user?.headline || "",
  aboutMe: app.user?.aboutMe || "",
  skills: app.user?.skillsJson || [],
  languages: app.user?.languagesJson || [],
  education: app.user?.educationJson || [],
  certifications: app.user?.certificationsJson || [],
  projects: app.user?.projectsJson || [],
  workPreferences: app.user?.workPreferences || {},
  profileVisibility: app.user?.profileVisibility || "",
  location: app.user?.location || "",
  additionalQuestions: additionalAnswers,
};
      const intelligenceDoc = (
        <FullCandidateIntelligencePDF
          candidateName={candidateName}
          candidateEmail={candidateEmail}
          profile={profile}
          job={app.job}
          forgeAssessment={forgeAssessment}
          whyResult={whyResult}
        />
      );
      const intelligenceBuf = await pdf(intelligenceDoc).toBuffer();
      zip.file(
        `05_FT_Candidate_Alignment_Review_${base}.pdf`,
        intelligenceBuf
      );
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
