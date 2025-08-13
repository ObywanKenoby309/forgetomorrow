// components/recruiter/CandidateProfileModal.js
import { useEffect, useState } from "react";

export default function CandidateProfileModal({ open, onClose, candidate, onSaveNotes, onToggleTag }) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) setNotes(candidate?.notes || "");
  }, [open, candidate]);

  if (!open || !candidate) return null;

  const saveNotes = () => onSaveNotes?.(candidate.id, notes);

  const Tag = ({ t }) => (
    <button
      onClick={() => onToggleTag?.(candidate.id, t)}
      className={`text-xs px-2 py-[3px] rounded border ${
        (candidate.tags || []).includes(t)
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-slate-100 text-slate-700 border-slate-300"
      }`}
    >
      {t}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-3xl rounded-lg bg-white shadow-xl border">
        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">{candidate.name}</div>
            <div className="text-sm text-slate-500">
              {candidate.role} • {candidate.location || "—"}
            </div>
          </div>
          <button onClick={onClose} className="rounded border px-3 py-2 text-sm hover:bg-slate-50">Close</button>
        </div>

        {/* Body */}
        <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left column: summary + skills */}
          <div className="lg:col-span-2 space-y-5">
            {/* Summary */}
            <section className="rounded border bg-white p-4">
              <div className="font-medium mb-2">Summary</div>
              <div className="text-sm text-slate-700">
                {candidate.summary || "No summary available."}
              </div>
            </section>

            {/* Experience */}
            <section className="rounded border bg-white p-4">
              <div className="font-medium mb-2">Experience</div>
              <ul className="space-y-3 text-sm">
                {(candidate.experience || []).map((exp, idx) => (
                  <li key={idx} className="border-b last:border-0 pb-3">
                    <div className="font-medium">{exp.title} — {exp.company}</div>
                    <div className="text-slate-500">{exp.range}</div>
                    {exp.highlights && (
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        {exp.highlights.map((h, i) => <li key={i}>{h}</li>)}
                      </ul>
                    )}
                  </li>
                ))}
                {(candidate.experience || []).length === 0 && (
                  <li className="text-slate-500">No experience listed.</li>
                )}
              </ul>
            </section>

            {/* Activity */}
            <section className="rounded border bg-white p-4">
              <div className="font-medium mb-2">Recent Activity</div>
              <ul className="space-y-2 text-sm">
                {(candidate.activity || []).map((a, idx) => (
                  <li key={idx} className="flex items-center justify-between">
                    <span className="text-slate-700">{a.event}</span>
                    <span className="text-slate-500">{a.when}</span>
                  </li>
                ))}
                {(candidate.activity || []).length === 0 && (
                  <li className="text-slate-500">No recent activity.</li>
                )}
              </ul>
            </section>
          </div>

          {/* Right column: skills + notes + tags */}
          <div className="space-y-5">
            {/* Skills */}
            <section className="rounded border bg-white p-4">
              <div className="font-medium mb-2">Skills</div>
              <div className="flex flex-wrap gap-2">
                {(candidate.skills || []).map((s, i) => (
                  <span key={i} className="text-xs px-2 py-[3px] rounded border bg-slate-100 text-slate-700 border-slate-300">
                    {s}
                  </span>
                ))}
                {(candidate.skills || []).length === 0 && (
                  <div className="text-sm text-slate-500">No skills listed.</div>
                )}
              </div>
            </section>

            {/* Tags (click to toggle) */}
            <section className="rounded border bg-white p-4">
              <div className="font-medium mb-2">Tags</div>
              <div className="flex flex-wrap gap-2">
                {["Top Prospect", "Phone Screen", "Keep Warm", "Do Not Contact"].map((t) => (
                  <Tag key={t} t={t} />
                ))}
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
                <button onClick={saveNotes} className="px-3 py-2 rounded text-sm text-white bg-[#FF7043] hover:bg-[#F4511E]">
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
