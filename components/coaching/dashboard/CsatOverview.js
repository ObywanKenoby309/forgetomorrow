// components/coaching/dashboard/CsatOverview.js
import React from 'react';
import Link from 'next/link';

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#455A64' }}>
      <span>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}/5</span>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div
      style={{
        background: '#FAFAFA',
        border: '1px solid #eee',
        borderRadius: 10,
        padding: 16,
        minHeight: 120,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{title}</div>
      {children || <div style={{ color: '#90A4AE' }}>Coming soon…</div>}
    </div>
  );
}

export default function CsatOverview({ csat = [], avgScore = '—', totalResponses = 0, recent = [], refreshing = false, onRefresh }) {
  const grid3 = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 12,
  };

  return (
    <section
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        border: '1px solid #eee',
      }}
    >
      <div
        style={{
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ color: '#FF7043', fontWeight: 700, fontSize: 18 }}>CSAT Overview</div>

        <button
          type="button"
          onClick={onRefresh}
          aria-label="Refresh CSAT"
          title="Refresh CSAT"
          style={{
            background: 'white',
            color: '#FF7043',
            border: '1px solid #FF7043',
            borderRadius: 10,
            padding: '8px 10px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div style={grid3}>
        <Card title="Average Score">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#263238' }}>{avgScore}</div>
            <div style={{ color: '#90A4AE', fontSize: 12 }}>/ 5</div>
          </div>
          <div style={{ color: '#607D8B', fontSize: 13, marginTop: 4 }}>
            Based on {totalResponses} {totalResponses === 1 ? 'response' : 'responses'}
          </div>
          <div style={{ marginTop: 10 }}>
            <Link href="/dashboard/coaching/feedback" style={{ color: '#FF7043', fontWeight: 600 }}>
              Open feedback
            </Link>
          </div>
        </Card>

        <Card title="Recent Feedback">
          {recent.length === 0 ? (
            <div style={{ color: '#90A4AE' }}>No responses yet.</div>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
              {recent.map((r) => {
                const avg = ((Number(r.satisfaction) + Number(r.timeliness) + Number(r.quality)) / 3).toFixed(1);
                const comment = (r.comment || '').trim();
                return (
                  <li
                    key={r.id}
                    style={{
                      border: '1px solid #eee',
                      borderRadius: 8,
                      padding: '8px 10px',
                      background: 'white',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div style={{ fontWeight: 700, color: '#263238' }}>{avg}/5</div>
                      <div style={{ color: '#90A4AE', fontSize: 12 }}>
                        {new Date(r.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <div style={{ color: '#455A64', marginTop: 4 }}>
                      {comment ? comment : <span style={{ color: '#90A4AE' }}>(No comment)</span>}
                    </div>
                    {r.anonymous ? (
                      <div style={{ color: '#90A4AE', fontSize: 12, marginTop: 4 }}>Anonymous</div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Breakdown (latest)">
          {csat.length === 0 ? (
            <div style={{ color: '#90A4AE' }}>No data yet.</div>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              <Row label="Satisfaction" value={csat[0].satisfaction} />
              <Row label="Timeliness" value={csat[0].timeliness} />
              <Row label="Quality" value={csat[0].quality} />
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
