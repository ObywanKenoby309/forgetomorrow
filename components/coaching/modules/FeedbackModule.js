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

const METRIC_LABELS = {
  satisfaction: 'Satisfaction',
  quality: 'Quality',
  communication: 'Communication',
  helpfulness: 'Helpfulness',
  progress: 'Progress',
  recommendation: 'Recommendation',
  timeliness: 'Timeliness',
};

const SCORE_FIELDS = [
  'satisfaction',
  'quality',
  'communication',
  'helpfulness',
  'progress',
  'recommendation',
  'timeliness',
];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function avg(arr, key) {
  const vals = arr.map(r => r[key]).filter(v => typeof v === 'number' && Number.isFinite(v));
  if (!vals.length) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

function overallScore(r) {
  const vals = SCORE_FIELDS.map(f => r[f]).filter(v => typeof v === 'number' && Number.isFinite(v));
  if (!vals.length) return 0;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

function truncateText(text, max = 150) {
  if (!text) return '';
  const clean = String(text).trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trim()}…`;
}

function Stars({ value, size = 14 }) {
  const n = Math.max(0, Math.min(5, Math.round(value || 0)));

  return (
    <span style={{ color: '#FF7043', letterSpacing: 1, fontSize: size, lineHeight: 1 }}>
      {'★'.repeat(n)}{'☆'.repeat(5 - n)}
    </span>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 12,
        padding: '5px 14px',
        borderRadius: 20,
        border: '1px solid',
        borderColor: active ? '#334155' : 'rgba(0,0,0,0.12)',
        background: active ? '#334155' : 'transparent',
        color: active ? 'white' : '#607D8B',
        cursor: 'pointer',
        fontWeight: 600,
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  );
}

function KPI({ label, value, featured = false }) {
  return (
    <div
      style={{
        ...WHITE_CARD,
        padding: featured ? '14px 18px' : '12px 16px',
        display: 'grid',
        gap: 4,
        minHeight: 86,
        alignContent: 'center',
        textAlign: 'center',
        borderColor: featured ? 'rgba(255,112,67,0.28)' : 'rgba(0,0,0,0.08)',
        background: featured
          ? 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(255,244,239,0.94))'
          : WHITE_CARD.background,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 900,
          color: '#FF7043',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: featured ? 26 : 22,
          fontWeight: 900,
          color: '#0F172A',
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MetricPill({ label, value }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        borderRadius: 999,
        background: 'rgba(255,112,67,0.08)',
        border: '1px solid rgba(255,112,67,0.18)',
        color: '#334155',
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ color: '#607D8B', fontWeight: 800 }}>{label}</span>
      <span style={{ color: '#FF7043' }}>{Number(value).toFixed(0)}★</span>
    </span>
  );
}

function DetailMetric({ label, value }) {
  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.035)',
        border: '1px solid rgba(15,23,42,0.06)',
        borderRadius: 10,
        padding: '9px 10px',
        display: 'grid',
        gap: 5,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 900,
          color: '#78909C',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Stars value={value} size={13} />
        <span style={{ fontSize: 12, fontWeight: 900, color: '#334155' }}>
          {Number(value).toFixed(1)}
        </span>
      </div>
    </div>
  );
}

function ResponseCard({ r }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showFullComment, setShowFullComment] = useState(false);

  const overall = overallScore(r);
  const overallRounded = Math.round(overall);
  const comment = r.comment?.trim() || '';
  const hasLongComment = comment.length > 150;

  const metrics = Object.entries(METRIC_LABELS)
    .filter(([key]) => typeof r[key] === 'number' && Number.isFinite(r[key]))
    .map(([key, label]) => ({ key, label, val: r[key] }));

  const visibleMetrics = metrics.slice(0, 3);
  const hiddenMetricCount = Math.max(0, metrics.length - visibleMetrics.length);

  return (
    <div
      style={{
        ...WHITE_CARD,
        padding: 20,
        display: 'grid',
        gap: 12,
        borderColor: 'rgba(255,112,67,0.12)',
        alignContent: 'start',
      }}
    >
      <div style={{ display: 'grid', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Stars value={overallRounded} size={15} />
          <span style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>
            {overall.toFixed(1)}
          </span>
        </div>

        <div style={{ fontSize: 12, color: '#78909C', fontWeight: 800 }}>
          {formatDate(r.createdAt)}
          {r.anonymous ? ' • Anonymous' : ''}
        </div>
      </div>

      {comment ? (
        <div
          onClick={() => hasLongComment && setShowFullComment(p => !p)}
          style={{
            fontSize: 14,
            color: '#1E293B',
            lineHeight: 1.65,
            background: 'rgba(255,255,255,0.74)',
            border: '1px solid rgba(15,23,42,0.06)',
            borderRadius: 12,
            padding: '13px 14px',
            whiteSpace: 'pre-wrap',
            cursor: hasLongComment ? 'pointer' : 'default',
            minHeight: 72,
          }}
        >
          “{showFullComment ? comment : truncateText(comment)}”
        </div>
      ) : (
        <div
          style={{
            fontSize: 13,
            color: '#90A4AE',
            lineHeight: 1.55,
            background: 'rgba(15,23,42,0.03)',
            border: '1px dashed rgba(15,23,42,0.12)',
            borderRadius: 12,
            padding: '12px 14px',
            minHeight: 72,
          }}
        >
          No written comment included with this response.
        </div>
      )}

      {hasLongComment && (
        <button
          type="button"
          onClick={() => setShowFullComment(p => !p)}
          style={{
            justifySelf: 'start',
            border: 'none',
            background: 'transparent',
            color: '#FF7043',
            fontSize: 12,
            fontWeight: 900,
            cursor: 'pointer',
            fontFamily: 'inherit',
            padding: 0,
          }}
        >
          {showFullComment ? 'Show less' : 'View full comment'}
        </button>
      )}

      {visibleMetrics.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {visibleMetrics.map(m => (
            <MetricPill key={m.key} label={m.label} value={m.val} />
          ))}
        </div>
      )}

      {metrics.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowDetails(p => !p)}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#FF7043',
              fontSize: 12,
              fontWeight: 900,
              cursor: 'pointer',
              fontFamily: 'inherit',
              padding: 0,
            }}
          >
            {showDetails ? 'Hide detailed ratings' : 'View detailed ratings'}
          </button>

          {showDetails && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
                gap: 8,
                marginTop: 10,
              }}
            >
              {metrics.map(m => (
                <DetailMetric key={m.key} label={m.label} value={m.val} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FeedbackModule() {
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

      const rows = Array.isArray(data.responses)
        ? data.responses
        : Array.isArray(data.csat)
          ? data.csat
          : [];

      setResponses(rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => responses.filter(r => {
    const overall = Math.round(overallScore(r));
    const byRating = ratingFilter === 'All' ? true : overall === Number(ratingFilter);
    const byComment = commentOnly ? !!r.comment?.trim() : true;
    return byRating && byComment;
  }), [responses, ratingFilter, commentOnly]);

  const kpis = useMemo(() => {
    if (!responses.length) return null;

    const overallValues = responses
      .map(r => overallScore(r))
      .filter(v => typeof v === 'number' && Number.isFinite(v));

    const overallAverage = overallValues.length
      ? overallValues.reduce((s, v) => s + v, 0) / overallValues.length
      : null;

    const detailFields = Object.entries(METRIC_LABELS)
      .map(([key, label]) => {
        const val = avg(responses, key);
        return val !== null ? { key, label, value: val.toFixed(1) } : null;
      })
      .filter(Boolean);

    const latestFeedback = responses
      .map(r => r.createdAt)
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a))[0];

    return {
      overallAverage,
      total: responses.length,
      withComment: responses.filter(r => r.comment?.trim()).length,
      lastFeedback: latestFeedback ? formatDate(latestFeedback) : '—',
      fields: detailFields,
    };
  }, [responses]);

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {kpis && (
        <div style={{ ...GLASS, padding: '16px 18px' }}>
          <div
            style={{
              fontSize: 18,
              color: '#FF7043',
              marginBottom: 14,
              textAlign: 'center',
              ...ORANGE_HEADING_LIFT,
            }}
          >
            Feedback Summary
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 180px))',
              justifyContent: 'center',
              gap: 10,
              maxWidth: 860,
              margin: '0 auto',
            }}
          >
            <KPI
              label="Overall Rating"
              value={kpis.overallAverage !== null ? `${kpis.overallAverage.toFixed(1)} / 5` : '—'}
              featured
            />
            <KPI label="Total Responses" value={kpis.total} />
            <KPI label="With Comments" value={kpis.withComment} />
            <KPI label="Last Feedback" value={kpis.lastFeedback} />
          </div>

          {kpis.fields.length > 0 && (
            <details style={{ marginTop: 12, textAlign: 'center' }}>
              <summary
                style={{
                  cursor: 'pointer',
                  color: '#FF7043',
                  fontSize: 12,
                  fontWeight: 900,
                  fontFamily: 'inherit',
                  listStylePosition: 'inside',
                }}
              >
                View detailed ratings
              </summary>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
                  gap: 8,
                  marginTop: 10,
                  textAlign: 'left',
                }}
              >
                {kpis.fields.map(f => (
                  <DetailMetric key={f.key} label={f.label} value={Number(f.value)} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      <div style={{ ...GLASS, padding: '18px 20px', minHeight: 280 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 14,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontSize: 18, color: '#FF7043', ...ORANGE_HEADING_LIFT }}>
              Responses
            </div>
            <div style={{ fontSize: 12, color: '#334155', fontWeight: 700, marginTop: 4 }}>
              Review individual comments and coaching experience signals.
            </div>
          </div>

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
          <div
            style={{
              background: '#FDECEA',
              border: '1px solid #FFCDD2',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: '#C62828',
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ color: '#90A4AE', fontSize: 13 }}>Loading feedback…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
              {responses.length === 0 ? 'No feedback yet.' : 'No responses match your current filters.'}
            </div>
            {responses.length === 0 && (
              <div style={{ fontSize: 13, color: '#334155', fontWeight: 500, lineHeight: 1.6 }}>
                Responses will appear here after clients submit the CSAT form.
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: 12,
              alignItems: 'start',
            }}
          >
            {filtered.map(r => <ResponseCard key={r.id} r={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}