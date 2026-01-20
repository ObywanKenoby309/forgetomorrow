// components/ai/JDOptimizer.js
'use client';
import { useState } from 'react';

export default function JDOptimizer({ draft, title, onOptimize }) {
  const [loading, setLoading] = useState(false);

  const hasDraft = !!draft && draft.trim().length > 0;

  const optimize = async () => {
    if (!hasDraft || loading) return;
    setLoading(true);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'optimizeJD',
          input: draft,
          title,
        }),
      });

      const text = await res.text();
      let json = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch (err) {
        console.error('[JDOptimizer] Failed to parse JSON from /api/ai/generate', {
          error: err,
          rawBody: text,
        });
      }

      if (!res.ok) {
        const msg = json.error || `Description refinement failed (status ${res.status})`;
        console.error('[JDOptimizer] API error', { status: res.status, body: json || text });
        onOptimize(`ERROR: ${msg}`);
        return;
      }

      if (!json || typeof json.response !== 'string') {
        console.error('[JDOptimizer] Missing "response" field in API result', json);
        onOptimize('ERROR: The refinement tool did not return text. Check /api/ai/generate.');
        return;
      }

      onOptimize(json.response);
    } catch (err) {
      console.error('[JDOptimizer] Network or unexpected error', err);
      onOptimize('ERROR: Could not reach the refinement service. Check console/network logs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
          Description Refinement
        </p>
        <button
          type="button"
          onClick={optimize}
          disabled={!hasDraft || loading}
          className={`px-4 py-1.5 text-xs font-semibold rounded ${
            !hasDraft || loading
              ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
              : 'bg-[#FF7043] text-white hover:bg-[#F4511E]'
          }`}
        >
          {loading ? 'Refining…' : 'Refine description'}
        </button>
      </div>

      <p className="mt-1 text-[11px] text-slate-700">
        Improves structure and clarity while preserving the intent of your draft. After refining, run the review below to spot
        confusion points and quick edits.
      </p>
    </div>
  );
}
