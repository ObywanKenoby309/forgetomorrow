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

export default function CheckMyFit({ job, onImproveResume, profileSignal }) {
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
      const resumeScore = typeof job.match === 'number' ? Math.round(job.match) : null;
      const profScore = typeof profileSignal?.score === 'number' ? profileSignal.score : null;

      const reasons = toArray(job.alignmentReasons).map(x => String(x || '').trim()).filter(Boolean);
      const gaps = toArray(job.alignmentGaps).map(x => String(x || '').trim()).filter(Boolean);
      const evidence = toArray(job.alignmentEvidence);

      // Strongest resume signal
      const skillEvidence = evidence.find(item => lower(item?.label || '').includes('skill'));
      const ecosystemEvidence = evidence.find(item => lower(item?.label || '').includes('ecosystem'));
      const strongestSignals = [];
      if (skillEvidence?.text) strongestSignals.push(`Matched skills: ${skillEvidence.text}`);
      if (ecosystemEvidence?.text) strongestSignals.push(`Shared capability signals: ${ecosystemEvidence.text}`);
      if (reasons.length && !strongestSignals.length) strongestSignals.push(reasons[0]);

      // Primary resume gap
      const primaryResumeGap = gaps[0] || (
        resumeScore !== null && resumeScore < 60
          ? 'Your resume shows transferable signals, but some role-specific evidence is currently limited.'
          : ''
      );

      // Profile signal insight
      const profilePriority = profileSignal?.breakdown?.priority;
      const profileInsight = profilePriority
        ? `Your profile's biggest opportunity: ${profilePriority.label} — ${profilePriority.gapReason}`
        : profScore !== null && profScore < 50
        ? 'Your profile signal is below average. Strengthening your headline, summary, and portfolio will improve your overall alignment score.'
        : profScore !== null && profScore >= 75
        ? 'Your profile signal is strong — recruiters can validate your background and availability.'
        : 'Adding more portfolio projects with measurable outcomes will strengthen your profile signal.';

      // Overall summary
      const overallScore = resumeScore !== null && profScore !== null
        ? Math.round(resumeScore * 0.65 + profScore * 0.35)
        : resumeScore ?? profScore ?? null;

      const summary = overallScore >= 75
        ? 'Your background strongly aligns with this role across both resume evidence and profile depth.'
        : overallScore >= 60
        ? 'You show meaningful alignment. Strengthening either your resume or profile signal will move you into strong territory.'
        : overallScore !== null && overallScore > 0
        ? 'You have overlapping signals, but there are noticeable gaps between your current profile and this role.'
        : 'ForgeTomorrow could not detect strong alignment signals for this opportunity yet.';

      setResult({
        resumeScore,
        profScore,
        overallScore,
        summary,
        strongestSignals,
        primaryResumeGap,
        profileInsight,
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
    const color = result.overallScore >= 75 ? '#43A047' : result.overallScore >= 60 ? '#FF7043' : '#D32F2F';
    return (
      <div style={{
        borderRadius: 14,
        border: `1.5px solid ${color}22`,
        background: `${color}08`,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {/* Score row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 999, flexShrink: 0,
            background: `${color}18`, border: `2px solid ${color}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontWeight: 900, fontSize: 18, color, lineHeight: 1 }}>
              {result.overallScore ?? '—'}
            </span>
            <span style={{ fontSize: 9, color, fontWeight: 700 }}>%</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#112033' }}>
              {result.overallScore >= 75 ? 'Strong alignment' : result.overallScore >= 60 ? 'Moderate alignment' : 'Low alignment'}
            </div>
            <div style={{ fontSize: 11, color: '#607D8B', marginTop: 2 }}>
              Resume {result.resumeScore ?? '—'}% · Profile {result.profScore ?? '—'}%
            </div>
          </div>
          <button
            type="button"
            onClick={() => { setState('idle'); setResult(null); }}
            style={{ background: 'none', border: 'none', color: '#90A4AE', fontSize: 18, cursor: 'pointer' }}
            aria-label="Dismiss"
          >×</button>
        </div>

        {/* Summary */}
        {result.summary && (
          <p style={{ margin: 0, fontSize: 13, color: '#37474F', lineHeight: 1.5 }}>
            {result.summary}
          </p>
        )}

        {/* Strongest resume signals */}
        {result.strongestSignals?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#112033', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Strongest Signals
            </div>
            {result.strongestSignals.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: '#455A64', lineHeight: 1.5 }}>
                <span style={{ color: '#43A047', fontWeight: 900, marginTop: 1 }}>✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}

        {/* Primary resume gap */}
        {result.primaryResumeGap && (
          <div style={{
            borderRadius: 10, border: '1px solid rgba(211,47,47,0.16)',
            background: 'rgba(211,47,47,0.05)', padding: '10px 12px',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#D32F2F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Resume Gap
            </div>
            <div style={{ fontSize: 12, color: '#455A64', lineHeight: 1.5 }}>
              {result.primaryResumeGap}
            </div>
          </div>
        )}

        {/* Profile signal insight */}
        {result.profileInsight && (
          <div style={{
            borderRadius: 10, border: '1px solid rgba(22,163,74,0.18)',
            background: 'rgba(22,163,74,0.05)', padding: '10px 12px',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Profile Signal
            </div>
            <div style={{ fontSize: 12, color: '#455A64', lineHeight: 1.5 }}>
              {result.profileInsight}
            </div>
          </div>
        )}

        {/* CTA */}
        {typeof onImproveResume === 'function' && (
          <button
            type="button"
            onClick={() => onImproveResume(job, result)}
            style={{
              marginTop: 2, width: '100%',
              background: '#1A4B8F', color: 'white',
              padding: '10px 16px', borderRadius: 10, border: 'none',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(26,75,143,0.25)',
            }}
          >
            Improve Resume Alignment →
          </button>
        )}

        <p style={{ margin: 0, fontSize: 10, color: '#90A4AE' }}>
          Overall score weights resume alignment 65% and profile signal 35% for role-specific opportunities.
        </p>
      </div>
    );
  }

  return null;
}
