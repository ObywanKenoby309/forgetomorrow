// components/ai/ATSAdvisor.js
'use client';

import { useState } from 'react';
import ATSScoreInfo from '@/components/ai/ATSScoreInfo';

export default function ATSAdvisor({ draft, title, company }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const hasDescription = !!draft && draft.trim().length > 0;

  const handleAnalyze = async () => {
    if (!hasDescription || loading) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/recruiter/ats-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: draft,
          title: (title || '').trim() || '(Untitled role)',
          company: company || '',
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      setResult(json);
    } catch (err) {
      setResult({
        error:
          err.message ||
          'We could not analyze this job description. Please try again in a moment.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 p-4 border border-slate-200 rounded-lg bg-slate-50">
      {/* Header row with title, helper text, action button, and ATS info modal trigger */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div>
          <p className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
            Step 2 — Sora ATS Insights
          </p>
          <p className="text-[11px] text-slate-700">
            Score, strengths, risk areas, and quick edits based on an ATS-style checklist.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!hasDescription || loading}
            className={`px-3 py-1.5 text-xs font-semibold rounded ${
              !hasDescription || loading
                ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {loading ? 'Analyzing…' : 'Analyze ATS fit'}
          </button>

          {/* "How this score works" info trigger */}
          <div className="flex items-center">
            <span className="text-[11px] text-slate-500 mr-1">
              How this score works
            </span>
            <ATSScoreInfo />
          </div>
        </div>
      </div>

      {!hasDescription && (
        <p className="mt-1 text-[11px] text-slate-600">
          Paste a job description above, then run ATS analysis.
        </p>
      )}

      {result && !result.error && (
        <div className="mt-3 space-y-3 text-xs text-slate-800">
          {/* Score + summary */}
          <div className="flex items-center gap-3 flex-wrap">
            {typeof result.score === 'number' && (
              <span className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white text-[11px] px-3 py-1 font-semibold">
                ATS strength: {result.score}/100
              </span>
            )}
            {result.summary && (
              <p className="text-[11px] text-slate-700 max-w-xl">{result.summary}</p>
            )}
          </div>

          {/* Strengths */}
          {Array.isArray(result.strengths) && result.strengths.length > 0 && (
            <div>
              <p className="font-semibold text-slate-900 mb-1">
                What you&apos;re already doing well
              </p>
              <ul className="list-disc pl-4 space-y-1">
                {result.strengths.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Issues */}
          {Array.isArray(result.issues) && result.issues.length > 0 && (
            <div>
              <p className="font-semibold text-slate-900 mb-1">
                Risk areas for ATS + candidate clarity
              </p>
              <ul className="list-disc pl-4 space-y-1">
                {result.issues.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {Array.isArray(result.suggestions) && result.suggestions.length > 0 && (
            <div>
              <p className="font-semibold text-slate-900 mb-1">
                Quick edits to make right now
              </p>
              <ul className="list-disc pl-4 space-y-1">
                {result.suggestions.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Keywords */}
          {Array.isArray(result.keywords) && result.keywords.length > 0 && (
            <div>
              <p className="font-semibold text-slate-900 mb-1">
                Detected keywords to keep / strengthen
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.keywords.map((k, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 rounded-full bg-white border border-slate-300 text-[11px]"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {result && result.error && (
        <p className="mt-2 text-[11px] text-red-600">{result.error}</p>
      )}
    </div>
  );
}
