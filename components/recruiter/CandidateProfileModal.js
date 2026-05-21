// components/recruiter/CandidateProfileModal.js
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import ProfileSignalEngine from "@/components/profile/ProfileSignalEngine";

function toSafeArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return [];
    return s.split(",").map((x) => String(x || "").trim()).filter(Boolean);
  }
  if (typeof value === "number" || typeof value === "boolean") return [value];
  return [];
}

function formatWorkStatus(value) {
  const v = String(value || "").trim().toLowerCase();
  if (!v) return "";
  if (v === "unemployed" || v === "not-seeking") return "Not Seeking";
  if (v === "actively-seeking" || v === "actively seeking") return "Actively Seeking";
  if (v === "open-to-opportunities" || v === "open to opportunities") return "Open to Opportunities";
  if (v === "employed") return "Employed";
  if (v === "student") return "Student";
  if (v === "contractor") return "Contractor / Freelance";
  return String(value || "").trim();
}

function formatWorkType(value) {
  const v = String(value || "").trim().toLowerCase();
  if (!v) return "";
  if (v === "remote-only" || v === "remote") return "Remote";
  if (v === "hybrid") return "Hybrid";
  if (v === "onsite" || v === "on-site") return "On-site";
  if (v === "full-time") return "Full-time";
  if (v === "part-time") return "Part-time";
  if (v === "flexible") return "Flexible";
  return String(value || "").trim();
}

function formatRelocate(value) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const v = String(value || "").trim().toLowerCase();
  if (!v) return "";
  if (v === "yes" || v === "true" || v === "y") return "Yes";
  if (v === "no" || v === "false" || v === "n") return "No";
  if (v === "maybe" || v === "open") return "Maybe";
  return String(value || "").trim();
}

function formatDate(value) {
  if (!value) return "";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return String(value);
  }
}

function textOf(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(textOf).join(" ");
  if (typeof value === "object") return Object.values(value).map(textOf).join(" ");
  return String(value || "");
}

