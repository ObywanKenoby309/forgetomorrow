// pages/api/recruiter/candidates/[id]/review-packet.js
// Exports the full recruiter CandidateProfileModal readout as a controlled PDF packet.
// GET  = downloads the packet directly.
// POST = renders the same packet, stores it in Supabase Storage, and shares it into a Foundry room.

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
    padding: 34,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111827",
    lineHeight: 1.35,
  },
  header: {
    backgroundColor: "#111827",
    color: "#ffffff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 14,
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 1.3,
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
    fontSize: 10,
  },
  section: {
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 7,
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
    marginBottom: 6,
    backgroundColor: "#F9FAFB",
  },
  metricLabel: {
    color: "#6B7280",
    fontSize: 7,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
    fontWeight: 700,
  },
  metricValue: {
    fontSize: 11,
    fontWeight: 700,
    color: "#111827",
  },
  muted: {
    color: "#4B5563",
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
  bullet: {
    marginBottom: 3,
  },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 34,
    right: 34,
    borderTop: "1px solid #E5E7EB",
    paddingTop: 8,
    fontSize: 8,
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

const PillList = ({ items = [], max = 16 }) => {
  const arr = asArray(items).slice(0, max);
  if (!arr.length) return <Text style={styles.muted}>Not listed.</Text>;
  return (
    <View style={styles.pillWrap}>
      {arr.map((item, index) => (
        <Text key={`${String(item).slice(0, 16)}-${index}`} style={styles.pill}>
          {String(item)}
        </Text>
      ))}
    </View>
  );
};


function formatCertItem(cert) {
  if (!cert) return "";
  if (typeof cert === "string") return cert;
  if (typeof cert === "number" || typeof cert === "boolean") return String(cert);

  if (typeof cert === "object") {
    const name =
      cert.name ||
      cert.title ||
      cert.certification ||
      cert.credential ||
      cert.label ||
      "";
    const issuer =
      cert.issuer ||
      cert.provider ||
      cert.organization ||
      cert.authority ||
      "";
    const date =
      cert.date ||
      cert.year ||
      cert.issuedAt ||
      cert.issueDate ||
      cert.completedAt ||
      "";

    return [name, issuer, date].filter(Boolean).join(" — ");
  }

  return String(cert || "");
}

function formatGenericItem(item) {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (typeof item === "number" || typeof item === "boolean") return String(item);
  if (typeof item === "object") {
    return (
      item.title ||
      item.name ||
      item.label ||
      item.summary ||
      item.description ||
      item.projectName ||
      JSON.stringify(item)
    );
  }
  return String(item || "");
}

function capabilityClustersForPacket(skills = []) {
  const list = asArray(skills).map((s) => String(s || "").trim()).filter(Boolean);
  const lower = (s) => s.toLowerCase();

  const clusters = [
    {
      label: "Support Operations",
      match: (s) => /service|support|itil|ticket|knowledge|documentation|sme|troubleshoot|customer/i.test(s),
    },
    {
      label: "Endpoint & Device Operations",
      match: (s) => /sccm|intune|jamf|imaging|workstation|desktop|endpoint|mac os|windows|ubuntu|linux/i.test(s),
    },
    {
      label: "Identity & Access",
      match: (s) => /active directory|entra|okta|access|identity|azure ad|global protect|vpn/i.test(s),
    },
    {
      label: "Network & Infrastructure",
      match: (s) => /cisco|meraki|router|switch|firewall|network|global protect/i.test(s),
    },
    {
      label: "Security / Analysis",
      match: (s) => /kali|security|analytics|bi|data|research|compliance|usability/i.test(s),
    },
  ];

  const assigned = clusters
    .map((cluster) => ({
      label: cluster.label,
      items: list.filter((s) => cluster.match(s)).slice(0, 8),
    }))
    .filter((cluster) => cluster.items.length);

  const assignedItems = new Set(assigned.flatMap((c) => c.items.map((i) => lower(i))));
  const remaining = list.filter((s) => !assignedItems.has(lower(s))).slice(0, 14);

  if (remaining.length) assigned.push({ label: "Additional Signals", items: remaining });

  return assigned.slice(0, 6);
}

const PacketMetric = ({ label, value }) => (
  <View
    style={{
      flex: 1,
      minHeight: 48,
      border: "1px solid #E5E7EB",
      borderRadius: 9,
      padding: 8,
      backgroundColor: "#F9FAFB",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
    }}
  >
    <Text style={{ color: "#6B7280", fontSize: 7, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3, fontWeight: 700 }}>
      {label}
    </Text>
    <Text style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{value || "—"}</Text>
  </View>
);

const PortfolioMetric = ({ label, value }) => (
  <View
    style={{
      flex: 1,
      minHeight: 54,
      border: "1px solid #D1D5DB",
      borderRadius: 10,
      padding: 8,
      backgroundColor: "#FFFFFF",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
    }}
  >
    <Text style={{ color: "#6B7280", fontSize: 7, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 4, fontWeight: 700 }}>
      {label}
    </Text>
    <Text style={{ fontSize: 16, fontWeight: 700, color: "#FF7043" }}>{value || "—"}</Text>
  </View>
);

const SignalCard = ({ signal }) => {
  if (!signal) return null;

  const status =
    signal.status === "direct"
      ? "Proven"
      : signal.status === "adjacent"
      ? "Validate"
      : "Review";

  const evidence = asArray(signal.evidenceDetected || signal.evidence || signal.proof || []).slice(0, 4);

  return (
    <View style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 10, marginBottom: 8, backgroundColor: "#FFFFFF" }} wrap={false}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, fontWeight: 700, color: "#111827" }}>
            {String(signal.label || signal.key || "Signal").replace(" Signal", "")}
          </Text>
          <Text style={{ marginTop: 3, fontSize: 8.5, color: "#4B5563" }}>
            {signal.recruiterInterpretation || signal.interpretation || signal.summary || "Recruiter-visible signal available for review."}
          </Text>
        </View>
        <View style={{ border: "1px solid #E5E7EB", borderRadius: 999, paddingVertical: 3, paddingHorizontal: 7, alignSelf: "flex-start" }}>
          <Text style={{ fontSize: 7, fontWeight: 700, textTransform: "uppercase", color: "#111827" }}>{status}</Text>
        </View>
      </View>

      {evidence.length ? (
        <View style={{ marginTop: 7, backgroundColor: "#F9FAFB", borderRadius: 8, padding: 7 }}>
          <Text style={{ fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: "#6B7280", marginBottom: 3 }}>
            Evidence
          </Text>
          <List items={evidence} max={4} />
        </View>
      ) : null}
    </View>
  );
};

