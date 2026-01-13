// pages/internal/reports.js
import React, { useMemo } from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';

import InternalLayoutPlain from '@/components/layouts/InternalLayoutPlain';
import { getMockTickets, TICKET_TYPES, TICKET_STATES, calcMetrics, humanDurationMinutes } from '@/lib/internal/mockTickets';

const CARD = {
  border: '1px solid rgba(17, 24, 39, 0.10)',
  background: '#FFFFFF',
  boxShadow: '0 10px 22px rgba(0,0,0,0.06)',
  borderRadius: 14,
};

export default function Reports({ employee, department }) {
  const tickets = useMemo(() => getMockTickets(), []);

  const stats = useMemo(() => {
    const incidents = tickets.filter((t) => t.type === TICKET_TYPES.INCIDENT);
    const requests = tickets.filter((t) => t.type === TICKET_TYPES.REQUEST);

    const done = tickets.filter((t) => t.completedAt);
    const avg = done.length
      ? Math.round(done.map((t) => calcMetrics(t).createdToCompletedMins).reduce((a, b) => a + b, 0) / done.length)
      : 0;

    const backlog = tickets.filter((t) => ![TICKET_STATES.CANCELLED, TICKET_STATES.COMPLETED, TICKET_STATES.CLOSED_COMPLETE].includes(t.state));

    return { incidents: incidents.length, requests: requests.length, avg, backlog: backlog.length };
  }, [tickets]);

  return (
    <InternalLayoutPlain
      activeNav="reports"
      headerTitle="Reports"
      headerSubtitle="Export-friendly layout (plain background)"
      employee={employee}
      department={department}
      initialHat="seeker"
    >
      <section style={{ ...CARD, padding: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 950, color: '#111827' }}>Summary</div>

        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
          {[
            { label: 'Incidents', value: stats.incidents },
            { label: 'Requests', value: stats.requests },
            { label: 'Backlog', value: stats.backlog },
            { label: 'Avg Resolve Time', value: humanDurationMinutes(stats.avg) },
          ].map((x) => (
            <div key={x.label} style={{ border: '1px solid rgba(17,24,39,0.10)', borderRadius: 14, padding: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: 'rgba(17,24,39,0.55)', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                {x.label}
              </div>
              <div style={{ marginTop: 6, fontSize: 22, fontWeight: 950, color: '#111827' }}>{x.value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, fontSize: 12, fontWeight: 900, color: 'rgba(17,24,39,0.60)' }}>
          Note: This is mock data for layout signoff. Once DB models land, these become real org metrics + exports.
        </div>
      </section>

      <section style={{ ...CARD, padding: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 950, color: '#111827' }}>Export Targets (next wiring)</div>
        <ul style={{ marginTop: 10, marginBottom: 0, paddingLeft: 18, fontSize: 13, fontWeight: 800, color: 'rgba(17,24,39,0.72)', lineHeight: 1.6 }}>
          <li>CSV export: ticket list filtered by queue, state, type</li>
          <li>Time-to-complete by queue / assignee</li>
          <li>Hold-time analysis (clock stopped)</li>
          <li>Reopen rate (incidents only)</li>
          <li>Change log + audit trail</li>
        </ul>
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
