import React from 'react';

export default function ResponseSpeedCard({ toInterview, toOffer, note }) {
  return (
    <div
      style={{
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      }}
    >
      <h3 style={{ margin: 0, color: '#FF7043', fontSize: 16 }}>Response Speed</h3>
      <p style={{ margin: '8px 0', color: '#607D8B', fontSize: 13 }}>
        Avg. days until responses from employers
      </p>
      <div style={{ display: 'grid', gap: 6 }}>
        <div>Interview: <strong>{toInterview ?? '—'} days</strong></div>
        <div>Offer: <strong>{toOffer ?? '—'} days</strong></div>
      </div>
      {note && (
        <p style={{ marginTop: 8, fontSize: 12, color: '#90A4AE' }}>{note}</p>
      )}
    </div>
  );
}
