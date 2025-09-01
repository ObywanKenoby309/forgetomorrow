// components/GroupsList.js
import React from 'react';

export default function GroupsList({ groups = [], onOpen }) {
  if (!groups.length) return <div style={{ color: '#607D8B' }}>You haven’t joined any groups yet.</div>;

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {groups.map((g) => (
        <div key={g.id} style={{ border: '1px solid #eee', borderRadius: 10, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#ECEFF1' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, color: '#263238' }}>{g.name}</div>
            <div style={{ fontSize: 12, color: '#607D8B' }}>{g.members} members • {g.category}</div>
          </div>
          <button onClick={() => onOpen?.(g)} style={{ background: 'white', border: '1px solid #CFD8DC', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontWeight: 700, color: '#455A64' }}>Open</button>
        </div>
      ))}
    </div>
  );
}
