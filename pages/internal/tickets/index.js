// pages/internal/tickets/index.js
import React, { useMemo, useState } from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../api/auth/[...nextauth]';

import InternalLayoutPlain from '@/components/layouts/InternalLayoutPlain';
import {
  getMockTickets,
  formatState,
  calcMetrics,
  humanDurationMinutes,
  QUEUES,
  TICKET_TYPES,
  TICKET_STATES,
} from '@/lib/internal/mockTickets';

const CARD = {
  border: '1px solid rgba(17, 24, 39, 0.10)',
  background: '#FFFFFF',
  boxShadow: '0 10px 22px rgba(0,0,0,0.06)',
  borderRadius: 14,
};

function Pill({ children, tone = 'dark' }) {
  const bg =
    tone === 'orange'
      ? 'rgba(255,112,67,0.14)'
      : tone === 'green'
      ? 'rgba(16,185,129,0.14)'
      : tone === 'yellow'
      ? 'rgba(245,158,11,0.16)'
      : tone === 'red'
      ? 'rgba(239,68,68,0.14)'
      : 'rgba(17,24,39,0.08)';

  const color =
    tone === 'orange'
      ? '#C2410C'
      : tone === 'green'
      ? '#065F46'
      : tone === 'yellow'
      ? '#92400E'
      : tone === 'red'
      ? '#991B1B'
      : 'rgba(17,24,39,0.75)';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        borderRadius: 999,
        background: bg,
        color,
        fontSize: 12,
        fontWeight: 900,
        border: '1px solid rgba(17,24,39,0.10)',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function toneForState(state) {
  if (state === TICKET_STATES.IN_PROGRESS) return 'orange';
  if (state === TICKET_STATES.ON_HOLD) return 'yellow';
  if (state === TICKET_STATES.ASSIGNED) return 'dark';
  if (state === TICKET_STATES.COMPLETED || state === TICKET_STATES.CLOSED_COMPLETE) return 'green';
  if (state === TICKET_STATES.CANCELLED) return 'red';
  return 'dark';
}

export default function InternalTickets({ employee, department }) {
  const tickets = useMemo(() => getMockTickets(), []);

  const [type, setType] = useState('all');
  const [state, setState] = useState('all');
  const [queue, setQueue] = useState('all');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (type !== 'all' && t.type !== type) return false;
      if (state !== 'all' && t.state !== state) return false;
      if (queue !== 'all' && t.queueKey !== queue) return false;

      const needle = q.trim().toLowerCase();
      if (needle) {
        const hay = `${t.id} ${t.title} ${t.description} ${(t.tags || []).join(' ')}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [tickets, type, state, queue, q]);

  return (
    <InternalLayoutPlain
      activeNav="tickets"
      headerTitle="Tickets"
      headerSubtitle="Filters + saved-view foundation (UI preview)"
      employee={employee}
      department={department}
      initialHat="seeker"
    >
      <section style={{ ...CARD, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 16, fontWeight: 950, color: '#111827' }}>All Tickets</div>
          <a
            href="/internal/tickets/new"
            style={{
              textDecoration: 'none',
              background: '#FF7043',
              color: '#fff',
              fontWeight: 950,
              padding: '9px 12px',
              borderRadius: 12,
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 10px 18px rgba(0,0,0,0.08)',
            }}
          >
            Create Ticket
          </a>
        </div>

        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search (id, title, tags)"
            style={{
              gridColumn: 'span 2',
              border: '1px solid rgba(17,24,39,0.18)',
              borderRadius: 12,
              padding: '10px 12px',
              fontSize: 13,
              fontWeight: 800,
              outline: 'none',
            }}
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ border: '1px solid rgba(17,24,39,0.18)', borderRadius: 12, padding: '10px 12px', fontSize: 13, fontWeight: 900 }}
          >
            <option value="all">All Types</option>
            <option value={TICKET_TYPES.INCIDENT}>Incident</option>
            <option value={TICKET_TYPES.REQUEST}>Request</option>
          </select>

          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            style={{ border: '1px solid rgba(17,24,39,0.18)', borderRadius: 12, padding: '10px 12px', fontSize: 13, fontWeight: 900 }}
          >
            <option value="all">All States</option>
            <option value={TICKET_STATES.NEW}>New</option>
            <option value={TICKET_STATES.ASSIGNED}>Assigned</option>
            <option value={TICKET_STATES.IN_PROGRESS}>In Progress</option>
            <option value={TICKET_STATES.ON_HOLD}>On Hold</option>
            <option value={TICKET_STATES.COMPLETED}>Completed / Resolved</option>
            <option value={TICKET_STATES.CLOSED_COMPLETE}>Closed Complete</option>
            <option value={TICKET_STATES.CANCELLED}>Cancelled</option>
          </select>

          <select
            value={queue}
            onChange={(e) => setQueue(e.target.value)}
            style={{ border: '1px solid rgba(17,24,39,0.18)', borderRadius: 12, padding: '10px 12px', fontSize: 13, fontWeight: 900 }}
          >
            <option value="all">All Queues</option>
            {QUEUES.map((q) => (
              <option key={q.key} value={q.key}>
                {q.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 14, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                {['Ticket', 'Type', 'State', 'Queue', 'Assigned', 'Aging', 'Updated'].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      fontSize: 11,
                      letterSpacing: '0.10em',
                      textTransform: 'uppercase',
                      color: 'rgba(17,24,39,0.55)',
                      padding: '10px 10px',
                      borderBottom: '1px solid rgba(17,24,39,0.10)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const m = calcMetrics(t);
                return (
                  <tr key={t.id}>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid rgba(17,24,39,0.08)' }}>
                      <a
                        href={`/internal/tickets/${encodeURIComponent(t.id)}`}
                        style={{ textDecoration: 'none', color: '#111827', fontWeight: 950 }}
                      >
                        {t.id}
                      </a>
                      <div style={{ marginTop: 4, fontSize: 12, fontWeight: 800, color: 'rgba(17,24,39,0.68)' }}>
                        {t.title}
                      </div>
                    </td>

                    <td style={{ padding: '12px 10px', borderBottom: '1px solid rgba(17,24,39,0.08)' }}>
                      <Pill>{t.type.toUpperCase()}</Pill>
                    </td>

                    <td style={{ padding: '12px 10px', borderBottom: '1px solid rgba(17,24,39,0.08)' }}>
                      <Pill tone={toneForState(t.state)}>{formatState(t.state, t.type)}</Pill>
                    </td>

                    <td style={{ padding: '12px 10px', borderBottom: '1px solid rgba(17,24,39,0.08)', fontWeight: 900 }}>
                      {t.queueKey.toUpperCase()}
                    </td>

                    <td style={{ padding: '12px 10px', borderBottom: '1px solid rgba(17,24,39,0.08)', fontWeight: 900 }}>
                      {t.assignedTo?.name || '—'}
                    </td>

                    <td style={{ padding: '12px 10px', borderBottom: '1px solid rgba(17,24,39,0.08)', fontWeight: 900 }}>
                      {humanDurationMinutes(m.totalOpenedToClosedMins)}
                    </td>

                    <td style={{ padding: '12px 10px', borderBottom: '1px solid rgba(17,24,39,0.08)', fontWeight: 900 }}>
                      {new Date(t.updatedAt || t.createdAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {!filtered.length ? (
                <tr>
                  <td colSpan={7} style={{ padding: 14, fontWeight: 900, color: 'rgba(17,24,39,0.60)' }}>
                    No tickets match the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </InternalLayoutPlain>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user) {
    return { redirect: { destination: '/auth/signin', permanent: false } };
  }

  const employee = Boolean(session?.user?.employee);
  const department = session?.user?.department || '';

  return { props: { employee, department } };
}
