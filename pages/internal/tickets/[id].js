// pages/internal/tickets/[id].js
import React, { useMemo, useState } from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../api/auth/[...nextauth]';

import InternalLayoutPlain from '@/components/layouts/InternalLayoutPlain';
import {
  getMockTicketById,
  formatState,
  calcMetrics,
  humanDurationMinutes,
  TICKET_TYPES,
  TICKET_STATES,
} from '@/lib/internal/mockTickets';

const CARD = {
  border: '1px solid rgba(17, 24, 39, 0.10)',
  background: '#FFFFFF',
  boxShadow: '0 10px 22px rgba(0,0,0,0.06)',
  borderRadius: 14,
};

const ORANGE = '#FF7043';

function ActionButton({ children, onClick, tone = 'dark', disabled }) {
  const bg =
    tone === 'orange' ? ORANGE : tone === 'light' ? '#fff' : tone === 'red' ? '#EF4444' : '#111827';
  const color = tone === 'light' ? '#111827' : '#fff';
  const border = tone === 'light' ? '1px solid rgba(17,24,39,0.18)' : '1px solid rgba(0,0,0,0.06)';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        background: bg,
        color,
        border,
        borderRadius: 12,
        padding: '9px 12px',
        fontWeight: 950,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        boxShadow: tone === 'light' ? 'none' : '0 10px 18px rgba(0,0,0,0.08)',
      }}
    >
      {children}
    </button>
  );
}

