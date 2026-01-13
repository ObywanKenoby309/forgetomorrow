// pages/internal/dashboard.js
import React, { useMemo } from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';

import InternalLayoutPlain from '@/components/layouts/InternalLayoutPlain';
import { getMockTickets, calcMetrics, humanDurationMinutes, TICKET_STATES } from '@/lib/internal/mockTickets';

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
      <div style={{ fontSize: 11, fontWeight: 900, color: 'rgba(17,24,39,0.55)', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ marginTop: 6, fontSize: 22, fontWeight: 950, color: '#111827', lineHeight: 1.1 }}>{value}</div>
      {sub ? <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: 'rgba(17,24,39,0.60)' }}>{sub}</div> : null}
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

export default function InternalDashboard({ employee, department }) {
  const tickets = useMemo(() => getMockTickets(), []);
  const openTickets = tickets.filter((t) => ![TICKET_STATES.CANCELLED, TICKET_STATES.COMPLETED, TICKET_STATES.CLOSED_COMPLETE].includes(t.state));
  const assigned = tickets.filter((t) => t.state === TICKET_STATES.ASSIGNED || t.state === TICKET_STATES.IN_PROGRESS || t.state === TICKET_STATES.ON_HOLD);

  const avgToComplete = useMemo(() => {
    const done = tickets.filter((t) => t.completedAt);
    if (!done.length) return 0;
    const mins = done.map((t) => calcMetrics(t).createdToCompletedMins).reduce((a, b) => a + b, 0);
    return Math.round(mins / done.length);
  }, [tickets]);

  const recent = tickets
    .slice()
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 5);

  return (
    <InternalLayoutPlain
      activeNav="dashboard"
      headerTitle="Internal Workspace"
      headerSubtitle="ServiceNow-lite for ForgeTomorrow (UI preview)"
      employee={employee}
      department={department}
      initialHat="seeker"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        <KPI label="My Open" value={openTickets.length} sub="All non-closed tickets (mock)" />
        <KPI label="Assigned / Active" value={assigned.length} sub="Assigned + In Progress + On Hold" />
        <KPI label="Avg Time to Resolve" value={humanDurationMinutes(avgToComplete)} sub="Created → Resolved (avg)" />
        <KPI label="Reopen Rate" value="—" sub="Will compute from DB later" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 12 }}>
        <section style={{ ...CARD, padding: 14, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ fontSize: 16, fontWeight: 950, color: '#111827' }}>Recent Tickets</div>
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
              }}
            >
              Create Ticket
            </a>
          </div>

          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            {recent.map((t) => (
              <RowLink
                key={t.id}
                href={`/internal/tickets/${encodeURIComponent(t.id)}`}
                title={`${t.id} • ${t.title}`}
                meta={`${t.type.toUpperCase()} • ${t.priority} • ${t.queueKey.toUpperCase()} • Updated ${new Date(t.updatedAt || t.createdAt).toLocaleString()}`}
              />
            ))}
          </div>
        </section>

        <section style={{ ...CARD, padding: 14, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 950, color: '#111827' }}>Quick Actions</div>
          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            <RowLink href="/internal/tickets" title="View All Tickets" meta="Filters, saved views, full list" />
            <RowLink href="/internal/queues" title="Queues" meta="Queue backlog + aging view" />
            <RowLink href="/internal/reports" title="Reports" meta="Export-friendly metrics" />
          </div>
        </section>
      </div>
    </InternalLayoutPlain>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  // UI-first: we allow viewing if logged in, but page still displays employee status.
  // DB-first enforcement can be tightened once employee fields are in DB + session.
  const employee = Boolean(session?.user?.employee);
  const department = session?.user?.department || '';

  if (!session?.user) {
    return { redirect: { destination: '/auth/signin', permanent: false } };
  }

  return { props: { employee, department } };
}
