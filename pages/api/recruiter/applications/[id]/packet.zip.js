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
import { buildProfileExplain } from '@/lib/intelligence/whyEngine';

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
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#6b7280", marginBottom: 16 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 14,
    marginBottom: 4,
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
      </Page>
    </Document>
  );
}


function statusLabel(status) {
  if (status === "direct") return "Proven";
  if (status === "adjacent") return "Partial";
  return "Missing";
}

function safeList(value, limit = 4) {
  return Array.isArray(value)
    ? value.map((v) => safeString(v).trim()).filter(Boolean).slice(0, limit)
    : [];
}

function CompactBulletList({ items, color = "#374151", max = 4 }) {
  const list = safeList(items, max);
  if (!list.length) return null;

  return (
    <View style={{ gap: 2 }}>
      {list.map((item, i) => (
        <Text key={`bullet-${i}`} style={{ fontSize: 7.5, color, lineHeight: 1.35 }}>
          • {item}
        </Text>
      ))}
    </View>
  );
}

function IntelligencePill({ label, value, color = "#0D1B2A" }) {
  if (!value && value !== 0) return null;

  return (
    <View
      style={{
        backgroundColor: "#F3F4F6",
        borderRadius: 4,
        padding: "5 7",
        minWidth: 76,
        borderWidth: 1,
        borderColor: "#E5E7EB",
      }}
    >
      <Text style={{ fontSize: 6.5, color: "#6B7280", fontWeight: "bold", marginBottom: 2, textTransform: "uppercase" }}>
        {label}
      </Text>
      <Text style={{ fontSize: 8, color, fontWeight: "bold" }}>{String(value)}</Text>
    </View>
  );
}

function SignalMetaBadge({ children, color = "#374151", bg = "#F3F4F6" }) {
  if (!children) return null;
  return (
    <View style={{ backgroundColor: bg, borderRadius: 999, padding: "3 6" }}>
      <Text style={{ fontSize: 6.3, fontWeight: "bold", color }}>{String(children).toUpperCase()}</Text>
    </View>
  );
}

function SignalFieldList({ items, max = 3 }) {
  const list = safeList(items, max);
  if (!list.length) return null;
  return (
    <View style={{ gap: 2 }}>
      {list.map((item, i) => {
        const parts = String(item).split(":");
        const label = parts.length > 1 ? parts.shift() : null;
        const value = parts.join(":").trim();
        return (
          <Text key={`field-${i}`} style={{ fontSize: 7.2, color: "#374151", lineHeight: 1.3 }}>
            {label ? `${label}: ` : "• "}{label ? value : item}
          </Text>
        );
      })}
    </View>
  );
}

