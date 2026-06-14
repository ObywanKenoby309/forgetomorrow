// pages/hearth/spotlights/index.js
//
// Full rebuild — new card/detail UI matching the v2 mock.
// - Collapsible SpotlightFilters with apply button
// - List cards: hook line, soft tags, availability badge, CSAT mini, Book + Profile CTAs
// - Detail panel: avatar initials, CSAT strip, why-I-coach quote, specialty pills,
//   next available, rate/sessions meta, Book + Message CTAs
// - Click card → detail panel updates (no page nav)
// - Sort and csatMin passed as query params to API

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import InternalLayout from '@/components/layouts/InternalLayout';
import SpotlightFilters from '@/components/spotlights/SpotlightFilters';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import SupportFloatingButton from '@/components/SupportFloatingButton';

// ─── SSR-safe mobile hook ────────────────────────────────────────────────────
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

const glassBase = {
  background: 'rgba(255,255,255,0.78)',
  border: '1px solid rgba(255,255,255,0.55)',
  borderRadius: 14,
  boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
};

const WHITE_CARD = {
  background: 'rgba(255,255,255,0.92)',
  border: '0.5px solid rgba(0,0,0,0.08)',
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  boxSizing: 'border-box',
};

// ─── Availability badge ───────────────────────────────────────────────────────
function AvailBadge({ value, large }) {
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
      borderRadius: 20, fontWeight: 700,
      ...s,
    }}>
      {value || 'Open to discuss'}
    </span>
  );
}

// ─── CSAT stars (filled/empty) ────────────────────────────────────────────────
function Stars({ value, size = 11 }) {
  const n = Math.round(value || 0);
  return (
    <span style={{ color: '#FF7043', fontSize: size, letterSpacing: 1 }}>
      {'★'.repeat(n)}{'☆'.repeat(5 - n)}
    </span>
  );
}

