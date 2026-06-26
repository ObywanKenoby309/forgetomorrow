// components/recruiter/CandidateProfileModal.js
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { classifySignals, overallVerdict, signalScoreToPercent } from "@/lib/intelligence/profileSignalShared";
import { inferOperationalConclusion, inferCandidateOperationalProfile } from "@/lib/intelligence/operationalInference";

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


function roleInterpretation(exp = {}) {
  return inferOperationalConclusion(exp).conclusion;
}

function buildInterviewFocus({ roleSignalList = [], hasProjects, hasResume, candidateProfileInference = null }) {
  const sharedFocus = candidateProfileInference?.validationFocus || [];
  if (sharedFocus.length) return sharedFocus.slice(0, 5);

  const focus = [];
  if (roleSignalList.includes("Support delivery")) focus.push("Validate support volume, ticket complexity, escalation handling, and service ownership.");
  if (roleSignalList.includes("Endpoint operations")) focus.push("Ask for examples of endpoint lifecycle work, imaging, deployment, and troubleshooting depth.");
  if (roleSignalList.includes("Identity/access support")) focus.push("Confirm identity/access administration scope, tools used, and security boundaries.");
  if (!hasProjects) focus.push("Request one concrete project or work example with scope, ownership, and measurable result.");
  if (!hasResume) focus.push("Ask for resume detail or source artifacts before advancing to final evaluation.");
  return focus.slice(0, 5);
}

