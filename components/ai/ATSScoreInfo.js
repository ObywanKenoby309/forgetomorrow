// components/ai/ATSScoreInfo.js
'use client';

import { useEffect, useRef, useState } from 'react';

export default function ATSScoreInfo() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const closeRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // Focus the close button when the modal opens
  useEffect(() => {
    if (open && closeRef.current) {
      closeRef.current.focus();
    }
  }, [open]);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    // Return focus to trigger for accessibility
    if (triggerRef.current) {
      triggerRef.current.focus();
    }
  };

  return (
    <>
      {/* Trigger button – little "i" icon */}
      <button
        type="button"
        ref={triggerRef}
        onClick={handleOpen}
        className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF7043]"
        aria-label="About the ATS score"
        aria-haspopup="dialog"
        aria-expanded={open ? 'true' : 'false'}
      >
        i
      </button>

      {/* Modal dialog */}
      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6 bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ats-info-title"
        >
          {/* Backdrop click closes */}
          <button
            type="button"
            className="absolute inset-0 w-full h-full cursor-default"
            onClick={handleClose}
            aria-hidden="true"
          />

          <div className="relative z-[121] w-full max-w-lg rounded-xl bg-white shadow-xl border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-3">
              <div>
                <h2
                  id="ats-info-title"
                  className="text-sm font-semibold text-slate-900"
                >
                  About this ATS Score
                </h2>
                <p className="text-xs text-slate-500">
                  How ForgeTomorrow estimates job description readiness.
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={handleClose}
                className="ml-3 rounded-full p-1 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF7043]"
              >
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[70vh] overflow-y-auto px-5 py-4 text-xs leading-relaxed text-slate-700 space-y-3">
              <p>
                The ATS Score estimates how easily a job description can be
                parsed and ranked by modern Applicant Tracking Systems (ATS) and
                understood quickly by recruiters and candidates.
              </p>

              <p className="font-semibold text-slate-900">
                What the score measures
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <span className="font-semibold">Core structure</span> – checks
                  for pieces like title, worksite, employment type,
                  responsibilities, requirements, and compensation.
                </li>
                <li>
                  <span className="font-semibold">Keyword coverage</span> – looks
                  for important skills, tools, and domain keywords that match
                  the role family.
                </li>
                <li>
                  <span className="font-semibold">Clarity & specificity</span> –
                  rewards concrete, scannable responsibilities and requirements
                  instead of vague or generic language.
                </li>
                <li>
                  <span className="font-semibold">ATS parsing friendliness</span>{' '}
                  – favors clean bullets, consistent headings, and minimal
                  formatting that could confuse parsers.
                </li>
                <li>
                  <span className="font-semibold">Transparency signals</span> –
                  gives credit when you include worksite, seniority, and
                  compensation information.
                </li>
                <li>
                  <span className="font-semibold">Keyword balance</span> – aims
                  for keywords that are present but not over-stuffed.
                </li>
              </ul>

              <p className="font-semibold text-slate-900">
                How to read the score
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  <span className="font-semibold">95–100:</span> Recruiter-ready.
                  Strong clarity, structure, and keyword alignment.
                </li>
                <li>
                  <span className="font-semibold">80–94:</span> Strong ATS
                  foundation. A few clarity or detail improvements may still
                  help.
                </li>
                <li>
                  <span className="font-semibold">60–79:</span> Functional but
                  could benefit from tighter wording, better structure, or more
                  specific skills.
                </li>
                <li>
                  <span className="font-semibold">0–59:</span> High-risk range.
                  Missing details or unclear structure may hurt visibility in
                  real ATS systems.
                </li>
              </ul>

              <p className="font-semibold text-slate-900">
                Why the score can change
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Rewrites add or clarify responsibilities and requirements.</li>
                <li>
                  New keywords, tools, or frameworks make the role more
                  discoverable.
                </li>
                <li>
                  Adjusting worksite, seniority, or compensation improves
                  transparency signals.
                </li>
              </ul>

              <p className="font-semibold text-slate-900">Important note</p>
              <p>
                Every ATS uses its own algorithms, so no score can guarantee a
                specific ranking in any one system. ForgeTomorrow&apos;s ATS
                Insights provide a best-practice estimate and concrete editing
                suggestions, not a promise of performance in a particular tool
                or legal/DEI review.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF7043]"
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
