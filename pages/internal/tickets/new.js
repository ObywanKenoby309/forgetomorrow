// pages/internal/tickets/new.js
import React, { useEffect, useMemo, useState } from 'react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../api/auth/[...nextauth]';

import InternalLayoutPlain from '@/components/layouts/InternalLayoutPlain';
import { QUEUES, TICKET_TYPES } from '@/lib/internal/mockTickets';

const CARD = {
  border: '1px solid rgba(17, 24, 39, 0.10)',
  background: '#FFFFFF',
  boxShadow: '0 10px 22px rgba(0,0,0,0.06)',
  borderRadius: 14,
};

const ORANGE = '#FF7043';

export default function NewTicket({ employee, department }) {
  const openedAt = useMemo(() => new Date().toISOString(), []);
  const [type, setType] = useState(TICKET_TYPES.INCIDENT);
  const [queueKey, setQueueKey] = useState('cx');
  const [priority, setPriority] = useState('P3');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  const [submitted, setSubmitted] = useState(false);
  const [createdAt, setCreatedAt] = useState(null);

  useEffect(() => {
    // Type defaults: incidents tend to skew higher urgency
    if (type === TICKET_TYPES.INCIDENT && priority === 'P4') setPriority('P3');
  }, [type]); // eslint-disable-line

  function submitMock(e) {
    e.preventDefault();
    const now = new Date().toISOString();
    setCreatedAt(now);
    setSubmitted(true);

    // UI-only: later this becomes POST /api/internal/tickets
    // For now, we just show the captured timestamps for approval.
  }

  const timeToSubmit = createdAt ? Math.max(0, Math.round((new Date(createdAt).getTime() - new Date(openedAt).getTime()) / 1000)) : null;

  return (
    <InternalLayoutPlain
      activeNav="new"
      headerTitle="Create Ticket"
      headerSubtitle="Incidents + Requests (UI preview)"
      employee={employee}
      department={department}
      initialHat="seeker"
    >
      <section style={{ ...CARD, padding: 14 }}>
        <div style={{ fontSize: 16, fontWeight: 950, color: '#111827' }}>New Ticket</div>
        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: 'rgba(17,24,39,0.60)' }}>
          Opened at: <span style={{ fontWeight: 950 }}>{new Date(openedAt).toLocaleString()}</span>
        </div>

        <form onSubmit={submitMock} style={{ marginTop: 12, display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: 'rgba(17,24,39,0.65)' }}>Type</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={{ border: '1px solid rgba(17,24,39,0.18)', borderRadius: 12, padding: '10px 12px', fontSize: 13, fontWeight: 900 }}
              >
                <option value={TICKET_TYPES.INCIDENT}>Incident</option>
                <option value={TICKET_TYPES.REQUEST}>Request</option>
              </select>
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: 'rgba(17,24,39,0.65)' }}>Queue</span>
              <select
                value={queueKey}
                onChange={(e) => setQueueKey(e.target.value)}
                style={{ border: '1px solid rgba(17,24,39,0.18)', borderRadius: 12, padding: '10px 12px', fontSize: 13, fontWeight: 900 }}
              >
                {QUEUES.map((q) => (
                  <option key={q.key} value={q.key}>
                    {q.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: 'rgba(17,24,39,0.65)' }}>Priority</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{ border: '1px solid rgba(17,24,39,0.18)', borderRadius: 12, padding: '10px 12px', fontSize: 13, fontWeight: 900 }}
              >
                <option value="P1">P1</option>
                <option value="P2">P2</option>
                <option value="P3">P3</option>
                <option value="P4">P4</option>
              </select>
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: 'rgba(17,24,39,0.65)' }}>Tags</span>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="mobile, ux, recruiter"
                style={{ border: '1px solid rgba(17,24,39,0.18)', borderRadius: 12, padding: '10px 12px', fontSize: 13, fontWeight: 800 }}
              />
            </label>
          </div>

          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: 'rgba(17,24,39,0.65)' }}>Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short summary"
              required
              style={{ border: '1px solid rgba(17,24,39,0.18)', borderRadius: 12, padding: '10px 12px', fontSize: 14, fontWeight: 900 }}
            />
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: 'rgba(17,24,39,0.65)' }}>Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happened? Expected vs actual? Steps to reproduce? Screenshots (later)."
              rows={7}
              required
              style={{
                border: '1px solid rgba(17,24,39,0.18)',
                borderRadius: 12,
                padding: '10px 12px',
                fontSize: 13,
                fontWeight: 800,
                resize: 'vertical',
              }}
            />
          </label>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(17,24,39,0.55)' }}>
              Incident resolves → can reopen for 3 days. Requests complete → hard close.
            </div>

            <button
              type="submit"
              style={{
                background: ORANGE,
                color: '#fff',
                fontWeight: 950,
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 10px 18px rgba(0,0,0,0.08)',
                cursor: 'pointer',
              }}
            >
              Submit Ticket
            </button>
          </div>
        </form>
      </section>

      {submitted ? (
        <section style={{ ...CARD, padding: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 950, color: '#111827' }}>Captured timestamps (approval)</div>
          <div style={{ marginTop: 10, display: 'grid', gap: 6, fontSize: 13, fontWeight: 900, color: 'rgba(17,24,39,0.75)' }}>
            <div>openedAt: {new Date(openedAt).toLocaleString()}</div>
            <div>createdAt: {new Date(createdAt).toLocaleString()}</div>
            <div>time to submit: {timeToSubmit}s</div>
          </div>

          <div style={{ marginTop: 12 }}>
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
              Go to Tickets
            </a>
          </div>
        </section>
      ) : null}
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
