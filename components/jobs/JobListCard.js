// components/jobs/JobListCard.js
// ForgeTomorrow — mobile-first job card.
// Desktop: fixed 150px scannable strip (unchanged behavior).
// Mobile: breathing card with company accent, alignment score pill,
//         and a clean chip row — no fixed height, no truncation.
import React from 'react';

const ORANGE = '#FF7043';

function inferLocationType(location) {
  if (!location) return '';
  const lower = location.toLowerCase();
  if (lower.includes('remote')) return 'Remote';
  if (lower.includes('hybrid')) return 'Hybrid';
  return 'On-site';
}

// ── Desktop card (original layout, unchanged) ────────────────────────────────
function DesktopCard({ job, isSelected, onClick, getJobStatus, isInternalJob, showSearchRelevance }) {
  const location     = job.location || '';
  const locationType = inferLocationType(location);
  const internal     = isInternalJob(job);
  const displaySource = internal ? 'Forge' : 'External';

  let postedLabel = 'Date not provided';
  if (job.publishedat) {
    const d = new Date(job.publishedat);
    if (!Number.isNaN(d.getTime())) {
      postedLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  const hasSearchRelevance = showSearchRelevance && typeof job.match === 'number' && job.match >= 0;
  const relevanceScore     = hasSearchRelevance ? Math.round(job.match) : null;

  return (
    <article
      onClick={onClick}
      style={{
        cursor: 'pointer',
        border: isSelected ? `2px solid ${ORANGE}` : '1px solid #E5E7EB',
        background: '#FFFFFF',
        borderRadius: 18,
        padding: '16px 16px 14px',
        minHeight: 150,
        height: 150,
        boxSizing: 'border-box',
        boxShadow: isSelected ? '0 6px 18px rgba(255,112,67,0.18)' : '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 74px', gap: 12, alignItems: 'start' }}>
        <div style={{ minWidth: 0 }}>
          <div title={job.title || ''} style={{
            fontSize: 16, fontWeight: 800, lineHeight: 1.2, color: '#0F172A',
            minHeight: 40, maxHeight: 40, overflow: 'hidden',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>{job.title}</div>
          <div title={job.company || ''} style={{
            marginTop: 8, fontSize: 13, fontWeight: 600, color: '#607D8B',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', height: 18,
          }}>{job.company}</div>
        </div>
        <div style={{ textAlign: 'right', width: 74, flexShrink: 0 }}>
          {typeof relevanceScore === 'number' && (
            <div style={{ fontSize: 9, textTransform: 'uppercase', color: '#78909C', fontWeight: 800, letterSpacing: '0.04em', lineHeight: 1.1 }}>
              Search<br />Relevance
            </div>
          )}
          <div style={{ marginTop: 3, fontSize: 16, lineHeight: 1, fontWeight: 900, color: ORANGE }}>
            {typeof relevanceScore === 'number' ? `${relevanceScore}%` : ''}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2, minHeight: 34, maxHeight: 34, overflow: 'hidden' }}>
        <div title={location} style={{ fontSize: 13, color: '#607D8B', lineHeight: 1.3, minHeight: 16, maxHeight: 32, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{location}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#546E7A', height: 18, display: 'flex', alignItems: 'center' }}>
          Posted {postedLabel}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap', minHeight: 24, marginTop: -2 }}>
        <span style={{ padding: '4px 10px', borderRadius: 999, border: '1px solid #D5DCE1', background: '#F8FAFC', fontSize: 12, color: '#546E7A', fontWeight: 600, whiteSpace: 'nowrap' }}>{locationType}</span>
        <span style={{ padding: '4px 10px', borderRadius: 999, border: '1px solid #D5DCE1', background: '#F8FAFC', fontSize: 12, color: '#546E7A', fontWeight: 600, whiteSpace: 'nowrap' }}>{displaySource}</span>
      </div>
    </article>
  );
}

// ── Mobile card (intentional mobile-first design) ────────────────────────────
function MobileCard({ job, isSelected, onClick, getJobStatus, isInternalJob, getJobTier, showSearchRelevance }) {
  const location      = job.location || '';
  const locationType  = inferLocationType(location);
  const internal      = isInternalJob(job);
  const tier          = getJobTier ? getJobTier(job) : 'external';
  const isFtOfficial  = tier === 'ft-official';
  const isPartner     = tier === 'partner';
  const displaySource = internal ? 'Forge' : 'External';

  // Alignment score — from WHY engine signal attached post-fetch
  const alignScore    = typeof job?.jdProfileSignal?.score === 'number'
    ? Math.round(job.jdProfileSignal.score)
    : null;
  const searchScore   = showSearchRelevance && typeof job.match === 'number'
    ? Math.round(job.match)
    : null;

  let postedLabel = '';
  if (job.publishedat) {
    const d = new Date(job.publishedat);
    if (!Number.isNaN(d.getTime())) {
      const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
      if (diffDays === 0)       postedLabel = 'Today';
      else if (diffDays === 1)  postedLabel = 'Yesterday';
      else if (diffDays < 7)    postedLabel = `${diffDays}d ago`;
      else if (diffDays < 30)   postedLabel = `${Math.floor(diffDays / 7)}w ago`;
      else                       postedLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  const cardTone = isFtOfficial
    ? {
        accent: `linear-gradient(180deg, ${ORANGE}, #FF5722)`,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,244,238,0.96))',
        border: '1px solid rgba(255,112,67,0.24)',
        sourceColor: ORANGE,
        sourceBg: 'rgba(255,112,67,0.10)',
        sourceBorder: 'rgba(255,112,67,0.24)',
        sourceLabel: '⚡ Forge Official',
      }
    : isPartner || internal
    ? {
        accent: 'linear-gradient(180deg, #1A4B8F, #0B1724)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(241,247,255,0.96))',
        border: '1px solid rgba(26,75,143,0.22)',
        sourceColor: '#1A4B8F',
        sourceBg: 'rgba(26,75,143,0.08)',
        sourceBorder: 'rgba(26,75,143,0.18)',
        sourceLabel: 'Forge Recruiter',
      }
    : {
        accent: 'linear-gradient(180deg, rgba(100,116,139,0.32), rgba(100,116,139,0.10))',
        background: 'rgba(255,255,255,0.96)',
        border: '1px solid rgba(15,23,42,0.08)',
        sourceColor: '#78909C',
        sourceBg: 'rgba(15,23,42,0.035)',
        sourceBorder: 'rgba(15,23,42,0.08)',
        sourceLabel: displaySource,
      };

  const scoreToShow = alignScore !== null ? alignScore : searchScore;
  const scoreLabel = alignScore !== null ? 'Align' : searchScore !== null ? 'Match' : null;
  const scoreColor = scoreToShow === null
    ? '#94A3B8'
    : alignScore !== null
    ? scoreToShow >= 75 ? '#16A34A' : scoreToShow >= 50 ? ORANGE : '#DC2626'
    : '#64748B';

  return (
    <article
      onClick={onClick}
      style={{
        cursor: 'pointer',
        background: cardTone.background,
        borderRadius: 22,
        border: isSelected ? '1.5px solid rgba(15,23,42,0.24)' : cardTone.border,
        boxShadow: isSelected
          ? '0 8px 22px rgba(15,23,42,0.12)'
          : '0 8px 24px rgba(15,23,42,0.08)',
        overflow: 'hidden',
        display: 'flex',
        position: 'relative',
        transition: 'box-shadow 0.18s ease, border-color 0.18s ease, transform 0.18s ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Left accent bar — communicates job source, not selected state */}
      <div style={{ width: 5, flexShrink: 0, background: cardTone.accent }} />

      {/* Card body */}
      <div style={{ flex: 1, minWidth: 0, padding: '15px 14px 13px 13px' }}>
        {/* Source / date strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
          <span style={{
            fontSize: 10,
            fontWeight: 900,
            color: cardTone.sourceColor,
            background: cardTone.sourceBg,
            border: `1px solid ${cardTone.sourceBorder}`,
            borderRadius: 999,
            padding: '3px 9px',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
          }}>
            {cardTone.sourceLabel}
          </span>
          {postedLabel && (
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#94A3B8', whiteSpace: 'nowrap' }}>
              {postedLabel}
            </span>
          )}
        </div>

        {/* Top row: title + score */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, justifyContent: 'space-between' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 16,
              fontWeight: 900,
              color: '#0F172A',
              lineHeight: 1.22,
              letterSpacing: '-0.25px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {job.title}
            </div>
            <div style={{
              marginTop: 5,
              fontSize: 13,
              fontWeight: 750,
              color: '#607D8B',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textTransform: 'capitalize',
            }}>
              {job.company}
            </div>
          </div>

          {/* Alignment/search score badge — shows the FT intelligence when available */}
          {scoreToShow !== null && (
            <div style={{
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 50,
              borderRadius: 16,
              background: alignScore !== null
                ? scoreToShow >= 75
                  ? 'rgba(22,163,74,0.08)'
                  : scoreToShow >= 50
                  ? 'rgba(255,112,67,0.08)'
                  : 'rgba(220,38,38,0.07)'
                : 'rgba(100,116,139,0.07)',
              border: `1.5px solid ${
                alignScore !== null
                  ? scoreToShow >= 75
                    ? 'rgba(22,163,74,0.22)'
                    : scoreToShow >= 50
                    ? 'rgba(255,112,67,0.22)'
                    : 'rgba(220,38,38,0.20)'
                  : 'rgba(100,116,139,0.18)'
              }`,
            }}>
              <div style={{ fontSize: 15, fontWeight: 950, lineHeight: 1, color: scoreColor }}>
                {scoreToShow}%
              </div>
              <div style={{ fontSize: 8, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3, textAlign: 'center', lineHeight: 1.1 }}>
                {scoreLabel}
              </div>
            </div>
          )}
        </div>

        {/* Location */}
        {location ? (
          <div style={{
            marginTop: 9,
            fontSize: 12,
            color: '#78909C',
            fontWeight: 650,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}>
            <svg width="10" height="12" viewBox="0 0 10 12" fill="none" style={{ flexShrink: 0, opacity: 0.62 }}>
              <path d="M5 0A4 4 0 001 4C1 7.5 5 12 5 12S9 7.5 9 4A4 4 0 005 0zm0 5.5A1.5 1.5 0 113.5 4 1.5 1.5 0 015 5.5z" fill="currentColor"/>
            </svg>
            {location}
          </div>
        ) : null}

        {/* Bottom chip row */}
        <div style={{ marginTop: 11, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          {locationType && (
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#546E7A',
              background: 'rgba(84,110,122,0.08)',
              border: '1px solid rgba(84,110,122,0.16)',
              borderRadius: 999,
              padding: '4px 10px',
            }}>
              {locationType}
            </span>
          )}

          {isSelected && (
            <span style={{
              fontSize: 10,
              fontWeight: 850,
              color: '#64748B',
              background: 'rgba(100,116,139,0.08)',
              border: '1px solid rgba(100,116,139,0.14)',
              borderRadius: 999,
              padding: '4px 9px',
              marginLeft: 'auto',
              whiteSpace: 'nowrap',
            }}>
              Last viewed
            </span>
          )}
        </div>
      </div>

      {/* Right arrow — indicates tappable */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        paddingRight: 12,
        color: isSelected ? '#64748B' : '#CBD5E1',
        fontSize: 18,
        fontWeight: 900,
        transition: 'color 0.15s',
      }}>
        ›
      </div>
    </article>
  );
}

// ── Export — responsive wrapper ───────────────────────────────────────────────
export default function JobListCard({
  job,
  isSelected,
  onClick,
  getJobStatus,
  isInternalJob,
  getJobTier,
  showSearchRelevance = false,
  isMobile = false,
}) {
  if (!job) return null;

  if (isMobile) {
    return (
      <MobileCard
        job={job}
        isSelected={isSelected}
        onClick={onClick}
        getJobStatus={getJobStatus}
        isInternalJob={isInternalJob}
        getJobTier={getJobTier}
        showSearchRelevance={showSearchRelevance}
      />
    );
  }

  return (
    <DesktopCard
      job={job}
      isSelected={isSelected}
      onClick={onClick}
      getJobStatus={getJobStatus}
      isInternalJob={isInternalJob}
      showSearchRelevance={showSearchRelevance}
    />
  );
}