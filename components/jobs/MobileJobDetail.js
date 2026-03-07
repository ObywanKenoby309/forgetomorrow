// components/jobs/MobileJobDetail.js
// Full-screen push view for mobile. Animates in from the right.

import React, { useEffect } from 'react';
import PinnedJobToggleButton from './PinnedJobToggleButton';

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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        background: '#F4F6F8',
      }}
    >
      {/* ── Sticky header ── */}
      <div
        style={{
          flexShrink: 0,
          background: headerBg,
          backdropFilter: !isDark ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: !isDark ? 'blur(12px)' : 'none',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
          padding: '12px 16px 14px',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
            border: 'none',
            borderRadius: 999,
            padding: '6px 12px 6px 8px',
            color: isDark ? 'rgba(255,255,255,0.85)' : '#546E7A',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>←</span>
          Back to jobs
        </button>

        {chipLabel && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 10px',
              borderRadius: 999,
              marginBottom: 8,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(17,32,51,0.85)',
              fontSize: 11,
              color: '#FFCC80',
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: 999,
                background: '#FF7043',
                flexShrink: 0,
              }}
            />
            {chipLabel}
          </div>
        )}

        <h1
          style={{
            margin: '0 0 4px',
            fontWeight: 900,
            fontSize: 20,
            color: titleColor,
            lineHeight: 1.25,
            letterSpacing: '-0.3px',
          }}
        >
          {job.title}
        </h1>

        <div
          style={{
            fontSize: 13,
            color: subtleColor,
            fontWeight: 500,
            marginBottom: 10,
          }}
        >
          {job.company}{job.location ? ` — ${job.location}` : ''}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {inferLocationType(job.location || '') && (
            <span
              style={{
                fontSize: 11,
                padding: '3px 9px',
                borderRadius: 999,
                border: '1px solid rgba(207,216,220,0.5)',
                background: isDark ? 'rgba(38,50,56,0.70)' : 'rgba(0,0,0,0.06)',
                color: isDark ? '#ECEFF1' : '#546E7A',
                fontWeight: 600,
              }}
            >
              {inferLocationType(job.location || '')}
            </span>
          )}

          <span
            style={{
              fontSize: 11,
              padding: '3px 9px',
              borderRadius: 999,
              border: '1px solid rgba(207,216,220,0.5)',
              background: isDark ? 'rgba(38,50,56,0.70)' : 'rgba(0,0,0,0.06)',
              color: isDark ? '#ECEFF1' : '#546E7A',
              fontWeight: 600,
            }}
          >
            {sourceLabel}
          </span>

          {status && status !== 'Open' && (
            <span
              style={{
                fontSize: 11,
                padding: '3px 9px',
                borderRadius: 999,
                border: '1px solid #FFCC80',
                background: status === 'Reviewing' ? '#FFF3E0' : '#ECEFF1',
                color: status === 'Reviewing' ? '#E65100' : '#607D8B',
                fontWeight: 700,
              }}
            >
              {status === 'Reviewing' ? 'Reviewing applicants' : status}
            </span>
          )}
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div
  style={{
    flex: 1,
    overflowY: 'auto',
    paddingTop: 20,
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 220,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  }}
>
        <div>
          {paragraphs.length === 0 ? (
            <p
              style={{
                margin: 0,
                color: bodyColor,
                fontSize: 14,
                lineHeight: 1.7,
                fontStyle: 'italic',
              }}
            >
              No description provided.
            </p>
          ) : (
            paragraphs.map((para, idx) => (
              <p
                key={idx}
                style={{
                  margin: idx === 0 ? '0 0 12px' : '12px 0 0',
                  color: bodyColor,
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                {para}
              </p>
            ))
          )}
        </div>

        {status === 'Reviewing' && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid #FFCC80',
              background: '#FFF3E0',
              fontSize: 13,
              color: '#E65100',
            }}
          >
            <p style={{ margin: 0, fontWeight: 700 }}>
              {hasApplied ? 'Thank you for applying.' : 'Reviewing applicants now.'}
            </p>
            <p style={{ margin: '4px 0 0', lineHeight: 1.5 }}>
              {hasApplied
                ? "This employer is reviewing applicants. You'll hear directly if selected."
                : 'New applications are paused.'}
            </p>
          </div>
        )}

        {status === 'Closed' && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid #CFD8DC',
              background: '#ECEFF1',
              fontSize: 13,
              color: '#546E7A',
            }}
          >
            <p style={{ margin: 0, fontWeight: 700 }}>
              {hasApplied ? 'Thank you for applying.' : 'This posting is now closed.'}
            </p>
            <p style={{ margin: '4px 0 0', lineHeight: 1.5 }}>
              {hasApplied
                ? 'If selected for next steps, the employer will reach out directly.'
                : 'Stay tuned for future opportunities.'}
            </p>
          </div>
        )}

      </div>

      {/* ── Fixed 3-button action row above mobile toolbar ── */}
      {status === 'Open' && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 68,
            background: 'rgba(244,246,248,0.96)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(0,0,0,0.08)',
            padding: '10px 12px',
            zIndex: 61,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isPaidUser ? '1fr 1.35fr 72px' : '1fr 72px',
              gap: 10,
              width: '100%',
              maxWidth: 560,
              margin: '0 auto',
              alignItems: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => onApply(job)}
              style={{
                width: '100%',
                minWidth: 0,
                padding: '14px 12px',
                background: '#FF7043',
                color: 'white',
                border: 'none',
                borderRadius: 14,
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(255,112,67,0.32)',
                letterSpacing: '-0.1px',
                whiteSpace: 'nowrap',
              }}
            >
              Apply
            </button>

            {isPaidUser && (
              <button
                type="button"
                onClick={() => onResumeAlign(job)}
                style={{
                  width: '100%',
                  minWidth: 0,
                  padding: '14px 12px',
                  background: 'white',
                  color: '#FF7043',
                  border: '1.5px solid #FF7043',
                  borderRadius: 14,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Resume Align
              </button>
            )}

            <div
              style={{
                width: 72,
                height: 56,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  transform: 'scale(1.45)',
                  transformOrigin: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PinnedJobToggleButton
                  jobId={job.id}
                  initiallyPinned={isJobPinned(job)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}