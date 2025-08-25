// components/coaching/dashboard/SectionBlock.js
import React from 'react';

export default function SectionBlock({ title, action = null, children, padding = 20 }) {
  return (
    <section
      style={{
        background: 'white',
        borderRadius: 12,
        padding,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        border: '1px solid #eee',
      }}
    >
      <div
        style={{
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ color: '#FF7043', fontWeight: 700, fontSize: 18 }}>{title}</div>
        {action}
      </div>
      <div>{children}</div>
    </section>
  );
}
