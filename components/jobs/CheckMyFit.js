// components/jobs/CheckMyFit.js
import React, { useEffect, useState } from 'react';

function safe(v) { return String(v || '').trim(); }

export default function CheckMyFit({ job, onImproveResume, profileSignal }) {
  const [state, setState] = useState('idle');
  const [result, setResult] = useState(null);

  useEffect(() => {
    setState('idle');
    setResult(null);
  }, [job?.id]);

  if (!job) return null;

  const run = async () => {
    setState('loading');
    try {
      const response = await fetch('/api/jobs/check-fit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jdText: job.description || '',
          jobMeta: {
            title: job.title || '',
            company: job.company || '',
            location: job.location || '',
          },
        }),
      });
      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : { ok: false, error: await response.text() };

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || 'Alignment request failed');
      }

      if (data?.upgrade) {
        setResult({
          locked: true,
          message: data?.text || 'Monthly limit reached.',
          remaining: 0,
          limit: data?.limit,
        });
        setState('done');
        return;
      }

      const structured = data?.hammer?.structured || {};
      const improvementActions = Array.isArray(structured?.improvementActions)
        ? structured.improvementActions
        : [];

      // Score — from derived score returned by check-fit.js
      const score = typeof data?.resumeAlignScore === 'number'
        ? data.resumeAlignScore
        : null;

      // Profile vs Role — from profileSignal prop (already computed, free)
      const profileVsRole = typeof profileSignal?.score === 'number'
        ? profileSignal.score
        : null;

      // Summary — from matchAssessment first, then fallbacks
      const summary =
        structured?.matchAssessment ||
        structured?.summary ||
        data?.hammer?.text ||
        'ForgeTomorrow analyzed your resume against this role.';

      // Strongest signal — ONLY from positive evidence, never from gaps
      const positiveAction = improvementActions.find(a => {
        const impact = String(a?.hiringImpact || '').toLowerCase();
        return impact.includes('strength') ||
               impact.includes('strong') ||
               impact.includes('confirms') ||
               impact.includes('demonstrates');
      });
      // If no genuinely positive action found, check resumeEvidence on any action
      // that isn't a screen-out — adjacent/transferable evidence counts as a strength
      const adjacentAction = !positiveAction
        ? improvementActions.find(a => {
            const impact = String(a?.hiringImpact || '').toLowerCase();
            return !impact.includes('screen-out') &&
                   !impact.includes('screening risk') &&
                   !impact.includes('disqualify') &&
                   safe(a?.resumeEvidence).length > 10;
          })
        : null;

      const strongest = positiveAction
        ? safe(positiveAction.resumeEvidence || positiveAction.requiredSignal)
        : adjacentAction
        ? safe(adjacentAction.resumeEvidence)
        : '';

      // Biggest gap — ONLY from screen-out actions
      const gapAction = improvementActions.find(a => {
        const impact = String(a?.hiringImpact || '').toLowerCase();
        return impact.includes('screen-out') || impact.includes('screening risk');
      });
      const biggestGap = gapAction
        ? safe(gapAction.requiredSignal)
        : safe(structured?.signalGaps?.[0] || '');

console.log('[CheckMyFit] improvementActions:', JSON.stringify(improvementActions, null, 2));

      setResult({
        score,
        profileVsRole,
        strongest,
        biggestGap,
        summary,
        remaining: data?.remaining,
        limit: data?.limit,
        raw: data?.hammer,
      });
      setState('done');
    } catch (err) {
      console.error('[CheckMyFit] error', err);
      setState('error');
    }
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
        }}
      >
        ⚡ Check My Alignment
      </button>
    );
  }

  if (state === 'loading') {
    return (
      <div style={{
        width: '100%',
        padding: '14px 16px',
        borderRadius: 12,
        border: '1px solid #E0E0E0',
        background: '#FAFAFA',
        color: '#607D8B',
        fontSize: 13,
        fontWeight: 700,
      }}>
        Running resume vs JD alignment...
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div style={{
        borderRadius: 12,
        border: '1px solid rgba(211,47,47,0.20)',
        background: 'rgba(211,47,47,0.06)',
        padding: '12px 14px',
        color: '#D32F2F',
        fontSize: 13,
        fontWeight: 700,
      }}>
        Could not analyze this role right now.
      </div>
    );
  }

  if (state === 'done' && result?.locked) {
    return (
      <div style={{
        borderRadius: 12,
        border: '1px solid rgba(255,112,67,0.20)',
        background: 'rgba(255,112,67,0.06)',
        padding: '14px 16px',
        color: '#455A64',
        fontSize: 13,
        lineHeight: 1.6,
      }}>
        <div style={{ fontWeight: 800, marginBottom: 6 }}>Monthly limit reached</div>
        <div>{result.message}</div>
      </div>
    );
  }

  if (state === 'done' && result) {
    const scoreText = typeof result.score === 'number' ? `${result.score}%` : '—';
    return (
      <div style={{
        borderRadius: 14,
        border: '1px solid rgba(255,112,67,0.20)',
        background: 'rgba(255,112,67,0.06)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 54, height: 54, borderRadius: 999,
            border: '2px solid #FF7043',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 18, color: '#FF7043',
            background: 'rgba(255,112,67,0.12)',
          }}>
            {scoreText}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#112033' }}>
              Resume vs Role
            </div>
            <div style={{ marginTop: 2, fontSize: 11, color: '#607D8B' }}>
              Profile vs Role: {result.profileVsRole ?? '—'}%
            </div>
          </div>
        </div>

        {result.summary && (
          <div style={{ fontSize: 13, lineHeight: 1.6, color: '#455A64' }}>
            {result.summary}
          </div>
        )}

        {result.strongest && (
          <div style={{
            borderRadius: 10, padding: '10px 12px',
            background: 'rgba(22,163,74,0.06)',
            border: '1px solid rgba(22,163,74,0.16)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#16A34A', marginBottom: 4, textTransform: 'uppercase' }}>
              Strongest Alignment
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.5, color: '#455A64' }}>
              {result.strongest}
            </div>
          </div>
        )}

        {result.biggestGap && (
          <div style={{
            borderRadius: 10, padding: '10px 12px',
            background: 'rgba(211,47,47,0.05)',
            border: '1px solid rgba(211,47,47,0.16)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#D32F2F', marginBottom: 4, textTransform: 'uppercase' }}>
              Biggest Gap
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.5, color: '#455A64' }}>
              {result.biggestGap}
            </div>
          </div>
        )}

        {typeof onImproveResume === 'function' && (
          <button
            type="button"
            onClick={() => onImproveResume(job, result)}
            style={{
              width: '100%', background: '#1A4B8F', color: 'white',
              padding: '10px 16px', borderRadius: 10, border: 'none',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}
          >
            Improve Resume Alignment
          </button>
        )}

        <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', lineHeight: 1.5 }}>
          Remaining this month: {result.remaining ?? '—'} / {result.limit ?? '—'}
        </div>
      </div>
    );
  }

  return null;
}