// pages/coaching-dashboard.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingRightColumn from '@/components/coaching/CoachingRightColumn';

// ---- Local date helpers (match Coaching Sessions payload: { date, time }) ----
function localISODate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toLocalDateTime(dateStr, timeStr = '00:00') {
  const [y, m, d] = String(dateStr || '').split('-').map(Number);
  const [hh, mm] = String(timeStr || '00:00').split(':').map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1, hh || 0, mm || 0);
}

// Uniform status colors shared across dashboard (matches Clients list)
function getStatusStyles(status) {
  if (status === 'At Risk') {
    return { background: '#FDECEA', color: '#C62828' };
  }
  if (status === 'New Intake') {
    return { background: '#E3F2FD', color: '#1565C0' };
  }
  // default: Active/OK
  return { background: '#E8F5E9', color: '#2E7D32' };
}

export default function CoachingDashboardPage() {
  const router = useRouter();

  // ✅ NEW: Action Center lite preview (coach scope)
  const [actionLoading, setActionLoading] = useState(true);
  const [actionItems, setActionItems] = useState([]);

  // ---- Sessions (DB source of truth) ----
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sessions payload shape returned by /api/coaching/sessions.ts:
  // { id, date, time, client, type, status, clientId, clientType, notes, participants }
  const [sessions, setSessions] = useState([]);

  const loadSessions = useCallback(async () => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/coaching/sessions', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to load coaching sessions');
      }

      const data = await res.json();
      const list = Array.isArray(data?.sessions) ? data.sessions : [];
      setSessions(list);
      setLoading(false);
    } catch (err) {
      console.error('Error loading coaching sessions:', err);
      setError('Unable to load your coaching dashboard right now.');
      setSessions([]);
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // ✅ NEW: load Action Center preview (unread only)
  useEffect(() => {
    let cancelled = false;

    async function loadActionPreview() {
      setActionLoading(true);
      try {
        const res = await fetch('/api/notifications/list?scope=COACH&limit=3&includeRead=0', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!res.ok) {
          if (!cancelled) setActionItems([]);
          return;
        }

        const data = await res.json();
        if (cancelled) return;
        setActionItems(Array.isArray(data?.items) ? data.items : []);
      } catch (e) {
        console.error('Coach action preview error:', e);
        if (!cancelled) setActionItems([]);
      } finally {
        if (!cancelled) setActionLoading(false);
      }
    }

    loadActionPreview();
    const t = setInterval(loadActionPreview, 25000);

    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  // ---- CSAT (DB source of truth) ----
  const [csat, setCsat] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [csatError, setCsatError] = useState('');

  const loadCsat = useCallback(async () => {
    setCsatError('');
    try {
      const res = await fetch('/api/coaching/csat', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.status === 401) return;
      if (!res.ok) {
        throw new Error('Failed to load CSAT');
      }

      const data = await res.json();
      const list =
        (Array.isArray(data?.csat) && data.csat) ||
        (Array.isArray(data?.responses) && data.responses) ||
        (Array.isArray(data?.items) && data.items) ||
        [];

      setCsat(list);
    } catch (err) {
      console.error('Error loading CSAT:', err);
      setCsat([]);
      setCsatError('CSAT data is unavailable right now.');
    }
  }, []);

  useEffect(() => {
    loadCsat();
  }, [loadCsat]);

  const refreshCsat = async () => {
    setRefreshing(true);
    await loadCsat();
    setTimeout(() => setRefreshing(false), 120);
  };

  // ---- KPIs derived from sessions ----
  const todayISO = localISODate();
  const now = new Date();

  const sessionsToday = useMemo(
    () => sessions.filter((s) => s?.date === todayISO),
    [sessions, todayISO]
  );

  const upcomingNext3 = useMemo(() => {
    return sessions
      .filter((s) => s?.date && s?.time && toLocalDateTime(s.date, s.time) >= now)
      .sort((a, b) => toLocalDateTime(a.date, a.time) - toLocalDateTime(b.date, b.time))
      .slice(0, 3);
  }, [sessions, now]);

  const activeClients = useMemo(() => {
    const set = new Set(
      sessions
        .map((s) => (s?.client || '').trim())
        .filter(Boolean)
    );
    return set.size;
  }, [sessions]);

  const followUpsDue = 0;

  const kpis = [
    { label: 'Sessions Today', value: sessionsToday.length },
    { label: 'Active Clients', value: activeClients },
    { label: 'Follow-ups Due', value: followUpsDue },
  ];

  // ---- Clients table derived from sessions (minimal, no new endpoints) ----
  const clients = useMemo(() => {
    const byClient = new Map();

    for (const s of sessions) {
      const name = (s?.client || '').trim();
      if (!name) continue;

      const dt = s?.date && s?.time ? toLocalDateTime(s.date, s.time) : null;
      const existing = byClient.get(name);

      if (!existing) {
        byClient.set(name, {
          id: s?.clientId || name,
          name,
          status: s?.status || 'Active',
          nextSession: dt && dt >= now ? dt : null,
        });
        continue;
      }

      existing.status = s?.status || existing.status;

      if (dt && dt >= now) {
        if (!existing.nextSession || dt < existing.nextSession) {
          existing.nextSession = dt;
        }
      }

      byClient.set(name, existing);
    }

    return Array.from(byClient.values()).sort((a, b) => {
      const aTime = a.nextSession ? a.nextSession.getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.nextSession ? b.nextSession.getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
  }, [sessions, now]);

  // ---- CSAT stats ----
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

  return (
    <CoachingLayout
      title="Coaching Dashboard | ForgeTomorrow"
      activeNav="overview"
      headerDescription="Track client progress, manage sessions, and review feedback — all in one place."
      right={<CoachingRightColumn />}
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      <div style={{ display: 'grid', gap: 16, width: '100%' }}>
        {/* Error banner (sessions API fails) */}
        {error && (
          <div
            style={{
              background: '#FDECEA',
              borderRadius: 8,
              padding: 10,
              border: '1px solid #FFCDD2',
              color: '#C62828',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

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
            {kpis.map((k) => (
              <KPI key={k.label} label={k.label} value={k.value} />
            ))}
          </div>

          <div style={grid3}>
            <Card title="Upcoming Sessions">
              {loading ? (
                <div style={{ color: '#90A4AE', fontSize: 14 }}>
                  Loading upcoming sessions…
                </div>
              ) : upcomingNext3.length === 0 ? (
                <div style={{ color: '#90A4AE' }}>
                  No upcoming sessions yet. Once you add sessions in the calendar, they will appear here.
                </div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                  {upcomingNext3.map((s) => {
                    const { background, color } = getStatusStyles(s.status);
                    return (
                      <li
                        key={s.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: '1px solid #eee',
                          borderRadius: 8,
                          padding: '8px 10px',
                          background: 'white',
                          gap: 10,
                        }}
                      >
                        <span style={{ fontWeight: 600, minWidth: 72 }}>
                          {s.time || '—'}
                        </span>
                        <div style={{ display: 'grid', gap: 2, flex: 1 }}>
                          <span style={{ color: '#455A64' }}>
                            {s.client || 'Client'}
                          </span>
                          <span style={{ color: '#90A4AE', fontSize: 12 }}>
                            {s.type || 'Session'}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            background,
                            color,
                            padding: '4px 8px',
                            borderRadius: 999,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {s.status || 'Scheduled'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div style={{ textAlign: 'right', marginTop: 10 }}>
                <Link
                  href="/dashboard/coaching/sessions"
                  style={{ color: '#FF7043', fontWeight: 600 }}
                >
                  View schedule
                </Link>
              </div>
            </Card>

            {/* ✅ NEW: Action Center lite preview */}
            <Card title="Action Center">
              {actionLoading ? (
                <div style={{ color: '#90A4AE' }}>Loading updates…</div>
              ) : actionItems.length === 0 ? (
                <div style={{ color: '#90A4AE' }}>No unread items.</div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {actionItems.map((n) => (
                    <Link
                      key={n.id}
                      href="/action-center?scope=COACH"
                      style={{
                        display: 'block',
                        border: '1px solid #eee',
                        borderRadius: 8,
                        padding: '8px 10px',
                        background: 'white',
                        textDecoration: 'none',
                      }}
                    >
                      <div style={{ fontWeight: 700, color: '#263238', fontSize: 13 }}>
                        {n.title || 'Update'}
                      </div>
                      {n.body ? (
                        <div style={{ color: '#607D8B', fontSize: 12, marginTop: 2 }}>
                          {n.body}
                        </div>
                      ) : null}
                    </Link>
                  ))}
                </div>
              )}

              <div style={{ textAlign: 'right', marginTop: 10 }}>
                <Link href="/action-center?scope=COACH" style={{ color: '#FF7043', fontWeight: 600 }}>
                  View all
                </Link>
              </div>
            </Card>

            <Card title="Follow-ups Due" />
          </div>
        </Section>

        {/* Clients */}
        <Section title="Clients">
          {loading ? (
            <div
              style={{
                padding: 16,
                background: 'white',
                borderRadius: 10,
                border: '1px solid #eee',
                color: '#90A4AE',
                fontSize: 14,
              }}
            >
              Loading clients…
            </div>
          ) : clients.length === 0 ? (
            <div
              style={{
                padding: 16,
                background: 'white',
                borderRadius: 10,
                border: '1px solid #eee',
                color: '#90A4AE',
                fontSize: 14,
              }}
            >
              No clients yet. Once you start working with clients, a quick snapshot of their status will appear here.
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'separate',
                    borderSpacing: 0,
                    background: 'white',
                    border: '1px solid #eee',
                    borderRadius: 10,
                    overflow: 'hidden',
                  }}
                >
                  <thead>
                    <tr style={{ background: '#FAFAFA' }}>
                      <Th>Name</Th>
                      <Th>Status</Th>
                      <Th>Next Session</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((c) => {
                      const { background, color } = getStatusStyles(c.status);
                      return (
                        <tr key={c.id} style={{ borderTop: '1px solid #eee' }}>
                          <Td strong>{c.name}</Td>
                          <Td>
                            <span
                              style={{
                                fontSize: 12,
                                background,
                                color,
                                padding: '4px 8px',
                                borderRadius: 999,
                              }}
                            >
                              {c.status}
                            </span>
                          </Td>
                          <Td>
                            {c.nextSession
                              ? c.nextSession.toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ textAlign: 'right', marginTop: 10 }}>
                <Link
                  href="/dashboard/coaching/clients"
                  style={{ color: '#FF7043', fontWeight: 600 }}
                >
                  View all clients
                </Link>
              </div>
            </>
          )}
        </Section>

        {/* CSAT */}
        <Section
          title="CSAT Overview"
          action={
            <button
              type="button"
              onClick={refreshCsat}
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
          }
        >
          {csatError ? (
            <div
              style={{
                background: '#FFF3E0',
                border: '1px solid #FFCC80',
                borderRadius: 10,
                padding: 10,
                color: '#6D4C41',
                fontSize: 13,
                marginBottom: 12,
              }}
            >
              {csatError}
            </div>
          ) : null}

          <div style={grid3}>
            <Card title="Average Score">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#263238' }}>
                  {avgScore}
                </div>
                <div style={{ color: '#90A4AE', fontSize: 12 }}>/ 5</div>
              </div>
              <div style={{ color: '#607D8B', fontSize: 13, marginTop: 4 }}>
                Based on {totalResponses} {totalResponses === 1 ? 'response' : 'responses'}
              </div>
              <div style={{ marginTop: 10 }}>
                <Link
                  href="/dashboard/coaching/feedback"
                  style={{ color: '#FF7043', fontWeight: 600 }}
                >
                  Open feedback
                </Link>
              </div>
            </Card>

            <Card title="Recent Feedback">
              {recent.length === 0 ? (
                <div style={{ color: '#90A4AE' }}>No responses yet.</div>
              ) : (
                <ul
                  style={{
                    margin: 0,
                    padding: 0,
                    listStyle: 'none',
                    display: 'grid',
                    gap: 8,
                  }}
                >
                  {recent.map((r) => {
                    const avg = (
                      (Number(r.satisfaction) +
                        Number(r.timeliness) +
                        Number(r.quality)) /
                      3
                    ).toFixed(1);
                    const comment = (r.comment || '').trim();
                    const createdAt = r.createdAt ? new Date(r.createdAt) : null;

                    return (
                      <li
                        key={r.id || `${avg}-${comment}-${String(r.createdAt || '')}`}
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
                            {createdAt
                              ? createdAt.toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })
                              : ''}
                          </div>
                        </div>
                        <div style={{ color: '#455A64', marginTop: 4 }}>
                          {comment ? comment : <span style={{ color: '#90A4AE' }}>(No comment)</span>}
                        </div>
                        {r.anonymous ? (
                          <div style={{ color: '#90A4AE', fontSize: 12, marginTop: 4 }}>
                            Anonymous
                          </div>
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
        </Section>

        {/* Docs & Tools */}
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

/* ---------- Local UI helpers (kept intact) ---------- */

function Section({ title, children, action = null }) {
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
        <div
          style={{
            color: '#FF7043',
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          {title}
        </div>
        {action}
      </div>
      <div>{children}</div>
    </section>
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

function KPI({ label, value }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #eee',
        borderRadius: 10,
        padding: 12,
        minHeight: 70,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 4,
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: '#607D8B',
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: '#263238',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Th({ children }) {
  return (
    <th
      style={{
        textAlign: 'left',
        padding: '10px 12px',
        fontSize: 13,
        color: '#546E7A',
        borderBottom: '1px solid #eee',
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, strong = false }) {
  return (
    <td
      style={{
        padding: '10px 12px',
        fontSize: 14,
        color: '#37474F',
        fontWeight: strong ? 600 : 400,
        background: 'white',
      }}
    >
      {children}
    </td>
  );
}

function Row({ label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        color: '#455A64',
      }}
    >
      <span>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}/5</span>
    </div>
  );
}

const grid3 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 12,
};
