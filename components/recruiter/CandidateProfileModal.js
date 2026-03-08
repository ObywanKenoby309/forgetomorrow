// components/recruiter/CandidateProfileModal.js
import { useEffect, useState } from "react";
import Link from "next/link";

function toSafeArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return [];
    return s.split(",").map((x) => String(x || "").trim()).filter(Boolean);
  }
  if (typeof value === "number" || typeof value === "boolean") return [value];
  return [];
}

// ── Work preference formatters (mirrors CandidateList) ──────────────────────
function formatWorkStatus(value) {
  const v = String(value || "").trim().toLowerCase();
  if (!v) return "";
  if (v === "unemployed" || v === "not-seeking") return "Not Seeking";
  if (v === "actively-seeking" || v === "actively seeking") return "Actively Seeking";
  if (v === "open-to-opportunities" || v === "open to opportunities") return "Open to Opportunities";
  if (v === "employed") return "Employed";
  if (v === "student") return "Student";
  if (v === "contractor") return "Contractor / Freelance";
  // Capitalize first letter as fallback
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

// ── Small display sub-components ────────────────────────────────────────────
function PrefRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className="text-xs text-slate-800 font-medium text-right">{value}</span>
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

  const inferType = (action = "") => {
    const a = String(action || "").toLowerCase();
    if (a.includes("view")) return "Views";
    if (a.includes("apply")) return "Applies";
    if (a.includes("message") || a.includes("email")) return "Messages";
    return "Other";
  };

  const getFilteredJourney = () => {
    const list = toSafeArray(candidate?.journey);
    if (journeyFilter === "All") return list;
    return list.filter((s) => inferType(s?.action) === journeyFilter);
  };

  if (!open || !candidate) return null;

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

  const Tag = ({ t }) => (
    <button
      type="button"
      onClick={() => toggleTagLocal(t)}
      className={`text-xs px-2 py-[6px] rounded border ${
        toSafeArray(tagsLocal).includes(t)
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-slate-100 text-slate-700 border-slate-300"
      }`}
    >
      {t}
    </button>
  );

  const toggleExp = (idx) => setExpandedExp((p) => ({ ...p, [idx]: !p[idx] }));

  const sectionClasses = (isEmpty = false) =>
    `rounded border p-4 ${isEmpty ? "bg-slate-50 border-slate-200" : "bg-white"}`;

  const isSummaryEmpty = !candidate.summary || !candidate.summary.toString().trim();

  const experienceList = toSafeArray(candidate.experience);
  const activityList = toSafeArray(candidate.activity);
  const journeyList = getFilteredJourney();

  const hasExperience = experienceList.length > 0;
  const hasActivity = activityList.length > 0;
  const hasJourney = journeyList.length > 0;
  const hasSkills = toSafeArray(skillsLocal).length > 0;
  const hasNotes = notes.trim().length > 0;

  const hasResume = Boolean(candidate?.resumeId);

  // ── Work preferences ────────────────────────────────────────────────────────
  const preferredLocationList = toSafeArray(candidate?.preferredLocations);
  const workStatusFmt = formatWorkStatus(candidate?.workStatus);
  const workTypeFmt = formatWorkType(candidate?.preferredWorkType);
  const relocateFmt = formatRelocate(candidate?.willingToRelocate);

  // Earliest start date — stored in workPreferences.earliestStartDate or top-level
  const earliestStart =
    candidate?.workPreferences?.earliestStartDate ||
    candidate?.earliestStartDate ||
    "";

  const hasWorkPrefs = Boolean(
    workStatusFmt || workTypeFmt || relocateFmt ||
    preferredLocationList.length || earliestStart
  );

  // ── Education ────────────────────────────────────────────────────────────────
  const educationList = toSafeArray(candidate?.education).filter(
    (e) => e && typeof e === "object" && (e.school || e.degree || e.field)
  );
  const hasEducation = educationList.length > 0;

  // ── Languages ───────────────────────────────────────────────────────────────
  const languageList = toSafeArray(candidate?.languages);
  const hasLanguages = languageList.length > 0;

  return (
    // ✅ FIX: z-[200] ensures this always renders above the sidebar (z-index: 10)
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-6xl rounded-lg bg-white shadow-xl border max-h-[90vh] flex flex-col">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="p-5 border-b flex items-center justify-between flex-shrink-0">
          <div className="min-w-0">
            <div className="text-lg font-semibold truncate">
              {candidate.name || "Candidate"}
            </div>
            <div className="text-sm text-slate-500 truncate">
              {candidate.role || "Candidate"} • {candidate.location || "—"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {typeof onViewResume === "function" && (
              <button
                type="button"
                onClick={() => onViewResume(candidate)}
                disabled={!hasResume}
                className={`rounded border px-3 py-2 text-sm hover:bg-slate-50 ${
                  hasResume
                    ? "text-slate-700"
                    : "text-slate-400 cursor-not-allowed opacity-70"
                }`}
                title={hasResume ? "View resume" : "No resume on file"}
              >
                View resume
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded border px-3 py-2 text-sm hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>

        {/* ── Body grid ──────────────────────────────────────────────────── */}
        <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5 overflow-y-auto bg-slate-50/40">

          {/* Left column — main profile content */}
          <div className="lg:col-span-2 space-y-5">

            {/* Summary */}
            <section className={sectionClasses(isSummaryEmpty)}>
              <div className="font-medium mb-1">Summary</div>
              {isSummaryEmpty ? (
                <div className="text-sm text-slate-500">
                  This candidate hasn&apos;t added a full summary yet.
                  <span className="block text-xs text-slate-400 mt-1">
                    Review their profile or resume for additional context.
                  </span>
                </div>
              ) : (
                <div className="text-sm text-slate-700 whitespace-pre-line">
                  {candidate.summary}
                </div>
              )}
            </section>

            {/* Experience */}
            <section className={sectionClasses(!hasExperience)}>
              <div className="font-medium mb-2">Experience</div>
              {hasExperience ? (
                <ul className="space-y-3 text-sm">
                  {experienceList.map((exp, idx) => {
                    const openItem = !!expandedExp[idx];
                    const highlights = toSafeArray(exp?.highlights);
                    return (
                      <li key={idx} className="border-b last:border-0 pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium break-words">
                              {exp?.title || "Role"} — {exp?.company || "Company"}
                            </div>
                            <div className="text-slate-500 break-words">
                              {exp?.range || "—"}
                            </div>
                          </div>
                          {highlights.length ? (
                            <button
                              type="button"
                              onClick={() => toggleExp(idx)}
                              className="text-xs px-2 py-1 border rounded hover:bg-slate-50 shrink-0"
                            >
                              {openItem ? "Hide" : "Show"} details
                            </button>
                          ) : null}
                        </div>
                        {openItem && highlights.length ? (
                          <ul className="list-disc pl-5 mt-2 space-y-1">
                            {highlights.map((h, i) => (
                              <li key={i}>{h}</li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-sm text-slate-500">
                  No experience listed.
                  <span className="block text-xs text-slate-400 mt-1">
                    Experience is pulled from the candidate's primary resume.
                  </span>
                </div>
              )}
            </section>

            {/* Education */}
            <section className={sectionClasses(!hasEducation)}>
              <div className="font-medium mb-2">Education</div>
              {hasEducation ? (
                <ul className="space-y-2 text-sm">
                  {educationList.map((edu, idx) => (
                    <li key={idx} className="border-b last:border-0 pb-2">
                      <div className="font-medium break-words">
                        {[edu.degree, edu.field].filter(Boolean).join(" in ") || "Degree"}
                      </div>
                      {edu.school && (
                        <div className="text-slate-500">{edu.school}</div>
                      )}
                      {(edu.startYear || edu.endYear) && (
                        <div className="text-slate-400 text-xs">
                          {[edu.startYear, edu.endYear].filter(Boolean).join(" – ")}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-slate-500">
                  No education listed.
                  <span className="block text-xs text-slate-400 mt-1">
                    Education is pulled from the candidate's profile.
                  </span>
                </div>
              )}
            </section>

            {/* Recent Activity */}
            <section className={sectionClasses(!hasActivity)}>
              <div className="font-medium mb-2">Recent Activity</div>
              {hasActivity ? (
                <ul className="space-y-2 text-sm">
                  {activityList.map((a, idx) => {
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
                      return (
                        <li key={idx}>
                          {isInternal ? (
                            <Link href={a.url} className="block hover:bg-slate-50 rounded px-2 py-1">
                              {content}
                            </Link>
                          ) : (
                            <a href={a.url} target="_blank" rel="noreferrer noopener"
                              className="block hover:bg-slate-50 rounded px-2 py-1">
                              {content}
                            </a>
                          )}
                        </li>
                      );
                    }
                    return <li key={idx}><div className="px-2 py-1">{content}</div></li>;
                  })}
                </ul>
              ) : (
                <div className="text-sm text-slate-500">
                  No recent activity.
                  <span className="block text-xs text-slate-400 mt-1">
                    This will populate from job views + applications (team scoped).
                  </span>
                </div>
              )}
            </section>

            {/* Candidate Journey Replay */}
            <section className={sectionClasses(!hasJourney)}>
              <div className="flex items-center justify-between mb-2 gap-3">
                <div className="font-medium">Candidate Journey Replay</div>
                <div className="flex gap-2 flex-wrap justify-end">
                  {["All", "Views", "Applies", "Messages"].map((f) => (
                    <button
                      type="button"
                      key={f}
                      onClick={() => setJourneyFilter(f)}
                      className={`text-xs px-2 py-1 rounded border ${
                        journeyFilter === f
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2">
                {hasJourney ? (
                  journeyList.map((step, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="font-medium break-words">{step?.action || "Event"}</div>
                      <div className="text-slate-500 break-words">{step?.timestamp || ""}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-sm">
                    No journey replay data available.
                    <span className="block text-xs text-slate-400 mt-1">
                      This will populate from job views + applications (team scoped).
                    </span>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right column — recruiter tools + candidate preferences */}
          <div className="space-y-5">

            {/* ✅ NEW: Work Preferences — surfaces what the seeker set on their profile */}
            <section className={sectionClasses(!hasWorkPrefs)}>
              <div className="font-medium mb-2">Work Preferences</div>
              {hasWorkPrefs ? (
                <div className="divide-y divide-slate-100">
                  <PrefRow label="Status" value={workStatusFmt} />
                  <PrefRow label="Work type" value={workTypeFmt} />
                  <PrefRow label="Willing to relocate" value={relocateFmt} />
                  {preferredLocationList.length > 0 && (
                    <div className="py-1.5 border-b border-slate-100 last:border-0">
                      <div className="text-xs text-slate-500 mb-1">Preferred locations</div>
                      <div className="flex flex-wrap gap-1.5">
                        {preferredLocationList.map((loc, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700"
                          >
                            {loc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {earliestStart && (
                    <PrefRow
                      label="Earliest start"
                      value={new Date(earliestStart).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    />
                  )}
                </div>
              ) : (
                <div className="text-sm text-slate-500">
                  No work preferences set.
                  <span className="block text-xs text-slate-400 mt-1">
                    Candidate hasn't configured discovery settings yet.
                  </span>
                </div>
              )}
            </section>

            {/* Skills (recruiter-editable, team-only) */}
            <section className={sectionClasses(!hasSkills)}>
              <div className="font-medium mb-2">Skills</div>
              <div className="text-[11px] text-slate-400 mb-2">
                Visible to your team only. Does not modify the candidate's profile.
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {hasSkills ? (
                  toSafeArray(skillsLocal).map((s, i) => (
                    <span
                      key={`${s}-${i}`}
                      className="text-xs px-2 py-[6px] rounded border bg-slate-100 text-slate-700 border-slate-300 flex items-center gap-1 break-words"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={async () => {
                          const next = toSafeArray(skillsLocal).filter((x) => x !== s);
                          setSkillsLocal(next);
                          await saveRecruiterSkills(next);
                        }}
                        className="ml-1 text-slate-500 hover:text-slate-700"
                        title="Remove"
                        disabled={savingSkills}
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <div className="text-sm text-slate-500">No skills listed yet.</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  className="border rounded px-3 py-2 text-sm w-full"
                  placeholder="Add a skill…"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      const val = skillInput.trim();
                      if (val && !toSafeArray(skillsLocal).includes(val)) {
                        const next = [...toSafeArray(skillsLocal), val];
                        setSkillsLocal(next);
                        setSkillInput("");
                        await saveRecruiterSkills(next);
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={savingSkills}
                  onClick={async () => {
                    const val = skillInput.trim();
                    if (val && !toSafeArray(skillsLocal).includes(val)) {
                      const next = [...toSafeArray(skillsLocal), val];
                      setSkillsLocal(next);
                      setSkillInput("");
                      await saveRecruiterSkills(next);
                    }
                  }}
                  className="px-3 py-2 rounded text-sm text-white bg-[#FF7043] hover:bg-[#F4511E] disabled:opacity-50"
                >
                  {savingSkills ? "Saving…" : "Add"}
                </button>
              </div>
            </section>

            {/* Languages */}
            {hasLanguages && (
              <section className={sectionClasses(false)}>
                <div className="font-medium mb-2">Languages</div>
                <div className="flex flex-wrap gap-2">
                  {languageList.map((lang, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-[6px] rounded border bg-slate-50 text-slate-700 border-slate-200"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Tags */}
            <section className={sectionClasses(false)}>
              <div className="font-medium mb-2">Tags</div>
              <div className="flex flex-wrap gap-2">
                {["Top Prospect", "Phone Screen", "Keep Warm", "Do Not Contact"].map((t) => (
                  <Tag key={t} t={t} />
                ))}
              </div>
            </section>

            {/* Notes */}
            <section className={sectionClasses(!hasNotes)}>
              <div className="font-medium mb-2">Notes</div>
              <textarea
                className="border rounded px-3 py-2 w-full min-h-[120px] text-sm"
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
                  className="px-3 py-2 rounded text-sm text-white bg-[#FF7043] hover:bg-[#F4511E]"
                >
                  Save Notes
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}