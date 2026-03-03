// components/jobs/JobListCard.js
import React from 'react';

function inferLocationType(location) {
  if (!location) return '';
  const lower = location.toLowerCase();
  if (lower.includes('remote')) return 'Remote';
  if (lower.includes('hybrid')) return 'Hybrid';
  return 'On-site';
}

export default function JobListCard({ job, isSelected, onClick, getJobStatus, isInternalJob, getJobTier }) {
  if (!job) return null;

  const rawDesc   = job.description || '';
  const cleanDesc = rawDesc.replace(/<[^>]*>/g, '');
  const snippet   = cleanDesc.length > 140 ? `${cleanDesc.slice(0, 140)}…` : cleanDesc;

  const location     = job.location || '';
  const locationType = inferLocationType(location);
  const status       = getJobStatus(job);
  const internal     = isInternalJob(job);
  const displaySource = internal ? 'Forge recruiter' : 'External';

  let postedLabel = 'Date not provided';
  if (job.publishedat) {
    const d = new Date(job.publishedat);
    if (!Number.isNaN(d.getTime())) {
      postedLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  const tier        = getJobTier(job);
  const isFtOfficial = tier === 'ft-official';
  const isPartner    = tier === 'partner';
  const isDarkCard   = isFtOfficial || isPartner;

  const logoUrl = job.logoUrl || (isFtOfficial ? '/images/logo-color.png' : null);

  let cardBackground, cardBorder, cardShadow;
  if (isFtOfficial) {
    cardBackground = 'linear-gradient(135deg, #FF7043, #FF8A65)';
    cardBorder     = isSelected ? '2px solid #FFFFFF' : '1px solid #FFCC80';
    cardShadow     = '0 4px 20px rgba(255,112,67,0.40)';
  } else if (isPartner) {
    cardBackground = 'linear-gradient(135deg, #0B1724, #112033)';
    cardBorder     = isSelected ? '2px solid #FF7043' : '1px solid rgba(255,112,67,0.55)';
    cardShadow     = '0 4px 18px rgba(0,0,0,0.40)';
  } else {
    cardBackground = isSelected
      ? 'linear-gradient(135deg,#FFFFFF,#FFF3EE)'
      : '#FFFFFF';
    cardBorder     = isSelected ? '2px solid #FF7043' : '1px solid #E8EAEC';
    cardShadow     = isSelected
      ? '0 4px 16px rgba(255,112,67,0.18)'
      : '0 1px 4px rgba(0,0,0,0.06)';
  }

  const titleColor  = isDarkCard ? '#FFFFFF' : '#112033';
  const subtleColor = isDarkCard ? '#CFD8DC' : '#607D8B';
  const textColor   = isDarkCard ? '#ECEFF1' : '#455A64';

  const chipLabel = isFtOfficial
    ? 'ForgeTomorrow official posting'
    : internal
    ? 'ForgeTomorrow recruiter partner'
    : null;

  const showSnippet = internal;

  return (
    <article
      aria-label={`${job.title} at ${job.company || 'Unknown company'}`}
      onClick={onClick}
      style={{
        cursor: 'pointer',
        border: cardBorder,
        background: cardBackground,
        boxShadow: cardShadow,
        borderRadius: 14,
        padding: '14px 16px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 150ms ease, border-color 150ms ease',
        minHeight: 100,
      }}
    >
      {/* Selected indicator bar */}
      {isSelected && !isDarkCard && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: 4, background: '#FF7043', borderRadius: '14px 0 0 14px',
        }} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
        {/* Left: logo + title */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
          {logoUrl && (
            <div style={{
              width: 36, height: 36, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
              backgroundColor: isDarkCard ? 'rgba(0,0,0,0.30)' : 'rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img src={logoUrl} alt={`${job.company || 'Company'} logo`}
                style={{ maxWidth: '70%', maxHeight: '70%', objectFit: 'contain' }} />
            </div>
          )}

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontWeight: 800, fontSize: 14, color: titleColor,
              lineHeight: 1.3, marginBottom: 2,
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2,
            }}>
              {job.title}
            </div>
            <div style={{ fontSize: 12, color: subtleColor, fontWeight: 500 }}>
              {job.company}
            </div>
          </div>
        </div>

        {/* Right: date */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: subtleColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Posted
          </div>
          <div style={{ fontSize: 12, color: isDarkCard ? '#FFFFFF' : '#546E7A', fontWeight: 600 }}>
            {postedLabel}
          </div>
        </div>
      </div>

      {/* Tags row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, alignItems: 'center' }}>
        {location && (
          <span style={{ fontSize: 11, color: subtleColor }}>
            {location}
          </span>
        )}
        {locationType && (
          <span style={{
            fontSize: 11, padding: '2px 7px', borderRadius: 999,
            border: '1px solid rgba(207,216,220,0.7)',
            background: isDarkCard ? 'rgba(38,50,56,0.70)' : 'rgba(0,0,0,0.04)',
            color: isDarkCard ? '#ECEFF1' : '#546E7A', fontWeight: 600,
          }}>
            {locationType}
          </span>
        )}
        {displaySource && (
          <span style={{
            fontSize: 11, padding: '2px 7px', borderRadius: 999,
            border: '1px solid rgba(207,216,220,0.7)',
            background: isDarkCard ? 'rgba(38,50,56,0.70)' : 'rgba(0,0,0,0.04)',
            color: isDarkCard ? '#ECEFF1' : '#546E7A', fontWeight: 600,
          }}>
            {displaySource}
          </span>
        )}
        {status && status !== 'Open' && (
          <span style={{
            fontSize: 11, padding: '2px 7px', borderRadius: 999,
            border: '1px solid #FFCC80',
            background: status === 'Reviewing' ? '#FFF3E0' : '#ECEFF1',
            color: status === 'Reviewing' ? '#E65100' : '#607D8B',
            fontWeight: 700,
          }}>
            {status === 'Reviewing' ? 'Reviewing applicants' : status}
          </span>
        )}
      </div>

      {/* Chip badge (internal/official) */}
      {chipLabel && (
        <div style={{
          marginTop: 8,
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '3px 9px', borderRadius: 999,
          border: isFtOfficial ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.15)',
          background: isFtOfficial ? 'rgba(0,0,0,0.22)' : 'rgba(17,32,51,0.85)',
          fontSize: 11, color: '#FFCC80', fontWeight: 700,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: '#FF7043', flexShrink: 0 }} />
          {chipLabel}
        </div>
      )}

      {/* Snippet (internal jobs only) */}
      {showSnippet && snippet && (
        <p style={{
          margin: '8px 0 0', color: textColor,
          fontSize: 12, lineHeight: 1.5,
          display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2,
          overflow: 'hidden',
        }}>
          {snippet}
        </p>
      )}
    </article>
  );
}