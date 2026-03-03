// components/jobs/JobsPageHeader.js
import React from 'react';

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

export default function JobsPageHeader({ totalCount }) {
  return (
    <header style={{ ...GLASS, padding: '20px 24px', textAlign: 'center' }}>
      <h1 style={{ color: '#FF7043', fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
        Job Listings
      </h1>
      <p style={{ margin: '8px 0 0', color: '#546E7A', fontSize: 14, fontWeight: 500 }}>
        Explore openings, review full details, and apply with confidence.
        {typeof totalCount === 'number' && totalCount > 0 && (
          <span style={{ marginLeft: 8, color: '#FF7043', fontWeight: 700 }}>
            {totalCount.toLocaleString()} open roles
          </span>
        )}
      </p>
    </header>
  );
}