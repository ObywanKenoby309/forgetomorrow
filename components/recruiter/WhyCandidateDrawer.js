// components/recruiter/WhyCandidateDrawer.js
import React from "react";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";

/**
 * Props:
 * - open, onClose, explain, mode ("lite" | "full")
 * - onViewCandidate? : optional callback to open the candidate profile view
 *
 * explain shape:
 * {
 *   score, summary,
 *   reasons: [{ requirement, evidence: [{ text, source }] }],
 *   skills: { matched: [], gaps: [], transferable: [] },
 *   trajectory: [{ title, company, from, to }],
 *   filters_triggered: []
 * }
 */
export default function WhyCandidateDrawer({
  open,
  onClose,
  explain,
  mode = "lite",
  onViewCandidate, // ← NEW (optional)
}) {
  if (!open) return null;

  const isFull = mode === "full";
  const {
    score = 0,
    summary = "",
    reasons = [],
    skills = { matched: [], gaps: [], transferable: [] },
    trajectory = [],
    filters_triggered = [],
  } = explain || {};

  const reasonsToShow = isFull ? reasons : reasons.slice(0, 2);
  const evidencePerReason = (r) => (isFull ? (r.evidence || []) : (r.evidence || []).slice(0, 1));
  const matchedSkills = isFull ? (skills.matched || []) : (skills.matched || []).slice(0, 3);

  return (
    <div aria-live="polite">
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 60 }}
      />

      {/* Right Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: "min(560px, 100%)",
          background: "#fff",
          borderLeft: "1px solid #e5e7eb",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.12)",
          zIndex: 61,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-semibold">Why this candidate</div>
          <SecondaryButton onClick={onClose}>Close</SecondaryButton>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto grid gap-4">
          {/* Match Summary */}
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">Match Summary</div>
              <div className="text-2xl font-bold text-[#FF7043]">{score}%</div>
            </div>
            {!!summary && <p className="text-sm text-slate-600 mt-1">{summary}</p>}
            <p className="mt-2 text-xs text-slate-500">
              AI-assisted rationale; recruiter reviews all reasoning.
            </p>
          </div>

          {/* Requirements → Evidence */}
          <div className="rounded-lg border bg-white p-4">
            <div className="font-medium mb-2">
              Requirements matched — {isFull ? "with evidence" : "top reasons"}
            </div>
            <div className="grid gap-3">
              {reasonsToShow.length === 0 ? (
                <div className="text-sm text-slate-500">No requirement mappings available.</div>
              ) : (
                reasonsToShow.map((r, idx) => (
                  <div key={idx} className="rounded border p-3">
                    <div className="text-sm font-semibold">Requirement: {r.requirement}</div>
                    <ul className="text-sm mt-1 grid gap-1">
                      {evidencePerReason(r).map((ev, i) => (
                        <li key={i} className="text-slate-700">
                          — <span className="italic">{ev.text}</span>
                          {ev.source ? <span className="text-slate-400"> ({ev.source})</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
            {!isFull && (
              <p className="text-xs text-slate-500 mt-2">
                You’re viewing WHY Lite. Add WHY Plus or upgrade to Enterprise for full evidence.
              </p>
            )}
          </div>

          {/* Skills */}
          <div className="rounded-lg border bg-white p-4">
            <div className="font-medium mb-2">Skills alignment</div>
            <div className={`grid ${isFull ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1"} gap-3 text-sm`}>
              <div>
                <div className="font-semibold mb-1">Matched</div>
                <ul className="grid gap-1">{(matchedSkills || []).map((s) => <li key={s}>• {s}</li>)}</ul>
              </div>
              {isFull && (
                <>
                  <div>
                    <div className="font-semibold mb-1">Gaps</div>
                    <ul className="grid gap-1">{(skills.gaps || []).map((s) => <li key={s}>• {s}</li>)}</ul>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Transferable</div>
                    <ul className="grid gap-1">{(skills.transferable || []).map((s) => <li key={s}>• {s}</li>)}</ul>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Career path (Full only) */}
          {isFull && (
            <div className="rounded-lg border bg-white p-4">
              <div className="font-medium mb-2">Career path</div>
              <ol className="text-sm grid gap-2">
                {trajectory.length === 0 ? (
                  <li className="text-slate-500">No work history found.</li>
                ) : (
                  trajectory.map((t, i) => (
                    <li key={`${t.title}-${t.company}-${i}`} className="grid gap-0.5">
                      <div className="font-semibold">
                        {t.title} — {t.company}
                      </div>
                      <div className="text-slate-600">
                        {t.from} → {t.to || "Present"}
                      </div>
                    </li>
                  ))
                )}
              </ol>
            </div>
          )}

          {/* Filters that triggered */}
          <div className="rounded-lg border bg-white p-4">
            <div className="font-medium mb-2">Matched your filters</div>
            <div className="flex flex-wrap gap-2">
              {(filters_triggered || []).length ? (
                (filters_triggered || []).map((f) => (
                  <span key={f} className="text-xs px-2 py-1 rounded-full border bg-[#FFEDE6] text-[#FF7043]">
                    {f}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">No filters triggered recorded.</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-end gap-2">
          {!isFull && <SecondaryButton href="#upgrade">Upgrade WHY</SecondaryButton>}
          <SecondaryButton onClick={onClose}>Close</SecondaryButton>
          {onViewCandidate ? (
            <PrimaryButton onClick={onViewCandidate}>View full candidate</PrimaryButton>
          ) : (
            <PrimaryButton href="#view-candidate">View full candidate</PrimaryButton>
          )}
        </div>
      </aside>
    </div>
  );
}
