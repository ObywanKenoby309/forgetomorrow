// pages/internal/queues.js
import React, { useMemo } from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';

import InternalLayoutPlain from '@/components/layouts/InternalLayoutPlain';
import { getMockTickets, QUEUES, TICKET_STATES, calcMetrics, humanDurationMinutes } from '@/lib/internal/mockTickets';

const CARD = {
  border: '1px solid rgba(17, 24, 39, 0.10)',
  background: '#FFFFFF',
  boxShadow: '0 10px 22px rgba(0,0,0,0.06)',
  borderRadius: 14,
};

export default function Queues({ employee, department }) {
  const tickets = useMemo(() => getMockTickets(), []);

  const byQueue = useMemo(() => {
    const map = {};
    for (const q of QUEUES) map[q.key] = [];
    for (const t of tickets) {
      if (!map[t.queueKey]) map[t.queueKey] = [];
      map[t.queueKey].push(t);
    }
    return map;
  }, [tickets]);

  function backlog(list) {
    return list.filter((t) => ![TICKET_STATES.CANCELLED, TICKET_STATES.COMPLETED, TICKET_STATES.CLOSED_COMPLETE].includes(t.state));
  }

  return (
    <InternalLayoutPlain
      activeNav="queues"
      headerTitle="Queues"
      headerSubtitle="Backlog + aging (UI preview)"
      employee={employee}
      department={department}
      initialHat="seeker"
    >
      {QUEUES.map((q) => {
        const list = byQueue[q.key] || [];
        const bl = backlog(list);
        const oldest = bl
          .slice()
          .sort((a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime())[0];

        return (
          <section key={q.key} style={{ ...CARD, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 16, fontWeight: 950, color: '#111827' }}>{q.name}</div>
              <div style={{ fontSize: 13, fontWeight: 950, color: 'rgba(17,24,39,0.72)' }}>
                Backlog: {bl.length} • Total: {list.length}
              </div>
            </div>

            <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              {oldest ? (
                <div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(17,24,39,0.60)' }}>
                  Oldest in backlog: <span style={{ color: '#111827' }}>{oldest.id}</span> • Aging{' '}
                  <span style={{ color: '#111827' }}>{humanDurationMinutes(calcMetrics(oldest).totalOpenedToClosedMins)}</span>
                </div>
              ) : (
                <div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(17,24,39,0.60)' }}>No backlog items.</div>
              )}

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <thead>
                    <tr>
                      {['Ticket', 'State', 'Assigned', 'Aging', 'Updated'].map((h) => (
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
                    {bl
                      .slice()
                      .sort((a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime())
                      .slice(0, 8)
                      .map((t) => {
                        const m = calcMetrics(t);
                        return (
                          <tr key={t.id}>
                            <td style={{ padding: '12px 10px', borderBottom: '1px solid rgba(17,24,39,0.08)' }}>
                              <a href={`/internal/tickets/${encodeURIComponent(t.id)}`} style={{ textDecoration: 'none', color: '#111827', fontWeight: 950 }}>
                                {t.id}
                              </a>
                              <div style={{ marginTop: 4, fontSize: 12, fontWeight: 800, color: 'rgba(17,24,39,0.68)' }}>{t.title}</div>
                            </td>
                            <td style={{ padding: '12px 10px', borderBottom: '1px solid rgba(17,24,39,0.08)', fontWeight: 950 }}>
                              {t.state}
                            </td>
                            <td style={{ padding: '12px 10px', borderBottom: '1px solid rgba(17,24,39,0.08)', fontWeight: 950 }}>
                              {t.assignedTo?.name || '—'}
                            </td>
                            <td style={{ padding: '12px 10px', borderBottom: '1px solid rgba(17,24,39,0.08)', fontWeight: 950 }}>
                              {humanDurationMinutes(m.totalOpenedToClosedMins)}
                            </td>
                            <td style={{ padding: '12px 10px', borderBottom: '1px solid rgba(17,24,39,0.08)', fontWeight: 950 }}>
                              {new Date(t.updatedAt || t.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    {!bl.length ? (
                      <tr>
                        <td colSpan={5} style={{ padding: 14, fontWeight: 900, color: 'rgba(17,24,39,0.60)' }}>
                          Queue is clear.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        );
      })}
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