function SignalIntelligenceCard({ signal, index }) {
  const color = getSignalColor(signal.status);
  const evidence = safeList(signal.recruiterContext || signal.evidenceDetected, 3);
  const missing = safeList(signal.missingValidation, 2);
  const title = safeString(signal.interpretationTitle || signal.label);
  const interpretation = safeString(signal.interpretationSummary || signal.recruiterInterpretation || signal.gapReason || signal.description);
  const focus = safeString(signal.recruiterFocus || signal.signalImpact);
  const risk = signal.recruiterRisk || (signal.status === "direct" ? "Low Risk" : signal.status === "adjacent" ? "Medium Risk" : "High Risk");
  const confidence = signal.confidenceLevel ? `${signal.confidenceLevel} Confidence` : "Measured Confidence";

  return (
    <View
      key={`profile-signal-${index}`}
      wrap={false}
      style={{
        width: "48.5%",
        backgroundColor: "#F9FAFB",
        borderRadius: 5,
        padding: "6 8",
        marginBottom: 6,
        borderLeftWidth: 3,
        borderLeftColor: color,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 6, marginBottom: 5 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 8.4, fontWeight: "bold", color: "#0D1B2A" }}>{title}</Text>
          <Text style={{ fontSize: 6.5, color, fontWeight: "bold", marginTop: 1 }}>{statusLabel(signal.status)}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 3, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: 150 }}>
          <SignalMetaBadge color={color} bg={signal.status === "direct" ? "#ECFDF5" : signal.status === "adjacent" ? "#FFFBEB" : "#FEF2F2"}>{risk}</SignalMetaBadge>
          <SignalMetaBadge color="#1D4ED8" bg="#EFF6FF">{confidence}</SignalMetaBadge>
        </View>
      </View>

      {interpretation ? (
        <Text style={{ fontSize: 7.5, color: "#374151", lineHeight: 1.32, marginBottom: 4 }}>{interpretation}</Text>
      ) : null}

      {evidence.length ? (
        <View style={{ marginBottom: 4 }}>
          <Text style={{ fontSize: 6.3, fontWeight: "bold", color: "#16A34A", marginBottom: 2, textTransform: "uppercase" }}>
            Evidence / Context
          </Text>
          <SignalFieldList items={evidence} max={3} />
        </View>
      ) : null}

      {missing.length ? (
        <View style={{ marginBottom: 4 }}>
          <Text style={{ fontSize: 6.3, fontWeight: "bold", color: "#D97706", marginBottom: 2, textTransform: "uppercase" }}>
            Validation Needed
          </Text>
          <CompactBulletList items={missing} color="#374151" max={2} />
        </View>
      ) : null}

      {focus ? (
        <View style={{ borderTopWidth: 1, borderTopColor: "#E5E7EB", paddingTop: 4, marginTop: 2 }}>
          <Text style={{ fontSize: 6.3, fontWeight: "bold", color: "#6B7280", marginBottom: 2, textTransform: "uppercase" }}>
            Recruiter Focus
          </Text>
          <Text style={{ fontSize: 7, color: "#4B5563", lineHeight: 1.28 }}>{focus}</Text>
        </View>
      ) : null}
    </View>
  );
}


function ReadinessSignalSummary({ signal, title, accent = "#0D1B2A" }) {
  if (!signal) return null;

  const summary = safeString(signal.interpretationSummary || signal.recruiterInterpretation || signal.description);
  const context = safeList(signal.recruiterContext || signal.evidenceDetected, 4);
  const focus = safeString(signal.recruiterFocus || "");

  return (
    <View style={{ padding: "5 0", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10, marginBottom: 3 }}>
        <Text style={{ fontSize: 8.6, fontWeight: "bold", color: "#0D1B2A", flex: 1 }}>{title}</Text>
        <View style={{ flexDirection: "row", gap: 4 }}>
          <SignalMetaBadge color={getSignalColor(signal.status)} bg={signal.status === "direct" ? "#ECFDF5" : signal.status === "adjacent" ? "#FFFBEB" : "#FEF2F2"}>
            {signal.recruiterRisk || (signal.status === "direct" ? "Low Risk" : signal.status === "adjacent" ? "Medium Risk" : "High Risk")}
          </SignalMetaBadge>
          <SignalMetaBadge color="#1D4ED8" bg="#EFF6FF">
            {signal.confidenceLevel ? `${signal.confidenceLevel} Confidence` : "Measured Confidence"}
          </SignalMetaBadge>
        </View>
      </View>

      {summary ? (
        <Text style={{ fontSize: 7.5, color: "#374151", lineHeight: 1.34, marginBottom: 4 }}>{summary}</Text>
      ) : null}

      {context.length ? (
        <View style={{ marginBottom: focus ? 3 : 0 }}>
          <SignalFieldList items={context} max={4} />
        </View>
      ) : null}

      {focus ? (
        <Text style={{ fontSize: 7.2, color: "#6B7280", lineHeight: 1.3 }}>
          Focus: {focus}
        </Text>
      ) : null}
    </View>
  );
}

