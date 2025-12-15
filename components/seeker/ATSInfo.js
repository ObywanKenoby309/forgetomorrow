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
        aria-label="About Resume-Role Alignment"
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
                Resume-Role Alignment
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-500 hover:text-black"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-slate-700 mb-3">
              Resume-Role Alignment is a quick AI helper that shows how well your resume
              lines up with this job.
            </p>

            <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
              <li>Highlights key skills and keywords from the job</li>
              <li>Shows where your resume is strong or light</li>
              <li>Suggests simple edits you can make before applying</li>
            </ul>

            <p className="text-xs text-slate-500 mt-3">
              This is a guidance tool - it cannot guarantee results, but it can help you
              tune your resume for each role.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
