// pages/internal/dashboard.js
//
// WIRED — replaces mock data with live /api/crm/reports/queue
// Keeps InternalLayoutPlain, CARD style, and getServerSideProps pattern.

import React, { useState, useEffect, useCallback } from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import InternalLayoutPlain from '@/components/layouts/InternalLayoutPlain';

const CARD = {
  border: '1px solid rgba(17, 24, 39, 0.10)',
  background: '#FFFFFF',
  boxShadow: '0 10px 22px rgba(0,0,0,0.06)',
  borderRadius: 14,
};

const ORANGE = '#FF7043';

// Priority colors
const PRIORITY_COLOR = {
  P1: '#EF4444',
  P2: '#F59E0B',
  P3: '#3B82F6',
  P4: '#9CA3AF',
};

const STATUS_LABEL = {
  OPEN:             'Open',
  ASSIGNED:         'Assigned',
  IN_PROGRESS:      'In Progress',
  ON_HOLD:          'On Hold',
  PENDING_CUSTOMER: 'Pending',
  RESOLVED:         'Resolved',
  CLOSED:           'Closed',
  CANCELLED:        'Cancelled',
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function KPI({ label, value, sub, alert }) {
  return (
    <div
      style={{
        ...CARD,
        padding: '10px 10px',
        minWidth: 0,
        textAlign: 'center',
        borderColor: alert ? 'rgba(239,68,68,0.35)' : undefined,
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
      <div
        style={{
          marginTop: 6,
          fontSize: 22,
          fontWeight: 950,
          color: alert ? '#EF4444' : '#111827',
          lineHeight: 1,
        }}
      >
        {value ?? '—'}
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
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function TicketRow({ ticket }) {
  const ref = `FT-${String(ticket.number).padStart(5, '0')}`;
  const assigneeName = ticket.assignedTo
    ? `${ticket.assignedTo.firstName ?? ''} ${ticket.assignedTo.lastName ?? ''}`.trim()
    : 'Unassigned';
  const updatedAt = new Date(ticket.updatedAt).toLocaleString();

  return (
    <a
      href={`/internal/tickets/${ticket.id}`}
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: PRIORITY_COLOR[ticket.priority] ?? '#9CA3AF',
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 950, color: ORANGE }}>{ref}</span>
        <span style={{ fontSize: 14, fontWeight: 950, lineHeight: 1.2, flex: 1 }}>{ticket.title}</span>
        {ticket.slaBreached && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 900,
              background: 'rgba(239,68,68,0.10)',
              color: '#EF4444',
              padding: '2px 7px',
              borderRadius: 6,
              border: '1px solid rgba(239,68,68,0.25)',
            }}
          >
            SLA BREACHED
          </span>
        )}
      </div>
      <div style={{ fontSize: 12, fontWeight: 850, color: 'rgba(17,24,39,0.60)', lineHeight: 1.2 }}>
        {ticket.type} • {ticket.priority} • {ticket.queue?.name ?? ''} •{' '}
        {STATUS_LABEL[ticket.status] ?? ticket.status} • {assigneeName} • Updated {updatedAt}
      </div>
    </a>
  );
}

