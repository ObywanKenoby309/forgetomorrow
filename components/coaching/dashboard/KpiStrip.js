// components/coaching/dashboard/KpiStrip.js
import React from 'react';

function KPI({ label, value }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #eee',
        borderRadius: 10,
        padding: 12,
        minHeight: 70,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 4,
      }}
    >
      <div style={{ fontSize: 12, color: '#607D8B', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#263238' }}>{value}</div>
    </div>
  );
}

export default function KpiStrip({ items = [] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 12 }}>
      {items.map((k) => (
        <KPI key={k.label} label={k.label} value={k.value} />
      ))}
    </div>
  );
}
