// components/resume-form/ResumeSectionRow.js
// -----------------------------------------------------------------------------
// ResumeSectionRow
// Presentation-only UX wrapper for Resume Builder sections.
// Mirrors ProfileSectionRow behavior and visual language.
// - Glass card styling
// - Collapsible / expandable by user
// - Hint panel support
// - NO business logic
// - NO data mutation
// -----------------------------------------------------------------------------

import React, { useState } from 'react';

const ORANGE = '#FF7043';

export default function ResumeSectionRow({
  id,
  title,
  subtitle,
  hintTitle,
  hintBullets = [],
  defaultOpen = false,
  children,
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));

  return (
    <section
      id={id}
      aria-label={title}
      style={{
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.22)',
        background: 'rgba(255,255,255,0.78)',
        boxShadow: open
          ? '0 18px 38px rgba(0,0,0,0.16)'
          : '0 10px 22px rgba(0,0,0,0.10)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        overflow: 'hidden',
        transition: 'box-shadow 180ms ease, background 180ms ease',
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`${id}-content`}
        style={{
          width: '100%',
          padding: '16px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          textAlign: 'left',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 900,
              color: '#1F2937',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#475569',
                marginTop: 2,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        <div
          aria-hidden
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            background: open ? ORANGE : 'rgba(0,0,0,0.12)',
            color: 'white',
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 160ms ease',
            flexShrink: 0,
          }}
        >
          {open ? '–' : '+'}
        </div>
      </button>

      {/* Content */}
      <div
        id={`${id}-content`}
        style={{
          maxHeight: open ? 3000 : 0,
          overflow: 'hidden',
          transition: 'max-height 260ms ease',
        }}
      >
        <div style={{ padding: '0 18px 18px' }}>
          {/* Hint panel */}
          {(hintTitle || hintBullets.length > 0) && (
            <div
              style={{
                marginBottom: 16,
                padding: 14,
                borderRadius: 12,
                background: 'rgba(255,112,67,0.08)',
                border: '1px solid rgba(255,112,67,0.35)',
              }}
            >
              {hintTitle && (
                <div
                  style={{
                    fontWeight: 900,
                    color: ORANGE,
                    marginBottom: hintBullets.length ? 6 : 0,
                  }}
                >
                  {hintTitle}
                </div>
              )}
              {hintBullets.length > 0 && (
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 18,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#5F6368',
                  }}
                >
                  {hintBullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {children}
        </div>
      </div>
    </section>
  );
}
