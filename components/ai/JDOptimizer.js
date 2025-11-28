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
        const msg = json.error || `JD optimize API failed (status ${res.status})`;
        console.error('[JDOptimizer] API error', { status: res.status, body: json || text });
        onOptimize(`ERROR: ${msg}`);
        return;
      }

      if (!json || typeof json.response !== 'string') {
        console.error('[JDOptimizer] Missing "response" field in API result', json);
        onOptimize('ERROR: JD builder did not return text. Check /api/ai/generate implementation.');
        return;
      }

      onOptimize(json.response);
    } catch (err) {
      console.error('[JDOptimizer] Network or unexpected error', err);
      onOptimize('ERROR: Could not reach Grok JD Builder. Check console/network logs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-purple-900 uppercase tracking-wide">
          Step 1 — Grok JD Builder
        </p>
        <button
          type="button"
          onClick={optimize}
          disabled={!hasDraft || loading}
          className="px-4 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
        >
          {loading ? 'Optimizing…' : 'Run Grok JD Builder'}
        </button>
      </div>
      <p className="mt-1 text-[11px] text-purple-700">
        Rewrites your draft to be clearer, more compelling, and ATS-aware. Then run{' '}
        <span className="font-semibold">Sora ATS Insights</span> to get a score and concrete fixes.
      </p>
    </div>
  );
}
