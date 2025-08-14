// components/recruiter/CandidateProfileModal.js
import { useEffect, useState } from "react";
import Link from "next/link";

export default function CandidateProfileModal({
  open,
  onClose,
  candidate,
  onSaveNotes,
  onToggleTag,
}) {
  const [notes, setNotes] = useState("");
  const [expandedExp, setExpandedExp] = useState({});
  const [journeyFilter, setJourneyFilter] = useState("All");
  const [skillInput, setSkillInput] = useState("");
  const [skillsLocal, setSkillsLocal] = useState([]);

  useEffect(() => {
    if (open) {
      setNotes(candidate?.notes || "");
      setExpandedExp({});
      setJourneyFilter("All");
      setSkillsLocal(candidate?.skills || []);
      setSkillInput("");
    }
  }, [open, candidate]);

  // Helpers (no hooks) — avoids hook-order issues entirely
  const inferType = (action = "") => {
    const a = action.toLowerCase();
    if (a.includes("view")) return "Views";
    if (a.includes("apply")) return "Applies";
    if (a.includes("message") || a.includes("email")) return "Messages";
    return "Other";
  };

  const getFilteredJourney = () => {
    const list = candidate?.journey || [];
    if (journeyFilter === "All") return list;
    return list.filter((s) => inferType(s.action) === journeyFilter);
  };

  if (!open || !candidate) return null;

  const saveNotes = () => onSaveNotes?.(candidate.id, notes);

  const Tag = ({ t }) => (
    <button
      onClick={() => onToggleTag?.(candidate.id, t)}
      className={`text-xs px-2 py-[6px] rounded border ${
        (candidate.tags || []).includes(t)
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-slate-100 text-slate-700 border-slate-300"
      }`}
    >
      {t}
    </button>
  );

  const toggleExp = (idx) =>
    setExpandedExp((p) => ({ ...p, [idx]: !p[idx] }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal shell */}
      <div className="relative w-full max-w-6xl rounded-lg bg-white shadow-xl border max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between flex-shrink-0">
          <div>
            <div className="text-lg font-semibold">{candidate.name}</div>
            <div className="text-sm text-slate-500">
              {candidate.role} • {candidate.location || "—"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded border px-3 py-2 text-sm hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5 overflow-y-auto">
          {/* LEFT: Summary, Experience, Activity, Journey */}
          <div className="lg:col-span-2 space-y-5">
            {/* Summary */}
            <section className="rounded border bg-white p-4">
              <div className="font-medium mb-2">Summary</div>
              <div className="text-sm text-slate-700">
                {candidate.summary || "No summary available."}
              </div>
            </section>

            {/* Experience (expandable) */}
            <section className="rounded border bg-white p-4">
              <div className="font-medium mb-2">Experience</div>
              <ul className="space-y-3 text-sm">
                {(candidate.experience || []).map((exp, idx) => {
                  const openItem = !!expandedExp[idx];
                  return (
                    <li key={idx} className="border-b last:border-0 pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">
                            {exp.title} — {exp.company}
                          </div>
                          <div className="text-slate-500">{exp.range}</div>
                        </div>
                        {exp.highlights?.length ? (
                          <button
                            onClick={() => toggleExp(idx)}
                            className="text-xs px-2 py-1 border rounded hover:bg-slate-50"
                          >
                            {openItem ? "Hide" : "Show"} details
                          </button>
                        ) : null}
                      </div>

                      {openItem && exp.highlights?.length ? (
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          {exp.highlights.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
                {(candidate.experience || []).length === 0 && (
                  <li className="text-slate-500">No experience listed.</li>
                )}
              </ul>
            </section>

            {/* Activity (Next.js-safe links) */}
            <section className="rounded border bg-white p-4">
              <div className="font-medium mb-2">Recent Activity</div>
              <ul className="space-y-2 text-sm">
                {(candidate.activity || []).map((a, idx) => {
                  const content = (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-slate-700">{a.event}</span>
                      <span className="text-slate-500">{a.when}</span>
                    </div>
                  );

                  if (a.url) {
                    const isInternal = a.url.startsWith("/");
                    return (
                      <li key={idx}>
                        {isInternal ? (
                          <Link
                            href={a.url}
                            className="block hover:bg-slate-50 rounded px-2 py-1"
                          >
                            {content}
                          </Link>
                        ) : (
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="block hover:bg-slate-50 rounded px-2 py-1"
                          >
                            {content}
                          </a>
                        )}
                      </li>
                    );
                  }

                  return (
                    <li key={idx}>
                      <div className="px-2 py-1">{content}</div>
                    </li>
                  );
                })}
                {(candidate.activity || []).length === 0 && (
                  <li className="text-slate-500">No recent activity.</li>
                )}
              </ul>
            </section>

            {/* Candidate Journey Replay (with filter) */}
            <section className="rounded border bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Candidate Journey Replay</div>
                <div className="flex gap-2">
                  {["All", "Views", "Applies", "Messages"].map((f) => (
                    <button
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
                {getFilteredJourney().length ? (
                  getFilteredJourney().map((step, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="font-medium">{step.action}</div>
                      <div className="text-slate-500">{step.timestamp}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-sm">
                    No journey replay data available.
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT: Skills, Tags, Notes */}
          <div className="space-y-5">
            {/* Skills (add/remove; local only) */}
            <section className="rounded border bg-white p-4">
              <div className="font-medium mb-2">Skills</div>
              <div className="flex flex-wrap gap-2 mb-3">
                {skillsLocal.length ? (
                  skillsLocal.map((s, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-[6px] rounded border bg-slate-100 text-slate-700 border-slate-300 flex items-center gap-1"
                    >
                      {s}
                      <button
                        onClick={() => {
                          setSkillsLocal((prev) => prev.filter((x) => x !== s));
                        }}
                        className="ml-1 text-slate-500 hover:text-slate-700"
                        title="Remove"
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <div className="text-sm text-slate-500">No skills listed.</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  className="border rounded px-3 py-2 text-sm w-full"
                  placeholder="Add a skill…"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = skillInput.trim();
                      if (val && !skillsLocal.includes(val)) {
                        setSkillsLocal((prev) => [...prev, val]);
                        setSkillInput("");
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const val = skillInput.trim();
                    if (val && !skillsLocal.includes(val)) {
                      setSkillsLocal((prev) => [...prev, val]);
                      setSkillInput("");
                    }
                  }}
                  className="px-3 py-2 rounded text-sm text-white bg-[#FF7043] hover:bg-[#F4511E]"
                >
                  Add
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                (Mock only — changes aren’t saved yet.)
              </p>
            </section>

            {/* Tags */}
            <section className="rounded border bg-white p-4">
              <div className="font-medium mb-2">Tags</div>
              <div className="flex flex-wrap gap-2">
                {["Top Prospect", "Phone Screen", "Keep Warm", "Do Not Contact"].map(
                  (t) => (
                    <Tag key={t} t={t} />
                  )
                )}
              </div>
            </section>

            {/* Notes */}
            <section className="rounded border bg-white p-4">
              <div className="font-medium mb-2">Notes</div>
              <textarea
                className="border rounded px-3 py-2 w-full min-h-[120px] text-sm"
                placeholder="Add private notes visible to your team…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="mt-2 flex items-center justify-end">
                <button
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
