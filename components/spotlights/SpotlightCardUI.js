// components/spotlights/SpotlightCardUI.js
//
// Shared UI components used by both:
//   - pages/hearth/spotlights/index.js  (standalone page)
//   - pages/the-hearth.js               (inline MentorshipModule)
//
// Exports: SpotlightCard, SpotlightDetail, AvailBadge, Stars, Avatar

import React, { useState } from 'react';
import Link from 'next/link';

export const WHITE_CARD = {
  background: 'rgba(255,255,255,0.92)',
  border: '0.5px solid rgba(0,0,0,0.08)',
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  boxSizing: 'border-box',
};

// ─── Availability badge ───────────────────────────────────────────────────────
export function AvailBadge({ value, large }) {
  const styles = {
    'Open to discuss': { background: '#E8F5E9', color: '#2E7D32' },
    'Limited slots':   { background: '#FFF8E1', color: '#F57F17' },
    'Waitlist':        { background: '#FDECEA', color: '#C62828' },
  };
  const s = styles[value] || styles['Open to discuss'];
  return (
    <span style={{
      fontSize: large ? 12 : 10,
      padding: large ? '4px 10px' : '2px 7px',
      borderRadius: 20, fontWeight: 700, whiteSpace: 'nowrap',
      ...s,
    }}>
      {value || 'Open to discuss'}
    </span>
  );
}

// ─── Stars ────────────────────────────────────────────────────────────────────
export function Stars({ value, size = 11 }) {
  const n = Math.round(value || 0);
  return (
    <span style={{ color: '#FF7043', fontSize: size, letterSpacing: 1 }}>
      {'★'.repeat(n)}{'☆'.repeat(5 - n)}
    </span>
  );
}

// ─── Initials avatar ──────────────────────────────────────────────────────────
export function Avatar({ name, size = 44 }) {
  const initials = (name || '')
    .split(' ').filter(Boolean).slice(0, 2)
    .map((w) => w[0].toUpperCase()).join('');
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: '#FAECE7', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: size * 0.33,
      fontWeight: 900, color: '#993C1D', flexShrink: 0,
    }}>
      {initials || '?'}
    </div>
  );
}

