// components/ai/JDOptimizer.js
'use client';
import { useState } from 'react';

export default function JDOptimizer({ draft, title, onOptimize }) {
  const [loading, setLoading] = useState(false);

  const optimize = async () => {
  if (!draft.trim()) return;
  setLoading(true);

  try {
    const res = await fetch('/api/recruiter/jd-optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        draft,
        title,
        company, 
        location,
        worksite,
        employmentType,
        compensation,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      onOptimize('Failed to optimize.');
      return;
    }

    onOptimize(data.optimizedDescription);
  } catch (err) {
    onOptimize('Failed to optimize.');
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-purple-900">
          AI JD Optimizer (ATS + Engagement)
        </p>
        <button
          onClick={optimize}
          disabled={loading || !draft}
          className="px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
        >
          {loading ? 'Optimizing...' : 'Optimize JD'}
        </button>
      </div>
      <p className="mt-1 text-xs text-purple-700">
        Rewrites your draft to beat ATS and attract top talent
      </p>
    </div>
  );
}