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
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={label}
      >
        {label}
      </div>

      <div style={{ marginTop: 6, fontSize: 22, fontWeight: 950, color: '#111827', lineHeight: 1 }}>
        {value}
      </div>

      {sub ? (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            fontWeight: 900,
            color: 'rgba(17,24,39,0.60)',
            lineHeight: 1.15,
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
        gap: 6,
        padding: 12,
        borderRadius: 12,
        border: '1px solid rgba(17,24,39,0.10)',
        background: '#fff',
        color: '#111827',
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 950, lineHeight: 1.2 }}>{title}</div>
      <div style={{ fontSize: 12, fontWeight: 850, color: 'rgba(17,24,39,0.60)', lineHeight: 1.2 }}>{meta}</div>
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

  return t?.assigneeId || t?.assignedToId || t?.ownerId || t?.ownerEmail || '';
}

function rawType(t) {
  return String(t?.type || '').toLowerCase().trim();
}

function getTicketType(t) {
  const raw = rawType(t);
  if (raw === String(TICKET_TYPES?.INCIDENT || 'incident')) return 'incident';
  if (raw === String(TICKET_TYPES?.REQUEST || 'request')) return 'request';
  // support future types without breaking
  if (raw === 'sctask' || raw === 'sc_task' || raw === 'sc-task') return 'sctask';
  return raw || 'unknown';
}

function getQueueLabel(queueKey) {
  const q = String(queueKey || '').trim().toLowerCase();
  const hit = (QUEUES || []).find((x) => String(x.key || '').toLowerCase() === q);
  return hit?.name || String(queueKey || '').toUpperCase();
}

function stateLabelForDisplay(state, viewKind) {
  // viewKind: 'incident' | 'sctask'
  if (viewKind === 'sctask' && state === TICKET_STATES.ON_HOLD) return 'pending';
  return String(state || '').replaceAll('_', ' ');
}

