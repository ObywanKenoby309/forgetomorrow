// pages/dashboard/coaching/feedback.js
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingRightColumn from '@/components/coaching/CoachingRightColumn';

const STORAGE_KEY = 'coachFeedback_v1';

export default function CoachingFeedbackDashboardPage() {
  const [all, setAll] = useState([]);
  const [coachId, setCoachId] = useState('demo-coach');
  const [ratingFilter, setRatingFilter] = useState('All'); // All, 5,4,3,2,1
  const [consentOnly, setConsentOnly] = useState(false);

  useEffect(() => {
    try {
      const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      setAll(Array.isArray(arr) ? arr : []);
    } catch {
      setAll([]);
    }
  }, []);

  const mine = useMemo(() => all.filter((f) => f.coachId === coachId), [all, coachId]);

  const filtered = useMemo(() => {
    return mine.filter((f) => {
      const byRating = ratingFilter === 'All' ? true : Number(f.rating) === Number(ratingFilter);
      const byConsent = consentOnly ? !!f.consent : true;
      return byRating && byConsent;
    });
  }, [mine, ratingFilter, consentOnly]);

  const stats = useMemo(() => {
    if (mine.length === 0) return { avg: 0, count: 0 };
    const avg = mine.reduce((sum, r) => sum + Number(r.rating || 0), 0) / mine.length;
    return { avg: Number(avg.toFixed(2)), count: mine.length };
  }, [mine]);

  const fmtDate = (iso) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return '—';
    }
  };

  return (
    <CoachingLayout
      title="Coach Feedback | ForgeTomorrow"
      headerTitle="Coach Feedback"
      headerDescription="View ratings, filter testimonials, and open your shareable feedback form."
      activeNav="feedback"
      right={<CoachingRightColumn />}
    >
      <div style={{ display: 'grid', gap: 16, maxWidth: 860 }}>
        {/* Header + Shareable link */}
        <section style={section}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
            <h2 style={{ color: '#FF7043', margin: 0 }}>Coach Feedback</h2>
            <Link
              href={`/feedback/${encodeURIComponent(coachId)}`}
              style={{ color: '#FF7043', fontWeight: 700, textDecoration: 'none' }}
              title="Open public feedback form"
            >
              Open Public Form →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 200px', gap: 12, marginTop: 12 }}>
            <input
              value={coachId}
              onChange={(e) => setCoachId(e.target.value)}
              placeholder="Coach ID (e.g., demo-coach)"
              style={input}
            />
            <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} style={input}>
              <option value="All">All Ratings</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} stars
                </option>
              ))}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={consentOnly} onChange={(e) => setConsentOnly(e.target.checked)} />
              Show testimonials only
            </label>
          </div>
        </section>

        {/* KPI bar */}
        <section style={section}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            <KPI label="Average Rating" value={stats.count ? `${stats.avg} / 5` : '—'} />
            <KPI label="Total Responses" value={String(stats.count)} />
            <KPI label="Testimonials (consented)" value={String(mine.filter((x) => x.consent).length)} />
          </div>
        </section>

        {/* List */}
        <section style={section}>
          {filtered.length === 0 ? (
            <div style={{ color: '#90A4AE' }}>No feedback yet for this coach or filters are too narrow.</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {filtered.map((f) => (
                <div key={f.id} style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <strong style={{ color: '#263238' }}>
                        {'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}
                      </strong>
                      <span style={{ marginLeft: 8, color: '#607D8B', fontSize: 12 }}>{fmtDate(f.createdAt)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {f.consent && <span style={pill('#E8F5E9', '#2E7D32')}>Testimonial OK</span>}
                      {f.anonymous ? (
                        <span style={{ color: '#607D8B', fontSize: 12 }}>Anonymous</span>
                      ) : (
                        <span style={{ color: '#607D8B', fontSize: 12 }}>{f.name || f.email || 'Unnamed'}</span>
                      )}
                    </div>
                  </div>
                  {f.comment && (
                    <div style={{ color: '#455A64', marginTop: 6, whiteSpace: 'pre-wrap' }}>{f.comment}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </CoachingLayout>
  );
}

/* ---- Local UI helpers/styles ---- */
function KPI({ label, value }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #eee',
        borderRadius: 10,
        padding: 12,
        minHeight: 70,
        display: 'grid',
        gap: 4,
      }}
    >
      <div style={{ fontSize: 12, color: '#607D8B', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#263238' }}>{value}</div>
    </div>
  );
}
const pill = (bg, fg) => ({ fontSize: 12, background: bg, color: fg, padding: '4px 8px', borderRadius: 999 });

const section = {
  background: 'white',
  borderRadius: 12,
  padding: 20,
  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
  border: '1px solid #eee',
};
const input = {
  border: '1px solid #ddd',
  borderRadius: 10,
  padding: '10px 12px',
  outline: 'none',
  background: 'white',
};
const card = { background: '#FAFAFA', border: '1px solid #eee', borderRadius: 10, padding: 12 };