export default function TicketDetail({ employee, department, id }) {
  const baseTicket = useMemo(() => getMockTicketById(id), [id]);

  // UI-only local state to simulate actions
  const [ticket, setTicket] = useState(baseTicket);

  const metrics = ticket ? calcMetrics(ticket) : null;

  if (!ticket) {
    return (
      <InternalLayoutPlain activeNav="tickets" headerTitle="Ticket" headerSubtitle="Not found" employee={employee} department={department}>
        <section style={{ ...CARD, padding: 14, fontWeight: 950 }}>Ticket not found.</section>
      </InternalLayoutPlain>
    );
  }

  const isIncident = ticket.type === TICKET_TYPES.INCIDENT;
  const canReopen = isIncident && ticket.state === TICKET_STATES.COMPLETED && !ticket.closedCompleteAt;

  function setState(next) {
    setTicket((t) => ({
      ...t,
      state: next,
      updatedAt: new Date().toISOString(),
      activity: [
        { at: new Date().toISOString(), by: 'You', kind: 'status', message: `State set to ${formatState(next, t.type)}` },
        ...(t.activity || []),
      ],
    }));
  }

  function markCompleted() {
    setTicket((t) => ({
      ...t,
      state: TICKET_STATES.COMPLETED,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activity: [
        { at: new Date().toISOString(), by: 'You', kind: 'status', message: isIncident ? 'Resolved' : 'Completed' },
        ...(t.activity || []),
      ],
    }));
  }

  function reopen() {
    // Per your decision: reopen goes to Assigned to last assigned tech
    setTicket((t) => ({
      ...t,
      state: TICKET_STATES.ASSIGNED,
      updatedAt: new Date().toISOString(),
      activity: [
        { at: new Date().toISOString(), by: 'You', kind: 'reopened', message: 'Reopened → Assigned (re-triage required)' },
        ...(t.activity || []),
      ],
    }));
  }

  return (
    <InternalLayoutPlain
      activeNav="tickets"
      headerTitle={`${ticket.id}`}
      headerSubtitle={`${ticket.type.toUpperCase()} • ${ticket.priority} • ${formatState(ticket.state, ticket.type)} • ${ticket.queueKey.toUpperCase()}`}
      employee={employee}
      department={department}
      initialHat="seeker"
    >
      <section style={{ ...CARD, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 950, color: '#111827' }}>{ticket.title}</div>
            <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800, color: 'rgba(17,24,39,0.68)', lineHeight: 1.35 }}>
              {ticket.description}
            </div>
            <div style={{ marginTop: 10, fontSize: 12, fontWeight: 900, color: 'rgba(17,24,39,0.55)' }}>
              Opened by {ticket.openedBy?.name || '—'} • Assigned to {ticket.assignedTo?.name || '—'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <ActionButton tone="light" onClick={() => setState(TICKET_STATES.ASSIGNED)}>
              Assign
            </ActionButton>
            <ActionButton tone="orange" onClick={() => setState(TICKET_STATES.IN_PROGRESS)}>
              Start
            </ActionButton>
            <ActionButton tone="light" onClick={() => setState(TICKET_STATES.ON_HOLD)}>
              Hold
            </ActionButton>
            <ActionButton tone="dark" onClick={markCompleted}>
              {isIncident ? 'Resolve' : 'Complete'}
            </ActionButton>
            <ActionButton tone="red" onClick={() => setState(TICKET_STATES.CANCELLED)}>
              Cancel
            </ActionButton>
            <ActionButton tone="light" onClick={reopen} disabled={!canReopen}>
              Reopen
            </ActionButton>
          </div>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 12 }}>
        <section style={{ ...CARD, padding: 14, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 950, color: '#111827' }}>Timeline</div>

          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            {(ticket.activity || []).slice().sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).map((a, idx) => (
              <div key={idx} style={{ border: '1px solid rgba(17,24,39,0.10)', borderRadius: 12, padding: 12, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 12, fontWeight: 950, color: '#111827' }}>{a.by}</div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(17,24,39,0.55)' }}>{new Date(a.at).toLocaleString()}</div>
                </div>
                <div style={{ marginTop: 6, fontSize: 13, fontWeight: 800, color: 'rgba(17,24,39,0.72)' }}>{a.message}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...CARD, padding: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 950, color: '#111827' }}>Timestamps</div>

          <div style={{ marginTop: 10, display: 'grid', gap: 8, fontSize: 13, fontWeight: 900, color: 'rgba(17,24,39,0.75)' }}>
            <div>openedAt: {ticket.openedAt ? new Date(ticket.openedAt).toLocaleString() : '—'}</div>
            <div>createdAt: {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '—'}</div>
            <div>updatedAt: {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : '—'}</div>
            <div>
              {isIncident ? 'resolvedAt' : 'completedAt'}: {ticket.completedAt ? new Date(ticket.completedAt).toLocaleString() : '—'}
            </div>
            <div>
              closedCompleteAt: {ticket.closedCompleteAt ? new Date(ticket.closedCompleteAt).toLocaleString() : '—'}
            </div>
          </div>

          <div style={{ marginTop: 14, fontSize: 15, fontWeight: 950, color: '#111827' }}>Metrics</div>
          <div style={{ marginTop: 10, display: 'grid', gap: 8, fontSize: 13, fontWeight: 900, color: 'rgba(17,24,39,0.75)' }}>
            <div>Opened → Submitted: {humanDurationMinutes(metrics.openedToCreatedMins)}</div>
            <div>Submitted → {isIncident ? 'Resolved' : 'Completed'}: {humanDurationMinutes(metrics.createdToCompletedMins)}</div>
            <div>Active work time: {humanDurationMinutes(metrics.workMins)}</div>
            <div>Hold time: {humanDurationMinutes(metrics.holdMins)}</div>
            <div>Resolved → Closed Complete: {isIncident ? humanDurationMinutes(metrics.resolvedToClosedCompleteMins) : '—'}</div>
            <div>Total aging: {humanDurationMinutes(metrics.totalOpenedToClosedMins)}</div>
          </div>

          <div style={{ marginTop: 14 }}>
            <a
              href="/internal/tickets"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                padding: '9px 12px',
                background: '#111827',
                color: '#fff',
                fontWeight: 950,
              }}
            >
              Back to Tickets
            </a>
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

  const employee = Boolean(session?.user?.employee);
  const department = session?.user?.department || '';
  const id = context.params?.id ? String(context.params.id) : '';

  return { props: { employee, department, id } };
}
