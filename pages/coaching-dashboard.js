// pages/coaching-dashboard.js
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingRightColumn from '@/components/coaching/CoachingRightColumn';

const STORAGE_KEY = 'coachCSAT_v1';
const SESSIONS_KEY = 'coachSessions_v1';

// ---- Local date helpers (match Coaching Sessions page) ----
function localISODate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toLocalDateTime(dateStr, timeStr = '00:00') {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0);
}

// Uniform status colors
function getStatusStyles(status) {
  if (status === 'At Risk') {
    return { background: '#FDECEA', color: '#C62828' };
  }
  if (status === 'New Intake') {
    return { background: '#E3F2FD', color: '#1565C0' };
  }
  return { background: '#E8F5E9', color: '#2E7D32' };
}

export default function CoachingDashboardPage() {
  // ---- CSAT ----
  const [csat, setCsat] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadCsat = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      setCsat(Array.isArray(arr) ? arr : []);
    } catch {
      setCsat([]);
    }
  }, []);

  useEffect(() => {
    loadCsat();
  }, [loadCsat]);

  const refreshCsat = () => {
    setRefreshing(true);
    setTimeout(() => {
      loadCsat();
      setRefreshing(false);
    }, 120);
  };

  const avgScore =
    csat.length > 0
      ? (
          csat.reduce(
            (sum, r) =>
              sum +
              (Number(r.satisfaction) +
                Number(r.timeliness) +
                Number(r.quality)) /
                3,
            0
          ) / csat.length
        ).toFixed(1)
      : '—';

  const totalResponses = csat.length;
  const recent = csat.slice(0, 3);

  // ---- Sessions ----
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
      setSessions(Array.isArray(saved) ? saved : []);
    } catch {
      setSessions([]);
    }
  }, []);

  const todayISO = localISODate();
  const sessionsToday = sessions.filter((s) => s.date === todayISO);
  const activeClients = new Set(sessions.map((s) => s.client)).size;

  const now = new Date();
  const upcomingNext3 = sessions
    .filter((s) => s.date && s.time && toLocalDateTime(s.date, s.time) >= now)
    .sort(
      (a, b) =>
        toLocalDateTime(a.date, a.time) - toLocalDateTime(b.date, b.time)
    )
    .slice(0, 3);

  const clients = [];

  return (
    <CoachingLayout
      title="Coaching Dashboard | ForgeTomorrow"
      activeNav="overview"
      headerDescription="Track client progress, manage sessions, and review feedback — all in one place."
      right={<CoachingRightColumn />}
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      <div style={{ display: 'grid', gap: 16, width: '100%' }}>
        {/* TODAY */}
        <Section title="Today">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <KPI label="Sessions Today" value={sessionsToday.length} />
            <KPI label="Active Clients" value={activeClients} />
            <KPI label="Follow-ups Due" value={0} />
          </div>

          <div style={grid3}>
            <Card title="Upcoming Sessions">
              {upcomingNext3.length === 0 ? (
                <div style={{ color: '#90A4AE' }}>
                  No upcoming sessions yet.
                </div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {upcomingNext3.map((s, i) => {
                    const { background, color } = getStatusStyles(s.status);
                    return (
                      <li
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          border: '1px solid #eee',
                          borderRadius: 8,
                          padding: 8,
                          marginBottom: 6,
                          background: 'white',
                        }}
                      >
                        <strong>{s.time}</strong>
                        <span>{s.client}</span>
                        <span
                          style={{
                            background,
                            color,
                            fontSize: 12,
                            padding: '4px 8px',
                            borderRadius: 999,
                          }}
                        >
                          {s.status}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div style={{ textAlign: 'right', marginTop: 10 }}>
                <Link href="/dashboard/coaching/sessions" style={{ color: '#FF7043', fontWeight: 600 }}>
                  View schedule
                </Link>
              </div>
            </Card>

            <Card title="New Client Intakes" />
            <Card title="Follow-ups Due" />
          </div>
        </Section>

        {/* CSAT */}
        <Section
          title="CSAT Overview"
          action={
            <button
              type="button"
              onClick={refreshCsat}
              style={{
                background: 'white',
                color: '#FF7043',
                border: '1px solid #FF7043',
                borderRadius: 10,
                padding: '8px 10px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          }
        >
          <div style={grid3}>
            <Card title="Average Score">
              <div style={{ fontSize: 28, fontWeight: 800 }}>{avgScore}</div>
              <div style={{ color: '#90A4AE' }}>
                Based on {totalResponses} responses
              </div>
            </Card>

            <Card title="Recent Feedback">
              {recent.length === 0 ? (
                <div style={{ color: '#90A4AE' }}>No responses yet.</div>
              ) : (
                recent.map((r, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    {(Number(r.satisfaction) +
                      Number(r.timeliness) +
                      Number(r.quality)) /
                      3}
                    /5
                  </div>
                ))
              )}
            </Card>

            <Card title="Breakdown (latest)">
              {csat.length === 0 ? (
                <div style={{ color: '#90A4AE' }}>No data yet.</div>
              ) : (
                <>
                  <Row label="Satisfaction" value={csat[0].satisfaction} />
                  <Row label="Timeliness" value={csat[0].timeliness} />
                  <Row label="Quality" value={csat[0].quality} />
                </>
              )}
            </Card>
          </div>
        </Section>

        {/* Docs */}
        <Section title="Docs & Tools">
          <div style={grid3}>
            <Card title="Templates & Guides" />
            <Card title="Resource Library" />
            <Card title="Announcements" />
          </div>
        </Section>
      </div>
    </CoachingLayout>
  );
}

/* ---------- UI helpers ---------- */

function Section({ title, children, action }) {
  return (
    <section style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #eee' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ color: '#FF7043' }}>{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: '#FAFAFA', border: '1px solid #eee', borderRadius: 10, padding: 16 }}>
      <strong>{title}</strong>
      <div style={{ marginTop: 8 }}>{children || <span style={{ color: '#90A4AE' }}>Coming soon…</span>}</div>
    </div>
  );
}

function KPI({ label, value }) {
  return (
    <div style={{ border: '1px solid #eee', borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 12, color: '#607D8B' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span>{label}</span>
      <strong>{value}/5</strong>
    </div>
  );
}

const grid3 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 12,
};