// ─── Initials avatar ──────────────────────────────────────────────────────────
function Avatar({ name, size = 44 }) {
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
function SpotlightCard({ spotlight, selected, onSelect }) {
  const { name, headline, hook, summary, specialties, rate, availability, csat } = spotlight;
  const displayHook = hook || headline || '';
  const displayDesc = summary || '';
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
      {displayDesc && (
        <div style={{ fontSize: 12, color: '#546E7A', lineHeight: 1.5, marginBottom: 8 }}>
          {displayDesc.length > 120 ? `${displayDesc.slice(0, 120)}…` : displayDesc}
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
          {csat?.overall !== null && csat?.overall !== undefined && (
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
function SpotlightDetail({ spotlight }) {
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
      {csat?.overall !== null && csat?.overall !== undefined && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
            {[
              { label: 'Satisfaction', val: csat.satisfaction },
              { label: 'Timeliness',   val: csat.timeliness },
              { label: 'Quality',      val: csat.quality },
            ].map((m) => (
              <div key={m.label} style={{
                background: 'rgba(0,0,0,0.03)', borderRadius: 8,
                padding: '8px 10px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                  {m.label}
                </div>
                <div style={{ fontSize: 17, fontWeight: 900, color: '#112033' }}>
                  {m.val !== null ? m.val : '—'}
                </div>
                {m.val !== null && <Stars value={m.val} size={10} />}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#90A4AE', textAlign: 'center', marginTop: -6 }}>
            Based on {csat.sessions} {csat.sessions === 1 ? 'session' : 'sessions'}
          </div>
        </>
      )}

      {/* Why I coach quote */}
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
          <div style={{ fontSize: 10, fontWeight: 700, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>
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
              style={{ fontSize: 11, color: '#FF7043', background: 'none', border: 'none', cursor: 'pointer', marginTop: 5, padding: 0, fontWeight: 600 }}
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

// ─── Page shell ───────────────────────────────────────────────────────────────
function PageShell({ header, right, children }) {
  return (
    <div className="px-4 md:px-8 pb-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1.8fr)_minmax(260px,0.7fr)] gap-6">
        <div className="space-y-4">
          {header}
          {children}
        </div>
        <aside className="hidden lg:block">{right}</aside>
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <header style={{ ...glassBase, padding: '20px 24px', textAlign: 'center' }}>
      <h1 style={{ color: '#FF7043', fontSize: 28, fontWeight: 800, margin: 0 }}>
        Hearth Spotlight
      </h1>
      <p style={{ margin: '8px 0 0', color: '#546E7A', fontSize: 14 }}>
        Find a mentor or guide who is actively offering help.
      </p>
    </header>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HearthSpotlightsPage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  const [spotlights, setSpotlights] = useState([]);
  const [selected, setSelected]     = useState(null);
  const [filters, setFilters]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  const load = useCallback(async (committedFilters) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (committedFilters?.sort)    params.set('sort', committedFilters.sort);
      if (committedFilters?.csatMin && committedFilters.csatMin !== 'Any') {
        params.set('csatMin', committedFilters.csatMin.replace('+', ''));
      }
      const res = await fetch(`/api/hearth/spotlights?${params.toString()}`);
      if (res.status === 401) { router.push('/login'); return; }
      if (!res.ok) throw new Error('Failed to load spotlights');
      const data = await res.json();
      const list =
        (Array.isArray(data?.spotlights) && data.spotlights) ||
        (Array.isArray(data)             && data)            ||
        [];
      setSpotlights(list);
      if (list.length > 0) setSelected(list[0]);
    } catch (e) {
      console.error(e);
      setError('Spotlights are unavailable right now. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(null); }, [load]);

  // Client-side filter for q, specialties, availability, rate
  // Sort and csatMin are server-side (passed as query params on apply)
  const filtered = useMemo(() => {
    let arr = [...spotlights];
    if (!filters) return arr;
    const term = (filters.q || '').trim().toLowerCase();
    if (term) {
      arr = arr.filter((a) =>
        [a.name, a.headline, a.hook, a.summary, (a.specialties || []).join(' ')]
          .join(' ').toLowerCase().includes(term)
      );
    }
    if (filters.specialties?.length) {
      arr = arr.filter((a) =>
        (a.specialties || []).some((s) => filters.specialties.includes(s))
      );
    }
    if (filters.availability && filters.availability !== 'Any') {
      arr = arr.filter((a) => a.availability === filters.availability);
    }
    if (filters.rate?.length) {
      arr = arr.filter((a) => filters.rate.includes(a.rate));
    }
    return arr;
  }, [spotlights, filters]);

  function handleFiltersApply(f) {
    setFilters(f);
    // Re-fetch from server for sort and csatMin changes
    load(f);
  }

  return (
    <InternalLayout activeNav="hearth">
      <Head>
        <title>Hearth Spotlight | ForgeTomorrow</title>
      </Head>

      <PageShell
        header={<PageHeader />}
        right={<RightRailPlacementManager surfaceId="hearth/spotlights" />}
      >
        <SpotlightFilters onChange={handleFiltersApply} />

        {error && (
          <div style={{ ...glassBase, padding: '14px 16px', color: '#C62828', fontSize: 13 }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ ...glassBase, padding: '14px 16px', color: '#90A4AE', fontSize: 13 }}>
            Loading spotlights…
          </div>
        )}

        {!loading && !error && spotlights.length === 0 && (
          <div style={{ ...glassBase, padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color: '#37474F', fontSize: 15, marginBottom: 6 }}>
              No Hearth Spotlights yet
            </div>
            <div style={{ color: '#607D8B', fontSize: 13, lineHeight: 1.6 }}>
              As mentors join The Hearth and opt in, they'll appear here.
            </div>
          </div>
        )}

        {!loading && !error && spotlights.length > 0 && filtered.length === 0 && (
          <div style={{ ...glassBase, padding: '14px 16px', color: '#90A4AE', fontSize: 13 }}>
            No mentors match your filters.
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          isMobile ? (
            // Mobile: single column — list then detail below on selection
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map((s) => (
                  <SpotlightCard
                    key={s.id}
                  spotlight={s}
                  selected={selected?.id === s.id}
                  onSelect={setSelected}
                />
              ))}
            </div>
            {selected && (
              <SpotlightDetail spotlight={selected} />
            )}
          </div>
          ) : (
          // Desktop: two-column list + sticky detail
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1.8fr) minmax(0,1.5fr)',
            gap: 14,
            alignItems: 'flex-start',
          }}>
            {/* List */}
            <div style={{
              maxHeight: '78vh', overflowY: 'auto',
              display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4,
            }}>
              {filtered.map((s) => (
                <SpotlightCard
                  key={s.id}
                  spotlight={s}
                  selected={selected?.id === s.id}
                  onSelect={setSelected}
                />
              ))}
            </div>

            {/* Detail */}
            <div style={{ position: 'sticky', top: 16 }}>
              {selected
                ? <SpotlightDetail spotlight={selected} />
                : <div style={{ ...WHITE_CARD, padding: '20px', color: '#90A4AE', fontSize: 13 }}>
                    Select a mentor to view details.
                  </div>
              }
            </div>
          </div>
          )
        )}
      </PageShell>

      <SupportFloatingButton />
    </InternalLayout>
  );
}