function Skeleton() {
  return (
    <div
      style={{
        height: 60,
        borderRadius: 12,
        background: 'rgba(17,24,39,0.06)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function InternalDashboard({ employee, department, queues: initialQueues }) {
  const [queues, setQueues]         = useState(initialQueues ?? []);
  const [selectedQueue, setSelectedQueue] = useState(initialQueues?.[0]?.id ?? '');
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const fetchStats = useCallback(async (queueId) => {
    if (!queueId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/crm/reports/queue?queueId=${queueId}`);
      if (!res.ok) throw new Error(`Failed to load stats: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('[Dashboard]', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedQueue) fetchStats(selectedQueue);
  }, [selectedQueue, fetchStats]);

  const stats         = data?.stats ?? {};
  const recentTickets = data?.recentTickets ?? [];
  const myTickets     = data?.myOpenTickets ?? [];

  const selectedQueueName = queues.find((q) => q.id === selectedQueue)?.name ?? '';

  // Split recent tickets into incidents vs sctasks for the two panels
  const recentIncidents = recentTickets.filter((t) => t.type === 'INCIDENT').slice(0, 4);
  const recentSctasks   = recentTickets.filter((t) => t.type === 'SCTASK').slice(0, 4);

  return (
    <InternalLayoutPlain
      activeNav="dashboard"
      headerTitle="Employee Suite"
      headerSubtitle="Queue Management"
      employee={employee}
      department={department}
      initialHat="seeker"
    >
      {/* ── Queue selector + Create Ticket ── */}
      <section style={{ ...CARD, padding: 14, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
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
                <option key={q.id} value={q.id}>
                  {q.name}
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

      {error && (
        <div style={{ ...CARD, padding: 14, background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.3)' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#EF4444' }}>
            Failed to load dashboard data: {error}
          </div>
        </div>
      )}

      {/* ── Incidents KPI row ── */}
      <section style={{ ...CARD, padding: 14, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 950, color: '#111827', marginBottom: 10 }}>Incidents</div>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
          {loading ? (
            Array(7).fill(0).map((_, i) => <Skeleton key={i} />)
          ) : (
            <>
              <KPI label="Assigned"     value={stats.assigned}       sub={selectedQueueName} />
              <KPI label="Open"         value={stats.open}           sub={selectedQueueName} />
              <KPI label="Unassigned"   value={stats.unassigned}     sub="Open" />
              <KPI label="On Hold"      value={stats.onHold}         sub="Open" />
              <KPI label="Aging"        value={stats.aging}          sub="> 7 days" alert={stats.aging > 0} />
              <KPI label="Reopen"       value={stats.reopen}         sub="This month" />
              <KPI label="Avg Resolve"  value={stats.avgResolution ?? '—'} sub="This month" />
            </>
          )}
        </div>
      </section>

      {/* ── SCTASKs KPI row ── */}
      <section style={{ ...CARD, padding: 14, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 950, color: '#111827', marginBottom: 10 }}>SCTASKs</div>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}>
          {loading ? (
            Array(6).fill(0).map((_, i) => <Skeleton key={i} />)
          ) : (
            <>
              <KPI label="Assigned"        value={stats.assigned}           sub={selectedQueueName} />
              <KPI label="Open"            value={stats.open}               sub={selectedQueueName} />
              <KPI label="Unassigned"      value={stats.unassigned}         sub="Open" />
              <KPI label="Pending"         value={stats.pending}            sub="Open" />
              <KPI label="Aging"           value={stats.aging}              sub="> 7 days" alert={stats.aging > 0} />
              <KPI label="Avg Fulfillment" value={stats.avgFulfillment ?? '—'} sub="This month" />
            </>
          )}
        </div>
      </section>

      {/* ── Main grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 12 }}>
        <div style={{ display: 'grid', gap: 12, minWidth: 0 }}>

          {/* Recent Incidents */}
          <section style={{ ...CARD, padding: 14, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 950, color: '#111827' }}>
                Recent Incidents • {selectedQueueName}
              </div>
              <a
                href={`/internal/tickets?queueId=${selectedQueue}&type=INCIDENT`}
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
              >
                View queue
              </a>
            </div>
            <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              {loading ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} />)
              ) : recentIncidents.length ? (
                recentIncidents.map((t) => <TicketRow key={t.id} ticket={t} />)
              ) : (
                <div style={{ padding: 12, borderRadius: 12, border: '1px dashed rgba(17,24,39,0.18)', color: 'rgba(17,24,39,0.65)', fontWeight: 800 }}>
                  No incidents in this queue.
                </div>
              )}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, fontWeight: 850, color: 'rgba(17,24,39,0.60)', textAlign: 'center' }}>
              Active: <span style={{ color: '#111827', fontWeight: 950 }}>{stats.open ?? '—'}</span>
              {' '}• Avg resolve: <span style={{ color: '#111827', fontWeight: 950 }}>{stats.avgResolution ?? '—'}</span>
              {' '}• SLA compliance: <span style={{ color: stats.slaCompliancePct < 90 ? '#EF4444' : '#111827', fontWeight: 950 }}>{stats.slaCompliancePct != null ? `${stats.slaCompliancePct}%` : '—'}</span>
            </div>
          </section>

          {/* Recent SCTASKs */}
          <section style={{ ...CARD, padding: 14, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 950, color: '#111827' }}>
                Recent SCTASKs • {selectedQueueName}
              </div>
              <a
                href={`/internal/tickets?queueId=${selectedQueue}&type=SCTASK`}
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
              >
                View queue
              </a>
            </div>
            <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              {loading ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} />)
              ) : recentSctasks.length ? (
                recentSctasks.map((t) => <TicketRow key={t.id} ticket={t} />)
              ) : (
                <div style={{ padding: 12, borderRadius: 12, border: '1px dashed rgba(17,24,39,0.18)', color: 'rgba(17,24,39,0.65)', fontWeight: 800 }}>
                  No SCTASKs in this queue.
                </div>
              )}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, fontWeight: 850, color: 'rgba(17,24,39,0.60)', textAlign: 'center' }}>
              Active: <span style={{ color: '#111827', fontWeight: 950 }}>{stats.open ?? '—'}</span>
            </div>
          </section>
        </div>

        {/* Right column: Org-wide + My Work */}
        <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
          <section style={{ ...CARD, padding: 14, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 950, color: '#111827' }}>Org-wide</div>
            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 850, color: 'rgba(17,24,39,0.60)' }}>
              Full lists (all queues)
            </div>
            <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              {[
                { label: 'All Incidents',    href: '/internal/tickets?type=INCIDENT' },
                { label: 'All Requests',     href: '/internal/tickets?type=REQUEST' },
                { label: 'All SCTASKs',      href: '/internal/tickets?type=SCTASK' },
                { label: 'Problems',         href: '/internal/tickets?type=PROBLEM' },
                { label: 'Reports',          href: '/internal/reports' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  style={{
                    textDecoration: 'none',
                    display: 'block',
                    padding: 12,
                    borderRadius: 12,
                    border: '1px solid rgba(17,24,39,0.10)',
                    background: '#fff',
                    color: '#111827',
                    fontSize: 14,
                    fontWeight: 950,
                    lineHeight: 1.2,
                  }}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </section>

          <section style={{ ...CARD, padding: 14, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 950, color: '#111827' }}>My Work</div>
            <div style={{ marginTop: 6, fontSize: 12, fontWeight: 850, color: 'rgba(17,24,39,0.60)' }}>
              Assigned to you
            </div>
            <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
              {loading ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} />)
              ) : myTickets.length ? (
                myTickets.map((t) => {
                  const ref = `FT-${String(t.number).padStart(5, '0')}`;
                  return (
                    <a
                      key={t.id}
                      href={`/internal/tickets/${t.id}`}
                      style={{
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 10px',
                        borderRadius: 10,
                        border: '1px solid rgba(17,24,39,0.10)',
                        background: '#fff',
                        color: '#111827',
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: PRIORITY_COLOR[t.priority] ?? '#9CA3AF',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 11, fontWeight: 950, color: ORANGE, flexShrink: 0 }}>{ref}</span>
                      <span style={{ fontSize: 12, fontWeight: 900, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.title}
                      </span>
                    </a>
                  );
                })
              ) : (
                <div style={{ fontSize: 13, fontWeight: 900, color: 'rgba(17,24,39,0.55)' }}>
                  No open tickets assigned to you.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </InternalLayoutPlain>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user) {
    return { redirect: { destination: '/auth/signin', permanent: false } };
  }

  const employee   = Boolean(session?.user?.employee);
  const department = session?.user?.department || '';

  // Fetch queues server-side so the selector is populated on first paint
  let queues = [];
  try {
    const { prisma } = await import('@/lib/prisma');
    queues = await prisma.queue.findMany({
      where:   { isActive: true },
      orderBy: { name: 'asc' },
      select:  { id: true, name: true, color: true },
    });
  } catch (e) {
    console.error('[Dashboard SSR] Failed to load queues:', e.message);
  }

  return {
    props: { employee, department, queues },
  };
}