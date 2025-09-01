// components/NewslettersList.js
import React from 'react';

export default function NewslettersList({ items = [], onOpen }) {
  if (!items.length) return <div style={{ color: '#607D8B' }}>No newsletter subscriptions yet.</div>;

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {items.map((n) => (
        <div key={n.id} style={{ border: '1px solid #eee', borderRadius: 10, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#E3F2FD' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, color: '#263238' }}>{n.title}</div>
            <div style={{ fontSize: 12, color: '#607D8B' }}>{n.frequency} • {n.source}</div>
          </div>
          <button onClick={() => onOpen?.(n)} style={{ background: 'white', border: '1px solid #CFD8DC', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontWeight: 700, color: '#455A64' }}>Open</button>
        </div>
      ))}
    </div>
  );
}
