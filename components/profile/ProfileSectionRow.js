// components/profile/ProfileSectionRow.js
'use client';

import React, { useMemo, useState } from 'react';

export default function ProfileSectionRow({
  id,
  title,
  subtitle,
  children,
  hintTitle,
  hintBullets = [],
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));

  const hint = useMemo(() => {
    if (!hintTitle && (!hintBullets || hintBullets.length === 0)) return null;

    return (
      <aside
        aria-label={`${title} help`}
        style={{
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.28)',
          background: 'rgba(255,255,255,0.62)',
          boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          padding: 14,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 800, color: '#112033' }}>
          {hintTitle || 'Tips'}
        </div>

        {hintBullets?.length > 0 && (
          <ul
            style={{
              margin: '10px 0 0',
              paddingLeft: 18,
              color: '#263238',
              fontSize: 13,
              lineHeight: 1.45,
            }}
          >
            {hintBullets.map((b, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                {b}
              </li>
            ))}
          </ul>
        )}
      </aside>
    );
  }, [hintTitle, hintBullets, title]);

  const panelId = `${id || title}-panel`;

  return (
    <section id={id} aria-label={title} style={{ width: '100%' }}>
      {/* Mobile stacking rules (minimum change) */}
      <style jsx>{`
        @media (max-width: 767px) {
          [data-psr-grid='true'] {
            grid-template-columns: 1fr !important;
          }
          [data-psr-hint='true'] {
            transform: none !important;
          }
        }
      `}</style>

      {/* Compact header bar */}
      <div
        style={{
          borderRadius: 14,
          border: '1px solid rgba(255,255,255,0.22)',
          background: 'rgba(255,255,255,0.58)',
          boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          padding: 14,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#112033' }}>
              {title}
            </h2>
            {subtitle ? (
              <span style={{ fontSize: 13, color: '#455A64', fontWeight: 600 }}>
                {subtitle}
              </span>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          style={{
            borderRadius: 999,
            border: '1px solid rgba(255,112,67,0.55)',
            background: open ? '#FF7043' : 'rgba(255,255,255,0.75)',
            color: open ? 'white' : '#FF7043',
            padding: '8px 12px',
            fontSize: 13,
            fontWeight: 900,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {open ? 'Collapse' : 'Edit'}
        </button>
      </div>

      {/* Expand area: editor + hint (hint slides in) */}
      <div
        id={panelId}
        style={{
          overflow: 'hidden',
          transition: 'max-height 220ms ease, opacity 220ms ease, margin-top 220ms ease',
          maxHeight: open ? 2000 : 0,
          opacity: open ? 1 : 0,
          marginTop: open ? 12 : 0,
        }}
      >
        <div
          data-psr-grid="true"
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: open ? 'minmax(0, 1fr) minmax(240px, 320px)' : '1fr',
            alignItems: 'start',
          }}
        >
          {/* Editor card */}
          <div
            style={{
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.22)',
              background: 'rgba(255,255,255,0.70)',
              boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              padding: 14,
              minWidth: 0,
            }}
          >
            {children}
          </div>

          {/* Hint “curtain” */}
          <div
            data-psr-hint="true"
            style={{
              transform: open ? 'translateX(0)' : 'translateX(18px)',
              opacity: open ? 1 : 0,
              transition: 'transform 220ms ease, opacity 220ms ease',
              minWidth: 0,
            }}
          >
            {hint}
          </div>
        </div>
      </div>
    </section>
  );
}
