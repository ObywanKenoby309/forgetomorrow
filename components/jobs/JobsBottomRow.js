// components/jobs/JobsBottomRow.js
import React from 'react';

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

function MiniCard({ title, emptyText, jobs, onSelect }) {
  return (
    <div style={{ ...GLASS, padding: '16px 18px' }}>
      <div style={{
        fontWeight: 800, fontSize: 15, color: '#FF7043',
        marginBottom: 12, letterSpacing: '-0.2px',
      }}>
        {title}
      </div>
      {jobs.length === 0 ? (
        <p style={{ color: '#90A4AE', fontStyle: 'italic', margin: 0, fontSize: 13 }}>
          {emptyText}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {jobs.map((job) => (
            <div
              key={`${job.id}-${job.title}`}
              onClick={() => onSelect?.(job)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 10,
                background: 'rgba(255,255,255,0.70)',
                border: '1px solid rgba(224,224,224,0.70)',
                cursor: onSelect ? 'pointer' : 'default',
                transition: 'background 120ms ease',
              }}
            >
              <div style={{
                width: 8, height: 8, borderRadius: 999,
                background: '#FF7043', flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: '#112033',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {job.title}
                </div>
                {job.company && (
                  <div style={{ fontSize: 11, color: '#78909C', fontWeight: 500 }}>
                    {job.company}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function JobsBottomRow({ viewedJobs = [], appliedJobs = [], onSelectJob }) {
  const recentViewed = viewedJobs.slice(-6).reverse();

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: 16,
    }}>
      <MiniCard
        title="Recently Viewed"
        emptyText="No jobs viewed yet."
        jobs={recentViewed}
        onSelect={onSelectJob}
      />
      <MiniCard
        title="Applied Jobs"
        emptyText="No applications yet."
        jobs={appliedJobs}
        onSelect={onSelectJob}
      />
    </div>
  );
}