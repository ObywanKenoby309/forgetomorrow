// components/jobs/CheckMyFit.js
// On-demand ATS alignment — shown only on the detail panel/screen.
// User taps "Check My Fit", we run the API, show inline result.

import React, { useEffect, useState } from 'react';

export default function CheckMyFit({ job, onImproveResume }) {
  const [state, setState] = useState('idle'); // 'idle' | 'loading' | 'done' | 'error'
  const [result, setResult] = useState(null);
  useEffect(() => {
  setState('idle');
  setResult(null);
}, [job?.id]);

  if (!job) return null;

 const run = async () => {
  setState('loading');

  try {
    const score =
      typeof job.match === 'number'
        ? Math.round(job.match)
        : null;

    const evidence = Array.isArray(job.alignmentEvidence)
      ? job.alignmentEvidence
      : [];

    const reasons = Array.isArray(job.alignmentReasons)
      ? job.alignmentReasons
      : [];

    const gaps = Array.isArray(job.alignmentGaps)
      ? job.alignmentGaps
      : [];

    setResult({
      score,
      summary:
        reasons[0] ||
        'ForgeTomorrow analyzed your profile, portfolio, and primary resume against this opportunity.',

      recommendations: [
        ...evidence.map((e) => e.text),
        ...gaps,
      ].slice(0, 5),
    });

    setState('done');
  } catch (err) {
    console.error('[CheckMyFit] alignment explanation error', err);
    setState('error');
  }
};

  const scoreColor = (score) => {
    if (score >= 80) return '#43A047';
    if (score >= 60) return '#FF7043';
    return '#D32F2F';
  };

  const scoreLabel = (score) => {
    if (score >= 80) return 'Strong fit';
    if (score >= 60) return 'Moderate fit';
    return 'Needs work';
  };

  /* ── idle ── */
  if (state === 'idle') {
    return (
      <button
        type="button"
        onClick={run}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '11px 16px',
          borderRadius: 12,
          border: '1.5px solid rgba(255,112,67,0.35)',
          background: 'rgba(255,112,67,0.06)',
          color: '#FF7043',
          fontWeight: 800, fontSize: 13,
          cursor: 'pointer',
          transition: 'all 150ms ease',
        }}
      >
        <span style={{ fontSize: 16 }}>⚡</span>
        Explain My Alignment
      </button>
    );
  }

  /* ── loading ── */
  if (state === 'loading') {
    return (
      <div style={{
        width: '100%', padding: '14px 16px', borderRadius: 12,
        border: '1px solid #E0E0E0', background: '#FAFAFA',
        display: 'flex', alignItems: 'center', gap: 10,
        color: '#90A4AE', fontSize: 13, fontWeight: 600,
      }}>
        <span style={{
          display: 'inline-block', width: 16, height: 16, borderRadius: 999,
          border: '2px solid #FF7043', borderTopColor: 'transparent',
          animation: 'spin 0.7s linear infinite',
        }} />
        Analysing your profile against this role…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── done ── */
  if (state === 'done' && result) {
    const sc = result.score;
    const color = sc !== null ? scoreColor(sc) : '#607D8B';

    return (
      <div style={{
        borderRadius: 14, border: `1.5px solid ${color}22`,
        background: `${color}08`, padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {/* Score row */}
        {sc !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 999, flexShrink: 0,
              background: `${color}18`,
              border: `2px solid ${color}`,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontWeight: 900, fontSize: 18, color, lineHeight: 1 }}>{sc}</span>
              <span style={{ fontSize: 9, color, fontWeight: 700, letterSpacing: '0.04em' }}>%</span>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#112033' }}>
                {scoreLabel(sc)}
              </div>
              <div style={{ fontSize: 12, color: '#607D8B', marginTop: 1 }}>
                Profile and resume alignment score
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setState('idle'); setResult(null); }}
              style={{
                marginLeft: 'auto', background: 'none', border: 'none',
                color: '#90A4AE', fontSize: 18, cursor: 'pointer', lineHeight: 1,
              }}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {/* Summary */}
        {result.summary && (
          <p style={{ margin: 0, fontSize: 13, color: '#37474F', lineHeight: 1.5 }}>
            {result.summary}
          </p>
        )}

        {/* Recommendations */}
        {result.recommendations?.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#112033', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Resume tweaks
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {result.recommendations.map((rec, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                  fontSize: 12, color: '#455A64', lineHeight: 1.5,
                }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 999, flexShrink: 0,
                    background: '#FF7043', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800, marginTop: 1,
                  }}>
                    {i + 1}
                  </span>
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {typeof onImproveResume === 'function' && (
          <button
            type="button"
            onClick={() => onImproveResume(job, result)}
            style={{
              marginTop: 4, width: '100%',
              background: '#1A4B8F', color: 'white',
              padding: '10px 16px', borderRadius: 10, border: 'none',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(26,75,143,0.25)',
            }}
          >
            Improve Alignment →
          </button>
        )}

        <p style={{ margin: 0, fontSize: 10, color: '#90A4AE' }}>
          AI-assisted guidance. You control what gets added before you apply.
        </p>
      </div>
    );
  }

  return null;
}