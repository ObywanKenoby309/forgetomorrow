// components/IncomingRequestsList.js
import React from 'react';

export default function IncomingRequestsList({ items = [], onAccept, onDecline, onViewProfile }) {
  if (!items.length) return <div style={{ color: '#607D8B' }}>No incoming invites.</div>;

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {items.map((p) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #eee', borderRadius: 10, padding: 10 }}>
          <img src={p.photo} alt={p.name} width={40} height={40} style={{ borderRadius: 999 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: '#263238', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
            {p.note ? <div style={{ fontSize: 12, color: '#607D8B' }}>{p.note}</div> : null}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onAccept?.(p)} style={{ background: '#E8F5E9', color: '#1B5E20', border: '1px solid #C8E6C9', borderRadius: 8, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}>Accept</button>
            <button onClick={() => onDecline?.(p)} style={{ background: '#FFEBEE', color: '#B71C1C', border: '1px solid #FFCDD2', borderRadius: 8, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}>Decline</button>
            <button onClick={() => onViewProfile?.(p)} style={{ background: 'white', color: '#455A64', border: '1px solid #CFD8DC', borderRadius: 8, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}>View</button>
          </div>
        </div>
      ))}
    </div>
  );
}
