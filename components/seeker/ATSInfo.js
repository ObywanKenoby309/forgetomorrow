// components/seeker/ATSInfo.js
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export default function ATSInfo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Orange "i" badge */}
      <button
        onClick={() => setOpen(true)}
        aria-label="About ATS alignment"
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: '#FF7043',
          color: 'white',
          fontSize: 14,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: 'none',
          marginLeft: 6,
        }}
      >
        i
      </button>

      {/* Modal */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border bg-white p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold" style={{ color: '#263238' }}>
                ATS Alignment Help
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-500 hover:text-black"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-slate-700 mb-3">
              ATS Alignment gives you a fast, AI-assisted score showing how well your
              resume or profile matches a job posting.
            </p>

            <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
              <li>Analyzes your skills against the job requirements</li>
              <li>Estimates your match score (0–100%)</li>
              <li>Explains the top reasons for the score</li>
              <li>Suggests resume bullet improvements to help you match better</li>
            </ul>

            <p className="text-xs text-slate-500 mt-3">
              This is a guidance tool — no ATS system can guarantee results, but this
              helps you see how you appear from a recruiter’s perspective.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
