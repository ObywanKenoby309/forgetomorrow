import React from 'react';

export default function TrendChart({ data = [] }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {data.map((point, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '4px 8px',
            border: '1px solid #eee',
            borderRadius: 6,
          }}
        >
          <span style={{ fontWeight: 600 }}>{point.label}</span>
          <span style={{ color: '#FF7043' }}>Applied: {point.applied}</span>
          <span style={{ color: '#42A5F5' }}>Interviews: {point.interviews}</span>
        </div>
      ))}
    </div>
  );
}
