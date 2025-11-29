// components/ai/WHYScoreInfo.js
'use client';

import { useEffect, useRef, useState } from "react";

export default function WHYScoreInfo() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const closeRef = useRef(null);

  // Close on ESC
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus close button
  useEffect(() => {
    if (open && closeRef.current) {
      closeRef.current.focus();
    }
  }, [open]);

  return (
    <>
      {/* Trigger icon */}
      <button
        ref={triggerRef}
        onClick={() => setOpen(true)}
        aria-label="About this WHY match score"
        className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF7043]"
      >
        i
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6 bg-black/40"
          aria-modal="true"
          role="dialog"
        >
          {/* backdrop */}
          <button className="absolute inset-0" onClick={() => setOpen(false)} />

          <div className="relative z-[121] bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b px-5 py-3">
              <div>
                <h2 className="text-sm font-semibold">About the WHY Match Score</h2>
                <p className="text-xs text-slate-500">
                  How ForgeTomorrow explains candidate–job alignment.
                </p>
              </div>
              <button
                ref={closeRef}
                onClick={() => setOpen(false)}
                className="p-1 rounded-full text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF7043]"
              >
                ✕
              </button>
            </div>

            {/* BODY */}
            <div className="px-5 py-4 text-xs leading-relaxed max-h-[70vh] overflow-y-auto space-y-3">
              <p>
                The WHY Match Score shows how closely a candidate aligns with a specific job
                based on skills, experience, keywords, and the job’s true requirements.
              </p>

              <p className="font-semibold text-slate-900">What the score measures</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <span className="font-semibold">Skill alignment</span> — how well the
                  candidate’s technical or functional skills match the role.
                </li>
                <li>
                  <span className="font-semibold">Experience fit</span> — depth and relevance
                  of past job titles, responsibilities, and achievements.
                </li>
                <li>
                  <span className="font-semibold">Keyword overlap</span> — matches between
                  both descriptions that signal role-relevant experience.
                </li>
                <li>
                  <span className="font-semibold">Evidence mapping</span> — highlights real
                  lines or sections from the candidate's history that justify the match.
                </li>
                <li>
                  <span className="font-semibold">Risk flags</span> — areas where alignment
                  appears weak, incomplete, or ambiguous.
                </li>
              </ul>

              <p className="font-semibold text-slate-900">Why this matters</p>
              <p>
                WHY explanations reveal *exactly* why a candidate appears in your search or
                recommendation — offering full transparency and trust in the match.
              </p>

              <p className="font-semibold text-slate-900">Important note</p>
              <p>
                ForgeTomorrow’s WHY system does <span className="font-semibold">not</span>{" "}
                make decisions. It highlights relevant evidence to assist recruiter judgment,
                not replace it. Final decisions remain fully human-driven.
              </p>
            </div>

            {/* FOOTER */}
            <div className="border-t px-5 py-3 flex justify-end">
              <button
                onClick={() => setOpen(false)}
                className="border border-slate-300 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-slate-50 text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
