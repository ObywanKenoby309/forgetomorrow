// pages/coaching-dashboard.js
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingRightColumn from '@/components/coaching/CoachingRightColumn';
import { getClientSession } from '@/lib/auth-client';

const STORAGE_KEY = 'coachCSAT_v1'; // still local-only CSAT for now

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

// Small helpers for displaying dates/times from ISO strings
function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDateTimeShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function CoachingDashboardPage() {
  const router = useRouter();

  // ---- CSAT: load from localStorage (Phase 1: still client-only) ----
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

  // ---- REAL DATA: Coaching overview from API (sessions + clients + follow-ups) ----
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState({
    kpis: {
      sessionsToday: 0,
      activeClients: 0,
      followUpsDue: 0,
    },
    upcomingSessions: [],
    clients: [],
  });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (typeof window === 'undefined') return;

      try {
        const session = await getClientSession();
        const userId = session?.user?.id;

        if (!userId) {
          router.push('/login');
          return;
        }

        const res = await fetch(
          `/api/dashboard/coaching/overview?coachId=${encodeURIComponent(
            userId
          )}`
        );

        if (!res.ok) {
          throw new Error('Failed to load coaching overview');
        }

        const data = await res.json();

        if (!cancelled) {
          setOverview({
            kpis: data.kpis || {
              sessionsToday: 0,
              activeClients: 0,
              followUpsDue: 0,
            },
            upcomingSessions: Array.isArray(data.upcomingSessions)
              ? data.upcomingSessions
              : [],
            clients: Array.isArray(data.clients) ? data.clients : [],
          });
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading coaching overview:', err);
        if (!cancelled) {
          setError('Unable to load your coaching overview right now.');
          setLoading(false);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const { kpis: kpiData, upcomingSessions, clients } = overview;

  const kpis = [
    { label: 'Sessions Today', value: kpiData.sessionsToday },
    { label: 'Active Clients', value: kpiData.activeClients },
    { label: 'Follow-ups Due', value: kpiData.followUpsDue },
  ];

  return (
    <CoachingLayout
      title="Coaching Dashboard | ForgeTomorrow"
      activeNav="overview" // default coaching dashboard highlight
      headerDescription="Track client progress, manage sessions, and review feedback — all in one place."
      right={<CoachingRightColumn />}
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      {/* Center column content */}
      <div style={{ display: 'grid', gap: 16, width: '100%' }}>
        {/* Error banner (if API fails) */}
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

        {/* Today (KPI strip + sessions list) */}
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
                  {upcomingSessions.length === 0 ? (
                    <li style={{ color: '#90A4AE' }}>
                      No upcoming sessions yet. Once you add sessions in the
                      calendar, they will appear here.
                    </li>
                  ) : (
                    upcomingSessions.map((s) => {
                      const { background, color } = getStatusStyles(
                        s.status || 'Active'
                      );
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
                            {formatTime(s.startAt) || '—'}
                          </span>
                          <div
                            style={{
                              display: 'grid',
                              gap: 2,
                              flex: 1,
                            }}
                          >
                            <span style={{ color: '#455A64' }}>
                              {s.clientName || 'Client'}
                            </span>
                            <span
                              style={{
                                color: '#90A4AE',
                                fontSize: 12,
                              }}
                            >
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
                    })
                  )}
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

            <Card title="New Client Intakes">
              <div style={{ color: '#455A64', fontSize: 14 }}>
                Intake tracking and alerts will appear here as your client
                onboarding flow goes live. For now, monitor new{' '}
                <Link
                  href="/dashboard/coaching/clients"
                  style={{ color: '#FF7043', fontWeight: 600 }}
                >
                  coaching clients
                </Link>{' '}
                for early-stage relationships.
              </div>
            </Card>

            <Card title="Follow-ups Due">
              <div style={{ color: '#455A64', fontSize: 14 }}>
                Follow-up reminders are calculated from your coaching sessions
                (using <code>followUpDueAt</code> and <code>followUpDone</code>
                ). As you complete sessions and set follow-ups, this number will
                update automatically.
              </div>
            </Card>
          </div>
        </Section>

        {/* Clients (compact table) */}
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
              No clients yet. Once you start working with clients, a quick
              snapshot of their status will appear here.
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
                        <tr
                          key={c.id}
                          style={{ borderTop: '1px solid #eee' }}
                        >
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
                              ? formatDateTimeShort(c.nextSession)
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

        {/* CSAT Overview (with Refresh button) */}
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
          <div style={grid3}>
            <Card title="Average Score">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: '#263238',
                  }}
                >
                  {avgScore}
                </div>
                <div style={{ color: '#90A4AE', fontSize: 12 }}>/ 5</div>
              </div>
              <div
                style={{
                  color: '#607D8B',
                  fontSize: 13,
                  marginTop: 4,
                }}
              >
                Based on {totalResponses}{' '}
                {totalResponses === 1 ? 'response' : 'responses'}
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
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 700,
                              color: '#263238',
                            }}
                          >
                            {avg}/5
                          </div>
                          <div
                            style={{
                              color: '#90A4AE',
                              fontSize: 12,
                            }}
                          >
                            {new Date(r.createdAt).toLocaleString(
                              undefined,
                              {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              }
                            )}
                          </div>
                        </div>
                        <div
                          style={{
                            color: '#455A64',
                            marginTop: 4,
                          }}
                        >
                          {comment ? (
                            comment
                          ) : (
                            <span style={{ color: '#90A4AE' }}>
                              (No comment)
                            </span>
                          )}
                        </div>
                        {r.anonymous ? (
                          <div
                            style={{
                              color: '#90A4AE',
                              fontSize: 12,
                              marginTop: 4,
                            }}
                          >
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
