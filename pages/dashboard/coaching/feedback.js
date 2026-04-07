// pages/dashboard/coaching/feedback.js
//
// Layout mirrors coaching-dashboard.js exactly:
//   - CoachingLayout with contentFullBleed
//   - CoachingTitleCard, RightRailPlacementManager
//   - GLASS / WHITE_CARD / ORANGE_HEADING_LIFT constants
//
// Data from DB — CoachingCsatResponse records scoped to authed coach.
// No localStorage. No demo coach ID.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingTitleCard from '@/components/coaching/CoachingTitleCard';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';

// ─── Style constants (identical to coaching-dashboard) ────────────────────────
const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};
const WHITE_CARD = {
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 12,
  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  boxSizing: 'border-box',
};
const ORANGE_HEADING_LIFT = {
  textShadow: '0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)',
  fontWeight: 900,
};
const GAP = 16;
const RIGHT_COL_WIDTH = 280;

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function avg(arr, key) {
  if (!arr.length) return null;
  return arr.reduce((s, r) => s + (r[key] || 0), 0) / arr.length;
}

function Stars({ value }) {
  const n = Math.round(value || 0);
  return (
    <span style={{ color: '#FF7043', letterSpacing: 1, fontSize: 15 }}>
      {'★'.repeat(n)}{'☆'.repeat(5 - n)}
    </span>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KPI({ label, value, sub }) {
  return (
    <div style={{ ...WHITE_CARD, padding: '14px 16px', display: 'grid', gap: 4 }}>
      <div style={{
        fontSize: 10, fontWeight: 800, color: '#FF7043',
        textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: '#64748B' }}>{sub}</div>}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children, action, style = {} }) {
  return (
    <section style={{ ...GLASS, padding: 20, ...style }}>
      {title && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 14,
        }}>
          <div style={{
            fontSize: 18, color: '#FF7043', letterSpacing: '-0.01em', ...ORANGE_HEADING_LIFT,
          }}>
            {title}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

// ─── Filter chip ──────────────────────────────────────────────────────────────
function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      fontSize: 12, padding: '5px 14px', borderRadius: 20, border: '1px solid',
      borderColor: active ? '#334155' : 'rgba(0,0,0,0.12)',
      background: active ? '#334155' : 'transparent',
      color: active ? 'white' : '#607D8B',
      cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
    }}>
      {label}
    </button>
  );
}

