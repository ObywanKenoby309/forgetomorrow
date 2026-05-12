// components/jobs/CheckMyFit.js
// On-demand alignment explanation shown only on the job detail panel.
// Uses the existing card alignment score and evidence. Hammer handles resume-only JD alignment.

import React, { useEffect, useState } from 'react';

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function lower(value) {
  return String(value || '').trim().toLowerCase();
}

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

      const evidence = toArray(job.alignmentEvidence);

      const reasons = toArray(job.alignmentReasons)
        .map((x) => String(x || '').trim())
        .filter(Boolean);

      const gaps = toArray(job.alignmentGaps)
        .map((x) => String(x || '').trim())
        .filter(Boolean);

      const skillEvidence = evidence.find(
        (item) =>
          lower(item?.label || '').includes('skill')
      );

      const ecosystemEvidence = evidence.find(
        (item) =>
          lower(item?.label || '').includes('ecosystem')
      );

      const strongestSignals = [];

      if (skillEvidence?.text) {
        strongestSignals.push(
          `Matched skills: ${skillEvidence.text}`
        );
      }

      if (ecosystemEvidence?.text) {
        strongestSignals.push(
          `Shared capability signals: ${ecosystemEvidence.text}`
        );
      }

      const digestibleSummary =
        score >= 80
          ? 'Your background strongly aligns with this role based on your profile and primary resume.'
          : score >= 60
          ? 'You show meaningful alignment, but some experience areas could be strengthened.'
          : score > 0
          ? 'You have some overlapping signals, but there are noticeable gaps between your current profile and this role.'
          : 'ForgeTomorrow could not detect strong alignment signals for this opportunity yet.';

      setResult({
        score,
        summary: digestibleSummary,
        strongestSignals,
        reasons,
        gaps,
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
    if (score >= 80) return 'Strong alignment';
    if (score >= 60) return 'Moderate alignment';
    if (score > 0) return 'Low alignment';
    return 'No clear alignment yet';
  };

  if (state === 'idle') {
    return (
      <button
        type="button"
        onClick={run}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '11px 16px',
          borderRadius: 12,
          border: '1.5px solid rgba(255,112,67,0.35)',
          background: 'rgba(255,112,67,0.06)',
          color: '#FF7043',
          fontWeight: 800,
          fontSize: 13,
          cursor: 'pointer',
          transition: 'all 150ms ease',
        }}
      >
        <span style={{ fontSize: 16 }}>⚡</span>
        Explain My Alignment
      </button>
    );
  }

  if (state === 'loading') {
    return (
      <div
        style={{
          width: '100%',
          padding: '14px 16px',
          borderRadius: 12,
          border: '1px solid #E0E0E0',
          background: '#FAFAFA',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: '#90A4AE',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 16,
            height: 16,
            borderRadius: 999,
            border: '2px solid #FF7043',
            borderTopColor: 'transparent',
            animation: 'spin 0.7s linear infinite',
          }}
        />
        Explaining your alignment for this role...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div
        style={{
          borderRadius: 12,
          border: '1px solid rgba(211,47,47,0.20)',
          background: 'rgba(211,47,47,0.06)',
          padding: '12px 14px',
          color: '#D32F2F',
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        Could not explain alignment for this role. Please try again.
      </div>
    );
  }

  if (state === 'done' && result) {
    const sc = result.score;
    const color = sc !== null ? scoreColor(sc) : '#607D8B';

    return (
      <div
        style={{
          borderRadius: 14,
          border: `1.5px solid ${color}22`,
          background: `${color}08`,
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {sc !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 999,
                flexShrink: 0,
                background: `${color}18`,
                border: `2px solid ${color}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontWeight: 900, fontSize: 18, color, lineHeight: 1 }}>{sc}</span>
              <span style={{ fontSize: 9, color, fontWeight: 700, letterSpacing: '0.04em' }}>%</span>
            </div>

            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#112033' }}>
                {scoreLabel(sc)}
              </div>
              <div style={{ fontSize: 12, color: '#607D8B', marginTop: 1 }}>
                Profile, portfolio, preferences, and primary resume alignment
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setState('idle');
                setResult(null);
              }}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: '#90A4AE',
                fontSize: 18,
                cursor: 'pointer',
                lineHeight: 1,
              }}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {result.summary && (
          <p style={{ margin: 0, fontSize: 13, color: '#37474F', lineHeight: 1.5 }}>
            {result.summary}
          </p>
        )}

        {result.strongestSignals?.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: '#112033',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Strongest Signals
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {result.strongestSignals.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-start',
                    fontSize: 12,
                    color: '#455A64',
                    lineHeight: 1.5,
                  }}
                >
                  <span
                    style={{
                      color: '#43A047',
                      fontWeight: 900,
                      marginTop: 1,
                    }}
                  >
                    ✓
                  </span>

                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {typeof onImproveResume === 'function' && (
          <button
            type="button"
            onClick={() => onImproveResume(job, result)}
            style={{
              marginTop: 4,
              width: '100%',
              background: '#1A4B8F',
              color: 'white',
              padding: '10px 16px',
              borderRadius: 10,
              border: 'none',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(26,75,143,0.25)',
            }}
          >
            Improve Resume Alignment →
          </button>
        )}

        <p style={{ margin: 0, fontSize: 10, color: '#90A4AE' }}>
          This explains the card alignment score. Hammer reviews resume-only alignment for this JD.
        </p>
      </div>
    );
  }

  return null;
}
