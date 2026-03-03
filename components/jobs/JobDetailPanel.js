// components/jobs/JobDetailPanel.js
import React from 'react';
import JobActions from './JobActions';
import CheckMyFit from './CheckMyFit';

function inferLocationType(location) {
  if (!location) return '';
  const l = location.toLowerCase();
  if (l.includes('remote')) return 'Remote';
  if (l.includes('hybrid')) return 'Hybrid';
  return 'On-site';
}

export default function JobDetailPanel({
  job,
  getJobStatus,
  isInternalJob,
  getJobTier,
  isJobPinned,
  hasApplied,
  isPaidUser,
  onApply,
  onResumeAlign,
  onImproveResume,  // called after CheckMyFit result to launch resume builder
}) {
  if (!job) {
    return (
      <div style={{
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 10, padding: 40,
        background: 'rgba(255,255,255,0.70)',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        borderRadius: 16, border: '1px solid rgba(255,255,255,0.30)',
      }}>
        <div style={{ fontSize: 36 }}>💼</div>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#112033' }}>Select a job</div>
        <div style={{ fontSize: 13, color: '#78909C', textAlign: 'center', maxWidth: 200 }}>
          Choose a role from the list to view full details here.
        </div>
      </div>
    );
  }

  const status        = getJobStatus(job);
  const internal      = isInternalJob(job);
  const tier          = getJobTier(job);
  const isFtOfficial  = tier === 'ft-official';
  const isPartner     = tier === 'partner';
  const isDark        = isFtOfficial || isPartner;

  const sourceLabel   = internal ? 'Forge recruiter' : 'External';
  const chipLabel     = isFtOfficial
    ? 'ForgeTomorrow official posting'
    : internal ? 'ForgeTomorrow recruiter posting' : null;

  const detailBg      = isFtOfficial
    ? 'linear-gradient(145deg, #FF7043, #FF8A65)'
    : isPartner
    ? 'linear-gradient(145deg, #0B1724, #112033)'
    : 'rgba(255,255,255,0.92)';

  const detailBorder  = isFtOfficial
    ? '2px solid #FF7043'
    : isPartner
    ? '1px solid rgba(255,112,67,0.45)'
    : '1px solid rgba(224,224,224,0.80)';

  const titleColor    = isDark ? '#FFFFFF' : '#112033';
  const subtleColor   = isDark ? '#CFD8DC' : '#607D8B';
  const bodyColor     = isDark ? '#ECEFF1' : '#37474F';

  // Parse description into paragraphs
  const raw        = (job.description || '').replace(/<[^>]*>/g, '');
  const paragraphs = raw.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%',
      background: detailBg,
      borderRadius: 16,
      border: detailBorder,
      boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.30)' : '0 4px 20px rgba(0,0,0,0.08)',
      backdropFilter: !isDark ? 'blur(10px)' : 'none',
      WebkitBackdropFilter: !isDark ? 'blur(10px)' : 'none',
      overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <div style={{ padding: '18px 20px 14px', flexShrink: 0 }}>
        {chipLabel && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '3px 10px', borderRadius: 999, marginBottom: 10,
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'linear-gradient(135deg, #0B1724, #112033)',
            fontSize: 11, color: '#FFCC80', fontWeight: 700,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: '#FF7043', flexShrink: 0 }} />
            {chipLabel}
          </div>
        )}

        <h2 style={{
          margin: '0 0 4px', fontWeight: 900, fontSize: 20,
          color: titleColor, lineHeight: 1.25, letterSpacing: '-0.3px',
        }}>
          {job.title}
        </h2>

        <div style={{ fontSize: 14, color: subtleColor, fontWeight: 500, marginBottom: 10 }}>
          {job.company}{job.location ? ` — ${job.location}` : ''}
        </div>

        {/* Tag pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {inferLocationType(job.location || '') && (
            <span style={{
              fontSize: 11, padding: '3px 9px', borderRadius: 999,
              border: '1px solid rgba(207,216,220,0.6)',
              background: isDark ? 'rgba(38,50,56,0.70)' : 'rgba(0,0,0,0.05)',
              color: isDark ? '#ECEFF1' : '#546E7A', fontWeight: 600,
            }}>
              {inferLocationType(job.location || '')}
            </span>
          )}
          <span style={{
            fontSize: 11, padding: '3px 9px', borderRadius: 999,
            border: '1px solid rgba(207,216,220,0.6)',
            background: isDark ? 'rgba(38,50,56,0.70)' : 'rgba(0,0,0,0.05)',
            color: isDark ? '#ECEFF1' : '#546E7A', fontWeight: 600,
          }}>
            {sourceLabel}
          </span>
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)', flexShrink: 0 }} />

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Job description */}
        <div>
          {paragraphs.length === 0 ? (
            <p style={{ margin: 0, color: bodyColor, fontSize: 14, lineHeight: 1.7, fontStyle: 'italic' }}>
              No description provided.
            </p>
          ) : (
            paragraphs.map((para, idx) => (
              <p key={idx} style={{
                margin: idx === 0 ? '0 0 10px' : '10px 0 0',
                color: bodyColor, fontSize: 14, lineHeight: 1.7,
              }}>
                {para}
              </p>
            ))
          )}
        </div>

        {/* Check My Fit — only when open */}
        {status === 'Open' && isPaidUser && (
          <CheckMyFit job={job} onImproveResume={onImproveResume} />
        )}
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)', flexShrink: 0 }} />

      {/* ── Action zone — pinned to bottom ── */}
      <div style={{ padding: '14px 20px 18px', flexShrink: 0 }}>
        {status === 'Open' && (
          <JobActions
            job={job}
            isPinned={isJobPinned(job)}
            onApply={onApply}
            onResumeAlign={onResumeAlign}
            isPaidUser={isPaidUser}
            showViewPost={false}
          />
        )}

        {status === 'Reviewing' && (
          <div style={{
            padding: '10px 12px', borderRadius: 10,
            border: '1px solid #FFCC80', background: '#FFF3E0',
            fontSize: 12, color: '#E65100',
          }}>
            <p style={{ margin: 0, fontWeight: 700 }}>
              {hasApplied ? 'Thank you for applying.' : 'Reviewing applicants now.'}
            </p>
            <p style={{ margin: '4px 0 0' }}>
              {hasApplied
                ? 'This employer is reviewing applicants. You'll hear directly if selected.'
                : 'New applications are paused. Thank you to everyone who applied.'}
            </p>
          </div>
        )}

        {status === 'Closed' && (
          <div style={{
            padding: '10px 12px', borderRadius: 10,
            border: '1px solid #CFD8DC', background: '#ECEFF1',
            fontSize: 12, color: '#546E7A',
          }}>
            <p style={{ margin: 0, fontWeight: 700 }}>
              {hasApplied ? 'Thank you for applying.' : 'This posting is now closed.'}
            </p>
            <p style={{ margin: '4px 0 0' }}>
              {hasApplied
                ? 'If selected for next steps, the employer will reach out directly.'
                : 'Stay tuned for future opportunities from this employer.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}