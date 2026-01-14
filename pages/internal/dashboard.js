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
    <div style={{ ...CARD, padding: 12, minWidth: 0 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 900,
          color: 'rgba(17,24,39,0.55)',
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div style={{ marginTop: 6, fontSize: 22, fontWeight: 950, color: '#111827', lineHeight: 1.1 }}>
        {value}
      </div>
      {sub ? (
        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: 'rgba(17,24,39,0.60)' }}>
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

  return (
    <InternalLayoutPlain
      activeNav="dashboard"
      headerTitle="Employee Suite"
      headerSubtitle="Queue Management (UI preview — mock data)"
      employee={employee}
      department={department}
      initialHat="seeker"
    >
      {/* TOP STRIP: Queue selector + quick context */}
      <section style={{ ...CARD, padding: 14, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 950, color: '#111827' }}>Dashboard</div>
            <div style={{ marginTop: 4, fontSize: 12, fontWeight: 800, color: 'rgba(17,24,39,0.60)' }}>
              All KPI cards below are based on the selected queue.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(17,24,39,0.70)' }}>In queue</div>
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
                minWidth: 220,
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
                padding: '9px 12px',
                borderRadius: 12,
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 10px 18px rgba(0,0,0,0.08)',
                whiteSpace: 'nowrap',
              }}
            >
              Create Ticket
            </a>
          </div>
        </div>
      </section>

      {/* KPI GRID (queue-scoped) */}
      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        }}
      >
        <KPI
          label="Assigned to me"
          value={assignedToMe.length}
          sub={`Within ${getQueueLabel(selectedQueue)}`}
        />
        <KPI
          label="In queue"
          value={queueTicketsOpen.length}
          sub="Open tickets in selected queue"
        />
        <KPI
          label="Unassigned"
          value={unassigned.length}
          sub="Open + no assignee"
        />
        <KPI
          label="On hold"
          value={onHold.length}
          sub="Open + On Hold state"
        />
        <KPI
          label="Older than 7 days"
          value={olderThan7Days.length}
          sub="Open + created > 7d"
        />
        <KPI
          label="Reopen rate"
          value={reopenRate === null ? '—' : `${reopenRate}%`}
          sub={reopenRate === null ? 'Will compute from DB later' : 'Queue-scoped (closed tickets)'}
        />
      </div>

      {/* MAIN GRID: Recent (queue) + Org-wide CTAs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 12 }}>
        {/* Recent tickets in selected queue */}
        <section style={{ ...CARD, padding: 14, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ fontSize: 16, fontWeight: 950, color: '#111827' }}>
              Recent activity • {getQueueLabel(selectedQueue)}
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
              View queue tickets
            </a>
          </div>

          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            {recentInQueue.length ? (
              recentInQueue.map((t) => (
                <RowLink
                  key={t.id}
                  href={`/internal/tickets/${encodeURIComponent(t.id)}`}
                  title={`${t.id} • ${t.title}`}
                  meta={`${String(t.type || '').toUpperCase()} • ${t.priority} • ${getQueueLabel(t.queueKey)} • ${
                    t.state
                  } • Updated ${new Date(t.updatedAt || t.createdAt).toLocaleString()}`}
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
                }}
              >
                No tickets found in this queue (mock).
              </div>
            )}
          </div>

          <div style={{ marginTop: 12, fontSize: 12, fontWeight: 800, color: 'rgba(17,24,39,0.60)' }}>
            Active in queue:{' '}
            <span style={{ color: '#111827', fontWeight: 950 }}>{assignedActive.length}</span> • Avg resolve:{' '}
            <span style={{ color: '#111827', fontWeight: 950 }}>{humanDurationMinutes(avgToResolve)}</span>
          </div>
        </section>

        {/* Org-wide view cards */}
        <section style={{ ...CARD, padding: 14, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 950, color: '#111827' }}>Org-wide views</div>
          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: 'rgba(17,24,39,0.60)' }}>
            These links show the full lists across the organization (not tied to the selected queue).
          </div>

          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            <RowLink
              href={incidentsAllHref}
              title="View All Incidents"
              meta={`${orgCounts.incidents} open incidents (mock) • full org list`}
            />
            <RowLink
              href={requestsAllHref}
              title="View All Requests"
              meta={`${orgCounts.requests} open requests (mock) • full org list`}
            />
            <RowLink
              href="/internal/reports"
              title="Reports"
              meta="Export-friendly metrics (phase build)"
            />
          </div>
        </section>
      </div>
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
