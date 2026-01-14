// pages/internal/dashboard.js
import React, { useMemo, useState } from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';

import InternalLayoutPlain from '@/components/layouts/InternalLayoutPlain';
import {
  getMockTickets,
  humanDurationMinutes,
  TICKET_STATES,
  TICKET_TYPES,
  QUEUES,
  calcMetrics,
} from '@/lib/internal/mockTickets';

const CARD = {
  border: '1px solid rgba(17, 24, 39, 0.10)',
  background: '#FFFFFF',
  boxShadow: '0 10px 22px rgba(0,0,0,0.06)',
  borderRadius: 14,
};

const ORANGE = '#FF7043';

function KPI({ label, value, sub }) {
  return (
    <div
      style={{
        ...CARD,
        padding: '10px 10px',
        minWidth: 0,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 950,
          color: 'rgba(17,24,39,0.55)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={label}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 20,
          fontWeight: 950,
          color: '#111827',
          lineHeight: 1.05,
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </div>
      {sub ? (
        <div
          style={{
            marginTop: 4,
            fontSize: 11,
            fontWeight: 850,
            color: 'rgba(17,24,39,0.55)',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={sub}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function RowLink({ href, title, meta }) {
  return (
    <a
      href={href}
      style={{
        textDecoration: 'none',
        display: 'grid',
        gap: 4,
        padding: 12,
        borderRadius: 12,
        border: '1px solid rgba(17,24,39,0.10)',
        background: '#fff',
        color: '#111827',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 950 }}>{title}</div>
      <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(17,24,39,0.60)' }}>{meta}</div>
    </a>
  );
}

function isClosedState(state) {
  return [TICKET_STATES.CANCELLED, TICKET_STATES.COMPLETED, TICKET_STATES.CLOSED_COMPLETE].includes(state);
}

function isActiveState(state) {
  return !isClosedState(state);
}

// Best-effort assignee resolver (mock-safe)
// Your mock uses assignedTo: { name, team }, so we resolve to the assignee NAME.
function getAssigneeKey(t) {
  if (!t) return '';
  if (typeof t?.assignedTo === 'string') return t.assignedTo;
  if (t?.assignedTo && typeof t.assignedTo === 'object') return t.assignedTo?.name || '';
  if (typeof t?.assignee === 'string') return t.assignee;
  if (t?.assignee && typeof t.assignee === 'object') return t.assignee?.name || '';

  return (
    t?.assigneeId ||
    t?.assignedToId ||
    t?.ownerId ||
    t?.ownerEmail ||
    ''
  );
}

function getTicketType(t) {
  const raw = String(t?.type || '').toLowerCase().trim();
  if (raw === TICKET_TYPES.INCIDENT) return TICKET_TYPES.INCIDENT;
  if (raw === TICKET_TYPES.REQUEST) return TICKET_TYPES.REQUEST;
  return raw;
}

function getQueueLabel(queueKey) {
  const q = String(queueKey || '').trim().toLowerCase();
  const hit = (QUEUES || []).find((x) => String(x.key || '').toLowerCase() === q);
  return hit?.name || String(queueKey || '').toUpperCase();
}

export default function InternalDashboard({ employee, department, currentUserKey, currentUserName }) {
  const tickets = useMemo(() => getMockTickets(), []);

  // Build queue list from mock data (prefer QUEUES, fallback to discovered)
  const queues = useMemo(() => {
    const fromConst = (QUEUES || [])
      .map((q) => String(q?.key || '').trim())
      .filter(Boolean);

    const discovered = new Set();
    tickets.forEach((t) => {
      const q = String(t?.queueKey || '').trim();
      if (q) discovered.add(q);
    });

    const merged = Array.from(new Set([...fromConst, ...Array.from(discovered)]))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    return merged.length ? merged : ['general'];
  }, [tickets]);

  const [selectedQueue, setSelectedQueue] = useState(() => queues[0]);

  // Queue-scoped tickets
  const queueTicketsAll = useMemo(
    () => tickets.filter((t) => String(t?.queueKey || '').trim() === String(selectedQueue || '').trim()),
    [tickets, selectedQueue]
  );

  const queueTicketsOpen = useMemo(
    () => queueTicketsAll.filter((t) => isActiveState(t.state)),
    [queueTicketsAll]
  );

  // “Assigned to me” queue-scoped (match mock’s assignedTo.name)
  const assignedToMe = useMemo(() => {
    const meKey = String(currentUserKey || '').trim().toLowerCase();
    const meName = String(currentUserName || '').trim().toLowerCase();

    return queueTicketsOpen.filter((t) => {
      const assignee = String(getAssigneeKey(t) || '').trim().toLowerCase();
      if (!assignee) return false;

      // If we have a name, match on name (mock realistic)
      if (meName) return assignee === meName;

      // Otherwise fall back to key
      return !!meKey && assignee === meKey;
    });
  }, [queueTicketsOpen, currentUserKey, currentUserName]);

  const unassigned = useMemo(() => {
    return queueTicketsOpen.filter((t) => {
      const assignee = String(getAssigneeKey(t) || '').trim();
      return !assignee;
    });
  }, [queueTicketsOpen]);

  const onHold = useMemo(() => {
    return queueTicketsOpen.filter((t) => t.state === TICKET_STATES.ON_HOLD);
  }, [queueTicketsOpen]);

  const olderThan7Days = useMemo(() => {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return queueTicketsOpen.filter((t) => {
      const created = new Date(t.createdAt).getTime();
      if (!created || Number.isNaN(created)) return false;
      return now - created > sevenDaysMs;
    });
  }, [queueTicketsOpen]);

  // Reopen rate (queue-scoped): your mock doesn't include reopen fields yet => keep placeholder
  const reopenRate = useMemo(() => {
    const hasSignal = queueTicketsAll.some((t) => typeof t?.reopenCount === 'number' || typeof t?.reopened === 'boolean');
    if (!hasSignal) return null;

    const closed = queueTicketsAll.filter((t) => isClosedState(t.state));
    if (!closed.length) return 0;

    const reopenedCount = closed.filter((t) => {
      if (typeof t?.reopenCount === 'number') return t.reopenCount > 0;
      if (typeof t?.reopened === 'boolean') return t.reopened === true;
      return false;
    }).length;

    return Math.round((reopenedCount / closed.length) * 100);
  }, [queueTicketsAll]);

  // “Assigned/Active” queue-scoped (classic state buckets)
  const assignedActive = useMemo(() => {
    return queueTicketsOpen.filter(
      (t) =>
        t.state === TICKET_STATES.ASSIGNED ||
        t.state === TICKET_STATES.IN_PROGRESS ||
        t.state === TICKET_STATES.ON_HOLD
    );
  }, [queueTicketsOpen]);

  // Avg Time to Resolve (queue-scoped) from completed tickets in this queue
  const avgToResolve = useMemo(() => {
    const done = queueTicketsAll.filter((t) => t.completedAt);
    if (!done.length) return 0;
    const mins = done
      .map((t) => calcMetrics(t).createdToCompletedMins)
      .reduce((a, b) => a + b, 0);
    return Math.round(mins / done.length);
  }, [queueTicketsAll]);

  // Recent tickets inside selected queue
  const recentInQueue = useMemo(() => {
    return queueTicketsAll
      .slice()
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 6);
  }, [queueTicketsAll]);

  // Org-wide CTAs (full lists)
  const incidentsAllHref = '/internal/tickets?type=incident';
  const requestsAllHref = '/internal/tickets?type=request';

  // Optional org-wide open counts (NOT tied to queue)
  const orgCounts = useMemo(() => {
    const open = tickets.filter((t) => isActiveState(t.state));
    const incidents = open.filter((t) => getTicketType(t) === TICKET_TYPES.INCIDENT);
    const requests = open.filter((t) => getTicketType(t) === TICKET_TYPES.REQUEST);
    return { incidents: incidents.length, requests: requests.length };
  }, [tickets]);

  const queueLabel = getQueueLabel(selectedQueue);

  return (
    <InternalLayoutPlain
      activeNav="dashboard"
      headerTitle="Employee Suite"
      headerSubtitle=""
      employee={employee}
      department={department}
      initialHat="seeker"
    >
      {/* TOP STRIP: Queue selector (tight, centered, less noise) */}
      <section style={{ ...CARD, padding: 12, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 950, color: 'rgba(17,24,39,0.70)' }}>Queue</div>

          <select
            value={selectedQueue}
            onChange={(e) => setSelectedQueue(e.target.value)}
            aria-label="Select queue"
            style={{
              border: '1px solid rgba(17,24,39,0.18)',
              borderRadius: 12,
              padding: '8px 10px',
              fontSize: 13,
              fontWeight: 900,
              background: '#fff',
              cursor: 'pointer',
              minWidth: 240,
              height: 40,
            }}
          >
            {queues.map((q) => (
              <option key={q} value={q}>
                {getQueueLabel(q)}
              </option>
            ))}
          </select>

          <a
            href="/internal/tickets/new"
            style={{
              textDecoration: 'none',
              background: ORANGE,
              color: '#fff',
              fontWeight: 950,
              padding: '0 12px',
              height: 40,
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: 12,
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 10px 18px rgba(0,0,0,0.08)',
              whiteSpace: 'nowrap',
            }}
          >
            Create Ticket
          </a>
        </div>
      </section>

      {/* KPI GRID — FORCE SINGLE ROW ON DESKTOP */}
      <div
        style={{
          display: 'grid',
          gap: 10,
          alignItems: 'stretch',
          gridTemplateColumns: 'repeat(6, minmax(120px, 1fr))',
        }}
      >
        <KPI label="Assigned" value={assignedToMe.length} sub={queueLabel} />
        <KPI label="Open" value={queueTicketsOpen.length} sub={queueLabel} />
        <KPI label="Unassigned" value={unassigned.length} sub="Open" />
        <KPI label="On hold" value={onHold.length} sub="Open" />
        <KPI label="Aging" value={olderThan7Days.length} sub="> 7 days" />
        <KPI label="Reopen" value={reopenRate === null ? '—' : `${reopenRate}%`} sub={reopenRate === null ? 'Later' : 'Closed'} />
      </div>

      {/* MAIN GRID: Recent (queue) + Org-wide CTAs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 12 }}>
        {/* Recent tickets in selected queue */}
        <section style={{ ...CARD, padding: 14, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 16, fontWeight: 950, color: '#111827' }}>
              Recent • {queueLabel}
            </div>

            <a
              href={`/internal/tickets?queue=${encodeURIComponent(selectedQueue)}`}
              style={{
                textDecoration: 'none',
                color: '#111827',
                fontWeight: 950,
                fontSize: 13,
                padding: '8px 10px',
                borderRadius: 12,
                border: '1px solid rgba(17,24,39,0.12)',
                background: 'rgba(17,24,39,0.04)',
                whiteSpace: 'nowrap',
              }}
              aria-label="View tickets for selected queue"
            >
              View queue
            </a>
          </div>

          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            {recentInQueue.length ? (
              recentInQueue.map((t) => (
                <RowLink
                  key={t.id}
                  href={`/internal/tickets/${encodeURIComponent(t.id)}`}
                  title={`${t.id} • ${t.title}`}
                  meta={`${String(t.type || '').toUpperCase()} • ${t.priority} • ${getQueueLabel(t.queueKey)} • ${t.state} • ${new Date(
                    t.updatedAt || t.createdAt
                  ).toLocaleString()}`}
                />
              ))
            ) : (
              <div
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border: '1px dashed rgba(17,24,39,0.18)',
                  color: 'rgba(17,24,39,0.65)',
                  fontWeight: 800,
                  textAlign: 'center',
                }}
              >
                No tickets in this queue (mock).
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: 12,
              fontSize: 12,
              fontWeight: 850,
              color: 'rgba(17,24,39,0.60)',
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
              flexWrap: 'wrap',
              textAlign: 'center',
            }}
          >
            <span>
              Active: <span style={{ color: '#111827', fontWeight: 950 }}>{assignedActive.length}</span>
            </span>
            <span style={{ color: 'rgba(17,24,39,0.35)' }}>•</span>
            <span>
              Avg resolve: <span style={{ color: '#111827', fontWeight: 950 }}>{humanDurationMinutes(avgToResolve)}</span>
            </span>
          </div>
        </section>

        {/* Org-wide view cards */}
        <section style={{ ...CARD, padding: 14, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 950, color: '#111827' }}>Org-wide</div>
          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 850, color: 'rgba(17,24,39,0.60)' }}>
            Full lists (not queue-scoped)
          </div>

          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            <RowLink
              href={incidentsAllHref}
              title="All Incidents"
              meta={`${orgCounts.incidents} open • mock`}
            />
            <RowLink
              href={requestsAllHref}
              title="All Requests"
              meta={`${orgCounts.requests} open • mock`}
            />
            <RowLink
              href="/internal/reports"
              title="Reports"
              meta="Metrics (phase build)"
            />
          </div>
        </section>
      </div>

      {/* Responsive tweak: KPI row wraps on smaller screens */}
      <style jsx>{`
        @media (max-width: 1100px) {
          div[style*='grid-template-columns: repeat(6'] {
            grid-template-columns: repeat(3, minmax(140px, 1fr)) !important;
          }
        }
        @media (max-width: 720px) {
          div[style*='grid-template-columns: repeat(6'] {
            grid-template-columns: repeat(2, minmax(140px, 1fr)) !important;
          }
        }
      `}</style>
    </InternalLayoutPlain>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user) {
    return { redirect: { destination: '/auth/signin', permanent: false } };
  }

  // UI-first (as requested): show employee/dept status; enforcement can tighten once session carries DB-backed staff identity.
  const employee = Boolean(session?.user?.employee);
  const department = session?.user?.department || '';

  // Best-effort “me” key + name
  const currentUserKey =
    session?.user?.id ||
    session?.user?.email ||
    '';

  const currentUserName =
    session?.user?.name ||
    [session?.user?.firstName, session?.user?.lastName].filter(Boolean).join(' ') ||
    (session?.user?.email ? session.user.email.split('@')[0] : '');

  return { props: { employee, department, currentUserKey, currentUserName } };
}
