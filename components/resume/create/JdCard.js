// components/resume/create/JdCard.js
import { useRef } from 'react';

export default function JdCard({
  jd,
  setJd,
  busy,
  error,
  onImportFile,
  onAnalyze,
  onAssist,
}) {
  const fileInputRef = useRef(null);

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-base font-semibold text-gray-800">
          Job description (optional)
        </h3>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportFile?.(f);
              // reset so picking the same file twice still triggers
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[13px] font-medium border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50"
          >
            Import JD (PDF/DOCX/TXT)
          </button>
        </div>
      </div>

      {/* body */}
      <div className="px-4 pb-3">
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the job description here to tailor your resume & enable ATS checks…"
          className="w-full h-36 border border-gray-300 rounded-lg p-3 text-sm resize-y outline-none focus:ring-2 focus:ring-[#FF7043]/40"
          disabled={busy}
        />
        {!!error && (
          <div className="text-xs text-red-600 mt-2">{String(error)}</div>
        )}

        <div className="text-xs text-gray-500 mt-2">
          Tip: Drag & drop a JD file anywhere on this card.
        </div>

        {/* actions */}
        <div className="flex flex-wrap gap-8 items-center mt-3">
          <div className="flex gap-2">
            {/* secondary */}
            <button
              type="button"
              onClick={onAssist}
              className="border border-gray-300 bg-white font-medium rounded-lg px-3 py-2 hover:bg-gray-50"
              disabled={busy}
            >
              AI assist (free)
            </button>

            {/* secondary */}
            <button
              type="button"
              onClick={onAnalyze}
              className="border border-gray-300 bg-white font-medium rounded-lg px-3 py-2 hover:bg-gray-50"
              disabled={busy}
            >
              Analyze JD
            </button>
          </div>

          {/* primary */}
          <button
            type="button"
            onClick={() =>
              document
                .getElementById('template-select')
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
            className="bg-[#FF7043] text-white font-semibold rounded-lg px-4 py-2 shadow-sm hover:brightness-95 disabled:opacity-50"
            disabled={busy}
          >
            Continue to Cover →
          </button>
        </div>
      </div>
    </section>
  );
}