function truncate(text, max = 280) {
  const s = String(text || "").trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trim()}…`;
}

function inferType(action = "") {
  const a = String(action || "").toLowerCase();
  if (a.includes("view")) return "Views";
  if (a.includes("apply")) return "Applies";
  if (a.includes("message") || a.includes("email")) return "Messages";
  return "Other";
}

function capabilityClusters(skills = []) {
  const list = toSafeArray(skills).map((s) => String(s || "").trim()).filter(Boolean);
  const lower = (s) => s.toLowerCase();

  const clusters = [
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
      label: "Support Operations",
      match: (s) => /service|support|itil|ticket|knowledge|documentation|sme|troubleshoot|customer/i.test(s),
    },
    {
      label: "Security / Analysis",
      match: (s) => /kali|security|analytics|bi|data|research|compliance/i.test(s),
    },
  ];

  const assigned = clusters
    .map((cluster) => ({
      label: cluster.label,
      items: list.filter((s) => cluster.match(s)).slice(0, 6),
    }))
    .filter((cluster) => cluster.items.length);

  const assignedItems = new Set(assigned.flatMap((c) => c.items.map((i) => lower(i))));
  const remaining = list.filter((s) => !assignedItems.has(lower(s))).slice(0, 8);

  if (remaining.length) assigned.push({ label: "Additional Signals", items: remaining });

  return assigned.slice(0, 5);
}

function roleSignals(exp = {}) {
  const text = textOf(exp).toLowerCase();
  const signals = [];

  if (/support|desktop|help desk|service desk|user|troubleshoot|incident|ticket/.test(text)) {
    signals.push("Support delivery");
  }
  if (/active directory|okta|access|password|identity|entra/.test(text)) {
    signals.push("Identity/access support");
  }
  if (/intune|sccm|imaging|endpoint|workstation|device/.test(text)) {
    signals.push("Endpoint operations");
  }
  if (/knowledge|sop|documentation|training|sme|process/.test(text)) {
    signals.push("Knowledge/process ownership");
  }
  if (/customer|client|stakeholder|communication|non-technical/.test(text)) {
    signals.push("Client-facing communication");
  }
  if (/metric|reduced|improved|increased|saved|delivered|implemented|managed|led/.test(text)) {
    signals.push("Outcome evidence");
  }

  return Array.from(new Set(signals)).slice(0, 4);
}

function buildCandidateSignalProfileData(candidate, skillsLocal, languageList, educationList, hasResume) {
  const workPreferences = candidate?.workPreferences || {};

  return {
    headline:
      candidate?.headline ||
      candidate?.role ||
      candidate?.title ||
      candidate?.currentTitle ||
      "",
    aboutMe:
      candidate?.summary ||
      candidate?.aboutMe ||
      candidate?.bio ||
      candidate?.profileSummary ||
      "",
    skills: toSafeArray(skillsLocal),
    languages: toSafeArray(languageList),
    education: toSafeArray(educationList),
    certifications: toSafeArray(candidate?.certifications || candidate?.certificationsJson),
    projects: toSafeArray(candidate?.projects || candidate?.portfolioProjects || candidate?.projectHighlights),
    workPreferences: {
      ...workPreferences,
      workStatus: candidate?.workStatus || workPreferences.workStatus,
      workType: candidate?.preferredWorkType || workPreferences.workType,
      willingToRelocate: candidate?.willingToRelocate || workPreferences.willingToRelocate,
      locations: candidate?.preferredLocations || workPreferences.locations,
      startDate: candidate?.earliestStartDate || workPreferences.earliestStartDate || workPreferences.startDate,
    },
    profileVisibility:
      candidate?.profileVisibility ||
      candidate?.visibility ||
      (candidate?.slug ? "PUBLIC" : ""),
    location: candidate?.location || "",
    primaryResume: candidate?.primaryResume || candidate?.resume || null,
    hasResume,
  };
}

function GlassCard({ children, className = "", compact = false }) {
  return (
    <section
      className={`rounded-2xl border border-white/55 bg-white/82 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-md ${
        compact ? "p-3" : "p-4 sm:p-5"
      } ${className}`}
    >
      {children}
    </section>
  );
}

function SectionTitle({ eyebrow, title, right }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        {eyebrow ? (
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#FF7043]">
            {eyebrow}
          </div>
        ) : null}
        <h3 className="text-lg font-black tracking-tight text-slate-950">{title}</h3>
      </div>
      {right}
    </div>
  );
}

function SignalMetric({ label, value, tone = "neutral" }) {
  const toneClass =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "warn"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : tone === "risk"
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : "border-slate-200 bg-slate-50 text-slate-800";

  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClass}`}>
      <div className="text-[10px] font-black uppercase tracking-wide opacity-75">{label}</div>
      <div className="mt-1 text-sm font-black leading-tight">{value || "—"}</div>
    </div>
  );
}

