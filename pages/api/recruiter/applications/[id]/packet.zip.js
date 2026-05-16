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

import { safeArr, classifySignals, overallVerdict, signalScoreToPercent } from '@/lib/intelligence/profileSignalShared';

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

function getSignalColor(status) {
  if (["Strong", "Proven", "Matched", "direct"].includes(status)) return "#16A34A";
  if (["Moderate", "Partial", "Transferable", "adjacent"].includes(status)) return "#D97706";
  return "#DC2626";
}

function getReasonColor(reason) {
  const type = safeString(reason?.type || reason?.status || "").toLowerCase();
  if (type.includes("missing") || type.includes("gap")) return "#DC2626";
  if (type.includes("transfer") || type.includes("adjacent") || type.includes("partial")) return "#D97706";
  return "#16A34A";
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
  profileSignals,
  profileVerdict,
  realProfileSignalScore,
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

const profileSignalScore = realProfileSignalScore ?? whyResult?.profileScore ?? forgeAssessment?.profileScore ?? null;
  const hasJD = Boolean(job?.description || job?.id);
  const overallSignalScore =
    whyResult?.overallScore ??
    forgeAssessment?.overallScore ??
    (resumeIntelligenceScore !== null && profileSignalScore !== null
      ? Math.round(
          hasJD
            ? resumeIntelligenceScore * 0.65 + profileSignalScore * 0.35
            : resumeIntelligenceScore * 0.30 + profileSignalScore * 0.70
        )
      : resumeIntelligenceScore ?? profileSignalScore ?? null);

  const whyStrengths = Array.isArray(why?.strengths) ? why.strengths : [];
  const whyGaps = Array.isArray(why?.gaps) ? why.gaps : [];
  const whyTransferable = Array.isArray(why?.skills?.transferable) ? why.skills.transferable : [];
  const whyReasons = Array.isArray(why?.reasons) ? why.reasons : [];
  const whyInterview = why?.interviewQuestions || null;

  const resolvedProfileSignals = Array.isArray(profileSignals) && profileSignals.length > 0
    ? profileSignals
    : [];

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
      <Page size="LETTER" style={{ padding: 0, fontFamily: "Helvetica", backgroundColor: "#0D1B2A" }}>
        <View style={{ height: 8, backgroundColor: "#FF7043" }} />
        <View style={{ padding: 48 }}>
          <Text style={{ fontSize: 10, color: "#FF7043", fontWeight: "bold", letterSpacing: 1, marginBottom: 48 }}>
            FORGETOMORROW
          </Text>
          <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.50)", letterSpacing: 2, marginBottom: 16 }}>
            CANDIDATE ALIGNMENT REVIEW
          </Text>
          <Text style={{ fontSize: 32, fontWeight: "bold", color: "#FFFFFF", marginBottom: 8 }}>{candidateName}</Text>
          {profile?.headline ? (
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginBottom: 4 }}>{profile.headline}</Text>
          ) : null}
          {candidateEmail ? (
            <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.40)", marginBottom: 32 }}>{candidateEmail}</Text>
          ) : null}

          <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.12)", marginBottom: 32 }} />

          <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.40)", marginBottom: 6, letterSpacing: 0.5 }}>
            ROLE APPLIED FOR
          </Text>
          <Text style={{ fontSize: 16, color: "#FF7043", fontWeight: "bold", marginBottom: 4 }}>
            {job?.title || "Position"}
          </Text>
          {job?.company ? (
            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.50)", marginBottom: 32 }}>{job.company}</Text>
          ) : null}

          {overallSignalScore !== null ? (
            <View style={{ marginTop: 48 }}>
              <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.40)", marginBottom: 8, letterSpacing: 0.5 }}>
                FORGETOMORROW OVERALL SIGNAL SCORE
              </Text>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 52, fontWeight: "bold", color: scoreColor, lineHeight: 1 }}>
                    {overallSignalScore}
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: "bold", color: scoreColor, marginBottom: 6 }}>%</Text>
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
              Confidential. For authorized recruiter use only. ForgeTomorrow signal analysis is AI-assisted and not a hiring decision.
              Self-identification excluded.
            </Text>
          </View>
        </View>
      </Page>

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
                <Text style={{ fontSize: 9, color: "#6B7280" }}>
                  {hasJD ? "Overall Candidate Signal — Role-Specific" : "Overall Candidate Signal — General Profile"}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 10, color: "#374151", lineHeight: 1.6 }}>
              This score combines resume intelligence, profile depth, portfolio proof, employer-response context, and transferable
              capability signals for this specific role.
            </Text>
          </View>
        ) : null}

        <View style={{ flexDirection: "row", gap: 16, marginBottom: 20 }}>
          <View style={{ flex: 1, backgroundColor: "#F9FAFB", borderRadius: 6, padding: "14 16", borderLeftWidth: 4, borderLeftColor: "#FF7043" }}>
            <Text style={{ fontSize: 8, color: "#6B7280", marginBottom: 4 }}>RESUME INTELLIGENCE SCORE</Text>
            <Text style={{ fontSize: 34, fontWeight: "bold", color: "#0D1B2A", marginBottom: 18 }}>
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
              <Text style={{ fontSize: 14, fontWeight: "bold", color: "#0D1B2A", marginLeft: 2, marginBottom: 3 }}>%</Text>
            </View>
            <Text style={{ fontSize: 9, color: "#6B7280", lineHeight: 1.6 }}>
              Profile depth, projects, preferences, credentials, and recruiter response signal.
            </Text>
          </View>
        </View>

        <View style={{ backgroundColor: "#FFF7ED", borderRadius: 6, padding: "16 18", borderLeftWidth: 4, borderLeftColor: "#FF7043", marginBottom: 18 }}>
          <Text style={{ fontSize: 11, fontWeight: "bold", color: "#7C2D12", marginBottom: 10, letterSpacing: 0.3 }}>
            OVERALL CANDIDATE SIGNAL
          </Text>
          <Text style={{ fontSize: 9, color: "#374151", lineHeight: 1.7 }}>
            {hasJD
              ? "Role-specific hiring confidence. Resume-to-JD alignment carries 65% weight; profile depth, portfolio proof, and recruiter-readiness carry 35%. This is not an ATS score — it is evidence-based hiring signal."
              : "General recruiter confidence score. Profile depth, portfolio proof, and recruiter-readiness carry 70% weight; resume signal carries 30%. No job description was provided for role-specific alignment."}
          </Text>
        </View>

        {(whyStrengths.length > 0 || whyGaps.length > 0 || whyTransferable.length > 0) ? (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0D1B2A", marginBottom: 10, letterSpacing: 0.5 }}>
              RESUME INTELLIGENCE SUMMARY
            </Text>

            {whyStrengths.length > 0 ? (
              <View style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 9, fontWeight: "bold", color: "#16A34A", marginBottom: 6 }}>Strengths</Text>
                {whyStrengths.map((s, i) => (
                  <Text key={`strength-${i}`} style={{ fontSize: 8, color: "#374151", lineHeight: 1.5, marginBottom: 3 }}>
                    • {safeString(s)}
                  </Text>
                ))}
              </View>
            ) : null}

            {whyTransferable.length > 0 ? (
              <View style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 9, fontWeight: "bold", color: "#D97706", marginBottom: 6 }}>Transferable Signals</Text>
                {whyTransferable.map((t, i) => (
                  <Text key={`transfer-${i}`} style={{ fontSize: 8, color: "#374151", lineHeight: 1.5, marginBottom: 3 }}>
                    • {safeString(t)}
                  </Text>
                ))}
              </View>
            ) : null}

            {whyGaps.length > 0 ? (
              <View>
                <Text style={{ fontSize: 9, fontWeight: "bold", color: "#DC2626", marginBottom: 6 }}>Validation Areas</Text>
                {whyGaps.map((g, i) => (
                  <Text key={`gap-${i}`} style={{ fontSize: 8, color: "#374151", lineHeight: 1.5, marginBottom: 3 }}>
                    • {safeString(g)}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0D1B2A", marginBottom: 8, letterSpacing: 0.5 }}>
            RESUME ALIGNMENT DETAILS
          </Text>

          {whyReasons.length > 0 ? (
            whyReasons.slice(0, 6).map((r, i) => (
              <View
                key={`reason-${i}`}
                style={{
                  backgroundColor: "#F9FAFB",
                  borderRadius: 5,
                  padding: "10 12",
                  marginBottom: 8,
                  borderLeftWidth: 3,
                  borderLeftColor: getReasonColor(r),
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: "bold", color: "#111827", marginBottom: 4 }}>
                  {r.requirement || "Alignment Signal"}
                </Text>

                <Text style={{ fontSize: 8, color: "#4B5563", lineHeight: 1.6, marginBottom: 6 }}>
                  {r.explanation ||
                    r.reason ||
                    "ForgeTomorrow identified this as a relevant recruiter-facing alignment signal."}
                </Text>

                {Array.isArray(r.evidence) && r.evidence.length > 0 ? (
                  r.evidence.slice(0, 2).map((ev, j) => (
                    <Text key={`evidence-${i}-${j}`} style={{ fontSize: 8, color: "#6B7280", lineHeight: 1.5, marginBottom: 2 }}>
                      • {safeString(ev?.text || ev)}
                      {ev?.source ? ` · ${safeString(ev.source)}` : ""}
                    </Text>
                  ))
                ) : null}
              </View>
            ))
          ) : (
            <View style={{ backgroundColor: "#F9FAFB", borderRadius: 5, padding: "12 14" }}>
              <Text style={{ fontSize: 8, color: "#6B7280", lineHeight: 1.6 }}>
                No detailed resume intelligence explanation is stored yet for this application. Rerun the recruiter explain/why flow to populate this section.
              </Text>
            </View>
          )}
        </View>
      </Page>

      <Page size="LETTER" style={aiStyles.page}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: "#FF7043" }}>
          <Text style={{ fontSize: 14, fontWeight: "bold", color: "#0D1B2A" }}>Profile & Portfolio Intelligence</Text>
          <Text style={{ fontSize: 9, color: "#9CA3AF" }}>{candidateName} • ForgeTomorrow</Text>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0D1B2A", marginBottom: 8, letterSpacing: 0.5 }}>
            PROFILE & PORTFOLIO SIGNALS
          </Text>

          {resolvedProfileSignals.map((signal, i) => (
            <View
              key={`profile-signal-${i}`}
              style={{
                backgroundColor: "#F9FAFB",
                borderRadius: 4,
                padding: "8 12",
                marginBottom: 6,
                borderLeftWidth: 3,
                borderLeftColor: getSignalColor(signal.status),
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: "bold", color: "#0D1B2A", marginBottom: 3 }}>
                {signal.label} · {signal.status === "direct" ? "Proven" : signal.status === "adjacent" ? "Partial" : "Missing"}
              </Text>
              <Text style={{ fontSize: 8, color: "#6B7280", lineHeight: 1.45 }}>
                {signal.status === "direct"
                  ? signal.description
                  : signal.gapReason || signal.description || ""}
              </Text>
            </View>
          ))}
        </View>

        {profile?.aboutMe ? (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0D1B2A", marginBottom: 6, letterSpacing: 0.5 }}>
              PROFESSIONAL SUMMARY
            </Text>
            <Text style={{ fontSize: 10, color: "#374151", lineHeight: 1.7 }}>{profile.aboutMe}</Text>
          </View>
        ) : null}

        {skills.length > 0 ? (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0D1B2A", marginBottom: 8, letterSpacing: 0.5 }}>
              SKILLS
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
              {skills.map((s, i) => (
                <View key={`skill-${i}`} style={{ backgroundColor: "#F3F4F6", borderRadius: 3, padding: "3 8" }}>
                  <Text style={{ fontSize: 8, color: "#374151" }}>{typeof s === "string" ? s : s?.name}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {(certifications.length > 0 || languages.length > 0 || education.length > 0) ? (
          <View style={{ marginBottom: 18 }}>
            {certifications.length > 0 ? (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0D1B2A", marginBottom: 8, letterSpacing: 0.5 }}>
                  CERTIFICATIONS
                </Text>
                {certifications.map((c, i) => (
                  <Text key={`cert-${i}`} style={{ fontSize: 9, color: "#374151", marginBottom: 4 }}>
                    • {typeof c === "string" ? c : c?.name}
                  </Text>
                ))}
              </View>
            ) : null}

            {languages.length > 0 ? (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0D1B2A", marginBottom: 8, letterSpacing: 0.5 }}>
                  LANGUAGES
                </Text>
                <Text style={{ fontSize: 9, color: "#374151" }}>{languages.join(" • ")}</Text>
              </View>
            ) : null}

            {education.length > 0 ? (
              <View>
                <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0D1B2A", marginBottom: 8, letterSpacing: 0.5 }}>
                  EDUCATION
                </Text>
                {education.map((e, i) => (
                  <View key={`edu-${i}`} style={{ marginBottom: 6 }}>
                    <Text style={{ fontSize: 9, fontWeight: "bold", color: "#374151" }}>
                      {[e?.degree, e?.field].filter(Boolean).join(" in ")}
                    </Text>
                    {e?.school ? <Text style={{ fontSize: 8, color: "#9CA3AF" }}>{e.school}</Text> : null}
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {projects.length > 0 ? (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0D1B2A", marginBottom: 8, letterSpacing: 0.5 }}>
              PORTFOLIO & PROJECTS
            </Text>
            {projects.slice(0, 6).map((p, i) => (
              <View key={`project-${i}`} style={{ backgroundColor: "#F9FAFB", borderRadius: 4, padding: "10 12", marginBottom: 6, borderLeftWidth: 3, borderLeftColor: "#FF7043" }}>
                <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0D1B2A", marginBottom: 3 }}>
                  {typeof p === "string" ? `Project ${i + 1}` : safeString(p?.name || p?.title || `Project ${i + 1}`)}
                </Text>
                {p?.notes || p?.description ? (
                  <Text style={{ fontSize: 9, color: "#6B7280", lineHeight: 1.5 }}>{safeString(p?.notes || p?.description)}</Text>
                ) : null}
                {p?.url ? <Text style={{ fontSize: 8, color: "#FF7043", marginTop: 3 }}>{p.url}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {whyInterview ? (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0D1B2A", marginBottom: 8, letterSpacing: 0.5 }}>
              SUGGESTED INTERVIEW QUESTIONS
            </Text>

            {Array.isArray(whyInterview.behavioral) &&
              whyInterview.behavioral.slice(0, 2).map((q, i) => (
                <View key={`behavioral-${i}`} style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 8, color: "#9CA3AF", marginBottom: 2 }}>BEHAVIORAL</Text>
                  <Text style={{ fontSize: 9, color: "#374151", lineHeight: 1.5 }}>{q}</Text>
                </View>
              ))}

            {Array.isArray(whyInterview.occupational) &&
              whyInterview.occupational.slice(0, 2).map((q, i) => (
                <View key={`occupational-${i}`} style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 8, color: "#9CA3AF", marginBottom: 2 }}>ROLE-SPECIFIC</Text>
                  <Text style={{ fontSize: 9, color: "#374151", lineHeight: 1.5 }}>{q}</Text>
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

    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const applicationId = toInt(req.query.id);
    if (!applicationId) {
      return res.status(400).json({ error: "Invalid application id" });
    }

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
      },
    });

    if (!app) return res.status(404).json({ error: "Not found" });

    const appAccountKey = app.accountKey || app.job?.accountKey || null;

    if (!appAccountKey && !isStaff) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (appAccountKey && !allowedAccountKeys.has(appAccountKey)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const candidateName = pickName(app.user) || "Candidate";
    const candidateEmail = safeString(app.user?.email).trim() || "";

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

    if (!app.resume?.content) {
      return res.status(404).json({ error: "Resume not found" });
    }

    const resumeData = normalizeResumeTemplateData(app.resume.content);
    if (!resumeData) {
      return res.status(400).json({ error: "Resume content is not valid JSON" });
    }

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

    const zip = new JSZip();

    const safeCandidateLabel = (filenameSafe(candidateName) || "Candidate").slice(0, 20);
    const safeJobLabel = (filenameSafe(app.job?.title) || "Role").slice(0, 20);
    const base = `${applicationId}_${safeCandidateLabel}_${safeJobLabel}`;

    if (app.cover?.content) {
      const coverTemplateData = buildCoverTemplateData({ app, candidateName });
      const coverDoc = <CoverLetterTemplatePDF data={coverTemplateData} />;
      const coverBuf = await pdf(coverDoc).toBuffer();
      zip.file(`01_CoverLetter_${base}.pdf`, coverBuf);
    }

    {
      const hybridDoc = <HybridResumeTemplatePDF data={resumeData} />;
      const hybridBuf = await pdf(hybridDoc).toBuffer();
      zip.file(`02_Resume_Hybrid_${base}.pdf`, hybridBuf);
    }

    {
      const reverseDoc = <ReverseResumeTemplatePDF data={resumeData} />;
      const reverseBuf = await pdf(reverseDoc).toBuffer();
      zip.file(`03_Resume_Reverse_${base}.pdf`, reverseBuf);
    }

    {
      const standardQuestions = [];

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

      // Run real profile signal engine
      const profileSignals = classifySignals(profile);
      const profileVerdict = overallVerdict(profileSignals);
      const realProfileSignalScore = signalScoreToPercent(profileVerdict);

      const intelligenceDoc = (
        <FullCandidateIntelligencePDF
          candidateName={candidateName}
          candidateEmail={candidateEmail}
          profile={profile}
          job={app.job}
          forgeAssessment={forgeAssessment}
          whyResult={whyResult}
          profileSignals={profileSignals}
          profileVerdict={profileVerdict}
          realProfileSignalScore={realProfileSignalScore}
        />
      );

      const intelligenceBuf = await pdf(intelligenceDoc).toBuffer();
      zip.file(`05_FT_Candidate_Alignment_Review_${base}.pdf`, intelligenceBuf);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    const zipName = `FT_Packet_${base}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).send(zipBuffer);
  } catch (e) {
    console.error("packet.zip api error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}