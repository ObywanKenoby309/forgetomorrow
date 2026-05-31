// pages/api/recruiter/candidates/[id]/review-packet.js
// Exports the full recruiter CandidateProfileModal readout as a controlled PDF packet.
// GET  = downloads the packet directly to the local computer.
// POST action="vault" = saves/updates the ForgeVault snapshot record.
// POST with roomId = renders the same packet, stores it in Supabase Storage, and shares it into a Foundry room.

import React from "react";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import { uploadFile } from "@/lib/storage";
import {
  classifySignals,
  overallVerdict,
  signalScoreToPercent,
} from "@/lib/intelligence/profileSignalShared";
import { inferCandidateOperationalProfile } from "@/lib/intelligence/operationalInference";

function readCookie(req, name) {
  try {
    const raw = req.headers?.cookie || "";
    const parts = raw.split(";").map((p) => p.trim());
    for (const p of parts) {
      if (p.startsWith(name + "=")) return decodeURIComponent(p.slice(name.length + 1));
    }
    return "";
  } catch {
    return "";
  }
}

async function resolveEffectiveRecruiter(prismaClient, req, session) {
  const sessionEmail = String(session?.user?.email || "").trim().toLowerCase();
  if (!sessionEmail) return null;

  const isPlatformAdmin = !!session?.user?.isPlatformAdmin;
  let effectiveUserId = null;

  if (isPlatformAdmin) {
    const imp = readCookie(req, "ft_imp");
    if (imp) {
      try {
        const decoded = jwt.verify(
          imp,
          process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production"
        );
        if (decoded && typeof decoded === "object" && decoded.targetUserId) {
          effectiveUserId = String(decoded.targetUserId);
        }
      } catch {
        // ignore invalid/expired cookie
      }
    }
  }

  if (effectiveUserId) {
    const u = await prismaClient.user.findUnique({
      where: { id: effectiveUserId },
      select: { id: true, email: true, name: true, accountKey: true },
    });
    return u?.id ? u : null;
  }

  const u = await prismaClient.user.findUnique({
    where: { email: sessionEmail },
    select: { id: true, email: true, name: true, accountKey: true },
  });
  return u?.id ? u : null;
}