function Pill({ children, tone = "neutral", onRemove, disabled }) {
  const toneClass =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "warn"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : tone === "dark"
      ? "border-slate-700 bg-slate-900 text-white"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClass}`}>
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="ml-1 text-current opacity-70 hover:opacity-100"
          title="Remove"
        >
          ×
        </button>
      ) : null}
    </span>
  );
}

function PrefRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className="text-xs text-slate-800 font-bold text-right">{value}</span>
    </div>
  );
}

export default function CandidateProfileModal({
  open,
  onClose,
  candidate,
  onSaveNotes,
  onToggleTag,
  onViewResume,
}) {
  const [notes, setNotes] = useState("");
  const [expandedExp, setExpandedExp] = useState({});
  const [journeyFilter, setJourneyFilter] = useState("All");
  const [skillInput, setSkillInput] = useState("");
  const [skillsLocal, setSkillsLocal] = useState([]);
  const [tagsLocal, setTagsLocal] = useState([]);
  const [savingSkills, setSavingSkills] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    setNotes(candidate?.notes || "");
    setExpandedExp({});
    setJourneyFilter("All");

    const incomingRecruiterSkills =
      candidate?.recruiterSkills ??
      candidate?.recruiterSkillsJson ??
      candidate?.recruiterSkillsJSON;

    const incomingSkills =
      candidate?.skills ??
      incomingRecruiterSkills ??
      candidate?.skillsProfile ??
      candidate?.skillsJson ??
      candidate?.skillsJSON;

    setSkillsLocal(toSafeArray(incomingSkills));
    setSkillInput("");

    const incomingTags = candidate?.tags ?? candidate?.tagsJson ?? candidate?.tagsJSON;
    setTagsLocal(toSafeArray(incomingTags));
  }, [open, candidate]);

  if (!mounted || !open || !candidate) return null;
  if (typeof document === "undefined") return null;

  const saveNotes = () => onSaveNotes?.(candidate.id, notes);

  const toggleTagLocal = (t) => {
    const tag = String(t || "").trim();
    if (!tag) return;
    setTagsLocal((prev) => {
      const arr = toSafeArray(prev);
      const has = arr.includes(tag);
      if (has) return arr.filter((x) => x !== tag);
      return [...arr, tag];
    });
    onToggleTag?.(candidate.id, tag);
  };

  async function saveRecruiterSkills(nextSkills) {
    setSavingSkills(true);
    try {
      const res = await fetch("/api/recruiter/candidates/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: candidate.id,
          skills: toSafeArray(nextSkills),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("[skills] save failed:", data);
        alert(data?.error || "Failed to save recruiter skills.");
      }
    } catch (e) {
      console.error("[skills] save error:", e);
      alert("Failed to save recruiter skills.");
    } finally {
      setSavingSkills(false);
    }
  }

  const addSkill = async () => {
    const val = skillInput.trim();
    if (!val || toSafeArray(skillsLocal).includes(val)) return;
    const next = [...toSafeArray(skillsLocal), val];
    setSkillsLocal(next);
    setSkillInput("");
    await saveRecruiterSkills(next);
  };

  const toggleExp = (idx) => setExpandedExp((p) => ({ ...p, [idx]: !p[idx] }));

  const experienceList = toSafeArray(candidate.experience);
  const activityList = toSafeArray(candidate.activity);
  const journeyRaw = toSafeArray(candidate?.journey);
  const journeyList =
    journeyFilter === "All"
      ? journeyRaw
      : journeyRaw.filter((s) => inferType(s?.action) === journeyFilter);

  const hasExperience = experienceList.length > 0;
  const hasActivity = activityList.length > 0;
  const hasJourney = journeyList.length > 0;
  const hasSkills = toSafeArray(skillsLocal).length > 0;
  const hasNotes = notes.trim().length > 0;

  const hasResume = Boolean(candidate?.resumeId);
  const resumeDownloadHref =
    candidate?.resumeId && candidate?.slug
      ? `/api/resume/public-download?resumeId=${encodeURIComponent(candidate.resumeId)}&slug=${encodeURIComponent(candidate.slug)}`
      : "";

  const preferredLocationList = toSafeArray(candidate?.preferredLocations);
  const workStatusFmt = formatWorkStatus(candidate?.workStatus);
  const workTypeFmt = formatWorkType(candidate?.preferredWorkType);
  const relocateFmt = formatRelocate(candidate?.willingToRelocate);
  const earliestStart =
    candidate?.workPreferences?.earliestStartDate ||
    candidate?.earliestStartDate ||
    "";

  const hasWorkPrefs = Boolean(
    workStatusFmt || workTypeFmt || relocateFmt || preferredLocationList.length || earliestStart
  );

  const educationList = toSafeArray(candidate?.education).filter(
    (e) => e && typeof e === "object" && (e.school || e.degree || e.field)
  );
  const hasEducation = educationList.length > 0;

  const languageList = toSafeArray(candidate?.languages);
  const hasLanguages = languageList.length > 0;

  const projectList = toSafeArray(candidate?.projects || candidate?.portfolioProjects || candidate?.projectHighlights);
  const hasProjects = projectList.length > 0;

  const isForgeCandidate = Boolean(
    candidate?.isForgeUser ||
      candidate?.userId ||
      candidate?.slug ||
      candidate?.profileUrl ||
      candidate?.ftProfileUrl
  );

  const signalProfileData = buildCandidateSignalProfileData(
    candidate,
    skillsLocal,
    languageList,
    educationList,
    hasResume
  );

  const skillClusters = capabilityClusters(skillsLocal);

  const summaryText =
    candidate.summary ||
    candidate.aboutMe ||
    candidate.bio ||
    candidate.profileSummary ||
    "";

  const topRole = experienceList?.[0] || null;
  const roleSignalList = Array.from(
    new Set(experienceList.flatMap((exp) => roleSignals(exp)))
  ).slice(0, 8);

  const profileVisibility =
    candidate?.profileVisibility ||
    candidate?.visibility ||
    (candidate?.slug ? "PUBLIC" : "");

  const portfolioDepth =
    hasProjects ? "Project Evidence" : isForgeCandidate ? "Profile Only" : "Limited";

  const executionVisibility =
    hasProjects || roleSignalList.length >= 4 ? "Strong" : roleSignalList.length ? "Moderate" : "Limited";

  const validationRisk =
    hasResume && (hasSkills || roleSignalList.length) ? "Low" : "Review";

  const summaryPreview = summaryText
    ? truncate(summaryText, 340)
    : "No professional summary provided. Review primary resume and recruiter-entered signals for additional context.";

  const Tag = ({ t }) => (
    <button
      type="button"
      onClick={() => toggleTagLocal(t)}
      className={`text-xs px-2.5 py-1.5 rounded-xl border font-semibold ${
        toSafeArray(tagsLocal).includes(t)
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-slate-100 text-slate-700 border-slate-300"
      }`}
    >
      {t}
    </button>
  );

  return createPortal(
    <div className="fixed inset-0 z-[10020] flex items-start justify-center px-4 pt-8 pb-6 sm:px-6 sm:pt-10">
      <div
        className="absolute inset-0 bg-[rgba(2,6,23,0.62)] backdrop-blur-[3px]"
        onClick={onClose}
      />

      <div className="relative w-full max-w-7xl rounded-[28px] border border-white/25 bg-[rgba(248,250,252,0.86)] shadow-[0_30px_90px_rgba(2,6,23,0.42)] backdrop-blur-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 border-b border-white/35 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92))] text-white flex items-center justify-between gap-4 flex-shrink-0">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[24px] font-black tracking-tight truncate">
                {candidate.name || "Candidate"}
              </h2>
              {isForgeCandidate ? (
                <span className="rounded-full border border-orange-300/40 bg-orange-500/15 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-orange-100">
                  Forge Portfolio
                </span>
              ) : (
                <span className="rounded-full border border-amber-300/40 bg-amber-500/15 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-amber-100">
                  External Review
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
              <span>{candidate.role || candidate.headline || "Candidate"}</span>
              <span>•</span>
              <span>{candidate.location || "Location not listed"}</span>
              {workStatusFmt ? (
                <>
                  <span>•</span>
                  <span>{workStatusFmt}</span>
                </>
              ) : null}
              {profileVisibility ? (
                <>
                  <span>•</span>
                  <span>Portfolio: {profileVisibility}</span>
                </>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {resumeDownloadHref && (
              <a
                href={resumeDownloadHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-white/15 transition"
              >
                Download resume
              </a>
            )}
            {typeof onViewResume === "function" && (
              <button
                type="button"
                onClick={() => onViewResume(candidate)}
                disabled={!hasResume}
                className={`rounded-xl border px-3 py-2 text-sm font-bold shadow-sm transition ${
                  hasResume
                    ? "border-white/20 bg-white/10 text-white hover:bg-white/15"
                    : "border-white/10 bg-white/5 text-slate-400 cursor-not-allowed opacity-70"
                }`}
                title={hasResume ? "View resume" : "No resume on file"}
              >
                View resume
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-white/15 transition"
            >
              Close
            </button>
          </div>
        </div>

        <div className="overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(255,112,67,0.13),transparent_34%),linear-gradient(180deg,rgba(248,250,252,0.45),rgba(226,232,240,0.58))]">
          <div className="p-5 sm:p-6 space-y-5">
            {/* Intelligence strip */}
            <GlassCard compact className="bg-white/88">
              <div className="grid gap-2 md:grid-cols-5">
                <SignalMetric label="Professional Signal" value={hasResume || hasSkills ? "Strong" : "Review"} tone={hasResume || hasSkills ? "good" : "warn"} />
                <SignalMetric label="Execution Visibility" value={executionVisibility} tone={executionVisibility === "Strong" ? "good" : executionVisibility === "Moderate" ? "warn" : "risk"} />
                <SignalMetric label="Validation Risk" value={validationRisk} tone={validationRisk === "Low" ? "good" : "warn"} />
                <SignalMetric label="Portfolio Depth" value={portfolioDepth} tone={hasProjects ? "good" : isForgeCandidate ? "warn" : "risk"} />
                <SignalMetric label="Resume Access" value={hasResume ? "Available" : "Missing"} tone={hasResume ? "good" : "risk"} />
              </div>
            </GlassCard>

            <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.9fr] gap-5">
              {/* Main intelligence column */}
              <div className="space-y-5">
                <GlassCard>
                  <SectionTitle eyebrow="Professional Read" title="Positioning & Recruiter Summary" />
                  <p className="text-sm leading-6 text-slate-700">{summaryPreview}</p>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">Current Direction</div>
                      <div className="mt-1 text-sm font-black text-slate-900">{candidate.role || candidate.headline || "Not specified"}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">Primary Evidence</div>
                      <div className="mt-1 text-sm font-black text-slate-900">{hasResume ? "Portfolio + Resume" : "Portfolio / Recruiter Data"}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">Recruiter Action</div>
                      <div className="mt-1 text-sm font-black text-slate-900">Validate Fit</div>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard>
                  <SectionTitle eyebrow="Experience Intelligence" title="Career Path & Operational Signals" />
                  {hasExperience ? (
                    <div className="grid gap-3">
                      {experienceList.map((exp, idx) => {
                        const openItem = !!expandedExp[idx];
                        const highlights = toSafeArray(exp?.highlights);
                        const signals = roleSignals(exp);
                        return (
                          <div key={idx} className="rounded-2xl border border-slate-200 bg-white/80 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-black text-slate-950">
                                  {exp?.title || "Role"} — {exp?.company || "Company"}
                                </div>
                                <div className="text-xs font-semibold text-slate-500">
                                  {exp?.range || "—"}
                                </div>
                              </div>
                              {highlights.length ? (
                                <button
                                  type="button"
                                  onClick={() => toggleExp(idx)}
                                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shrink-0"
                                >
                                  {openItem ? "Hide details" : "Show evidence"}
                                </button>
                              ) : null}
                            </div>

                            {signals.length ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {signals.map((signal) => (
                                  <Pill key={signal} tone="good">{signal}</Pill>
                                ))}
                              </div>
                            ) : null}

                            {openItem && highlights.length ? (
                              <ul className="mt-3 list-disc pl-5 text-sm leading-6 text-slate-700">
                                {highlights.map((h, i) => (
                                  <li key={i}>{h}</li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">
                      No experience listed. Experience is usually pulled from the candidate&apos;s primary resume.
                    </div>
                  )}
                </GlassCard>

                <div className="grid gap-5 lg:grid-cols-2">
                  <GlassCard>
                    <SectionTitle eyebrow="Capability Clusters" title="Operational Evidence" />
                    {skillClusters.length ? (
                      <div className="grid gap-3">
                        {skillClusters.map((cluster) => (
                          <div key={cluster.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="text-xs font-black uppercase tracking-wide text-slate-600">
                              {cluster.label}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {cluster.items.map((item) => (
                                <Pill key={`${cluster.label}-${item}`}>{item}</Pill>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">No capability clusters available yet.</div>
                    )}
                  </GlassCard>

                  <GlassCard>
                    <SectionTitle eyebrow="Portfolio Proof" title="Projects & Evidence" />
                    {hasProjects ? (
                      <div className="grid gap-3">
                        {projectList.slice(0, 4).map((project, idx) => {
                          const title =
                            typeof project === "string"
                              ? project
                              : project?.title || project?.name || project?.projectName || `Project ${idx + 1}`;
                          const desc =
                            typeof project === "string"
                              ? ""
                              : project?.description || project?.summary || project?.details || "";
                          return (
                            <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                              <div className="text-sm font-black text-slate-900">{title}</div>
                              {desc ? (
                                <div className="mt-1 text-xs leading-5 text-slate-600">{truncate(desc, 180)}</div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        Portfolio project proof is limited. Use resume evidence and interview validation to confirm execution depth.
                      </div>
                    )}
                  </GlassCard>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <GlassCard>
                    <SectionTitle eyebrow="Education" title="Credential Context" />
                    {hasEducation ? (
                      <ul className="grid gap-2 text-sm">
                        {educationList.map((edu, idx) => (
                          <li key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="font-black text-slate-900">
                              {[edu.degree, edu.field].filter(Boolean).join(" in ") || "Degree"}
                            </div>
                            {edu.school ? <div className="text-slate-500">{edu.school}</div> : null}
                            {(edu.startYear || edu.endYear) ? (
                              <div className="text-xs text-slate-400">
                                {[edu.startYear, edu.endYear].filter(Boolean).join(" – ")}
                              </div>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-slate-500">No education listed.</div>
                    )}
                  </GlassCard>

                  <GlassCard>
                    <SectionTitle eyebrow="Engagement" title="Journey & Recent Activity" />
                    <div className="mb-3 flex flex-wrap gap-2">
                      {["All", "Views", "Applies", "Messages"].map((f) => (
                        <button
                          type="button"
                          key={f}
                          onClick={() => setJourneyFilter(f)}
                          className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                            journeyFilter === f
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white/80 text-slate-700 border-slate-300 hover:bg-white"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>

                    {hasJourney ? (
                      <div className="grid gap-2 max-h-[220px] overflow-y-auto pr-1">
                        {journeyList.map((step, idx) => (
                          <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                            <div className="font-black text-slate-900">{step?.action || "Event"}</div>
                            <div className="text-xs text-slate-500">{step?.timestamp || ""}</div>
                          </div>
                        ))}
                      </div>
                    ) : hasActivity ? (
                      <div className="grid gap-2">
                        {activityList.slice(0, 5).map((a, idx) => {
                          const content = (
                            <div className="flex items-center justify-between w-full gap-3">
                              <span className="text-slate-700 break-words min-w-0">
                                {a?.event || "Activity"}
                              </span>
                              <span className="text-slate-500 shrink-0">{a?.when || ""}</span>
                            </div>
                          );
                          if (a?.url) {
                            const isInternal = String(a.url).startsWith("/");
                            return isInternal ? (
                              <Link key={idx} href={a.url} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm hover:bg-white">
                                {content}
                              </Link>
                            ) : (
                              <a key={idx} href={a.url} target="_blank" rel="noreferrer noopener" className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm hover:bg-white">
                                {content}
                              </a>
                            );
                          }
                          return <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">{content}</div>;
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">
                        No journey replay data available yet. This will populate from job views and applications.
                      </div>
                    )}
                  </GlassCard>
                </div>
              </div>

              {/* Recruiter command rail */}
              <div className="space-y-5">
                <GlassCard>
                  <SectionTitle eyebrow="Recruiter Intelligence" title="Signal Interpretation" />
                  <ProfileSignalEngine
  key={candidate?.id || 'signal-engine'}
  profileData={signalProfileData}
  mode="recruiter"
  readOnly={true}
  title="Recruiter Signal View"
/>

                  {!isForgeCandidate && (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                      Portfolio unavailable. Signal is limited to resume and recruiter-entered data.
                    </div>
                  )}
                </GlassCard>

                <GlassCard>
                  <SectionTitle eyebrow="Readiness" title="Work Preferences" />
                  {hasWorkPrefs ? (
                    <div className="divide-y divide-slate-100">
                      <PrefRow label="Status" value={workStatusFmt} />
                      <PrefRow label="Work type" value={workTypeFmt} />
                      <PrefRow label="Willing to relocate" value={relocateFmt} />
                      {preferredLocationList.length > 0 && (
                        <div className="py-2 border-b border-slate-100 last:border-0">
                          <div className="text-xs text-slate-500 mb-1">Preferred locations</div>
                          <div className="flex flex-wrap gap-1.5">
                            {preferredLocationList.map((loc, i) => (
                              <Pill key={i}>{loc}</Pill>
                            ))}
                          </div>
                        </div>
                      )}
                      {earliestStart ? <PrefRow label="Earliest start" value={formatDate(earliestStart)} /> : null}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">No work preferences set.</div>
                  )}
                </GlassCard>

                <GlassCard>
                  <SectionTitle eyebrow="Team Controls" title="Skills, Tags & Notes" />
                  <div className="text-[11px] text-slate-400 mb-3">
                    Visible to your team only. Does not modify the candidate&apos;s portfolio.
                  </div>

                  <div className="mb-4">
                    <div className="text-xs font-black uppercase tracking-wide text-slate-500 mb-2">Recruiter Skills</div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {hasSkills ? (
                        toSafeArray(skillsLocal).map((s, i) => (
                          <Pill
                            key={`${s}-${i}`}
                            onRemove={async () => {
                              const next = toSafeArray(skillsLocal).filter((x) => x !== s);
                              setSkillsLocal(next);
                              await saveRecruiterSkills(next);
                            }}
                            disabled={savingSkills}
                          >
                            {s}
                          </Pill>
                        ))
                      ) : (
                        <div className="text-sm text-slate-500">No skills listed yet.</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        className="border border-slate-200 rounded-xl px-3 py-2 text-sm w-full bg-white/85"
                        placeholder="Add a skill…"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter") await addSkill();
                        }}
                      />
                      <button
                        type="button"
                        disabled={savingSkills}
                        onClick={addSkill}
                        className="px-3 py-2 rounded-xl text-sm font-bold text-white bg-[#FF7043] hover:bg-[#F4511E] shadow-sm disabled:opacity-50 transition"
                      >
                        {savingSkills ? "Saving…" : "Add"}
                      </button>
                    </div>
                  </div>

                  {hasLanguages ? (
                    <div className="mb-4">
                      <div className="text-xs font-black uppercase tracking-wide text-slate-500 mb-2">Languages</div>
                      <div className="flex flex-wrap gap-2">
                        {languageList.map((lang, i) => (
                          <Pill key={i}>{lang}</Pill>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="mb-4">
                    <div className="text-xs font-black uppercase tracking-wide text-slate-500 mb-2">Tags</div>
                    <div className="flex flex-wrap gap-2">
                      {["Top Prospect", "Phone Screen", "Keep Warm", "Do Not Contact"].map((t) => (
                        <Tag key={t} t={t} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-black uppercase tracking-wide text-slate-500 mb-2">Notes</div>
                    <textarea
                      className="border border-slate-200 rounded-2xl px-3 py-2 w-full min-h-[110px] text-sm bg-white/85"
                      placeholder="Add private notes visible to your team…"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <div className="mt-1 text-[11px] text-slate-400">
                      Notes are private to your organization and are not shared with candidates.
                    </div>
                    <div className="mt-3 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={saveNotes}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#FF7043] hover:bg-[#F4511E] shadow-sm transition"
                      >
                        Save Notes
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
