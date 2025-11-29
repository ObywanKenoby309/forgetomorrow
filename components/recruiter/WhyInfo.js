// components/recruiter/WhyInfo.js
import { useState } from "react";

export default function WhyInfo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger Icon */}
      <button
        onClick={() => setOpen(true)}
        className="w-4 h-4 flex items-center justify-center rounded-full text-white font-bold"
        style={{
          backgroundColor: "#FF7043",
          minWidth: "1rem",
          minHeight: "1rem",
          padding: "0",
          fontSize: "0.7rem",
          lineHeight: "0",
        }}
        aria-label="Explainability Information"
      >
        i
      </button>

      {/* Modal */}
      {open && (
        <div aria-live="polite">
          {/* Overlay */}
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* Modal Container */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 border">
              <h2 className="text-xl font-bold text-[#FF7043] mb-2">
                How ForgeTomorrow Computes “WHY”
              </h2>

              <p className="text-sm text-slate-700 leading-relaxed">
                Our explainability engine maps your job’s requirements to the
                candidate’s skills, experience, and written achievements. Every
                match is backed by extracted evidence — transparent, traceable,
                and reviewable by recruiters at every step.
              </p>

              <ul className="mt-3 text-sm text-slate-700 list-disc pl-5 space-y-1">
                <li>Matches your requirements to real resume text</li>
                <li>Extracts evidence for each skill or requirement</li>
                <li>Highlights gaps and transferable strengths</li>
                <li>Never ranks candidates without showing “why”</li>
                <li>Your review overrides AI suggestions — always</li>
              </ul>

              <div className="mt-4 text-xs text-slate-500">
                Transparent AI. No black boxes. No surprises.
                You’re always in control.
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 rounded border text-sm bg-white hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
