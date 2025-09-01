// components/PagesList.js
import React from 'react';

export default function PagesList({ pages = [], onOpen }) {
  if (!pages.length) return <div style={{ color: '#607D8B' }}>No pages followed yet.</div>;

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {pages.map((p) => (
        <div key={p.id} style={{ border: '1px solid #eee', borderRadius: 10, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#FFF3E9' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, color: '#263238' }}>{p.name}</div>
            <div style={{ fontSize: 12, color: '#607D8B' }}>{p.industry}</div>
          </div>
          <button onClick={() => onOpen?.(p)} style={{ background: 'white', border: '1px solid #CFD8DC', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontWeight: 700, color: '#455A64' }}>Open</button>
        </div>
      ))}
    </div>
  );
}