function isInCurrentMonth(dateValue) {
  const d = new Date(dateValue);
  if (!d || Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function avgCompletedThisMonthMins(list) {
  const doneThisMonth = (list || []).filter((t) => t?.completedAt && isInCurrentMonth(t.completedAt));
  if (!doneThisMonth.length) return 0;
  const total = doneThisMonth.map((t) => calcMetrics(t).createdToCompletedMins).reduce((a, b) => a + b, 0);
  return Math.round(total / doneThisMonth.length);
}

export default function InternalDashboard({ employee, department, currentUserKey, currentUserName }) {
  const tickets = useMemo(() => getMockTickets(), []);

  // detect whether mock includes real sctasks; if not, treat requests as sctasks for this UI draft
  const hasRealSctasks = useMemo(() => tickets.some((t) => getTicketType(t) === 'sctask'), [tickets]);

  // Build queue list from mock data (prefer QUEUES, fallback to discovered)
  const queues = useMemo(() => {
    const fromConst = (QUEUES || []).map((q) => String(q?.key || '').trim()).filter(Boolean);

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

  const queueTicketsOpen = useMemo(() => queueTicketsAll.filter((t) => isActiveState(t.state)), [queueTicketsAll]);

  // Split: incidents vs sctasks (mock-safe)
  const incidentsAll = useMemo(() => queueTicketsAll.filter((t) => getTicketType(t) === 'incident'), [queueTicketsAll]);

  const incidentsOpen = useMemo(() => incidentsAll.filter((t) => isActiveState(t.state)), [incidentsAll]);

  const sctasksAll = useMemo(() => {
    const list = queueTicketsAll.filter((t) => {
      const tt = getTicketType(t);
      if (tt === 'sctask') return true;
      if (!hasRealSctasks && tt === 'request') return true; // draft mapping until mock adds real sctasks
      return false;
    });
    return list;
  }, [queueTicketsAll, hasRealSctasks]);

  const sctasksOpen = useMemo(() => sctasksAll.filter((t) => isActiveState(t.state)), [sctasksAll]);

  // “Assigned to me” queue-scoped (match mock’s assignedTo.name)
  function buildAssignedToMe(openList) {
    const meKey = String(currentUserKey || '').trim().toLowerCase();
    const meName = String(currentUserName || '').trim().toLowerCase();

    return openList.filter((t) => {
      const assignee = String(getAssigneeKey(t) || '').trim().toLowerCase();
      if (!assignee) return false;
      if (meName) return assignee === meName;
      return !!meKey && assignee === meKey;
    });
  }

  // INCIDENT KPIs
  const incAssignedToMe = useMemo(
    () => buildAssignedToMe(incidentsOpen),
    [incidentsOpen, currentUserKey, currentUserName]
  );

  const incUnassigned = useMemo(() => incidentsOpen.filter((t) => !String(getAssigneeKey(t) || '').trim()), [incidentsOpen]);

  const incOnHold = useMemo(() => incidentsOpen.filter((t) => t.state === TICKET_STATES.ON_HOLD), [incidentsOpen]);

  const incAging = useMemo(() => {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return incidentsOpen.filter((t) => {
      const created = new Date(t.createdAt).getTime();
      if (!created || Number.isNaN(created)) return false;
      return now - created > sevenDaysMs;
    });
  }, [incidentsOpen]);

  const incReopenRate = useMemo(() => {
    const closedIncidents = incidentsAll.filter((t) => isClosedState(t.state));
    const hasSignal = closedIncidents.some((t) => typeof t?.reopenCount === 'number' || typeof t?.reopened === 'boolean');
    if (!hasSignal) return null;
    if (!closedIncidents.length) return 0;

    const reopenedCount = closedIncidents.filter((t) => {
      if (typeof t?.reopenCount === 'number') return t.reopenCount > 0;
      if (typeof t?.reopened === 'boolean') return t.reopened === true;
      return false;
    }).length;

    return Math.round((reopenedCount / closedIncidents.length) * 100);
  }, [incidentsAll]);

  // ✅ NEW: Avg Resolution Time (Incidents) — completed THIS MONTH (queue-scoped)
  const avgResolutionThisMonthIncidents = useMemo(() => {
    return avgCompletedThisMonthMins(incidentsAll);
  }, [incidentsAll]);

  // SCTASK KPIs (pending instead of on hold, no reopen metric)
  const scAssignedToMe = useMemo(
    () => buildAssignedToMe(sctasksOpen),
    [sctasksOpen, currentUserKey, currentUserName]
  );

  const scUnassigned = useMemo(() => sctasksOpen.filter((t) => !String(getAssigneeKey(t) || '').trim()), [sctasksOpen]);

  const scPending = useMemo(() => sctasksOpen.filter((t) => t.state === TICKET_STATES.ON_HOLD), [sctasksOpen]);

  const scAging = useMemo(() => {
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return sctasksOpen.filter((t) => {
      const created = new Date(t.createdAt).getTime();
      if (!created || Number.isNaN(created)) return false;
      return now - created > sevenDaysMs;
    });
  }, [sctasksOpen]);

  // ✅ NEW: Avg Fulfillment Time (SCTASKs) — completed THIS MONTH (queue-scoped)
  const avgFulfillmentThisMonthSctasks = useMemo(() => {
    return avgCompletedThisMonthMins(sctasksAll);
  }, [sctasksAll]);

  // Avg Time to Resolve (queue-scoped) from completed tickets in this queue (incidents only) — legacy footer metric
  const avgToResolveIncidents = useMemo(() => {
    const done = incidentsAll.filter((t) => t.completedAt);
    if (!done.length) return 0;
    const mins = done.map((t) => calcMetrics(t).createdToCompletedMins).reduce((a, b) => a + b, 0);
    return Math.round(mins / done.length);
  }, [incidentsAll]);

  // Recent lists (queue scoped)
  const recentIncidents = useMemo(() => {
    return incidentsAll
      .slice()
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 4);
  }, [incidentsAll]);

  const recentSctasks = useMemo(() => {
    return sctasksAll
      .slice()
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 4);
  }, [sctasksAll]);

  // Org-wide CTAs (full lists)
  const incidentsAllHref = '/internal/tickets?type=incident';
  const requestsAllHref = '/internal/tickets?type=request';
  const sctasksAllHref = '/internal/tickets?type=sctask';

  // Org-wide open counts (NOT tied to queue)
  const orgCounts = useMemo(() => {
    const open = tickets.filter((t) => isActiveState(t.state));
    const incidentCount = open.filter((t) => getTicketType(t) === 'incident').length;

    const requestCount = open.filter((t) => getTicketType(t) === 'request').length;

    // If mock has no true sctasks, show requests as sctasks for this UI draft
    const sctaskCount = hasRealSctasks ? open.filter((t) => getTicketType(t) === 'sctask').length : requestCount;

    return { incidents: incidentCount, requests: requestCount, sctasks: sctaskCount };
  }, [tickets, hasRealSctasks]);

  return (
    <InternalLayoutPlain
      activeNav="dashboard"
      headerTitle="Employee Suite"
      headerSubtitle="Queue Management (UI preview — mock data)"
      employee={employee}
      department={department}
      initialHat="seeker"
    >
      {/* TOP STRIP: Queue selector + Create Ticket (compact) */}
      <section style={{ ...CARD, padding: 14, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12, fontWeight: 950, color: 'rgba(17,24,39,0.65)' }}>Queue</div>

            <select
              value={selectedQueue}
              onChange={(e) => setSelectedQueue(e.target.value)}
              aria-label="Select queue"
              style={{
                border: '1px solid rgba(17,24,39,0.18)',
                borderRadius: 12,
                padding: '8px 10px',
                fontSize: 13,
                fontWeight: 950,
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
                padding: '0 14px',
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
        </div>
      </section>

      {/* INCIDENTS KPI ROW (single line) */}
      <section style={{ ...CARD, padding: 14, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 950, color: '#111827', marginBottom: 10 }}>Incidents</div>

        <div
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          }}
        >
          <KPI label="Assigned" value={incAssignedToMe.length} sub={getQueueLabel(selectedQueue)} />
          <KPI label="Open" value={incidentsOpen.length} sub={getQueueLabel(selectedQueue)} />
          <KPI label="Unassigned" value={incUnassigned.length} sub="Open" />
          <KPI label="On hold" value={incOnHold.length} sub="Open" />
          <KPI label="Aging" value={incAging.length} sub="> 7 days" />
          <KPI label="Reopen" value={incReopenRate === null ? '—' : `${incReopenRate}%`} sub={incReopenRate === null ? 'Later' : 'Rate'} />
          {/* ✅ NEW */}
          <KPI label="Avg resolution time" value={humanDurationMinutes(avgResolutionThisMonthIncidents)} sub="(This month)" />
        </div>
      </section>

      {/* SCTASK KPI ROW (single line, no reopen; Pending instead of On hold) */}
      <section style={{ ...CARD, padding: 14, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 950, color: '#111827', marginBottom: 10 }}>SCTASKs</div>

        <div
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
          }}
        >
          <KPI label="Assigned" value={scAssignedToMe.length} sub={getQueueLabel(selectedQueue)} />
          <KPI label="Open" value={sctasksOpen.length} sub={getQueueLabel(selectedQueue)} />
          <KPI label="Unassigned" value={scUnassigned.length} sub="Open" />
          <KPI label="Pending" value={scPending.length} sub="Open" />
          <KPI label="Aging" value={scAging.length} sub="> 7 days" />
          {/* ✅ NEW */}
          <KPI label="Avg fulfillment time" value={humanDurationMinutes(avgFulfillmentThisMonthSctasks)} sub="(This month)" />
        </div>
      </section>

      {/* MAIN GRID: Recent Incidents + Recent SCTASKs + Org-wide */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 12 }}>
        <div style={{ display: 'grid', gap: 12, minWidth: 0 }}>
          {/* Recent Incidents */}
          <section style={{ ...CARD, padding: 14, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 950, color: '#111827' }}>
                Recent Incidents • {getQueueLabel(selectedQueue)}
              </div>

              <a
                href={`/internal/tickets?queue=${encodeURIComponent(selectedQueue)}&type=incident`}
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
                aria-label="View incident tickets for selected queue"
              >
                View queue
              </a>
            </div>

            <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              {recentIncidents.length ? (
                recentIncidents.map((t) => (
                  <RowLink
                    key={t.id}
                    href={`/internal/tickets/${encodeURIComponent(t.id)}`}
                    title={`${t.id} • ${t.title}`}
                    meta={`INCIDENT • ${t.priority} • ${getQueueLabel(t.queueKey)} • ${stateLabelForDisplay(t.state, 'incident')} • Updated ${new Date(
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
                  }}
                >
                  No incidents found in this queue (mock).
                </div>
              )}
            </div>

            <div style={{ marginTop: 12, fontSize: 12, fontWeight: 850, color: 'rgba(17,24,39,0.60)', textAlign: 'center' }}>
              Active: <span style={{ color: '#111827', fontWeight: 950 }}>{incidentsOpen.length}</span> • Avg resolve:{' '}
              <span style={{ color: '#111827', fontWeight: 950 }}>{humanDurationMinutes(avgToResolveIncidents)}</span>
            </div>
          </section>

          {/* Recent SCTASKs */}
          <section style={{ ...CARD, padding: 14, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 950, color: '#111827' }}>
                Recent SCTASKs • {getQueueLabel(selectedQueue)}
              </div>

              <a
                href={`/internal/tickets?queue=${encodeURIComponent(selectedQueue)}&type=sctask`}
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
                aria-label="View sctask tickets for selected queue"
              >
                View queue
              </a>
            </div>

            <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              {recentSctasks.length ? (
                recentSctasks.map((t) => (
                  <RowLink
                    key={t.id}
                    href={`/internal/tickets/${encodeURIComponent(t.id)}`}
                    title={`${t.id} • ${t.title}`}
                    meta={`SCTASK • ${t.priority} • ${getQueueLabel(t.queueKey)} • ${stateLabelForDisplay(t.state, 'sctask')} • Updated ${new Date(
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
                  }}
                >
                  No SCTASKs found in this queue (mock).
                </div>
              )}
            </div>

            <div style={{ marginTop: 12, fontSize: 12, fontWeight: 850, color: 'rgba(17,24,39,0.60)', textAlign: 'center' }}>
              Active: <span style={{ color: '#111827', fontWeight: 950 }}>{sctasksOpen.length}</span>
            </div>
          </section>
        </div>

        {/* Org-wide view cards */}
        <section style={{ ...CARD, padding: 14, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 950, color: '#111827' }}>Org-wide</div>
          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 850, color: 'rgba(17,24,39,0.60)' }}>
            Full lists (not queue-scoped)
          </div>

          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            <RowLink href={incidentsAllHref} title="All Incidents" meta={`${orgCounts.incidents} open • mock`} />
            <RowLink href={requestsAllHref} title="All Requests" meta={`${orgCounts.requests} open • mock`} />
            <RowLink href={sctasksAllHref} title="All SCTASKs" meta={`${orgCounts.sctasks} open • mock`} />
            <RowLink href="/internal/reports" title="Reports" meta="Metrics (phase build)" />
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
  const currentUserKey = session?.user?.id || session?.user?.email || '';

  const currentUserName =
    session?.user?.name ||
    [session?.user?.firstName, session?.user?.lastName].filter(Boolean).join(' ') ||
    (session?.user?.email ? session.user.email.split('@')[0] : '');

  return { props: { employee, department, currentUserKey, currentUserName } };
}
