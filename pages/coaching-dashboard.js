// pages/coaching-dashboard.js
// Layout strategy — identical blueprint to Seeker and Recruiter dashboards:
//   - CoachingLayout receives NO header prop, NO right prop
//   - contentFullBleed passed so main overflowX clipping removed for this page only
//   - DashboardBody owns the full internal grid
//   - Right rail (Sponsored + CSAT Pulse) lives INSIDE the internal grid, spans rows 1-3
//   - Bottom 3 cards use marginLeft: -252 to extend under sidebar
//
// Visual structure:
// ┌─────────────────────────────┬──────────────┐
// │ Title Card       (row 1)    │  Sponsored   │
// ├─────────────────────────────│  (rows 1-3)  │
// │ KPI Row          (row 2)    │              │
// ├─────────────────────────────│  CSAT Pulse  │
// │ Action Center    (row 3)    │              │
// ├─────────────────────────────┴──────────────┤
// │ Clients       │ Docs & Tools │ Upcoming    │  ← full width incl. under sidebar
// └──────────────────────────────────────────────┘

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import CoachingLayout from '@/components/layouts/CoachingLayout';

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

function safeText(v) {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function pickActionBucket(n) {
  const title = safeText(n?.title).toLowerCase();
  const body = safeText(n?.body).toLowerCase();
  const meta = n?.metadata || {};
  const metaStr = safeText(meta?.type || meta?.event || meta?.kind || '').toLowerCase();
  const haystack = `${title} ${body} ${metaStr}`;

  // Heuristics (no new schema assumptions)
  if (
    haystack.includes('feedback') ||
    haystack.includes('csat') ||
    haystack.includes('rating') ||
    haystack.includes('survey')
  ) {
    return 'feedback';
  }
  if (
    haystack.includes('calendar') ||
    haystack.includes('invite') ||
    haystack.includes('session') ||
    haystack.includes('resched') ||
    haystack.includes('schedule')
  ) {
    return 'calendar';
  }
  if (
    haystack.includes('message') ||
    haystack.includes('inbox') ||
    haystack.includes('dm') ||
    haystack.includes('signal')
  ) {
    return 'messages';
  }

  // Default bucket so nothing disappears
  return 'messages';
}

export default function CoachingDashboardPage() {
  const router = useRouter();

  // ✅ Action Center lite preview (coach scope)
  const [actionLoading, setActionLoading] = useState(true);
  const [actionRefreshing, setActionRefreshing] = useState(false);
  const [actionBootstrapped, setActionBootstrapped] = useState(false);
  const [actionItems, setActionItems] = useState([]);

  // ---- Sessions (DB source of truth) ----
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  // ✅ load Action Center preview (unread only)
  useEffect(() => {
    let cancelled = false;

    async function loadActionPreview() {
      if (!actionBootstrapped) {
        setActionLoading(true);
      } else {
        setActionRefreshing(true);
      }

      try {
        const res = await fetch('/api/notifications/list?scope=COACH&limit=12&includeRead=0', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!res.ok) {
          if (!cancelled && !actionBootstrapped) {
            setActionItems([]);
          }
          return;
        }

        const data = await res.json();
        if (cancelled) return;

        const nextItems = Array.isArray(data?.items) ? data.items : [];
        setActionItems(nextItems);
        setActionBootstrapped(true);
      } catch (e) {
        console.error('Coach action preview error:', e);
        if (!cancelled && !actionBootstrapped) {
          setActionItems([]);
        }
      } finally {
        if (!cancelled) {
          setActionLoading(false);
          setActionRefreshing(false);
        }
      }
    }

    loadActionPreview();
    const t = setInterval(loadActionPreview, 25000);

    return () => {
      cancelled = true;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionBootstrapped]);

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

  const clientsPreview = useMemo(() => clients.slice(0, 5), [clients]);

  // ---- CSAT stats ----
  const avgScore =
    csat.length > 0
      ? (
          csat.reduce(
            (sum, r) =>
              sum +
              (Number(r.satisfaction) + Number(r.timeliness) + Number(r.quality)) / 3,
            0
          ) / csat.length
        ).toFixed(1)
      : '—';

  const totalResponses = csat.length;

  // ---- Action Center buckets (lite) ----
  const actionBuckets = useMemo(() => {
    const buckets = { messages: [], feedback: [], calendar: [], clients: [] };

    for (const n of Array.isArray(actionItems) ? actionItems : []) {
      const bucket = pickActionBucket(n);
      if (buckets[bucket]) buckets[bucket].push(n);
    }

    return {
      messages: buckets.messages.slice(0, 3),
      feedback: buckets.feedback.slice(0, 3),
      calendar: buckets.calendar.slice(0, 3),
      clients: buckets.clients.slice(0, 3),
    };
  }, [actionItems]);

  // ---- Style constants (same blueprint as Seeker + Recruiter) ----
  const RIGHT_COL_WIDTH = 280;
  const GAP = 16;

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

  const DARK_RAIL = {
    background: '#2a2a2a',
    border: '1px solid #3a3a3a',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    boxSizing: 'border-box',
  };

  const kpis = [
    { label: 'Sessions Today', value: loading ? '—' : sessionsToday.length, href: '/dashboard/coaching/sessions' },
    { label: 'Active Clients', value: loading ? '—' : activeClients, href: '/dashboard/coaching/clients' },
    { label: 'Follow-ups Due', value: followUpsDue, href: '/action-center?scope=COACH' },
    { label: 'Avg Session Rating', value: avgScore === '—' ? '—' : `${avgScore} / 5`, href: '/dashboard/coaching/feedback' },
  ];

  return (
    <CoachingLayout
      title="Coaching Dashboard | ForgeTomorrow"
      activeNav="overview"
      contentFullBleed
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      <div style={{ width: '100%', padding: 0, margin: 0, paddingRight: 16, boxSizing: 'border-box' }}>

        {/* Error banner */}
        {error && (
          <div style={{ background: '#FDECEA', borderRadius: 8, padding: 10, border: '1px solid #FFCDD2', color: '#C62828', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* ✅ INTERNAL PAGE GRID — identical blueprint to Seeker + Recruiter */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `minmax(0, 1fr) ${RIGHT_COL_WIDTH}px`,
            gridTemplateRows: 'auto auto auto auto',
            gap: GAP,
            width: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
          }}
        >
          {/* ROW 1, COL 1: Title card */}
          <section
            style={{ ...GLASS, padding: 16, textAlign: 'center', gridColumn: '1 / 2', gridRow: '1', boxSizing: 'border-box' }}
            aria-label="Coaching dashboard overview"
          >
            <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
              Your Coaching Dashboard
            </h1>
            <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 740 }}>
              Track client progress, manage sessions, and review feedback — all in one place.
            </p>
          </section>

          {/* ROW 2, COL 1: KPI strip — 4 stats */}
          <section style={{ ...WHITE_CARD, padding: 16, gridColumn: '1 / 2', gridRow: '2' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
              {kpis.map((k) => (
                <Link
                  key={k.label}
                  href={k.href}
                  style={{ textDecoration: 'none' }}
                >
                  <KPI label={k.label} value={k.value} />
                </Link>
              ))}
            </div>
          </section>

          {/* ROW 3, COL 1: Action Center — 4 tiles */}
          <Section
            title="Action Center"
            style={{ gridColumn: '1 / 2', gridRow: '3' }}
            action={
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {actionRefreshing ? (
                  <span style={{ fontSize: 12, color: '#90A4AE', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Updating…
                  </span>
                ) : null}
                <Link href="/action-center?scope=COACH&chrome=coach" style={{ color: '#FF7043', fontWeight: 700 }}>
                  View all
                </Link>
              </div>
            }
          >
            <div style={{ minHeight: 190 }}>
              {actionLoading && !actionBootstrapped ? (
                <div style={{ color: '#90A4AE' }}>Loading updates…</div>
              ) : (
                <div style={grid4}>
                  <ActionLiteCard
                    title="New Messages"
                    items={actionBuckets.messages}
                    emptyText="No unread coach inbox items."
                    href="/action-center?scope=COACH&chrome=coach"
                  />
                  <ActionLiteCard
                    title="New Feedback"
                    items={actionBuckets.feedback}
                    emptyText="No new feedback yet."
                    href="/dashboard/coaching/feedback"
                  />
                  <ActionLiteCard
                    title="Calendar Updates"
                    items={actionBuckets.calendar}
                    emptyText="No calendar updates."
                    href="/dashboard/coaching/sessions"
                  />
                  <ActionLiteCard
                    title="Client Updates"
                    items={actionBuckets.clients}
                    emptyText="No new client activity."
                    href="/dashboard/coaching/clients"
                  />
                </div>
              )}
            </div>
          </Section>

          {/* COL 2, ROWS 1–3: Right Rail — Sponsored + CSAT Pulse */}
          <aside
            style={{
              ...DARK_RAIL,
              gridColumn: '2 / 3',
              gridRow: '1 / 4',
              display: 'flex',
              flexDirection: 'column',
              gap: GAP,
              alignSelf: 'stretch',
            }}
          >
            {/* Sponsored — top, tall, breathing */}
            <div style={{ ...WHITE_CARD, padding: 16, flex: 2, minHeight: 180 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: '#263238' }}>Sponsored</div>
              <div style={{ color: '#90A4AE', fontSize: 13 }}>Ad space</div>
            </div>

            {/* CSAT Pulse — quiet, not judgmental */}
            <div style={{ ...WHITE_CARD, padding: 16, flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, color: '#263238' }}>CSAT Pulse</div>

              {csatError ? (
                <div style={{ color: '#C62828', fontSize: 12 }}>{csatError}</div>
              ) : (
                <div style={{ display: 'grid', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#263238' }}>{avgScore}</div>
                    <div style={{ color: '#90A4AE', fontSize: 12 }}>/ 5</div>
                  </div>
                  <div style={{ color: '#607D8B', fontSize: 12 }}>
                    Based on {totalResponses} {totalResponses === 1 ? 'response' : 'responses'}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <Link href="/dashboard/coaching/feedback" style={{ color: '#FF7043', fontWeight: 700, fontSize: 13 }}>
                      Open feedback
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* ROW 4: Bottom 3 cards — full width under sidebar */}
          <div
            style={{
              gridColumn: '1 / -1',
              gridRow: '4',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 4fr) minmax(0, 3fr)',
              gap: GAP,
              marginLeft: -252,
              boxSizing: 'border-box',
              minWidth: 0,
            }}
          >
            {/* Card 1: Clients */}
            <Section title="Clients">
              {loading ? (
                <div style={{ color: '#90A4AE', fontSize: 14, padding: 16, background: 'white', borderRadius: 10, border: '1px solid #eee' }}>
                  Loading clients…
                </div>
              ) : clientsPreview.length === 0 ? (
                <div style={{ padding: 16, background: 'white', borderRadius: 10, border: '1px solid #eee', color: '#90A4AE', fontSize: 14 }}>
                  No clients yet. Once you start working with clients, a quick snapshot of their status will appear here.
                </div>
              ) : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: 'white', border: '1px solid #eee', borderRadius: 10, overflow: 'hidden' }}>
                      <thead>
                        <tr style={{ background: '#FAFAFA' }}>
                          <Th>Name</Th>
                          <Th>Email</Th>
                          <Th>Status</Th>
                          <Th>Next Session</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientsPreview.map((c) => {
                          const { background, color } = getStatusStyles(c.status);
                          return (
                            <tr key={c.id} style={{ borderTop: '1px solid #eee' }}>
                              <Td strong>{c.name}</Td>
                              <Td>{c.email || '—'}</Td>
                              <Td>
                                <span style={{ fontSize: 12, background, color, padding: '4px 8px', borderRadius: 999 }}>
                                  {c.status}
                                </span>
                              </Td>
                              <Td>
                                {c.nextSession
                                  ? c.nextSession.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                                  : '—'}
                              </Td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ textAlign: 'right', marginTop: 10 }}>
                    <Link href="/dashboard/coaching/clients" style={{ color: '#FF7043', fontWeight: 600 }}>
                      View all clients
                    </Link>
                  </div>
                </>
              )}
            </Section>

            {/* Card 2: Docs & Tools */}
            <Section title="Docs & Tools">
              <div style={grid3}>
                <Card title="Templates & Guides" />
                <Card title="Resource Library" />
                <Card title="Announcements" />
              </div>
            </Section>

            {/* Card 3: Upcoming Sessions */}
            <Section
              title="Upcoming Sessions"
              action={
                <Link href="/dashboard/coaching/sessions" style={{ color: '#FF7043', fontWeight: 700, fontSize: 13 }}>
                  View schedule
                </Link>
              }
            >
              {loading ? (
                <div style={{ color: '#90A4AE', fontSize: 14 }}>Loading upcoming sessions…</div>
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
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #eee', borderRadius: 8, padding: '8px 10px', background: 'white', gap: 10 }}
                      >
                        <span style={{ fontWeight: 600, minWidth: 72 }}>{s.time || '—'}</span>
                        <div style={{ display: 'grid', gap: 2, flex: 1 }}>
                          <span style={{ color: '#455A64' }}>{s.client || 'Client'}</span>
                          <span style={{ color: '#90A4AE', fontSize: 12 }}>{s.type || 'Session'}</span>
                        </div>
                        <span style={{ fontSize: 12, background, color, padding: '4px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                          {s.status || 'Scheduled'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Section>
          </div>
        </div>



      </div>
    </CoachingLayout>
  );
}

/* ---------- Local UI helpers (all preserved from original) ---------- */

function Section({ title, children, action = null, style = {} }) {
  return (
    <section
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        border: '1px solid #eee',
        ...style,
      }}
    >
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: '#FF7043', fontWeight: 700, fontSize: 18 }}>{title}</div>
        {action}
      </div>
      <div>{children}</div>
    </section>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: '#FAFAFA', border: '1px solid #eee', borderRadius: 10, padding: 16, minHeight: 120 }}>
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
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
    >
      <div style={{ fontSize: 12, color: '#FF7043', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#263238' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#90A4AE' }}>View details</div>
    </div>
  );
}

function ActionLiteCard({ title, items, emptyText, href }) {
  const list = Array.isArray(items) ? items : [];

  return (
    <div style={{ background: '#FAFAFA', border: '1px solid #eee', borderRadius: 10, padding: 16, minHeight: 140, display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ fontWeight: 600 }}>{title}</div>
        <Link href={href} style={{ color: '#FF7043', fontWeight: 700, fontSize: 12 }}>
          View all
        </Link>
      </div>

      {list.length === 0 ? (
        <div style={{ color: '#90A4AE', fontSize: 13 }}>{emptyText}</div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {list.map((n) => (
            <Link
              key={n.id}
              href={href}
              style={{ display: 'block', border: '1px solid #eee', borderRadius: 8, padding: '8px 10px', background: 'white', textDecoration: 'none' }}
            >
              <div style={{ fontWeight: 700, color: '#263238', fontSize: 13 }}>{n.title || 'Update'}</div>
              {n.body ? (
                <div style={{ color: '#607D8B', fontSize: 12, marginTop: 2 }}>{n.body}</div>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Th({ children }) {
  return (
    <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 13, color: '#546E7A', borderBottom: '1px solid #eee' }}>
      {children}
    </th>
  );
}

function Td({ children, strong = false }) {
  return (
    <td style={{ padding: '10px 12px', fontSize: 14, color: '#37474F', fontWeight: strong ? 600 : 400, background: 'white' }}>
      {children}
    </td>
  );
}

const grid3 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 12,
};

const grid4 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 12,
};