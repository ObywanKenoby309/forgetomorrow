// components/jobs/MobileJobDetail.js
// Full-screen push view for mobile. Animates in from the right.

import React, { useEffect } from 'react';
import JobActions from './JobActions';

function inferLocationType(location) {
  if (!location) return '';
  const l = location.toLowerCase();
  if (l.includes('remote')) return 'Remote';
  if (l.includes('hybrid')) return 'Hybrid';
  return 'On-site';
}

export default function MobileJobDetail({
  job,
  onBack,
  getJobStatus,
  isInternalJob,
  getJobTier,
  isJobPinned,
  hasApplied,
  isPaidUser,
  onApply,
  onResumeAlign,
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!job) return null;

  const status       = getJobStatus(job);
  const internal     = isInternalJob(job);
  const tier         = getJobTier(job);
  const isFtOfficial = tier === 'ft-official';
  const isPartner    = tier === 'partner';
  const isDark       = isFtOfficial || isPartner;

  const sourceLabel  = internal ? 'Forge recruiter' : 'External';
  const chipLabel    = isFtOfficial
    ? 'ForgeTomorrow official posting'
    : internal ? 'ForgeTomorrow recruiter posting' : null;

  const headerBg     = isFtOfficial
    ? 'linear-gradient(135deg, #FF7043, #FF8A65)'
    : isPartner
    ? 'linear-gradient(135deg, #0B1724, #162236)'
    : 'rgba(255,255,255,0.92)';

  const titleColor   = isDark ? '#FFFFFF' : '#112033';
  const subtleColor  = isDark ? '#CFD8DC' : '#607D8B';
  const bodyColor    = '#37474F';

  const raw        = (job.description || '').replace(/<[^>]*>/g, '');
  const paragraphs = raw.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      display: 'flex', flexDirection: 'column',
      background: '#F4F6F8',
    }}>
      {/* ── Sticky header ── */}
      <div style={{
        flexShrink: 0,
        background: headerBg,
        backdropFilter: !isDark ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: !isDark ? 'blur(12px)' : 'none',
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
        padding: '12px 16px 14px',
      }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
            border: 'none', borderRadius: 999,
            padding: '6px 12px 6px 8px',
            color: isDark ? 'rgba(255,255,255,0.85)' : '#546E7A',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>←</span>
          Back to jobs
        </button>

        {chipLabel && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 999, marginBottom: 8,
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(17,32,51,0.85)',
            fontSize: 11, color: '#FFCC80', fontWeight: 700,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: '#FF7043', flexShrink: 0 }} />
            {chipLabel}
          </div>
        )}

        <h1 style={{
          margin: '0 0 4px', fontWeight: 900, fontSize: 20,
          color: titleColor, lineHeight: 1.25, letterSpacing: '-0.3px',
        }}>
          {job.title}
        </h1>

        <div style={{ fontSize: 13, color: subtleColor, fontWeight: 500, marginBottom: 10 }}>
          {job.company}{job.location ? ` — ${job.location}` : ''}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {inferLocationType(job.location || '') && (
            <span style={{
              fontSize: 11, padding: '3px 9px', borderRadius: 999,
              border: '1px solid rgba(207,216,220,0.5)',
              background: isDark ? 'rgba(38,50,56,0.70)' : 'rgba(0,0,0,0.06)',
              color: isDark ? '#ECEFF1' : '#546E7A', fontWeight: 600,
            }}>
              {inferLocationType(job.location || '')}
            </span>
          )}

          <span style={{
            fontSize: 11, padding: '3px 9px', borderRadius: 999,
            border: '1px solid rgba(207,216,220,0.5)',
            background: isDark ? 'rgba(38,50,56,0.70)' : 'rgba(0,0,0,0.06)',
            color: isDark ? '#ECEFF1' : '#546E7A', fontWeight: 600,
          }}>
            {sourceLabel}
          </span>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        <div>
          {paragraphs.length === 0 ? (
            <p style={{ margin: 0, color: bodyColor, fontSize: 14, lineHeight: 1.7, fontStyle: 'italic' }}>
              No description provided.
            </p>
          ) : (
            paragraphs.map((para, idx) => (
              <p key={idx} style={{
                margin: idx === 0 ? '0 0 12px' : '12px 0 0',
                color: bodyColor, fontSize: 14, lineHeight: 1.7,
              }}>
                {para}
              </p>
            ))
          )}
        </div>

        <div style={{ height: 100 }} />
      </div>

      {/* ── Fixed action bar at bottom ── */}
      {status === 'Open' && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'rgba(244,246,248,0.96)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(0,0,0,0.08)',
          padding: '12px 16px 28px',
          zIndex: 61,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <button
            type="button"
            onClick={() => onApply(job)}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: '#FF7043',
              color: 'white',
              border: 'none',
              borderRadius: 14,
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(255,112,67,0.40)',
              letterSpacing: '-0.2px',
            }}
          >
            Apply Now
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            {isPaidUser && (
              <button
                type="button"
                onClick={() => onResumeAlign(job)}
                style={{
                  flex: 1,
                  padding: '11px 14px',
                  background: 'white',
                  color: '#FF7043',
                  border: '1.5px solid #FF7043',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Resume-Role Align
              </button>
            )}

            <JobActions
              job={job}
              isPinned={isJobPinned(job)}
              onApply={onApply}
              onResumeAlign={onResumeAlign}
              isPaidUser={false}
              showViewPost={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}