// ─── List card ────────────────────────────────────────────────────────────────
export function SpotlightCard({ spotlight, selected, onSelect }) {
  const { name, headline, hook, summary, specialties, rate, availability, csat } = spotlight;
  const displayHook = hook || headline || '';
  const tags = Array.isArray(specialties) ? specialties.slice(0, 3) : [];

  return (
    <div
      onClick={() => onSelect(spotlight)}
      style={{
        ...WHITE_CARD,
        padding: '12px 14px',
        cursor: 'pointer',
        border: selected ? '2px solid #FF7043' : '0.5px solid rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.15s, transform 0.1s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = WHITE_CARD.boxShadow;
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div style={{ fontWeight: 900, fontSize: 13, color: '#112033', lineHeight: 1.25, marginBottom: 2 }}>
        {displayHook}
      </div>
      <div style={{ fontSize: 11, color: '#90A4AE', marginBottom: 5 }}>{name}</div>
      {summary && (
        <div style={{ fontSize: 12, color: '#546E7A', lineHeight: 1.5, marginBottom: 8 }}>
          {summary.length > 120 ? `${summary.slice(0, 120)}…` : summary}
        </div>
      )}
      {tags.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
          {tags.map((t) => (
            <span key={t} style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 20,
              background: 'rgba(255,112,67,0.08)', color: '#993C1D',
              fontWeight: 500, opacity: 0.85,
            }}>
              {t}
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AvailBadge value={availability} />
          {csat?.overall != null && (
            <span style={{ fontSize: 11, color: '#607D8B', display: 'flex', alignItems: 'center', gap: 2 }}>
              <span style={{ color: '#FF7043' }}>★</span>
              {csat.overall} · {csat.sessions} sessions
            </span>
          )}
          {rate && <span style={{ fontSize: 11, color: '#90A4AE' }}>{rate}</span>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={e => { e.stopPropagation(); onSelect(spotlight); }}
            style={{
              background: 'white', color: '#FF7043', border: '0.5px solid #FF7043',
              borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Profile
          </button>
          <button
            onClick={e => { e.stopPropagation(); onSelect(spotlight); }}
            style={{
              background: '#FF7043', color: 'white', border: 'none',
              borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Book
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
export function SpotlightDetail({ spotlight }) {
  const [showAll, setShowAll] = useState(false);
  const { name, headline, hook, summary, whyICoach, specialties, rate, availability, csat, userId } = spotlight;
  const tags = Array.isArray(specialties) ? specialties : [];
  const visibleTags = showAll ? tags : tags.slice(0, 3);
  const extraCount = tags.length - 3;

  return (
    <div style={{ ...WHITE_CARD, padding: '18px 20px', display: 'grid', gap: 14 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Avatar name={name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 16, color: '#112033', lineHeight: 1.2 }}>
            {hook || headline || 'Mentor'}
          </div>
          <div style={{ fontSize: 12, color: '#90A4AE', marginTop: 2 }}>{name}</div>
          <div style={{ marginTop: 5 }}>
            <AvailBadge value={availability} large />
          </div>
        </div>
      </div>

      {/* CSAT strip */}
      {csat?.overall != null && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }}>
            {[
              { label: 'Satisfaction', val: csat.satisfaction },
              { label: 'Timeliness',   val: csat.timeliness },
              { label: 'Quality',      val: csat.quality },
            ].map((m) => (
              <div key={m.label} style={{
                background: 'rgba(0,0,0,0.03)', borderRadius: 8,
                padding: '8px 10px', textAlign: 'center',
              }}>
                <div style={{
                  fontSize: 9, fontWeight: 700, color: '#90A4AE',
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3,
                }}>
                  {m.label}
                </div>
                <div style={{ fontSize: 17, fontWeight: 900, color: '#112033' }}>
                  {m.val != null ? m.val : '—'}
                </div>
                {m.val != null && <Stars value={m.val} size={10} />}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#90A4AE', textAlign: 'center', marginTop: -6 }}>
            Based on {csat.sessions} {csat.sessions === 1 ? 'session' : 'sessions'}
          </div>
        </>
      )}

      {/* Why I coach */}
      {whyICoach && (
        <div style={{
          background: 'rgba(255,112,67,0.06)',
          borderLeft: '3px solid #FF7043',
          borderRadius: '0 8px 8px 0',
          padding: '10px 13px',
          fontSize: 12, color: '#455A64', lineHeight: 1.65, fontStyle: 'italic',
        }}>
          "{whyICoach}"
        </div>
      )}

      {/* Summary */}
      {summary && (
        <p style={{ margin: 0, fontSize: 13, color: '#546E7A', lineHeight: 1.6 }}>{summary}</p>
      )}

      {/* Specialties */}
      {tags.length > 0 && (
        <div>
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#90A4AE',
            textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7,
          }}>
            Specialties
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {visibleTags.map((t) => (
              <span key={t} style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 20,
                background: 'rgba(255,112,67,0.08)', color: '#993C1D', fontWeight: 500,
              }}>
                {t}
              </span>
            ))}
          </div>
          {tags.length > 3 && (
            <button
              onClick={() => setShowAll((p) => !p)}
              style={{
                fontSize: 11, color: '#FF7043', background: 'none', border: 'none',
                cursor: 'pointer', marginTop: 5, padding: 0, fontWeight: 600,
              }}
            >
              {showAll ? '− show less' : `+ ${extraCount} more`}
            </button>
          )}
        </div>
      )}

      {/* Meta */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {rate && (
          <div style={{ fontSize: 12, color: '#455A64' }}>
            <span style={{ color: '#90A4AE', fontWeight: 700 }}>Rate </span>{rate}
          </div>
        )}
        {csat?.sessions > 0 && (
          <div style={{ fontSize: 12, color: '#455A64' }}>
            <span style={{ color: '#90A4AE', fontWeight: 700 }}>Sessions </span>{csat.sessions} completed
          </div>
        )}
      </div>

      <hr style={{ border: 'none', borderTop: '0.5px solid rgba(0,0,0,0.06)' }} />

      {/* CTAs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Link
          href={`/messaging?coachId=${userId}`}
          style={{
            display: 'block', textAlign: 'center',
            background: 'white', color: '#FF7043',
            border: '1px solid #FF7043', borderRadius: 8,
            padding: '10px 0', fontSize: 13, fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Send a message
        </Link>
        <Link
          href={`/calendar?coachId=${userId}`}
          style={{
            display: 'block', textAlign: 'center',
            background: '#FF7043', color: 'white',
            border: 'none', borderRadius: 8,
            padding: '10px 0', fontSize: 13, fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Book a session
        </Link>
      </div>
    </div>
  );
}