const ClusterList = ({ clusters = [] }) => {
  if (!clusters.length) return <Text style={styles.muted}>No capability clusters available yet.</Text>;

  return (
    <View>
      {clusters.map((cluster, index) => (
        <View key={`${cluster.label}-${index}`} style={{ border: "1px solid #E5E7EB", borderRadius: 9, padding: 8, backgroundColor: "#F9FAFB", marginBottom: 7 }}>
          <Text style={{ fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, color: "#6B7280", marginBottom: 5 }}>
            {cluster.label}
          </Text>
          <PillList items={cluster.items} max={10} />
        </View>
      ))}
    </View>
  );
};

function CandidateReviewPacketPDF({ packet }) {
  const { candidate, intelligence } = packet;
  const signals = asArray(intelligence.signals);
  const proven = signals.filter((s) => s.status === "direct");
  const validation = signals.filter((s) => s.status === "adjacent");
  const review = signals.filter((s) => s.status === "missing");
  const score = typeof intelligence.score === "number" ? `${intelligence.score}%` : "Review";

  const headline =
    typeof intelligence.score === "number" && intelligence.score >= 75
      ? "Strong recruiter-visible portfolio signal."
      : typeof intelligence.score === "number" && intelligence.score >= 50
      ? "Usable portfolio signal with validation areas."
      : "Portfolio signal requires deeper recruiter review.";

  const validationAreas = [...validation, ...review];
  const clusters = capabilityClustersForPacket(candidate.skills);
  const certifications = asArray(candidate.certifications).map(formatCertItem).filter(Boolean);
  const languages = asArray(candidate.languages).map(formatGenericItem).filter(Boolean);
  const projects = asArray(candidate.projects);
  const recruiterSkills = asArray(candidate.recruiterSkills).length ? asArray(candidate.recruiterSkills) : asArray(candidate.skills);

  return (
    <Document title={`${candidate.name || "Candidate"} Review Packet`}>
      {/* Narrative / decision context */}
      <Page size="LETTER" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>ForgeTomorrow Candidate Review Packet</Text>
          <Text style={styles.title}>{candidate.name || "Candidate"}</Text>
          <Text style={styles.subtitle}>
            {formatMaybe(candidate.headline, "Candidate")} • {formatMaybe(candidate.location)} • Portfolio: {formatMaybe(candidate.profileVisibility)}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
          <PacketMetric label="Professional Signal" value={score} />
          <PacketMetric label="Execution Visibility" value={projects.length ? "Strong" : intelligence.roleSignals?.length ? "Moderate" : "Limited"} />
          <PacketMetric label="Validation Risk" value={review.length || validation.length ? "Review" : "Low"} />
          <PacketMetric label="Resume Access" value={candidate.resumeId ? "Available" : "Missing"} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Positioning & Recruiter Summary</Text>
          <Text>{formatMaybe(candidate.summary, "No professional summary provided. Review primary resume and recruiter-entered signals for additional context.")}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.eyebrow}>Portfolio Intelligence</Text>
          <Text style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{headline}</Text>
          <Text style={{ fontSize: 9, color: "#4B5563", marginBottom: 10 }}>
            Recruiter-facing interpretation from ForgeTomorrow&apos;s shared portfolio signal engine.
          </Text>

          <View style={{ flexDirection: "row", gap: 8, justifyContent: "center", alignItems: "center" }}>
            <PortfolioMetric label="Signal Confidence" value={score} />
            <PortfolioMetric label="Proven" value={String(proven.length)} />
            <PortfolioMetric label="Validate" value={String(validation.length)} />
            <PortfolioMetric label="Review" value={String(review.length)} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recruiter Interpretation & Interview Focus</Text>
          <Text style={{ marginBottom: 6 }}>
            {formatMaybe(intelligence.inference?.overallConclusion, "Review the candidate profile, resume evidence, and validation areas before advancing.")}
          </Text>
          <List items={intelligence.inference?.validationFocus || []} max={5} />
        </View>

        <View style={styles.row}>
          <View style={[styles.section, styles.col]}>
            <Text style={styles.sectionTitle}>Demonstrated / Proven Signals</Text>
            <List items={proven.map((s) => s.label || s.key)} max={10} />
          </View>
          <View style={[styles.section, styles.col]}>
            <Text style={styles.sectionTitle}>Recruiter Validation Areas</Text>
            {validationAreas.length ? (
              validationAreas.slice(0, 6).map((sig, index) => (
                <View key={`${sig.key || sig.label}-${index}`} style={{ marginBottom: 6 }}>
                  <Text style={{ fontWeight: 700 }}>{String(sig.label || sig.key || "Validation Area").replace(" Signal", "")}</Text>
                  <Text style={styles.small}>
                    {sig.key === "portfolio"
                      ? "Ask for one concrete project, work sample, implementation example, or measurable outcome."
                      : sig.missingValidation?.[0] || sig.recruiterInterpretation || "Validate during recruiter review."}
                  </Text>
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

      {/* Proof / evidence context */}
      <Page size="LETTER" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Candidate Review Packet Continued</Text>
          <Text style={styles.title}>Evidence, Capability & Readiness</Text>
          <Text style={styles.subtitle}>{candidate.name || "Candidate"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Portfolio Review Cards</Text>
          {signals.length ? (
            signals.map((signal, index) => (
              <SignalCard key={`${signal.key || signal.label || "signal"}-${index}`} signal={signal} />
            ))
          ) : (
            <Text style={styles.muted}>No portfolio review signals available.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Capability Clusters</Text>
          <ClusterList clusters={clusters} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Capability & Execution Signals</Text>
          <PillList items={candidate.skills} max={24} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Execution Proof / {projects.length ? "Project Evidence" : "Limited Project Evidence"}</Text>
          {projects.length ? (
            projects.slice(0, 6).map((project, index) => {
              const title = typeof project === "string" ? project : project?.title || project?.name || project?.projectName || `Project ${index + 1}`;
              const desc = typeof project === "string" ? "" : project?.description || project?.summary || project?.details || "";
              return (
                <View key={`${title}-${index}`} style={{ marginBottom: 7 }}>
                  <Text style={{ fontWeight: 700 }}>{title}</Text>
                  {desc ? <Text style={styles.small}>{desc}</Text> : null}
                </View>
              );
            })
          ) : (
            <Text style={styles.muted}>
              No structured project entries are listed yet. Resume history and operational experience currently carry execution proof; validate project ownership, outcomes, and measurable impact during recruiter review.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Career Path & Operational Signals</Text>
          {candidate.experience.length ? (
            candidate.experience.slice(0, 5).map((exp, index) => (
              <View key={`${exp.title}-${index}`} style={{ marginBottom: 8 }} wrap={false}>
                <Text style={{ fontWeight: 700 }}>
                  {formatMaybe(exp.title, "Role")} — {formatMaybe(exp.company, "Company")}
                </Text>
                <Text style={styles.small}>{formatMaybe(exp.range, "Dates not listed")}</Text>
                <PillList items={roleSignals(exp)} max={5} />
                <List items={exp.highlights} max={4} />
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
            {candidate.education.length ? (
              candidate.education.slice(0, 5).map((edu, index) => (
                <Text key={`${edu.school}-${index}`} style={styles.bullet}>
                  • {[edu.degree, edu.field].filter(Boolean).join(" in ") || "Degree"}{edu.school ? ` — ${edu.school}` : ""}
                </Text>
              ))
            ) : (
              <Text style={styles.muted}>No education listed.</Text>
            )}

            <Text style={[styles.eyebrow, { marginTop: 8 }]}>Certifications</Text>
            <List items={certifications} max={6} />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.section, styles.col]}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <PillList items={languages} max={10} />
          </View>
          <View style={[styles.section, styles.col]}>
            <Text style={styles.sectionTitle}>Engagement / Journey</Text>
            <Text style={styles.muted}>
              No journey replay data is included in this export yet. This section will populate from job views, applications, and message activity when available.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recruiter Utilities Snapshot</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.eyebrow}>Recruiter Skills</Text>
              <PillList items={recruiterSkills} max={24} />
            </View>
            <View style={styles.col}>
              <Text style={styles.eyebrow}>Tags</Text>
              <Text>{candidate.tags.length ? candidate.tags.join(", ") : "Not listed."}</Text>
              <Text style={[styles.eyebrow, { marginTop: 8 }]}>Private Team Notes</Text>
              <Text>{formatMaybe(candidate.notes, "No recruiter notes saved.")}</Text>
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


