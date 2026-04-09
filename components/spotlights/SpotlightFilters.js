// components/spotlights/SpotlightFilters.js
//
// Changes from original:
//   - Filter body is collapsible (open by default)
//   - Filters only apply when "Apply filters" is clicked
//   - Active filter pills shown in footer with individual clear
//   - Sort expanded: Newest | Name A–Z | Highest rated | Most sessions
//   - New CSAT min filter: Any | 4.0+ | 4.5+
//   - onChange fires committed filters only (not on every keystroke)

import React, { useState, useMemo } from 'react';

const glassBase = {
  background: 'rgba(255,255,255,0.78)',
  border: '1px solid rgba(255,255,255,0.55)',
  borderRadius: 14,
  boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
};

const DEFAULT_FILTERS = {
  q:            '',
  specialties:  [],
  availability: 'Any',
  rate:         [],
  sort:         'Newest',
  csatMin:      'Any',
};

const SPECIALTY_OPTIONS = [
  'Resume Review',
  'Interview Prep',
  'Career Strategy',
  'Portfolio Review',
  'Networking',
  'Salary/Negotiation',
  'Career Pivot',
];

const CSAT_MIN_OPTIONS = ['Any', '4.0+', '4.5+'];

export default function SpotlightFilters({ onChange, initial }) {
  // Draft state — only committed on Apply
  const [draft, setDraft]         = useState(initial || DEFAULT_FILTERS);
  const [committed, setCommitted] = useState(initial || DEFAULT_FILTERS);
  const [open, setOpen]           = useState(true);

  const toggleArr = (arr, val) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  function apply() {
    setCommitted(draft);
    onChange?.(draft);
  }

  function clearAll() {
    setDraft(DEFAULT_FILTERS);
    setCommitted(DEFAULT_FILTERS);
    onChange?.(DEFAULT_FILTERS);
  }

  function removePill(key, val) {
    let next = { ...committed };
    if (key === 'q')           next.q = '';
    if (key === 'availability') next.availability = 'Any';
    if (key === 'csatMin')     next.csatMin = 'Any';
    if (key === 'sort')        next.sort = 'Newest';
    if (key === 'specialties') next.specialties = committed.specialties.filter(s => s !== val);
    if (key === 'rate')        next.rate = committed.rate.filter(r => r !== val);
    setDraft(next);
    setCommitted(next);
    onChange?.(next);
  }

  // Active pills derived from committed state
  const pills = useMemo(() => {
    const out = [];
    if (committed.q.trim())                 out.push({ key: 'q',           label: `"${committed.q.trim()}"`,  val: null });
    if (committed.availability !== 'Any')   out.push({ key: 'availability', label: committed.availability,     val: null });
    if (committed.csatMin !== 'Any')        out.push({ key: 'csatMin',      label: `${committed.csatMin} CSAT`, val: null });
    if (committed.sort !== 'Newest')        out.push({ key: 'sort',         label: committed.sort,             val: null });
    committed.specialties.forEach(s =>      out.push({ key: 'specialties',  label: s,                          val: s }));
    committed.rate.forEach(r =>             out.push({ key: 'rate',         label: r,                          val: r }));
    return out;
  }, [committed]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(committed);

  return (
    <section style={{ ...glassBase, overflow: 'hidden' }}>

      {/* Top row — always visible */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) 160px auto',
        gap: 10,
        alignItems: 'center',
        padding: '14px 16px',
      }}>
        <input
          value={draft.q}
          onChange={(e) => setDraft((f) => ({ ...f, q: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
          placeholder="Search by name, headline, or specialty…"
          style={{
            border: '1px solid rgba(0,0,0,0.12)',
            borderRadius: 10,
            padding: '9px 12px',
            outline: 'none',
            width: '100%',
            background: 'rgba(255,255,255,0.9)',
            fontSize: 13,
          }}
        />
        <select
          value={draft.sort}
          onChange={(e) => setDraft((f) => ({ ...f, sort: e.target.value }))}
          style={{
            border: '1px solid rgba(0,0,0,0.12)',
            borderRadius: 10,
            padding: '9px 12px',
            outline: 'none',
            background: 'rgba(255,255,255,0.9)',
            fontSize: 13,
            width: '100%',
          }}
        >
          <option>Newest</option>
          <option>Highest rated</option>
          <option>Most sessions</option>
          <option>Name A–Z</option>
        </select>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
            fontWeight: 700,
            color: '#FF7043',
            background: 'rgba(255,112,67,0.08)',
            border: '0.5px solid rgba(255,112,67,0.25)',
            borderRadius: 8,
            padding: '8px 12px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {open ? 'Hide filters' : 'Show filters'}
          <svg
            viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"
            style={{ width: 13, height: 13, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <path d="M4 6l4 4 4-4"/>
          </svg>
        </button>
      </div>

      {/* Collapsible filter body */}
      {open && (
        <>
          <div style={{
            borderTop: '1px solid rgba(0,0,0,0.06)',
            padding: '14px 16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 16,
          }}>
            {/* Specialties */}
            <div>
              <div style={sectionLabel}>Specialties</div>
              <div style={{ display: 'grid', gap: 5 }}>
                {SPECIALTY_OPTIONS.map((s) => (
                  <label key={s} style={checkLabel}>
                    <input
                      type="checkbox"
                      checked={draft.specialties.includes(s)}
                      onChange={() => setDraft((f) => ({ ...f, specialties: toggleArr(f.specialties, s) }))}
                      style={{ accentColor: '#FF7043' }}
                    />
                    <span style={{ fontSize: 13 }}>{s}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div>
              <div style={sectionLabel}>Availability</div>
              {['Any', 'Open to discuss', 'Limited slots', 'Waitlist'].map((a) => (
                <label key={a} style={checkLabel}>
                  <input
                    type="radio"
                    name="availability"
                    checked={draft.availability === a}
                    onChange={() => setDraft((f) => ({ ...f, availability: a }))}
                    style={{ accentColor: '#FF7043' }}
                  />
                  <span style={{ fontSize: 13 }}>{a}</span>
                </label>
              ))}
            </div>

            {/* Rate + CSAT */}
            <div>
              <div style={sectionLabel}>Rate</div>
              {['Free', 'Paid', 'Sliding'].map((r) => (
                <label key={r} style={checkLabel}>
                  <input
                    type="checkbox"
                    checked={draft.rate.includes(r)}
                    onChange={() => setDraft((f) => ({ ...f, rate: toggleArr(f.rate, r) }))}
                    style={{ accentColor: '#FF7043' }}
                  />
                  <span style={{ fontSize: 13 }}>{r}</span>
                </label>
              ))}
              <div style={{ marginTop: 14 }}>
                <div style={sectionLabel}>Min. CSAT rating</div>
                {CSAT_MIN_OPTIONS.map((c) => (
                  <label key={c} style={checkLabel}>
                    <input
                      type="radio"
                      name="csatMin"
                      checked={draft.csatMin === c}
                      onChange={() => setDraft((f) => ({ ...f, csatMin: c }))}
                      style={{ accentColor: '#FF7043' }}
                    />
                    <span style={{ fontSize: 13 }}>{c === 'Any' ? 'Any rating' : `${c} and above`}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer — pills + clear + apply */}
          <div style={{
            borderTop: '1px solid rgba(0,0,0,0.06)',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 }}>
              {pills.map((p, i) => (
                <span key={i} style={{
                  fontSize: 11, padding: '3px 8px', borderRadius: 20,
                  background: 'rgba(255,112,67,0.1)', color: '#993C1D',
                  fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4,
                }}>
                  {p.label}
                  <button
                    type="button"
                    onClick={() => removePill(p.key, p.val)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#993C1D', fontSize: 13, lineHeight: 1, padding: 0 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              {pills.length > 0 && (
                <button type="button" onClick={clearAll} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#90A4AE', fontSize: 12, fontWeight: 600,
                }}>
                  Clear all
                </button>
              )}
              <button
                type="button"
                onClick={apply}
                style={{
                  background: isDirty ? '#FF7043' : 'rgba(255,112,67,0.5)',
                  color: 'white', border: 'none', borderRadius: 8,
                  padding: '8px 18px', fontSize: 13, fontWeight: 700,
                  cursor: isDirty ? 'pointer' : 'default',
                  transition: 'background 0.15s',
                }}
              >
                Apply filters
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

const sectionLabel = {
  fontSize: 10,
  color: '#90A4AE',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 7,
};

const checkLabel = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  marginBottom: 4,
  cursor: 'pointer',
};