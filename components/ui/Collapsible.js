// components/ui/Collapsible.js
import React, { useState } from 'react';

export default function Collapsible({
  title,
  defaultOpen = false,
  children,
  countBadge,
  rightAction,
}) {
  const [open, setOpen] = useState(!!defaultOpen);

  return (
    <section
      style={{
        background: 'white',
        borderRadius: 12,
        border: '1px solid #e6e9ef',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 12,
          cursor: 'pointer',
          background: open ? '#F8FAFC' : 'white',
          borderBottom: open ? '1px solid #eef1f5' : '1px solid transparent',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 16, textAlign: 'center', color: '#90A4AE' }}>
            {open ? '▾' : '▸'}
          </span>
          <h3 style={{ margin: 0, color: '#263238', fontSize: 15, fontWeight: 700 }}>
            {title}
          </h3>
          {countBadge != null && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 11,
                background: '#ECEFF1',
                color: '#455A64',
                borderRadius: 999,
                padding: '2px 8px',
                fontWeight: 800,
              }}
            >
              {countBadge}
            </span>
          )}
        </div>

        {rightAction && (
          <div onClick={(e) => e.stopPropagation()}>
            {rightAction}
          </div>
        )}
      </div>

      <div style={{ display: open ? 'block' : 'none', padding: 16 }}>
        {children}
      </div>
    </section>
  );
}
