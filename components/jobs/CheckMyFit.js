// components/jobs/CheckMyFit.js
// On-demand alignment explanation shown only on the job detail panel.
// Quick truth preview — score, largest strength, largest gap, CTA to Hammer.
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

      const why = data?.why || {};
	  console.log('[CheckMyFit] why gaps:', why?.gaps, why?.signals?.not_yet_demonstrated, why?.skills?.gaps);
      const score = typeof why?.score === 'number' ? why.score : null;
      const profileVsRole = typeof profileSignal?.score === 'number' ? profileSignal.score : null;

      const largestStrength = safe(data?.strengthSentence || '');
	  const largestGap = safe(data?.gapSentence || '');

      setResult({
        score,
        profileVsRole,
        largestStrength,
        largestGap,
        remaining: data?.remaining,
        limit: data?.limit,
      });
      setState('done');
    } catch (err) {
      console.error('[CheckMyFit] error', err);
      setState('error');
    }
  };

  // ── Idle ──
  if (state === 'idle') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          type="button"
          onClick={run}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '11px 16px', borderRadius: 12,
            border: '1.5px solid rgba(255,112,67,0.35)',
            background: 'rgba(255,112,67,0.06)',
            color: '#FF7043', fontWeight: 800, fontSize: 13, cursor: 'pointer',
          }}
        >
          ⚡ Check My Alignment
        </button>
        <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', lineHeight: 1.5 }}>
          Resume vs JD · Free: 3/month · Pro: 15/month
        </div>
      </div>
    );
  }

  // ── Loading ──
  if (state === 'loading') {
    return (
      <div style={{
        width: '100%', padding: '14px 16px', borderRadius: 12,
        border: '1px solid #E0E0E0', background: '#FAFAFA',
        display: 'flex', alignItems: 'center', gap: 10,
        color: '#607D8B', fontSize: 13, fontWeight: 700,
      }}>
        <span style={{
          display: 'inline-block', width: 16, height: 16, borderRadius: 999,
          border: '2px solid #FF7043', borderTopColor: 'transparent',
          animation: 'spin 0.7s linear infinite', flexShrink: 0,
        }} />
        Analyzing your resume against this role...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Error ──
  if (state === 'error') {
    return (
      <div style={{
        borderRadius: 12, border: '1px solid rgba(211,47,47,0.20)',
        background: 'rgba(211,47,47,0.06)', padding: '12px 14px',
        color: '#D32F2F', fontSize: 13, fontWeight: 700,
      }}>
        Could not analyze this role right now. Please try again.
      </div>
    );
  }

  // ── Locked ──
  if (state === 'done' && result?.locked) {
    return (
      <div style={{
        borderRadius: 12, border: '1px solid rgba(255,112,67,0.20)',
        background: 'rgba(255,112,67,0.06)', padding: '14px 16px',
        color: '#455A64', fontSize: 13, lineHeight: 1.6,
      }}>
        <div style={{ fontWeight: 800, marginBottom: 6 }}>Monthly limit reached</div>
        <div>{result.message}</div>
      </div>
    );
  }

  // ── Result ──
  if (state === 'done' && result) {
    const scoreColor = result.score >= 75 ? '#16A34A' : result.score >= 50 ? '#FF7043' : '#DC2626';
    const scoreText = typeof result.score === 'number' ? `${result.score}%` : '—';

    return (
      <div style={{
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.22)',
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 12,
        boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
      }}>

        {/* Score row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 999, flexShrink: 0,
            border: `2px solid ${scoreColor}`,
            background: `${scoreColor}14`,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontWeight: 900, fontSize: 15, color: scoreColor, lineHeight: 1 }}>
              {scoreText}
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#112033' }}>
              Resume vs Role
            </div>
            {result.profileVsRole !== null && (
              <div style={{ fontSize: 11, color: '#607D8B', marginTop: 2 }}>
                Profile vs Role: {result.profileVsRole}%
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => { setState('idle'); setResult(null); }}
            style={{ background: 'none', border: 'none', color: '#90A4AE', fontSize: 20, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}
            aria-label="Dismiss"
          >×</button>
        </div>

        {/* Largest strength */}
        {result.largestStrength && (
          <div style={{
            borderRadius: 10, padding: '10px 12px',
            background: 'rgba(22,163,74,0.06)',
            border: '1px solid rgba(22,163,74,0.16)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#16A34A', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Largest Strength
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.55, color: '#374151' }}>
              {result.largestStrength}
            </div>
          </div>
        )}

        {/* Largest gap */}
        {result.largestGap && (
          <div style={{
            borderRadius: 10, padding: '10px 12px',
            background: 'rgba(220,38,38,0.05)',
            border: '1px solid rgba(220,38,38,0.16)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#DC2626', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Largest Gap
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.55, color: '#374151' }}>
              {result.largestGap}
            </div>
          </div>
        )}

        {/* CTA */}
        {typeof onImproveResume === 'function' && (
          <button
            type="button"
            onClick={() => onImproveResume(job, result)}
            style={{
              width: '100%', background: '#1A4B8F', color: 'white',
              padding: '10px 16px', borderRadius: 10, border: 'none',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(26,75,143,0.20)',
            }}
          >
            Improve Resume Alignment →
          </button>
        )}

        {/* Usage */}
        <div style={{ fontSize: 10, color: '#94A3B8', textAlign: 'center', lineHeight: 1.5 }}>
          {result.remaining ?? '—'} of {result.limit ?? '—'} uses remaining this month
        </div>
      </div>
    );
  }

  return null;
}