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
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
              <h2 className="text-xl font-black text-[#FF7043] mb-2">
                How ForgeTomorrow Computes “WHY”
              </h2>

              <p className="text-sm text-slate-700 leading-relaxed">
                ForgeTomorrow evaluates professional positioning, execution evidence,
                transferable capability, recruiter readiness, and portfolio intelligence
                using explainable reasoning systems. Every signal shown is evidence-backed
                and recruiter-reviewable.
              </p>

              <ul className="mt-4 text-sm text-slate-700 list-disc pl-5 space-y-2">
                <li>Portfolio-first professional intelligence for recruiter discovery</li>
                <li>Evidence-backed capability interpretation</li>
                <li>Transferable strength and validation analysis</li>
                <li>Transparent recruiter-facing reasoning and signal visibility</li>
                <li>Recruiters always control final hiring decisions</li>
              </ul>

              <div className="mt-5 rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs leading-relaxed text-slate-600">
                Internal recruiter search prioritizes portfolio and professional identity
                signals first. Primary resume evidence supports the review.
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