function InterviewPathBlock({ whyInterview }) {
  if (!whyInterview) return null;

  const behavioral = Array.isArray(whyInterview.behavioral) ? whyInterview.behavioral.slice(0, 2) : [];
  const roleSpecific = Array.isArray(whyInterview.occupational) ? whyInterview.occupational.slice(0, 2) : [];

  if (!behavioral.length && !roleSpecific.length) return null;

  return (
    <View style={{ backgroundColor: "#F9FAFB", borderRadius: 6, padding: "7 9", borderLeftWidth: 3, borderLeftColor: "#0D1B2A", marginTop: 8 }}>
      <Text style={{ fontSize: 9, fontWeight: "bold", color: "#0D1B2A", marginBottom: 7 }}>
        RECOMMENDED INTERVIEW PATHS
      </Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 6.8, fontWeight: "bold", color: "#6B7280", marginBottom: 4, textTransform: "uppercase" }}>Behavioral Validation</Text>
          {behavioral.map((q, i) => (
            <Text key={`ready-behavioral-${i}`} style={{ fontSize: 7.3, color: "#374151", lineHeight: 1.32, marginBottom: 3 }}>• {q}</Text>
          ))}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 6.8, fontWeight: "bold", color: "#6B7280", marginBottom: 4, textTransform: "uppercase" }}>Capability Validation</Text>
          {roleSpecific.map((q, i) => (
            <Text key={`ready-role-${i}`} style={{ fontSize: 7.3, color: "#374151", lineHeight: 1.32, marginBottom: 3 }}>• {q}</Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function CompactInsightColumn({ title, color, items, emptyText }) {
  const list = safeList(items, 4);
  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB", borderRadius: 5, padding: "7 9", borderTopWidth: 3, borderTopColor: color }}>
      <Text style={{ fontSize: 8, fontWeight: "bold", color, marginBottom: 5 }}>{title}</Text>
      {list.length ? (
        <CompactBulletList items={list} max={4} />
      ) : (
        <Text style={{ fontSize: 7.5, color: "#9CA3AF", lineHeight: 1.4 }}>{emptyText || "No items detected."}</Text>
      )}
    </View>
  );
}

function matchTypeDisplay(matchType) {
  return {
    tool_implies_category: "Supporting operational evidence",
    synonym_phrase: "Strong transferable evidence",
    single_token_only: "Supporting keyword evidence",
    direct_match: "Direct evidence match",
    exact_phrase: "Direct evidence match",
  }[matchType] || "Signal match";
}

function EvidenceAnalysisGrid({ matched = [], notDemonstrated = [] }) {
  const demonstrated = Array.isArray(matched) ? matched.slice(0, 7) : [];
  const validation = Array.isArray(notDemonstrated) ? notDemonstrated.slice(0, 7) : [];

  if (!demonstrated.length && !validation.length) {
    return (
      <View style={{ backgroundColor: "#F9FAFB", borderRadius: 5, padding: "12 14" }}>
        <Text style={{ fontSize: 8, color: "#6B7280", lineHeight: 1.6 }}>
          No signal alignment data available. Run the WHY analysis from the applicant pipeline to populate this section.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 8.5, fontWeight: "bold", color: "#16A34A", marginBottom: 6 }}>
          DEMONSTRATED / TRANSFERABLE
        </Text>

        {demonstrated.length ? demonstrated.map((sig, i) => {
          const tierColor = sig.tier === "A" ? "#FF7043" : "#6B7280";
          const strengthPct = typeof sig.strength === "number" ? Math.round(sig.strength * 100) : null;
          const ev = Array.isArray(sig.evidence) && sig.evidence.length ? sig.evidence[0] : null;

          return (
            <View key={`demo-${i}`} style={{ backgroundColor: "#F9FAFB", borderRadius: 5, padding: "8 10", marginBottom: 5, borderLeftWidth: 3, borderLeftColor: "#16A34A" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                <Text style={{ fontSize: 8.5, fontWeight: "bold", color: "#111827", maxWidth: 190 }}>{sig.label}</Text>
                <Text style={{ fontSize: 6.8, color: tierColor, fontWeight: "bold" }}>TIER {sig.tier}</Text>
              </View>
              <Text style={{ fontSize: 7.2, color: "#6B7280", marginBottom: 3 }}>
                {matchTypeDisplay(sig.match_type)}{strengthPct !== null ? ` • ${strengthPct}% confidence` : ""}
              </Text>
              {ev ? (
                <Text style={{ fontSize: 7.4, color: "#4B5563", lineHeight: 1.35 }}>
                  • {safeString(ev?.text || ev)}{ev?.source ? ` · ${ev.source}` : ""}
                </Text>
              ) : null}
            </View>
          );
        }) : (
          <Text style={{ fontSize: 7.5, color: "#9CA3AF", lineHeight: 1.4 }}>No demonstrated signals detected yet.</Text>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 8.5, fontWeight: "bold", color: "#DC2626", marginBottom: 6 }}>
          VALIDATION / NOT YET DEMONSTRATED
        </Text>

        {validation.length ? validation.map((sig, i) => (
          <View key={`validation-${i}`} style={{ backgroundColor: "#FEF2F2", borderRadius: 5, padding: "8 10", marginBottom: 5, borderLeftWidth: 3, borderLeftColor: "#DC2626" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
              <Text style={{ fontSize: 8.5, fontWeight: "bold", color: "#111827", maxWidth: 190 }}>{sig.label}</Text>
              <Text style={{ fontSize: 6.8, color: "#DC2626", fontWeight: "bold" }}>TIER {sig.tier}</Text>
            </View>
            <Text style={{ fontSize: 7.4, color: "#6B7280", lineHeight: 1.4 }}>
              {sig.why_missing || "Not demonstrated in the provided resume text. Recruiter should validate through interview, portfolio, or additional candidate evidence."}
            </Text>
          </View>
        )) : (
          <View style={{ backgroundColor: "#F0FDF4", borderRadius: 5, padding: "8 10", borderLeftWidth: 3, borderLeftColor: "#16A34A" }}>
            <Text style={{ fontSize: 7.5, color: "#166534", lineHeight: 1.4 }}>
              No major missing signals were detected from the available WHY analysis.
            </Text>
          </View>
        )}
      </View>
    </View>
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
  profileExplain,
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
  const whySignalsMatched = Array.isArray(why?.signals?.matched) ? why.signals.matched : [];
  const whySignalsRequired = Array.isArray(why?.signals?.required) ? why.signals.required : [];
  const whyNotDemonstrated = Array.isArray(why?.signals?.not_yet_demonstrated) ? why.signals.not_yet_demonstrated : [];
  const whyInterview = why?.interviewQuestions || null;

  const resolvedProfileSignals = Array.isArray(profileSignals) && profileSignals.length > 0
    ? profileSignals
    : [];

  const capabilitySignals = Array.isArray(profileExplain?.capabilitySignals) && profileExplain.capabilitySignals.length > 0
    ? profileExplain.capabilitySignals
    : resolvedProfileSignals.filter((s) => s?.signalGroup !== "recruiter_readiness" && !["availability", "language", "visibility"].includes(s?.key));

  const readinessSignals = Array.isArray(profileExplain?.readinessSignals) && profileExplain.readinessSignals.length > 0
    ? profileExplain.readinessSignals
    : resolvedProfileSignals.filter((s) => s?.signalGroup === "recruiter_readiness" || ["availability", "language", "visibility"].includes(s?.key));

  const readinessByKey = new Map(readinessSignals.map((s) => [s?.key, s]));

  const workPrefs = profile?.workPreferences && typeof profile.workPreferences === "object" ? profile.workPreferences : {};
  const readinessSnapshot = [
    ["Work Status", workPrefs.workStatus || workPrefs.status || workPrefs.openTo],
    ["Work Type", workPrefs.workType || workPrefs.preferredWorkType],
    ["Schedule", workPrefs.schedule],
    ["Location", profile?.location],
    ["Relocation", workPrefs.willingToRelocate],
    ["Start Timing", workPrefs.startDate || workPrefs.earliestStartDate],
    ["Primary Resume", profile?.hasResume || profile?.primaryResume ? "Available" : "Not attached"],
    ["Portfolio Visibility", profile?.profileVisibility],
    ["Language", languages.length ? languages.join(", ") : null],
  ].filter(([, value]) => value !== undefined && value !== null && String(value).trim());

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

          <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.40)", marginBottom: 4, letterSpacing: 0.5 }}>
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
                  <Text style={{ fontSize: 18, fontWeight: "bold", color: scoreColor, marginBottom: 4 }}>%</Text>
                </View>
                <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.50)" }}>
                  {overallSignalScore >= 75 ? "Strong Match" : overallSignalScore >= 50 ? "Moderate Match" : "Emerging Match"}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={{
            marginTop: 24,
            backgroundColor: "rgba(255,255,255,0.08)",
            borderRadius: 6,
            padding: "12 14",
            borderLeftWidth: 3,
            borderLeftColor: "#FF7043",
          }}>
            <Text style={{
              fontSize: 8,
              fontWeight: "bold",
              color: "#FF7043",
              marginBottom: 5,
              letterSpacing: 0.4,
            }}>
              FORGETOMORROW INTERPRETATION
            </Text>
            <Text style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.78)",
              lineHeight: 1.55,
            }}>
              {overallSignalScore >= 75
                ? "ForgeTomorrow sees strong direct alignment supported by credible execution evidence, transferable capability depth, and recruiter-usable validation signals."
                : overallSignalScore >= 50
                ? "ForgeTomorrow sees meaningful transferable capability and operational alignment, though some role-specific validation areas remain."
                : "ForgeTomorrow sees emerging alignment potential, but additional direct evidence or recruiter validation may still be required."}
            </Text>
          </View>

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
          <View style={{ backgroundColor: "#F9FAFB", borderRadius: 6, padding: "10 14", marginBottom: 12, borderLeftWidth: 4, borderLeftColor: scoreColor }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 8 }}>
              <Text style={{ fontSize: 32, fontWeight: "bold", color: scoreColor, lineHeight: 1 }}>{overallSignalScore}%</Text>
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

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
          <View style={{ flex: 1, backgroundColor: "#F9FAFB", borderRadius: 6, padding: "9 12", borderLeftWidth: 4, borderLeftColor: "#FF7043" }}>
            <Text style={{ fontSize: 8, color: "#6B7280", marginBottom: 4 }}>RESUME INTELLIGENCE SCORE</Text>
            <Text style={{ fontSize: 25, fontWeight: "bold", color: "#0D1B2A", marginBottom: 8 }}>
              {resumeIntelligenceScore !== null ? `${resumeIntelligenceScore}%` : "--"}
            </Text>
            <Text style={{ fontSize: 9, color: "#6B7280", lineHeight: 1.6 }}>
              Resume evidence, alignment, gaps, and transferable skill signal.
            </Text>
          </View>

          <View style={{ flex: 1, backgroundColor: "#F9FAFB", borderRadius: 6, padding: "9 12", borderLeftWidth: 4, borderLeftColor: "#16A34A" }}>
            <Text style={{ fontSize: 8, color: "#6B7280", marginBottom: 4 }}>PORTFOLIO SIGNAL</Text>
            <View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 18 }}>
              <Text style={{ fontSize: 25, fontWeight: "bold", color: "#0D1B2A" }}>
                {profileSignalScore ?? "--"}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: "#0D1B2A", marginLeft: 2, marginBottom: 3 }}>%</Text>
            </View>
            <Text style={{ fontSize: 9, color: "#6B7280", lineHeight: 1.6 }}>
              Portfolio depth, projects, preferences, credentials, and recruiter-readiness signal.
            </Text>
          </View>
        </View>

        <View style={{ backgroundColor: "#FFF7ED", borderRadius: 6, padding: "9 12", borderLeftWidth: 3, borderLeftColor: "#FF7043", marginBottom: 12 }}>
          <Text style={{ fontSize: 8.5, fontWeight: "bold", color: "#7C2D12", marginBottom: 4, letterSpacing: 0.3 }}>
            OVERALL CANDIDATE SIGNAL
          </Text>
          <Text style={{ fontSize: 8, color: "#374151", lineHeight: 1.45 }}>
            {hasJD
              ? "Role-specific hiring confidence. Resume-to-JD alignment carries 65% weight; profile depth, portfolio proof, and recruiter-readiness carry 35%. This is not an ATS score — it is evidence-based hiring signal."
              : "General recruiter confidence score. Profile depth, portfolio proof, and recruiter-readiness carry 70% weight; resume signal carries 30%. No job description was provided for role-specific alignment."}
          </Text>
        </View>

        {(whyStrengths.length > 0 || whyGaps.length > 0 || whyTransferable.length > 0) ? (
          <View style={{ marginBottom: 18 }}>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0D1B2A", marginBottom: 8, letterSpacing: 0.5 }}>
              RESUME INTELLIGENCE SUMMARY
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <CompactInsightColumn title="Operational Strengths" color="#16A34A" items={whyStrengths} emptyText="No clear strengths detected yet." />
              <CompactInsightColumn title="Transferable Capability Signals" color="#D97706" items={whyTransferable} emptyText="No transferable signals detected yet." />
              <CompactInsightColumn title="Recruiter Validation Areas" color="#DC2626" items={whyGaps} emptyText="No major validation areas detected." />
            </View>
          </View>
        ) : null}

        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0D1B2A", marginBottom: 8, letterSpacing: 0.5 }}>
            EVIDENCE & ALIGNMENT ANALYSIS
          </Text>
          <EvidenceAnalysisGrid matched={whySignalsMatched} notDemonstrated={whyNotDemonstrated} />
        </View>
      </Page>

      <Page size="LETTER" style={aiStyles.page}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: "#FF7043" }}>
          <Text style={{ fontSize: 14, fontWeight: "bold", color: "#0D1B2A" }}>Capability & Credibility Intelligence</Text>
          <Text style={{ fontSize: 9, color: "#9CA3AF" }}>{candidateName} • ForgeTomorrow</Text>
        </View>

        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0D1B2A", letterSpacing: 0.5 }}>
              CAPABILITY & CREDIBILITY INTELLIGENCE
            </Text>
            <Text style={{ fontSize: 7.5, color: "#6B7280" }}>
              {profileVerdict?.proven ?? 0} proven • {profileVerdict?.partial ?? 0} partial • {profileVerdict?.missing ?? 0} missing
            </Text>
          </View>

          <View style={{ backgroundColor: "#0D1B2A", borderRadius: 6, padding: "8 10", marginBottom: 8 }}>
            <Text style={{ fontSize: 8, color: "#FF7043", fontWeight: "bold", marginBottom: 4, letterSpacing: 0.4 }}>
              WHAT FORGETOMORROW SEES
            </Text>
            <Text style={{ fontSize: 7.4, color: "#E5E7EB", lineHeight: 1.35 }}>
              This section evaluates the candidate’s visible professional substance: positioning, narrative, capability proof, portfolio evidence, and credibility markers. Recruiter logistics are separated onto the next page so capability is not confused with availability or access metadata.
            </Text>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
            {capabilitySignals.map((signal, i) => (
              <SignalIntelligenceCard key={`capability-signal-${i}`} signal={signal} index={i} />
            ))}
          </View>
        </View>

        <View style={{ borderTopWidth: 1, borderTopColor: "#E5E7EB", paddingTop: 8, marginTop: 12 }}>
          <Text style={{ fontSize: 8, color: "#9CA3AF", lineHeight: 1.5 }}>
            ForgeTomorrow Candidate Alignment Reviews are for recruiter decision support only. AI-assisted signal analysis reflects available portfolio data at export time. Self-identification answers excluded.
          </Text>
        </View>
      </Page>

      <Page size="LETTER" style={aiStyles.page}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 13, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: "#FF7043" }}>
          <Text style={{ fontSize: 13, fontWeight: "bold", color: "#0D1B2A" }}>Recruiter Readiness & Hiring Logistics</Text>
          <Text style={{ fontSize: 9, color: "#9CA3AF" }}>{candidateName} • ForgeTomorrow</Text>
        </View>

        <View style={{ backgroundColor: "#0D1B2A", borderRadius: 6, padding: "8 10", marginBottom: 8 }}>
          <Text style={{ fontSize: 7.8, color: "#FF7043", fontWeight: "bold", marginBottom: 4, letterSpacing: 0.4 }}>
            OPERATIONAL HIRING CONTEXT
          </Text>
          <Text style={{ fontSize: 7.4, color: "#E5E7EB", lineHeight: 1.35 }}>
            Recruiter workflow context for scheduling, accessibility, communication, and follow-up. These details support hiring operations and should not be treated as candidate capability scoring.
          </Text>
        </View>

        <View style={{ backgroundColor: "#F9FAFB", borderRadius: 6, padding: "8 10", borderLeftWidth: 3, borderLeftColor: "#FF7043", marginBottom: 8 }}>
          <Text style={{ fontSize: 8.6, fontWeight: "bold", color: "#0D1B2A", marginBottom: 6 }}>HIRING LOGISTICS SNAPSHOT</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
            {readinessSnapshot.length ? readinessSnapshot.slice(0, 9).map(([label, value], i) => (
              <View key={`ready-snapshot-${i}`} style={{ width: "31.8%", padding: "4 6", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}>
                <Text style={{ fontSize: 5.9, color: "#6B7280", fontWeight: "bold", marginBottom: 1.5, textTransform: "uppercase" }}>{label}</Text>
                <Text style={{ fontSize: 7.4, color: "#111827", fontWeight: "bold", lineHeight: 1.2 }}>{String(value)}</Text>
              </View>
            )) : (
              <Text style={{ fontSize: 8, color: "#6B7280", lineHeight: 1.4 }}>No work preference or readiness details were provided.</Text>
            )}
          </View>
        </View>

        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 6, padding: "8 10", borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 8 }}>
          <Text style={{ fontSize: 8.6, fontWeight: "bold", color: "#0D1B2A", marginBottom: 4 }}>RECRUITER READINESS SIGNALS</Text>
          <Text style={{ fontSize: 7.2, color: "#6B7280", lineHeight: 1.3, marginBottom: 3 }}>
            Operational signals below are shown for recruiter workflow, not candidate skill ranking.
          </Text>

          <ReadinessSignalSummary signal={readinessByKey.get("availability")} title="Work Structure & Scheduling" accent="#FF7043" />
          <ReadinessSignalSummary signal={readinessByKey.get("language")} title="Communication Context" accent="#0D1B2A" />
          <ReadinessSignalSummary signal={readinessByKey.get("visibility")} title="Portfolio Access & Verification" accent="#16A34A" />
        </View>

        <InterviewPathBlock whyInterview={whyInterview} />

      </Page>

      <Page size="LETTER" style={aiStyles.page}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: "#FF7043" }}>
          <Text style={{ fontSize: 14, fontWeight: "bold", color: "#0D1B2A" }}>Candidate Narrative & Supporting Evidence</Text>
          <Text style={{ fontSize: 9, color: "#9CA3AF" }}>{candidateName} • ForgeTomorrow</Text>
        </View>

        {profile?.aboutMe ? (
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: "#0D1B2A", marginBottom: 4, letterSpacing: 0.5 }}>
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
                  <View key={`edu-${i}`} style={{ marginBottom: 4 }}>
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
              <View key={`project-${i}`} style={{ backgroundColor: "#F9FAFB", borderRadius: 4, padding: "10 12", marginBottom: 4, borderLeftWidth: 3, borderLeftColor: "#FF7043" }}>
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


        <View style={{ borderTopWidth: 1, borderTopColor: "#E5E7EB", paddingTop: 8, marginTop: 16 }}>
          <Text style={{ fontSize: 8, color: "#9CA3AF", lineHeight: 1.5 }}>
            ForgeTomorrow Candidate Alignment Reviews are for recruiter decision support only. AI-assisted signal analysis reflects available portfolio data at export time. Self-identification answers excluded.
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
      zip.file(`05_CoverLetter_${base}.pdf`, coverBuf);
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
		hasResume: Boolean(app.resume?.id),
        primaryResume: app.resume?.id ? { id: app.resume.id } : null,
        additionalQuestions: additionalAnswers,
      };

      // Run unified WHY-backed profile signal explanation.
      // profileSignalShared extracts structure; WHY converts it into evidence-first presentation data.
      const profileExplain = buildProfileExplain(profile, app.job);
      const profileSignals = Array.isArray(profileExplain?.signals) ? profileExplain.signals : classifySignals(profile, app.job);
      const profileVerdict = profileExplain?.verdict || overallVerdict(profileSignals);
      const realProfileSignalScore = profileExplain?.score ?? signalScoreToPercent(profileVerdict);

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
          profileExplain={profileExplain}
        />
      );

      const intelligenceBuf = await pdf(intelligenceDoc).toBuffer();
      zip.file(`01_FT_Candidate_Alignment_Review_${base}.pdf`, intelligenceBuf);
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