// ─── Response card ────────────────────────────────────────────────────────────
function ResponseCard({ r }) {
  const overall = Math.round((r.satisfaction + r.timeliness + r.quality) / 3);
  return (
    <div style={{ ...WHITE_CARD, padding: '14px 16px', display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Stars value={overall} />
          <span style={{ fontSize: 12, color: '#90A4AE' }}>{formatDate(r.createdAt)}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {r.anonymous
            ? <span style={{ fontSize: 12, color: '#90A4AE' }}>Anonymous</span>
            : null}
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8,
      }}>
        {[
          { label: 'Satisfaction', val: r.satisfaction },
          { label: 'Timeliness',   val: r.timeliness },
          { label: 'Quality',      val: r.quality },
        ].map(m => (
          <div key={m.label} style={{
            background: 'rgba(0,0,0,0.03)', borderRadius: 8, padding: '8px 10px',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#90A4AE',
              textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
              {m.label}
            </div>
            <Stars value={m.val} />
          </div>
        ))}
      </div>

      {r.comment && (
        <div style={{
          fontSize: 13, color: '#455A64', lineHeight: 1.6,
          paddingTop: 6, borderTop: '1px solid rgba(0,0,0,0.06)',
          whiteSpace: 'pre-wrap',
        }}>
          {r.comment}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CoachingFeedbackPage() {
  useSession();

  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [commentOnly, setCommentOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/coaching/csat');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load feedback');
      setResponses(data.responses);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return responses.filter(r => {
      const overall = Math.round((r.satisfaction + r.timeliness + r.quality) / 3);
      const byRating = ratingFilter === 'All' ? true : overall === Number(ratingFilter);
      const byComment = commentOnly ? !!r.comment?.trim() : true;
      return byRating && byComment;
    });
  }, [responses, ratingFilter, commentOnly]);

  const kpis = useMemo(() => {
    if (!responses.length) return null;
    return {
      satisfaction: avg(responses, 'satisfaction')?.toFixed(1),
      timeliness:   avg(responses, 'timeliness')?.toFixed(1),
      quality:      avg(responses, 'quality')?.toFixed(1),
      total:        responses.length,
      withComment:  responses.filter(r => r.comment?.trim()).length,
    };
  }, [responses]);

  return (
    <CoachingLayout
      title="Feedback | ForgeTomorrow"
      activeNav="feedback"
      contentFullBleed
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      <div style={{ width: '100%', padding: 0, margin: 0, paddingRight: 16, boxSizing: 'border-box' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `minmax(0,1fr) ${RIGHT_COL_WIDTH}px`,
          gridTemplateRows: 'auto auto auto',
          gap: GAP, width: '100%', minWidth: 0, boxSizing: 'border-box',
        }}>

          {/* Title card */}
          <CoachingTitleCard
            title="Client Feedback"
            subtitle="Ratings and comments collected from your clients after coaching sessions."
            style={{ gridColumn: '1/2', gridRow: '1', alignSelf: 'start' }}
          />

          {/* Right rail */}
          <aside style={{
            gridColumn: '2/3', gridRow: '1/4',
            display: 'flex', flexDirection: 'column', gap: GAP,
            alignSelf: 'stretch', boxSizing: 'border-box',
          }}>
            <RightRailPlacementManager slot="right_rail_1" />
          </aside>

          {/* KPI strip */}
          {kpis && (
            <section style={{ ...GLASS, padding: '14px 16px', gridColumn: '1/2', gridRow: '2' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
              }}>
                <div style={{ fontSize: 18, color: '#FF7043', ...ORANGE_HEADING_LIFT }}>
                  Summary
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 12 }}>
                <KPI label="Satisfaction" value={`${kpis.satisfaction} / 5`} />
                <KPI label="Timeliness"   value={`${kpis.timeliness} / 5`} />
                <KPI label="Quality"      value={`${kpis.quality} / 5`} />
                <KPI label="Total responses" value={kpis.total} />
                <KPI label="With comments"   value={kpis.withComment} />
              </div>
            </section>
          )}

          {/* Response list */}
          <Section
            title="Responses"
            style={{ gridColumn: '1/2', gridRow: kpis ? '3' : '2', minHeight: 320 }}
            action={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {['All', '5', '4', '3', '2', '1'].map(f => (
                  <Chip
                    key={f}
                    label={f === 'All' ? 'All ratings' : `${f} ★`}
                    active={ratingFilter === f}
                    onClick={() => setRatingFilter(f)}
                  />
                ))}
                <Chip
                  label="Comments only"
                  active={commentOnly}
                  onClick={() => setCommentOnly(p => !p)}
                />
              </div>
            }
          >
            {error && (
              <div style={{
                background: '#FDECEA', border: '1px solid #FFCDD2', borderRadius: 8,
                padding: '10px 14px', fontSize: 13, color: '#C62828', marginBottom: 12,
              }}>
                {error}
              </div>
            )}

            {loading ? (
              <div style={{ color: '#90A4AE', fontSize: 13 }}>Loading feedback…</div>
            ) : filtered.length === 0 ? (
              <div style={{
                padding: '40px 24px', textAlign: 'center',
                background: 'rgba(255,255,255,0.6)', borderRadius: 10,
                border: '1px dashed rgba(0,0,0,0.12)',
              }}>
                <div style={{ fontSize: 13, color: '#90A4AE' }}>
                  {responses.length === 0
                    ? 'No feedback yet. Responses will appear here after clients submit the CSAT form.'
                    : 'No responses match your current filters.'}
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {filtered.map(r => <ResponseCard key={r.id} r={r} />)}
              </div>
            )}
          </Section>

        </div>
      </div>
    </CoachingLayout>
  );
}