function portfolioReviewCopy(sig) {
  if (!sig) return "";

  if (sig.key === "credentials") {
    return "Professional credibility is supported through operational execution, structured support experience, and formal education visibility.";
  }

  if (sig.key === "portfolio" && sig.status === "missing") {
    return "Structured project proof is not yet visible. Resume history and interview examples should be used to validate execution depth.";
  }

  if (sig.key === "portfolio" && sig.status === "adjacent") {
    return "Project proof is visible, but recruiters should validate measurable outcomes, ownership, scope, and impact before treating it as fully proven.";
  }

  if (sig.key === "identity" && sig.status !== "direct") {
    return "Professional identity is present, but role level, specialization, or impact signal could be clearer for faster recruiter interpretation.";
  }

  return sig.recruiterInterpretation;
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
    projects: toSafeArray(candidate?.projects || candidate?.portfolioProjects || candidate?.projectHighlights || candidate?.portfolio?.projects || candidate?.profile?.projects || candidate?.publicProfile?.projects || candidate?.profileData?.projects),
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


function statusLabel(status) {
  if (status === "direct") return "Proven";
  if (status === "adjacent") return "Validation";
  return "Review";
}

function statusTone(status) {
  if (status === "direct") return "good";
  if (status === "adjacent") return "warn";
  return "risk";
}

function RecruiterPortfolioReview({ profileData }) {
  const signals = classifySignals(profileData || {}, null);
  const verdict = overallVerdict(signals);
  const score = signalScoreToPercent(verdict);

  const proven = signals.filter((s) => s.status === "direct");
  const validation = signals.filter((s) => s.status === "adjacent");
  const review = signals.filter((s) => s.status === "missing");

  const portfolioSignal = signals.find((s) => s.key === "portfolio");
  const identitySignal = signals.find((s) => s.key === "identity");
  const credibilitySignal = signals.find((s) => s.key === "credentials");
  const readinessSignal = signals.find((s) => s.key === "availability");

  const headline =
    score >= 75
      ? "Strong recruiter-visible portfolio signal."
      : score >= 50
      ? "Usable portfolio signal with validation areas."
      : "Portfolio signal requires deeper recruiter review.";

  const validationAreas = [...review, ...validation].slice(0, 3);

  return (
    <div className="grid gap-3">
      <div className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#FF7043]">
              Portfolio Intelligence
            </div>
            <div className="mt-1 text-base font-black leading-tight">
              {headline}
            </div>
            <div className="mt-2 text-xs leading-5 text-slate-300">
              Recruiter-facing interpretation from ForgeTomorrow&apos;s shared portfolio signal engine.
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-3xl font-black text-[#FF7043]">
              {score !== null && score !== undefined ? `${score}%` : "—"}
            </div>
            <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              Signal Confidence
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2">
            <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">Proven</div>
            <div className="mt-1 text-sm font-black text-emerald-200">{proven.length}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2">
            <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">Validate</div>
            <div className="mt-1 text-sm font-black text-amber-200">{validation.length}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-2">
            <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">Review</div>
            <div className="mt-1 text-sm font-black text-rose-200">{review.length}</div>
          </div>
        </div>
      </div>

      {[identitySignal, portfolioSignal, credibilitySignal, readinessSignal]
        .filter(Boolean)
        .map((sig) => (
          <div key={sig.key} className="rounded-2xl border border-slate-200 bg-white/88 p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-black text-slate-950">
                  {String(sig.label || "").replace(" Signal", "")}
                </div>
                <div className="mt-1 text-xs leading-5 text-slate-600">
                  {portfolioReviewCopy(sig)}
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black uppercase ${
                  statusTone(sig.status) === "good"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : statusTone(sig.status) === "warn"
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                {statusLabel(sig.status)}
              </span>
            </div>

            {Array.isArray(sig.evidenceDetected) && sig.evidenceDetected.length ? (
              <div className="mt-2 rounded-xl bg-slate-50 p-2">
                <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Evidence
                </div>
                <ul className="mt-1 grid gap-1 text-xs text-slate-700">
                  {sig.evidenceDetected.slice(0, 3).map((item, idx) => (
                    <li key={`${sig.key}-evidence-${idx}`}>• {item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ))}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">
          Recruiter Validation Areas
        </div>
        {validationAreas.length ? (
          <div className="mt-2 grid gap-2">
            {validationAreas.map((sig) => (
              <div key={`validation-${sig.key}`} className="rounded-xl border border-white bg-white p-2">
                <div className="text-xs font-black text-slate-800">
                  {String(sig.label || "").replace(" Signal", "")}
                </div>
                <div className="mt-1 text-xs leading-5 text-slate-600">
                  {sig.key === "portfolio"
                    ? "Ask for one concrete project, work sample, implementation example, or measurable outcome."
                    : sig.key === "credentials"
                    ? "Confirm credibility through experience scope, education, training, certifications, service background, or documented execution."
                    : sig.missingValidation?.[0] || portfolioReviewCopy(sig) || "Validate during recruiter review."}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-2 text-xs leading-5 text-slate-600">
            No major portfolio validation concerns detected from the current visible evidence.
          </div>
        )}
      </div>
    </div>
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
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const [savingPacket, setSavingPacket] = useState(false);
  const [savePacketMessage, setSavePacketMessage] = useState("");
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

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
    setSaveMenuOpen(false);
    setSavePacketMessage("");
    setMobileToolsOpen(false);
  }, [open, candidate]);

  // ── Striker context injection ────────────────────────────────────────────────
  // Writes window.__FT_CONTEXT__ when the full candidate profile modal is open.
  // This gives Striker the richest available candidate signal — full profile,
  // resume, projects, skills, education, work preferences.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!open || !candidate) return;

    try {
      const allSkills = [
        ...toSafeArray(skillsLocal),
        ...toSafeArray(candidate?.skills),
        ...toSafeArray(candidate?.skillsProfile),
      ].filter(Boolean).slice(0, 20);

      window.__FT_CONTEXT__ = {
        surface: "recruiter_candidate_center",

        activeCandidate: {
          id:          candidate.id          || null,
          name:        candidate.name        || null,
          title:       candidate.currentTitle || candidate.title || candidate.role || candidate.headline || null,
          location:    candidate.location    || null,
          workStatus:  candidate.workStatus  || candidate.workPreferences?.workStatus || null,
          match:       typeof candidate.match === "number" ? candidate.match : null,
          skills:      allSkills,
          summary:     candidate.aboutMe || candidate.about || candidate.summary || candidate.bio || candidate.profileSummary || null,
          profileSlug: candidate.slug || candidate.profileSlug || null,
          // Full profile extras — richer than the search card
          workType:       candidate.preferredWorkType || candidate.workPreferences?.workType || null,
          willingToRelocate: candidate.willingToRelocate ?? candidate.workPreferences?.willingToRelocate ?? null,
          education:      toSafeArray(candidate.education).slice(0, 3),
          projects:       toSafeArray(candidate.projects || candidate.portfolioProjects).slice(0, 5),
          certifications: toSafeArray(candidate.certifications).slice(0, 5),
          hasResume:      Boolean(candidate.resumeId),
          tags:           toSafeArray(tagsLocal).slice(0, 10),
        },

        // No WHY data in profile modal — cleared so Striker doesn't
        // use stale WHY from a prior drawer open on a different candidate
        activeWhy: null,
        activeJob: null,
        activeSearch: null,
        activeTargetingFilters: null,
      };
    } catch {
      // Never crash the recruiter UI — Striker context is best-effort
    }
  }, [open, candidate, skillsLocal, tagsLocal]);

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

  const reviewPacketHref = candidate?.id
    ? `/api/recruiter/candidates/${encodeURIComponent(candidate.id)}/review-packet`
    : "";

  async function handleSaveReviewPacketToVault() {
    if (!candidate?.id || savingPacket) return;

    setSavingPacket(true);
    setSavePacketMessage("");
    setSaveMenuOpen(false);

    try {
      const res = await fetch(reviewPacketHref, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "vault" }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Could not save review packet.");
      }

      setSavePacketMessage("Saved to ForgeVault.");
    } catch (err) {
      console.error("[CandidateProfileModal] save review packet failed", err);
      setSavePacketMessage(err?.message || "Could not save to ForgeVault.");
    } finally {
      setSavingPacket(false);
    }
  }

  function handleSaveReviewPacketToComputer() {
    if (!reviewPacketHref) return;
    setSaveMenuOpen(false);
    window.open(reviewPacketHref, "_blank", "noopener");
  }

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
  const certificationList = toSafeArray(candidate?.certifications || candidate?.certificationsJson);
  const hasCertifications = certificationList.length > 0;

  const languageList = toSafeArray(candidate?.languages);
  const hasLanguages = languageList.length > 0;

  const projectList = toSafeArray(candidate?.projects || candidate?.portfolioProjects || candidate?.projectHighlights || candidate?.portfolio?.projects || candidate?.profile?.projects || candidate?.publicProfile?.projects || candidate?.profileData?.projects);
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

  const candidateProfileInference = inferCandidateOperationalProfile({
    experience: experienceList,
    skills: skillsLocal,
    projects: projectList,
    hasResume,
  });

  const profileVisibility =
    candidate?.profileVisibility ||
    candidate?.visibility ||
    (candidate?.slug ? "PUBLIC" : "");

  const displayLocation =
    candidate.location ||
    preferredLocationList?.[0] ||
    (preferredLocationList.length ? "Preferred locations listed" : "Location not listed");

  const portfolioIdentityPoints = [
    summaryText,
    experienceList.length,
    hasSkills,
    hasEducation,
    hasWorkPrefs,
    preferredLocationList.length,
    profileVisibility,
  ].filter(Boolean).length;

  const portfolioDepth =
    portfolioIdentityPoints >= 5 ? "Strong" : portfolioIdentityPoints >= 3 ? "Moderate" : "Emerging";

  const portfolioProof =
    hasProjects ? "Project Evidence" : "Limited Project Evidence";

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

  const recruiterToolsContent = (
    <>
                <GlassCard>
                  <SectionTitle eyebrow="Recruiter Intelligence" title="Portfolio Review" />
                  <RecruiterPortfolioReview profileData={signalProfileData} />

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
                  <SectionTitle eyebrow="Recruiter Read" title="Interpretation & Interview Focus" />
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                      Primary Recruiter Interpretation
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-700">
                      {candidateProfileInference.overallConclusion}
                    </p>
                  </div>

                  <div className="mt-3 rounded-xl border border-slate-200 bg-white/80 p-3">
                    <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                      Suggested Interview Focus
                    </div>
                    <ul className="mt-2 grid gap-1.5 text-xs leading-5 text-slate-700">
                      {buildInterviewFocus({ roleSignalList, hasProjects, hasResume, candidateProfileInference }).map((item, idx) => (
                        <li key={`focus-${idx}`}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </GlassCard>

                <GlassCard>
                  <SectionTitle eyebrow="Recruiter Utilities" title="Team Notes & Controls" />
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
    </>
  );

  return createPortal(
    <div className="fixed inset-0 z-[10020] flex items-start justify-center px-4 pt-8 pb-6 sm:px-6 sm:pt-10">
      <div
        className="absolute inset-0 bg-[rgba(2,6,23,0.62)] backdrop-blur-[3px]"
        onClick={onClose}
      />

      <div className="relative w-full max-w-7xl rounded-[28px] border border-white/25 bg-[rgba(248,250,252,0.86)] shadow-[0_30px_90px_rgba(2,6,23,0.42)] backdrop-blur-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 border-b border-white/35 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92))] text-white flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 flex-shrink-0">
          <div className="min-w-0 w-full">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[20px] sm:text-[24px] font-black tracking-tight leading-tight">
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
            {candidate.role || candidate.headline ? (
  <div className="mt-1 text-sm font-medium text-slate-200 leading-snug">
    {candidate.role || candidate.headline}
  </div>
) : null}

<div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-300">
  <span>{displayLocation}</span>
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

          <div className="flex flex-wrap items-stretch gap-2 w-full xl:w-auto xl:justify-end">
            {candidate?.id && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSaveMenuOpen((v) => !v)}
                  disabled={savingPacket}
                  className="w-full sm:w-auto rounded-xl border border-orange-300/35 bg-orange-500/15 px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-orange-500/20 transition disabled:opacity-60"
                  title={savePacketMessage || "Save candidate review packet"}
                >
                  {savingPacket ? "Saving…" : "Save ▾"}
                </button>

                {saveMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-[10040] w-44 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xl">
                    <button
                      type="button"
                      onClick={handleSaveReviewPacketToVault}
                      className="block w-full px-3 py-2 text-left text-xs font-bold hover:bg-orange-50"
                    >
                      To ForgeVault
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveReviewPacketToComputer}
                      className="block w-full border-t border-slate-100 px-3 py-2 text-left text-xs font-bold hover:bg-orange-50"
                    >
                      To Computer
                    </button>
                  </div>
                )}

                {savePacketMessage && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-[10030] mt-12 w-48 rounded-lg border border-white/20 bg-slate-950/95 px-3 py-2 text-[11px] font-semibold text-white shadow-xl">
                    {savePacketMessage}
                  </div>
                )}
              </div>
            )}
            {resumeDownloadHref && (
              <a
                href={resumeDownloadHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-white/15 transition"
              >
                Download resume
              </a>
            )}
            {typeof onViewResume === "function" && (
              <button
                type="button"
                onClick={() => onViewResume(candidate)}
                disabled={!hasResume}
                className={`w-full sm:w-auto rounded-xl border px-3 py-2 text-sm font-bold shadow-sm transition ${
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
              className="w-full sm:w-auto rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-white/15 transition"
            >
              Close
            </button>
          </div>
        </div>

        {!mobileToolsOpen && (
  <button
    type="button"
    onClick={() => setMobileToolsOpen(true)}
    className="xl:hidden absolute right-0 top-1/2 z-[10030] -translate-y-1/2 bg-transparent border-0 p-0 shadow-none"
    aria-label="Open recruiter tools"
  >
    <img
      src="/icons/tools-b.png"
      alt="Recruiter Tools"
      style={{
        width: "28px",
        height: "88px",
        objectFit: "contain",
      }}
    />
  </button>
)}

        {mobileToolsOpen && (
          <div className="xl:hidden absolute inset-0 z-[10035] overflow-hidden">
            <button
              type="button"
              aria-label="Close recruiter tools overlay"
              onClick={() => setMobileToolsOpen(false)}
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
            />

            <aside className="absolute bottom-0 right-0 top-0 flex w-[min(88vw,390px)] max-w-full flex-col border-l border-white/35 bg-[rgba(248,250,252,0.96)] shadow-[-24px_0_70px_rgba(2,6,23,0.38)] backdrop-blur-xl">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-950 px-4 py-4 text-white">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#FF7043]">
                    Candidate Review
                  </div>
                  <div className="text-base font-black tracking-tight">Recruiter Tools</div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileToolsOpen(false)}
                  className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-black text-white"
                >
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {recruiterToolsContent}
                </div>
              </div>
            </aside>
          </div>
        )}

        <div className="overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(255,112,67,0.13),transparent_34%),linear-gradient(180deg,rgba(248,250,252,0.45),rgba(226,232,240,0.58))]">
          <div className="p-5 sm:p-6 space-y-5">
            {/* Intelligence strip */}
            <GlassCard compact className="bg-white/88">
              <div className="grid gap-2 md:grid-cols-5">
                <SignalMetric label="Professional Signal" value={hasResume || hasSkills ? "Strong" : "Review"} tone={hasResume || hasSkills ? "good" : "warn"} />
                <SignalMetric label="Execution Visibility" value={executionVisibility} tone={executionVisibility === "Strong" ? "good" : executionVisibility === "Moderate" ? "warn" : "risk"} />
                <SignalMetric label="Validation Risk" value={validationRisk} tone={validationRisk === "Low" ? "good" : "warn"} />
                <SignalMetric label="Portfolio Depth" value={portfolioDepth} tone={portfolioDepth === "Strong" ? "good" : portfolioDepth === "Moderate" ? "warn" : "risk"} />
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

                            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs leading-5 text-slate-700">
                              <div>
                                <span className="font-black text-slate-800">Recruiter read: </span>
                                {inferOperationalConclusion(exp).conclusion}
                              </div>
                              <div className="mt-1 text-slate-600">
                                <span className="font-black text-slate-700">Meaning: </span>
                                {inferOperationalConclusion(exp).recruiterMeaning}
                              </div>
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
                    <SectionTitle eyebrow="Execution Proof" title={portfolioProof} />
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
                        No structured project entries are listed yet. Resume history and operational experience currently carry execution proof; validate project ownership, outcomes, and measurable impact during recruiter review.
                      </div>
                    )}
                  </GlassCard>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <GlassCard>
                    <SectionTitle eyebrow="Credentials" title="Education & Certifications" />
                    {hasEducation || hasCertifications ? (
  <div className="grid gap-2 text-sm">
    {educationList.map((edu, idx) => (
      <div key={`edu-${idx}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="font-black text-slate-900">
          {[edu.degree, edu.field].filter(Boolean).join(" in ") || "Degree"}
        </div>
        {edu.school ? <div className="text-slate-500">{edu.school}</div> : null}
        {(edu.startYear || edu.endYear) ? (
          <div className="text-xs text-slate-400">
            {[edu.startYear, edu.endYear].filter(Boolean).join(" – ")}
          </div>
        ) : null}
      </div>
    ))}

    {certificationList.map((cert, idx) => {
      const title =
        typeof cert === "string"
          ? cert
          : cert?.name || cert?.title || cert?.certification || `Certification ${idx + 1}`;

      const issuer =
        typeof cert === "string"
          ? ""
          : cert?.issuer || cert?.organization || cert?.provider || "";

      const year =
        typeof cert === "string"
          ? ""
          : cert?.year || cert?.issuedYear || cert?.date || "";

      return (
        <div key={`cert-${idx}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="font-black text-slate-900">{title}</div>
          {[issuer, year].filter(Boolean).length ? (
            <div className="text-xs text-slate-400">
              {[issuer, year].filter(Boolean).join(" • ")}
            </div>
          ) : null}
        </div>
      );
    })}
  </div>
) : (
  <div className="text-sm text-slate-500">No education or certifications listed.</div>
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

              {/* Recruiter command rail — desktop only. Mobile opens from the right-side tools drawer. */}
              <div className="hidden xl:block space-y-5">
                {recruiterToolsContent}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}