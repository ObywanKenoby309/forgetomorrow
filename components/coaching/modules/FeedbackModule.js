// components/coaching/modules/FeedbackModule.js
//
// Extracted from pages/dashboard/coaching/feedback.js.
// Renders inline — no CoachingLayout, no page wrapper.
// Used by:
//   - pages/dashboard/coaching/client-hub-update.js (inline in hub)
//   - pages/dashboard/coaching/feedback.js          (thin page wrapper)

import React, { useState, useEffect, useCallback, useMemo } from 'react';

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

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function avg(arr, key) {
  if (!arr.length) return null;
  return arr.reduce((s, r) => s + (r[key] || 0), 0) / arr.length;
}

function Stars({ value }) {
  const n = Math.round(value || 0);
  return (
    <span style={{ color: '#FF7043', letterSpacing: 1, fontSize: 14 }}>
      {'★'.repeat(n)}{'☆'.repeat(5 - n)}
    </span>
  );
}

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

function KPI({ label, value }) {
  return (
    <div style={{ ...WHITE_CARD, padding: '12px 14px', display: 'grid', gap: 4 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: '#FF7043', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
        {value}
      </div>
    </div>
  );
}

function ResponseCard({ r }) {
  const overall = Math.round((r.satisfaction + r.timeliness + r.quality) / 3);
  return (
    <div style={{ ...WHITE_CARD, padding: '14px 16px', display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Stars value={overall} />
          <span style={{ fontSize: 12, color: '#90A4AE' }}>{formatDate(r.createdAt)}</span>
        </div>
        {r.anonymous && <span style={{ fontSize: 12, color: '#90A4AE' }}>Anonymous</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
        {[
          { label: 'Satisfaction', val: r.satisfaction },
          { label: 'Timeliness',   val: r.timeliness },
          { label: 'Quality',      val: r.quality },
        ].map(m => (
          <div key={m.label} style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#90A4AE', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
              {m.label}
            </div>
            <Stars value={m.val} />
          </div>
        ))}
      </div>

      {r.comment && (
        <div style={{ fontSize: 13, color: '#455A64', lineHeight: 1.6, paddingTop: 6, borderTop: '1px solid rgba(0,0,0,0.06)', whiteSpace: 'pre-wrap' }}>
          {r.comment}
        </div>
      )}
    </div>
  );
}

export default function FeedbackModule() {
  const [responses, setResponses]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [commentOnly, setCommentOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/coaching/csat');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load feedback');
      setResponses(Array.isArray(data.responses) ? data.responses : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => responses.filter(r => {
    const overall   = Math.round((r.satisfaction + r.timeliness + r.quality) / 3);
    const byRating  = ratingFilter === 'All' ? true : overall === Number(ratingFilter);
    const byComment = commentOnly ? !!r.comment?.trim() : true;
    return byRating && byComment;
  }), [responses, ratingFilter, commentOnly]);

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
    <div style={{ display: 'grid', gap: 14 }}>

      {/* KPI strip — only when there's data */}
      {kpis && (
        <div style={{ ...GLASS, padding: '14px 16px' }}>
          <div style={{ fontSize: 18, color: '#FF7043', marginBottom: 12, ...ORANGE_HEADING_LIFT }}>
            Summary
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 10 }}>
            <KPI label="Satisfaction"    value={`${kpis.satisfaction} / 5`} />
            <KPI label="Timeliness"      value={`${kpis.timeliness} / 5`} />
            <KPI label="Quality"         value={`${kpis.quality} / 5`} />
            <KPI label="Total responses" value={kpis.total} />
            <KPI label="With comments"   value={kpis.withComment} />
          </div>
        </div>
      )}

      {/* Response list */}
      <div style={{ ...GLASS, padding: '18px 20px', minHeight: 280 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 18, color: '#FF7043', ...ORANGE_HEADING_LIFT }}>Responses</div>
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
        </div>

        {error && (
          <div style={{ background: '#FDECEA', border: '1px solid #FFCDD2', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#C62828', marginBottom: 12 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ color: '#90A4AE', fontSize: 13 }}>Loading feedback…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#90A4AE', fontSize: 13 }}>
            {responses.length === 0
              ? 'No feedback yet. Responses will appear here after clients submit the CSAT form.'
              : 'No responses match your current filters.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {filtered.map(r => <ResponseCard key={r.id} r={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}