function safeJsonParse(value) {
  try {
    if (!value) return null;
    if (typeof value === "object") return value;
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function toArrayJson(v) {
  if (Array.isArray(v)) return v.map((x) => String(x || "").trim()).filter(Boolean);
  const parsed = safeJsonParse(v);
  if (Array.isArray(parsed)) return parsed.map((x) => String(x || "").trim()).filter(Boolean);
  return [];
}

function toStringArray(v) {
  if (Array.isArray(v)) return v.map((x) => String(x || "").trim()).filter(Boolean);
  return [];
}

function dedupeCaseInsensitive(arr) {
  const out = [];
  const seen = new Set();
  for (const raw of Array.isArray(arr) ? arr : []) {
    const t = String(raw || "").trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

function getWorkPreferencesObject(v) {
  if (v && typeof v === "object" && !Array.isArray(v)) return v;
  return {};
}

function getPreferredLocationsFromWorkPreferences(workPreferences) {
  const prefs = getWorkPreferencesObject(workPreferences);
  const raw =
    prefs.preferredLocations ??
    prefs.locations ??
    prefs.locationPreferences ??
    prefs.preferredLocation ??
    prefs.location ??
    [];

  if (Array.isArray(raw)) {
    return dedupeCaseInsensitive(
      raw.map((x) => {
        if (typeof x === "string") return x;
        if (x && typeof x === "object") return x.label || x.name || x.value || x.location || "";
        return "";
      })
    );
  }

  if (typeof raw === "string") {
    return dedupeCaseInsensitive(raw.split(",").map((s) => s.trim()).filter(Boolean));
  }

  return [];
}

function getWorkStatusFromWorkPreferences(workPreferences) {
  const prefs = getWorkPreferencesObject(workPreferences);
  return prefs.workStatus || prefs.currentWorkStatus || prefs.status || "";
}

function getPreferredWorkTypeFromWorkPreferences(workPreferences) {
  const prefs = getWorkPreferencesObject(workPreferences);
  return prefs.preferredWorkType || prefs.workType || prefs.employmentType || "";
}

function getRelocateFromWorkPreferences(workPreferences) {
  const prefs = getWorkPreferencesObject(workPreferences);
  return prefs.willingToRelocate ?? prefs.relocate ?? prefs.relocation ?? "";
}

function toEducationObjects(v) {
  if (Array.isArray(v)) {
    return v
      .map((x) => {
        if (!x || typeof x !== "object") return null;
        return {
          school: x.school ? String(x.school) : "",
          degree: x.degree ? String(x.degree) : "",
          field: x.field ? String(x.field) : "",
          startYear: x.startYear ? String(x.startYear) : "",
          endYear: x.endYear ? String(x.endYear) : "",
        };
      })
      .filter(Boolean);
  }

  if (typeof v === "string") {
    const parsed = safeJsonParse(v);
    if (Array.isArray(parsed)) return toEducationObjects(parsed);
  }

  return [];
}

function extractRootFromResumeContent(contentStr) {
  const parsed = typeof contentStr === "string" ? safeJsonParse(contentStr) : null;
  if (!parsed || typeof parsed !== "object") return null;
  return parsed?.data && typeof parsed.data === "object" ? parsed.data : parsed;
}

function extractExperienceFromResumeContent(contentStr) {
  const root = extractRootFromResumeContent(contentStr);
  if (!root || typeof root !== "object") return [];

  const list =
    (Array.isArray(root.workExperiences) && root.workExperiences) ||
    (Array.isArray(root.experiences) && root.experiences) ||
    (Array.isArray(root.experience) && root.experience) ||
    [];

  if (!Array.isArray(list)) return [];

  return list
    .map((exp) => {
      const title = exp?.title || exp?.jobTitle || exp?.role || "";
      const company = exp?.company || "";
      const start = exp?.startDate || exp?.start || "";
      const end = exp?.endDate || exp?.end || "";
      const range = [start, end].filter(Boolean).join(" - ") || exp?.range || "";
      const highlightsRaw = exp?.highlights || exp?.bullets || exp?.description || exp?.details || [];

      let highlights = [];
      if (Array.isArray(highlightsRaw)) {
        highlights = highlightsRaw.map((x) => String(x || "").trim()).filter(Boolean);
      } else if (typeof highlightsRaw === "string") {
        highlights = highlightsRaw.split(/\r?\n/g).map((x) => String(x || "").trim()).filter(Boolean);
      }

      return {
        title: String(title || "").trim(),
        company: String(company || "").trim(),
        range: String(range || "").trim(),
        highlights,
      };
    })
    .filter((e) => e.title || e.company || e.range || e.highlights.length);
}

function extractSkillsFromResumeContent(contentStr) {
  const root = extractRootFromResumeContent(contentStr);
  if (!root || typeof root !== "object") return [];
  const skills = Array.isArray(root.skills) ? root.skills : [];
  return dedupeCaseInsensitive(skills.map((s) => String(s || "").trim()).filter(Boolean));
}

function asArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return [];
}

function textOf(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(textOf).join(" ");
  if (typeof value === "object") return Object.values(value).map(textOf).join(" ");
  return String(value || "");
}

function roleSignals(exp = {}) {
  const text = textOf(exp).toLowerCase();
  const signals = [];
  if (/support|desktop|help desk|service desk|user|troubleshoot|incident|ticket/.test(text)) signals.push("Support delivery");
  if (/active directory|okta|access|password|identity|entra/.test(text)) signals.push("Identity/access support");
  if (/intune|sccm|imaging|endpoint|workstation|device/.test(text)) signals.push("Endpoint operations");
  if (/knowledge|sop|documentation|training|sme|process/.test(text)) signals.push("Knowledge/process ownership");
  if (/customer|client|stakeholder|communication|non-technical/.test(text)) signals.push("Client-facing communication");
  if (/metric|reduced|improved|increased|saved|delivered|implemented|managed|led/.test(text)) signals.push("Outcome evidence");
  return Array.from(new Set(signals)).slice(0, 6);
}

function formatMaybe(value, fallback = "Not listed") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function formatBoolish(value) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return formatMaybe(value);
}

function safeFileBaseName(value) {
  return String(value || "candidate-review-packet")
    .trim()
    .replace(/[^a-z0-9_\-]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 70) || "candidate-review-packet";
}

function relativeTime(date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function normalizeFile(file) {
  return {
    id: file.id,
    name: file.fileName,
    downloadUrl: `/api/files/download?fileId=${file.id}`,
    hasFile: !!file.fileUrl,
    sharedBy: file.sharedByName || "Unknown",
    ago: relativeTime(file.sharedAt),
    source: file.source || "FORGE",
  };
}

async function loadCandidatePacketData({ req, session, candidateId }) {
  const recruiter = await resolveEffectiveRecruiter(prisma, req, session);
  if (!recruiter?.id) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  if (!recruiter.accountKey) {
    const err = new Error("accountKey not found");
    err.statusCode = 404;
    throw err;
  }

  const user = await prisma.user.findFirst({
    where: {
      id: candidateId,
      deletedAt: null,
      OR: [
        { profileVisibility: { in: ["PUBLIC", "RECRUITERS_ONLY"] } },
        {
          AND: [{ isProfilePublic: true }, { profileVisibility: { not: "PRIVATE" } }],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      headline: true,
      aboutMe: true,
      location: true,
      workPreferences: true,
      skillsJson: true,
      languagesJson: true,
      educationJson: true,
      certificationsJson: true,
      projectsJson: true,
      createdAt: true,
      slug: true,
      profileVisibility: true,
      isProfilePublic: true,
    },
  });

  if (!user) {
    const err = new Error("Candidate not found");
    err.statusCode = 404;
    throw err;
  }

  const [meta, resumes] = await Promise.all([
    prisma.recruiterCandidate.findFirst({
      where: {
        recruiterUserId: recruiter.id,
        accountKey: recruiter.accountKey,
        candidateUserId: candidateId,
      },
      select: {
        tags: true,
        skills: true,
        notes: true,
        pipelineStage: true,
        lastContacted: true,
        lastSeen: true,
      },
    }),
    prisma.resume.findMany({
      where: { userId: candidateId },
      select: { id: true, userId: true, content: true, updatedAt: true, isPrimary: true, name: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  let bestResume = null;
  for (const r of resumes) {
    if (!bestResume) {
      bestResume = r;
      continue;
    }
    if (!bestResume.isPrimary && r.isPrimary) {
      bestResume = r;
      continue;
    }
    const a = bestResume?.updatedAt ? new Date(bestResume.updatedAt).getTime() : 0;
    const b = r?.updatedAt ? new Date(r.updatedAt).getTime() : 0;
    if (b > a) bestResume = r;
  }

  const profileSkillsArr = dedupeCaseInsensitive(toArrayJson(user.skillsJson));
  const resumeSkillsArr = bestResume?.content ? extractSkillsFromResumeContent(bestResume.content) : [];
  const baselineSkillsArr = profileSkillsArr.length > 0 ? profileSkillsArr : resumeSkillsArr;
  const recruiterSkillsArr = meta?.skills ? toStringArray(meta.skills) : [];
  const effectiveSkillsArr = recruiterSkillsArr.length > 0 ? recruiterSkillsArr : baselineSkillsArr;

  const workPreferencesObj = getWorkPreferencesObject(user.workPreferences);
  const preferredLocations = getPreferredLocationsFromWorkPreferences(workPreferencesObj);
  const experience = bestResume?.content ? extractExperienceFromResumeContent(bestResume.content) : [];
  const education = toEducationObjects(user.educationJson);
  const languages = toArrayJson(user.languagesJson);
  const certifications = toArrayJson(user.certificationsJson);
  const projects = toArrayJson(user.projectsJson);

  const signalProfileData = {
    headline: user.headline || "",
    aboutMe: user.aboutMe || "",
    skills: effectiveSkillsArr,
    languages,
    education,
    certifications,
    projects,
    workPreferences: {
      ...workPreferencesObj,
      workStatus: getWorkStatusFromWorkPreferences(workPreferencesObj),
      workType: getPreferredWorkTypeFromWorkPreferences(workPreferencesObj),
      willingToRelocate: getRelocateFromWorkPreferences(workPreferencesObj),
      locations: preferredLocations,
    },
    profileVisibility: user.profileVisibility || (user.isProfilePublic ? "PUBLIC" : ""),
    location: user.location || "",
    primaryResume: bestResume || null,
    hasResume: Boolean(bestResume?.id),
  };

  const signals = classifySignals(signalProfileData || {}, null);
  const verdict = overallVerdict(signals);
  const score = signalScoreToPercent(verdict);
  const inference = inferCandidateOperationalProfile({
    experience,
    skills: effectiveSkillsArr,
    projects,
    hasResume: Boolean(bestResume?.id),
  });

  return {
    recruiter,
    candidate: {
      id: user.id,
      userId: user.id,
      name: user.name || "Unnamed",
      email: user.email || null,
      title: user.headline || "",
      currentTitle: user.headline || "",
      role: user.headline || "",
      summary: user.aboutMe || "",
      headline: user.headline || "",
      about: user.aboutMe || "",
      location: user.location || "",
      slug: user.slug || "",
      profileVisibility: user.profileVisibility || "",
      workPreferences: workPreferencesObj,
      preferredLocations,
      workStatus: getWorkStatusFromWorkPreferences(workPreferencesObj),
      preferredWorkType: getPreferredWorkTypeFromWorkPreferences(workPreferencesObj),
      willingToRelocate: getRelocateFromWorkPreferences(workPreferencesObj),
      skills: effectiveSkillsArr,
      recruiterSkills: recruiterSkillsArr,
      skillsBaseline: baselineSkillsArr,
      skillsProfile: profileSkillsArr,
      skillsResume: resumeSkillsArr,
      education,
      languages,
      certifications,
      projects,
      experience,
      tags: meta?.tags ? toStringArray(meta.tags) : [],
      notes: typeof meta?.notes === "string" ? meta.notes : "",
      pipelineStage: meta?.pipelineStage || null,
      lastContacted: meta?.lastContacted || null,
      lastSeen: meta?.lastSeen || null,
      resumeId: bestResume?.id || null,
      resumeName: bestResume?.name || "Primary resume",
      match: typeof score === "number" ? score : null,
    },
    intelligence: {
      score,
      signals,
      inference,
      roleSignals: Array.from(new Set(experience.flatMap((exp) => roleSignals(exp)))).slice(0, 8),
    },
  };
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: "#111827",
    lineHeight: 1.35,
  },
  header: {
    backgroundColor: "#111827",
    color: "#ffffff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 1.25,
    color: "#FF7043",
    textTransform: "uppercase",
    marginBottom: 4,
    fontWeight: 700,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    color: "#D1D5DB",
    fontSize: 9,
  },
  section: {
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    padding: 10,
    marginBottom: 9,
  },
  darkSection: {
    backgroundColor: "#111827",
    color: "#ffffff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 9,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 7,
  },
  darkSectionTitle: {
    fontSize: 11.5,
    fontWeight: 700,
    color: "#ffffff",
    marginBottom: 7,
  },
  microLabel: {
    color: "#6B7280",
    fontSize: 7,
    textTransform: "uppercase",
    letterSpacing: 0.55,
    marginBottom: 2,
    fontWeight: 700,
  },
  orangeMicroLabel: {
    color: "#FF7043",
    fontSize: 7,
    textTransform: "uppercase",
    letterSpacing: 0.75,
    marginBottom: 2,
    fontWeight: 700,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  col: {
    flex: 1,
  },
  metric: {
    border: "1px solid #E5E7EB",
    borderRadius: 8,
    padding: 8,
    marginBottom: 7,
    backgroundColor: "#F9FAFB",
  },
  darkMetric: {
    border: "1px solid #374151",
    borderRadius: 8,
    padding: 8,
    backgroundColor: "#1F2937",
  },
  metricValue: {
    fontSize: 11,
    fontWeight: 700,
    color: "#111827",
  },
  darkMetricValue: {
    fontSize: 12,
    fontWeight: 700,
    color: "#ffffff",
  },
  muted: {
    color: "#4B5563",
  },
  darkMuted: {
    color: "#D1D5DB",
  },
  small: {
    fontSize: 8,
    color: "#6B7280",
  },
  pillWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  pill: {
    border: "1px solid #E5E7EB",
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 7,
    backgroundColor: "#F9FAFB",
    fontSize: 8,
    marginRight: 4,
    marginBottom: 4,
  },
  goodPill: {
    border: "1px solid #A7F3D0",
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 7,
    backgroundColor: "#ECFDF5",
    color: "#065F46",
    fontSize: 8,
    marginRight: 4,
    marginBottom: 4,
  },
  warnPill: {
    border: "1px solid #FDE68A",
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 7,
    backgroundColor: "#FFFBEB",
    color: "#92400E",
    fontSize: 8,
    marginRight: 4,
    marginBottom: 4,
  },
  riskPill: {
    border: "1px solid #FECACA",
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 7,
    backgroundColor: "#FEF2F2",
    color: "#991B1B",
    fontSize: 8,
    marginRight: 4,
    marginBottom: 4,
  },
  card: {
    border: "1px solid #E5E7EB",
    borderRadius: 9,
    padding: 8,
    marginBottom: 7,
    backgroundColor: "#FFFFFF",
  },
  softCard: {
    border: "1px solid #E5E7EB",
    borderRadius: 9,
    padding: 8,
    marginBottom: 7,
    backgroundColor: "#F9FAFB",
  },
  bullet: {
    marginBottom: 3,
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 30,
    right: 30,
    borderTop: "1px solid #E5E7EB",
    paddingTop: 7,
    fontSize: 7.5,
    color: "#6B7280",
  },
});

const List = ({ items = [], max = 8 }) => {
  const arr = asArray(items).slice(0, max);
  if (!arr.length) return <Text style={styles.muted}>Not listed.</Text>;
  return (
    <View>
      {arr.map((item, index) => (
        <Text key={`${String(item).slice(0, 16)}-${index}`} style={styles.bullet}>
          • {String(item)}
        </Text>
      ))}
    </View>
  );
};

const PillList = ({ items = [], max = 16, tone = "neutral" }) => {
  const arr = asArray(items).slice(0, max);
  if (!arr.length) return <Text style={styles.muted}>Not listed.</Text>;
  const pillStyle = tone === "good" ? styles.goodPill : tone === "warn" ? styles.warnPill : tone === "risk" ? styles.riskPill : styles.pill;
  return (
    <View style={styles.pillWrap}>
      {arr.map((item, index) => (
        <Text key={`${String(item).slice(0, 16)}-${index}`} style={pillStyle}>
          {String(item)}
        </Text>
      ))}
    </View>
  );
};

function statusLabel(status) {
  if (status === "direct") return "Proven";
  if (status === "adjacent") return "Validation";
  return "Review";
}

function statusPillStyle(status) {
  if (status === "direct") return styles.goodPill;
  if (status === "adjacent") return styles.warnPill;
  return styles.riskPill;
}

function signalCopy(sig) {
  if (!sig) return "Review this signal during recruiter evaluation.";
  if (sig.recruiterInterpretation) return sig.recruiterInterpretation;
  if (sig.key === "portfolio" && sig.status === "missing") {
    return "Structured project proof is not yet visible. Resume history and interview examples should be used to validate execution depth.";
  }
  if (sig.key === "credentials") {
    return "Professional credibility is supported through operational execution, structured support experience, education, training, or documented execution.";
  }
  return `${sig.label || sig.key || "Signal"} is available for recruiter review.`;
}

function capabilityClusters(skills = []) {
  const list = dedupeCaseInsensitive(asArray(skills).map((s) => String(s || "").trim()).filter(Boolean));
  const lower = (s) => s.toLowerCase();
  const clusters = [
    { label: "Endpoint & Device Operations", match: (s) => /sccm|intune|jamf|imaging|workstation|desktop|endpoint|mac os|windows|ubuntu|linux/i.test(s) },
    { label: "Identity & Access", match: (s) => /active directory|entra|okta|access|identity|azure ad|global protect|vpn/i.test(s) },
    { label: "Network & Infrastructure", match: (s) => /cisco|meraki|router|switch|firewall|network|global protect/i.test(s) },
    { label: "Support Operations", match: (s) => /service|support|itil|ticket|knowledge|documentation|sme|troubleshoot|customer/i.test(s) },
    { label: "Security / Analysis", match: (s) => /kali|security|analytics|bi|data|research|compliance|user research|usability/i.test(s) },
  ];

  const assigned = clusters
    .map((cluster) => ({ label: cluster.label, items: list.filter((s) => cluster.match(s)).slice(0, 8) }))
    .filter((cluster) => cluster.items.length);

  const assignedItems = new Set(assigned.flatMap((c) => c.items.map((i) => lower(i))));
  const remaining = list.filter((s) => !assignedItems.has(lower(s))).slice(0, 10);
  if (remaining.length) assigned.push({ label: "Additional Signals", items: remaining });
  return assigned.slice(0, 6);
}

function formatEducation(edu) {
  if (!edu || typeof edu !== "object") return "Education";
  const degree = [edu.degree, edu.field].filter(Boolean).join(" in ") || "Degree";
  return `${degree}${edu.school ? ` — ${edu.school}` : ""}`;
}

function CandidateReviewPacketPDF({ packet }) {
  const { candidate, intelligence } = packet;
  const signals = asArray(intelligence.signals);
  const proven = signals.filter((s) => s.status === "direct");
  const validation = signals.filter((s) => s.status === "adjacent");
  const review = signals.filter((s) => s.status === "missing");
  const validationAreas = [...review, ...validation];
  const score = typeof intelligence.score === "number" ? `${intelligence.score}%` : "Review";
  const clusters = capabilityClusters(candidate.skills);
  const projects = asArray(candidate.projects);
  const languages = asArray(candidate.languages);
  const certifications = asArray(candidate.certifications);
  const recruiterSkills = asArray(candidate.recruiterSkills);
  const roleSignalList = asArray(intelligence.roleSignals);
  const focus = asArray(intelligence.inference?.validationFocus);

  return (
    <Document title={`${candidate.name || "Candidate"} Review Packet`}>
      <Page size="LETTER" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>ForgeTomorrow Candidate Review Packet</Text>
          <Text style={styles.title}>{candidate.name || "Candidate"}</Text>
          <Text style={styles.subtitle}>
            {formatMaybe(candidate.headline, "Candidate")} • {formatMaybe(candidate.location)} • Portfolio: {formatMaybe(candidate.profileVisibility)}
          </Text>
        </View>

        <View style={styles.row}>
          <View style={styles.metric}>
            <Text style={styles.microLabel}>Professional Signal</Text>
            <Text style={styles.metricValue}>{score}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.microLabel}>Execution Visibility</Text>
            <Text style={styles.metricValue}>{projects.length || roleSignalList.length >= 4 ? "Strong" : roleSignalList.length ? "Moderate" : "Limited"}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.microLabel}>Validation Risk</Text>
            <Text style={styles.metricValue}>{review.length || validation.length ? "Review" : "Low"}</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.microLabel}>Resume Access</Text>
            <Text style={styles.metricValue}>{candidate.resumeId ? "Available" : "Missing"}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Positioning & Recruiter Summary</Text>
          <Text>{formatMaybe(candidate.summary, "No professional summary provided. Review primary resume and recruiter-entered signals for additional context.")}</Text>
        </View>

        <View style={styles.darkSection}>
          <Text style={styles.orangeMicroLabel}>Portfolio Intelligence</Text>
          <Text style={styles.darkSectionTitle}>
            {typeof intelligence.score === "number" && intelligence.score >= 75
              ? "Strong recruiter-visible portfolio signal."
              : typeof intelligence.score === "number" && intelligence.score >= 50
              ? "Usable portfolio signal with validation areas."
              : "Portfolio signal requires deeper recruiter review."}
          </Text>
          <Text style={styles.darkMuted}>Recruiter-facing interpretation from ForgeTomorrow's shared portfolio signal engine.</Text>
          <View style={[styles.row, { marginTop: 8 }]}>
            <View style={styles.darkMetric}>
              <Text style={styles.orangeMicroLabel}>Signal Confidence</Text>
              <Text style={styles.darkMetricValue}>{score}</Text>
            </View>
            <View style={styles.darkMetric}>
              <Text style={styles.orangeMicroLabel}>Proven</Text>
              <Text style={styles.darkMetricValue}>{proven.length}</Text>
            </View>
            <View style={styles.darkMetric}>
              <Text style={styles.orangeMicroLabel}>Validate</Text>
              <Text style={styles.darkMetricValue}>{validation.length}</Text>
            </View>
            <View style={styles.darkMetric}>
              <Text style={styles.orangeMicroLabel}>Review</Text>
              <Text style={styles.darkMetricValue}>{review.length}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Portfolio Review Cards</Text>
          {signals.length ? (
            signals.slice(0, 10).map((sig, index) => (
              <View key={`${sig.key || sig.label}-${index}`} style={styles.softCard}>
                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={{ fontWeight: 700 }}>{String(sig.label || sig.key || "Signal").replace(" Signal", "")}</Text>
                    <Text style={styles.muted}>{signalCopy(sig)}</Text>
                  </View>
                  <View style={{ width: 72 }}>
                    <Text style={statusPillStyle(sig.status)}>{statusLabel(sig.status)}</Text>
                  </View>
                </View>
                {asArray(sig.evidenceDetected).length ? (
                  <View style={{ marginTop: 5 }}>
                    <Text style={styles.microLabel}>Evidence</Text>
                    <List items={sig.evidenceDetected} max={4} />
                  </View>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.muted}>No portfolio signal cards available.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recruiter Interpretation & Interview Focus</Text>
          <Text style={{ marginBottom: 6 }}>
            {formatMaybe(intelligence.inference?.overallConclusion, "Review the candidate profile, resume evidence, and validation areas before advancing.")}
          </Text>
          <List items={focus} max={6} />
        </View>

        <View style={styles.row}>
          <View style={[styles.section, styles.col]}>
            <Text style={styles.sectionTitle}>Demonstrated / Proven Signals</Text>
            <List items={proven.map((s) => s.label || s.key)} max={10} />
          </View>
          <View style={[styles.section, styles.col]}>
            <Text style={styles.sectionTitle}>Recruiter Validation Areas</Text>
            {validationAreas.length ? (
              validationAreas.slice(0, 8).map((sig, index) => (
                <View key={`${sig.key || sig.label}-validation-${index}`} style={{ marginBottom: 5 }}>
                  <Text style={{ fontWeight: 700 }}>{String(sig.label || sig.key || "Signal").replace(" Signal", "")}</Text>
                  <Text style={styles.muted}>{sig.key === "portfolio" ? "Ask for one concrete project, work sample, implementation example, or measurable outcome." : signalCopy(sig)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.muted}>No major validation concerns detected from current visible evidence.</Text>
            )}
          </View>
        </View>

        <Text style={styles.footer} fixed>
          Decision-support export only. ForgeTomorrow provides evidence-backed recruiter review context; recruiters and hiring teams control all final decisions.
        </Text>
      </Page>

      <Page size="LETTER" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Candidate Review Packet Continued</Text>
          <Text style={styles.title}>Evidence, Capability & Readiness</Text>
          <Text style={styles.subtitle}>{candidate.name || "Candidate"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Capability Clusters</Text>
          {clusters.length ? (
            clusters.map((cluster) => (
              <View key={cluster.label} style={styles.softCard}>
                <Text style={styles.microLabel}>{cluster.label}</Text>
                <PillList items={cluster.items} max={10} />
              </View>
            ))
          ) : (
            <Text style={styles.muted}>No capability clusters available yet.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Capability & Execution Signals</Text>
          <PillList items={candidate.skills} max={28} tone="good" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{projects.length ? "Execution Proof / Projects" : "Execution Proof / Limited Project Evidence"}</Text>
          {projects.length ? (
            projects.slice(0, 6).map((project, index) => {
              const title = typeof project === "string" ? project : project?.title || project?.name || project?.projectName || `Project ${index + 1}`;
              const desc = typeof project === "string" ? "" : project?.description || project?.summary || project?.details || "";
              return (
                <View key={`${title}-${index}`} style={styles.softCard}>
                  <Text style={{ fontWeight: 700 }}>{title}</Text>
                  {desc ? <Text style={styles.muted}>{desc}</Text> : null}
                </View>
              );
            })
          ) : (
            <Text style={styles.muted}>No structured project entries are listed yet. Resume history and operational experience currently carry execution proof; validate project ownership, outcomes, and measurable impact during recruiter review.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Career Path & Operational Signals</Text>
          {candidate.experience.length ? (
            candidate.experience.slice(0, 6).map((exp, index) => (
              <View key={`${exp.title}-${index}`} style={styles.card}>
                <Text style={{ fontWeight: 700 }}>
                  {formatMaybe(exp.title, "Role")} — {formatMaybe(exp.company, "Company")}
                </Text>
                <Text style={styles.small}>{formatMaybe(exp.range, "Dates not listed")}</Text>
                <PillList items={roleSignals(exp)} max={6} />
                <List items={exp.highlights} max={5} />
              </View>
            ))
          ) : (
            <Text style={styles.muted}>No experience listed. Experience is usually pulled from the candidate primary resume.</Text>
          )}
        </View>

        <View style={styles.row}>
          <View style={[styles.section, styles.col]}>
            <Text style={styles.sectionTitle}>Work Preferences</Text>
            <Text>Status: {formatMaybe(candidate.workStatus)}</Text>
            <Text>Work type: {formatMaybe(candidate.preferredWorkType)}</Text>
            <Text>Willing to relocate: {formatBoolish(candidate.willingToRelocate)}</Text>
            <Text>Preferred locations: {candidate.preferredLocations.length ? candidate.preferredLocations.join(", ") : "Not listed"}</Text>
          </View>
          <View style={[styles.section, styles.col]}>
            <Text style={styles.sectionTitle}>Education / Credentials</Text>
            {candidate.education.length ? <List items={candidate.education.map(formatEducation)} max={6} /> : <Text style={styles.muted}>No education listed.</Text>}
            {certifications.length ? (
              <View style={{ marginTop: 6 }}>
                <Text style={styles.microLabel}>Certifications</Text>
                <List items={certifications} max={6} />
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.section, styles.col]}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <PillList items={languages} max={10} />
          </View>
          <View style={[styles.section, styles.col]}>
            <Text style={styles.sectionTitle}>Engagement / Journey</Text>
            <Text style={styles.muted}>No journey replay data is included in this export yet. This section will populate from job views, applications, and message activity when available.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recruiter Utilities Snapshot</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.microLabel}>Recruiter Skills</Text>
              <PillList items={recruiterSkills.length ? recruiterSkills : candidate.skills} max={28} />
            </View>
            <View style={styles.col}>
              <Text style={styles.microLabel}>Tags</Text>
              <PillList items={candidate.tags} max={12} />
              <Text style={[styles.microLabel, { marginTop: 8 }]}>Private Team Notes</Text>
              <Text style={styles.muted}>{formatMaybe(candidate.notes, "No recruiter notes saved.")}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer} fixed>
          Decision-support export only. ForgeTomorrow provides evidence-backed recruiter review context; recruiters and hiring teams control all final decisions.
        </Text>
      </Page>
    </Document>
  );
}

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

async function renderPacketBuffer(packet) {
  const output = await pdf(<CandidateReviewPacketPDF packet={packet} />).toBuffer();

  if (Buffer.isBuffer(output)) {
    return output;
  }

  if (output instanceof Uint8Array) {
    return Buffer.from(output);
  }

  if (output && typeof output.arrayBuffer === "function") {
    return Buffer.from(await output.arrayBuffer());
  }

  if (output && typeof output.on === "function") {
    return streamToBuffer(output);
  }

  throw new Error("PDF renderer did not return a valid buffer");
}

async function saveReviewPacketRecord({ packet, packetUrl = null, fileName = null }) {
  try {
    const recruiterUserId = packet?.recruiter?.id || null;
    const candidateUserId = packet?.candidate?.id || packet?.candidate?.userId || null;

    if (!recruiterUserId) return null;

    const snapshotJson = {
      candidate: packet?.candidate || null,
      intelligence: packet?.intelligence || null,
      fileName: fileName || null,
      generatedAt: new Date().toISOString(),
    };

    const existing = candidateUserId
      ? await prisma.recruiterCandidateReviewPacket.findFirst({
          where: { recruiterUserId, candidateUserId },
          orderBy: { updatedAt: "desc" },
          select: { id: true },
        })
      : null;

    const data = {
      recruiterUserId,
      candidateUserId,
      organizationId: packet?.recruiter?.accountKey || null,
      candidateName: packet?.candidate?.name || null,
      candidateEmail: packet?.candidate?.email || null,
      candidateSlug: packet?.candidate?.slug || null,
      resumeId: packet?.candidate?.resumeId || null,
      resumeUrl:
        packet?.candidate?.resumeId && packet?.candidate?.slug
          ? `/api/resume/public-download?resumeId=${encodeURIComponent(packet.candidate.resumeId)}&slug=${encodeURIComponent(packet.candidate.slug)}`
          : null,
      title: `${packet?.candidate?.name || "Candidate"} · Candidate Review Packet`,
      packetUrl,
      format: "pdf",
      snapshotJson,
    };

    if (existing?.id) {
      return await prisma.recruiterCandidateReviewPacket.update({
        where: { id: existing.id },
        data,
      });
    }

    return await prisma.recruiterCandidateReviewPacket.create({ data });
  } catch (err) {
    console.error("[candidate-review-packet] save record failed", err);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id && !session?.user?.email) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const candidateId = String(req.query?.id || "").trim();
    if (!candidateId) return res.status(400).json({ error: "Candidate id is required" });

    const packet = await loadCandidatePacketData({ req, session, candidateId });
    const fileBase = safeFileBaseName(`${packet.candidate.name || "candidate"}_review_packet`);
    const fileName = `${fileBase}.pdf`;

    if (req.method === "GET") {
      const pdfBuffer = await renderPacketBuffer(packet);

      if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
        return res.status(500).json({ error: "Could not render candidate review packet PDF" });
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("Content-Length", String(pdfBuffer.length));
      res.setHeader("Cache-Control", "private, no-cache");
      return res.status(200).send(pdfBuffer);
    }

    const { action, roomId } = req.body || {};

    if (String(action || "").trim().toLowerCase() === "vault") {
      const saved = await saveReviewPacketRecord({ packet, packetUrl: null, fileName });
      if (!saved?.id) {
        return res.status(500).json({ error: "Could not save candidate review packet to ForgeVault" });
      }

      return res.status(200).json({
        ok: true,
        packet: {
          id: saved.id,
          title: saved.title,
          candidateName: saved.candidateName,
          candidateUserId: saved.candidateUserId,
          updatedAt: saved.updatedAt,
        },
      });
    }

    const resolvedRoomId = String(roomId || "").trim();
    if (!resolvedRoomId) return res.status(400).json({ error: "roomId required" });

    const pdfBuffer = await renderPacketBuffer(packet);

    if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
      return res.status(500).json({ error: "Could not render candidate review packet PDF" });
    }

    const room = await prisma.foundryRoom.findUnique({
      where: { roomId: resolvedRoomId },
      select: { id: true, status: true, hostId: true, coHostUserId: true },
    });

    if (!room) return res.status(404).json({ error: "Foundry not found" });
    if (room.status === "ENDED") return res.status(410).json({ error: "Session has ended" });

    const isHost = room.hostId === session.user.id;
    const isCoHost = room.coHostUserId === session.user.id;
    let isParticipant = false;

    if (!isHost && !isCoHost) {
      const participant = await prisma.foundryParticipant.findFirst({
        where: { roomId: room.id, userId: session.user.id },
        select: { id: true },
      });
      isParticipant = !!participant;
    }

    if (!isHost && !isCoHost && !isParticipant) {
      return res.status(403).json({ error: "You are not a participant in this Foundry" });
    }

    const storagePath = `${session.user.id}/foundry/${resolvedRoomId}/candidate-review-${candidateId}-${Date.now()}-${nanoid(8)}.pdf`;
    const savedPath = await uploadFile({
      buffer: pdfBuffer,
      path: storagePath,
      contentType: "application/pdf",
    });

    const sharedFile = await prisma.foundrySharedFile.create({
      data: {
        roomId: room.id,
        sharedById: session.user.id,
        sharedByName: packet.recruiter.name || packet.recruiter.email || "Recruiter",
        fileName,
        fileUrl: savedPath,
        source: "FORGE",
        sharedAt: new Date(),
      },
    });

    return res.status(200).json({ file: normalizeFile(sharedFile) });
  } catch (err) {
    const statusCode = err?.statusCode || 500;
    console.error("[api/recruiter/candidates/[id]/review-packet]", err);
    return res.status(statusCode).json({ error: err?.message || "Could not build candidate review packet" });
  }
}
