// components/spotlights/SpotlightFilters.js
// Mobile-first search sheet + desktop expanded filter panel.

import React, { useEffect, useMemo, useRef, useState } from 'react';

const glassBase = {
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 14,
  boxShadow: '0 6px 18px rgba(15,23,42,0.10)',
  boxSizing: 'border-box',
};

const DEFAULT_FILTERS = {
  q: '',
  specialties: [],
  availability: 'Any',
  rate: [],
  sort: 'Newest',
  csatMin: 'Any',
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

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth < breakpoint
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  return isMobile;
}

function buildPills(committed) {
  const out = [];
  if (committed.q.trim()) out.push({ key: 'q', label: `"${committed.q.trim()}"`, val: null });
  if (committed.availability !== 'Any') out.push({ key: 'availability', label: committed.availability, val: null });
  if (committed.csatMin !== 'Any') out.push({ key: 'csatMin', label: `${committed.csatMin} CSAT`, val: null });
  if (committed.sort !== 'Newest') out.push({ key: 'sort', label: committed.sort, val: null });
  committed.specialties.forEach((s) => out.push({ key: 'specialties', label: s, val: s }));
  committed.rate.forEach((r) => out.push({ key: 'rate', label: r, val: r }));
  return out;
}

export default function SpotlightFilters({ onChange, initial }) {
  const isMobile = useIsMobile();
  const inputRef = useRef(null);

  const [draft, setDraft] = useState(initial || DEFAULT_FILTERS);
  const [committed, setCommitted] = useState(initial || DEFAULT_FILTERS);
  const [open, setOpen] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const toggleArr = (arr, val) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const pills = useMemo(() => buildPills(committed), [committed]);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(committed);

  useEffect(() => {
    if (!sheetOpen || !isMobile) return;
    const t = setTimeout(() => inputRef.current?.focus(), 180);
    return () => clearTimeout(t);
  }, [sheetOpen, isMobile]);

  useEffect(() => {
    if (!isMobile) return undefined;
    document.body.style.overflow = sheetOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sheetOpen, isMobile]);

  function apply() {
    setCommitted(draft);
    onChange?.(draft);
    if (isMobile) setSheetOpen(false);
  }

  function clearAll() {
    setDraft(DEFAULT_FILTERS);
    setCommitted(DEFAULT_FILTERS);
    onChange?.(DEFAULT_FILTERS);
  }

  function removePill(key, val) {
    const next = { ...committed };
    if (key === 'q') next.q = '';
    if (key === 'availability') next.availability = 'Any';
    if (key === 'csatMin') next.csatMin = 'Any';
    if (key === 'sort') next.sort = 'Newest';
    if (key === 'specialties') next.specialties = committed.specialties.filter((s) => s !== val);
    if (key === 'rate') next.rate = committed.rate.filter((r) => r !== val);
    setDraft(next);
    setCommitted(next);
    onChange?.(next);
  }

  const FilterBody = ({ compact = false }) => (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: compact ? 14 : 16,
        }}
      >
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
    </>
  );

  const ActivePills = ({ mobile = false }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1, minWidth: 0 }}>
      {pills.map((p, i) => (
        <span
          key={i}
          style={{
            fontSize: mobile ? 10 : 11,
            padding: mobile ? '3px 7px' : '3px 8px',
            borderRadius: 20,
            background: 'rgba(255,112,67,0.1)',
            color: '#993C1D',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            maxWidth: '100%',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</span>
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
  );

  if (isMobile) {
    return (
      <>
        <section style={{ ...glassBase, padding: 10, display: 'grid', gap: 8 }}>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            style={{
              width: '100%',
              border: '1px solid rgba(255,112,67,0.24)',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.92)',
              padding: '11px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              cursor: 'pointer',
              color: '#37474F',
              boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ color: '#FF7043', fontWeight: 900 }}>🔍</span>
              <span style={{ fontSize: 13, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {committed.q ? committed.q : 'Search Spotlights'}
              </span>
            </span>
            <span style={{ flexShrink: 0, color: '#FF7043', fontSize: 12, fontWeight: 900 }}>
              Filters{pills.length ? ` (${pills.length})` : ''}
            </span>
          </button>

          {pills.length > 0 ? <ActivePills mobile /> : null}
        </section>

        {sheetOpen ? (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
            <div
              onClick={() => setSheetOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                maxHeight: '88vh',
                background: 'rgba(255,255,255,0.98)',
                borderRadius: '20px 20px 0 0',
                boxShadow: '0 -18px 70px rgba(0,0,0,0.28)',
                display: 'grid',
                gridTemplateRows: 'auto minmax(0,1fr) auto',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: 38, height: 4, borderRadius: 999, background: 'rgba(15,23,42,0.18)' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ color: '#FF7043', fontSize: 16, fontWeight: 900 }}>Search Spotlights</div>
                    <div style={{ color: '#607D8B', fontSize: 12, marginTop: 2 }}>Find coaches by name, headline, or specialty.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSheetOpen(false)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      border: '1px solid rgba(0,0,0,0.10)',
                      background: 'white',
                      color: '#607D8B',
                      fontWeight: 900,
                      cursor: 'pointer',
                    }}
                    aria-label="Close search filters"
                  >
                    ×
                  </button>
                </div>

                <input
                  ref={inputRef}
                  value={draft.q}
                  onChange={(e) => setDraft((f) => ({ ...f, q: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && apply()}
                  placeholder="Search name, headline, or specialty…"
                  style={{
                    border: '1px solid rgba(255,112,67,0.24)',
                    borderRadius: 12,
                    padding: '12px 13px',
                    outline: 'none',
                    width: '100%',
                    background: 'rgba(255,255,255,0.94)',
                    fontSize: 15,
                    boxSizing: 'border-box',
                  }}
                />

                <select
                  value={draft.sort}
                  onChange={(e) => setDraft((f) => ({ ...f, sort: e.target.value }))}
                  style={{
                    border: '1px solid rgba(0,0,0,0.12)',
                    borderRadius: 12,
                    padding: '11px 12px',
                    outline: 'none',
                    background: 'rgba(255,255,255,0.94)',
                    fontSize: 14,
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <option>Newest</option>
                  <option>Highest rated</option>
                  <option>Most sessions</option>
                  <option>Name A–Z</option>
                </select>
              </div>

              <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: 16 }}>
                <FilterBody compact />
              </div>

              <div style={{ padding: '12px 16px calc(12px + env(safe-area-inset-bottom))', borderTop: '1px solid rgba(0,0,0,0.08)', display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={clearAll}
                  style={{
                    flex: '0 0 auto',
                    background: 'white',
                    border: '1px solid rgba(0,0,0,0.10)',
                    borderRadius: 12,
                    padding: '11px 13px',
                    color: '#607D8B',
                    fontSize: 13,
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={apply}
                  style={{
                    flex: 1,
                    background: '#FF7043',
                    color: 'white',
                    border: 'none',
                    borderRadius: 12,
                    padding: '11px 16px',
                    fontSize: 14,
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(255,112,67,0.25)',
                  }}
                >
                  Apply filters
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <section style={{ ...glassBase, overflow: 'hidden' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) 160px auto',
          gap: 10,
          alignItems: 'center',
          padding: '14px 16px',
        }}
      >
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
            boxSizing: 'border-box',
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
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ width: 13, height: 13, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </button>
      </div>

      {open ? (
        <>
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '14px 16px' }}>
            <FilterBody />
          </div>

          <div
            style={{
              borderTop: '1px solid rgba(0,0,0,0.06)',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <ActivePills />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              {pills.length > 0 ? (
                <button type="button" onClick={clearAll} style={desktopTextButton}>
                  Clear all
                </button>
              ) : null}
              <button
                type="button"
                onClick={apply}
                style={{
                  background: isDirty ? '#FF7043' : 'rgba(255,112,67,0.5)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 18px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: isDirty ? 'pointer' : 'default',
                  transition: 'background 0.15s',
                }}
              >
                Apply filters
              </button>
            </div>
          </div>
        </>
      ) : null}
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

const desktopTextButton = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#90A4AE',
  fontSize: 12,
  fontWeight: 600,
};