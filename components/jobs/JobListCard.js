// components/jobs/JobListCard.js
import React from 'react';

function inferLocationType(location) {
  if (!location) return '';
  const lower = location.toLowerCase();
  if (lower.includes('remote')) return 'Remote';
  if (lower.includes('hybrid')) return 'Hybrid';
  return 'On-site';
}

export default function JobListCard({
  job,
  isSelected,
  onClick,
  getJobStatus,
  isInternalJob,
}) {
  if (!job) return null;

  const location = job.location || '';
  const locationType = inferLocationType(location);
  const internal = isInternalJob(job);

  const displaySource = internal ? 'Forge' : 'External';

  let postedLabel = 'Date not provided';

  if (job.publishedat) {
    const d = new Date(job.publishedat);

    if (!Number.isNaN(d.getTime())) {
      postedLabel = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  }

  const hasMeaningfulAlignment =
  typeof job.match === 'number' &&
  job.match > 0 &&
  (
    job.matchSource === 'profile' ||
    job.matchSource === 'resume' ||
    job.matchSource === 'preferences'
  );

const alignmentScore = hasMeaningfulAlignment
  ? Math.round(job.match)
  : null;

const alignmentScore = hasMeaningfulMatch
  ? Math.round(job.match)
  : null;

  return (
    <article
      onClick={onClick}
      style={{
        cursor: 'pointer',
        border: isSelected
          ? '2px solid #FF7043'
          : '1px solid #E5E7EB',
        background: '#FFFFFF',
        borderRadius: 18,
        padding: '16px 16px 14px',
        minHeight: 150,
        height: 150,
        boxSizing: 'border-box',
        boxShadow: isSelected
          ? '0 6px 18px rgba(255,112,67,0.18)'
          : '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* TOP ZONE */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 64px',
          gap: 12,
          alignItems: 'start',
        }}
      >
        <div
          style={{
            minWidth: 0,
          }}
        >
          <div
            title={job.title || ''}
            style={{
              fontSize: 16,
              fontWeight: 800,
              lineHeight: 1.2,
              color: '#0F172A',
              minHeight: 40,
              maxHeight: 40,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {job.title}
          </div>

          <div
            title={job.company || ''}
            style={{
              marginTop: 8,
              fontSize: 13,
              fontWeight: 600,
              color: '#607D8B',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              height: 18,
            }}
          >
            {job.company}
          </div>
        </div>

        <div
          style={{
            textAlign: 'right',
            width: 64,
            flexShrink: 0,
          }}
        >
          {typeof alignmentScore === 'number' && (
  <div
    style={{
      fontSize: 10,
      textTransform: 'uppercase',
      color: '#78909C',
      fontWeight: 700,
      letterSpacing: '0.05em',
    }}
  >
    Alignment
  </div>
)}

          <div
            style={{
              marginTop: 2,
              fontSize: 15,
              lineHeight: 1,
              fontWeight: 900,
              color: '#FF7043',
            }}
          >
            {typeof alignmentScore === 'number'
			? `${alignmentScore}%`
			: ''}
          </div>
        </div>
      </div>

      {/* MIDDLE ZONE */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          marginTop: 2,
          minHeight: 34,
          maxHeight: 34,
          overflow: 'hidden',
        }}
      >
        <div
          title={location}
          style={{
            fontSize: 13,
            color: '#607D8B',
            lineHeight: 1.3,
            minHeight: 16,
            maxHeight: 32,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {location}
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#546E7A',
            height: 18,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          Posted {postedLabel}
        </div>
      </div>

      {/* BOTTOM ZONE */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 8,
          flexWrap: 'wrap',
          minHeight: 24,
          marginTop: -2,
        }}
      >
        <span
          style={{
            padding: '4px 10px',
            borderRadius: 999,
            border: '1px solid #D5DCE1',
            background: '#F8FAFC',
            fontSize: 12,
            color: '#546E7A',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {locationType}
        </span>

        <span
          style={{
            padding: '4px 10px',
            borderRadius: 999,
            border: '1px solid #D5DCE1',
            background: '#F8FAFC',
            fontSize: 12,
            color: '#546E7A',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {displaySource}
        </span>
      </div>
    </article>
  );
}
