import React from 'react';

export default function TopCategoriesChart({ data = [] }) {
  return (
    <div
      style={{
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      }}
    >
      <h3 style={{ margin: 0, color: '#FF7043', fontSize: 16 }}>Top Categories</h3>
      <p style={{ margin: '8px 0', color: '#607D8B', fontSize: 13 }}>
        Distribution of your applications
      </p>
      <div style={{ display: 'grid', gap: 6 }}>
        {data.map((c) => (
          <div
            key={c.name}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              border: '1px solid #f0f0f0',
              borderRadius: 6,
              padding: '4px 8px',
            }}
          >
            <span>{c.name}</span>
            <span style={{ fontWeight: 600 }}>{c.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
