// pages/dashboard/coaching/sessions.js
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import CoachingSidebar from '../../../components/coaching/CoachingSidebar';

export default function CoachingSessionsPage() {
  const [type, setType] = useState('All');
  const [status, setStatus] = useState('All');

  // --- Mock data ---
  const sessions = [
    // Today
    { date: '2025-08-12', time: '09:00', client: 'Alex Turner', type: 'Strategy', status: 'Scheduled' },
    { date: '2025-08-12', time: '11:30', client: 'Priya N.', type: 'Resume', status: 'Scheduled' },
    { date: '2025-08-12', time: '14:00', client: 'Michael R.', type: 'Interview', status: 'Scheduled' },
    // Tomorrow
    { date: '2025-08-13', time: '10:00', client: 'Dana C.', type: 'Strategy', status: 'Scheduled' },
    // Upcoming
    { date: '2025-08-15', time: '13:00', client: 'Robert L.', type: 'Resume', status: 'Completed' },
    { date: '2025-08-16', time: '09:30', client: 'Jia L.', type: 'Interview', status: 'No-show' },
  ];
  // ------------------

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      const byType = type === 'All' ? true : s.type === type;
      const byStatus = status === 'All' ? true : s.status === status;
      return byType && byStatus;
    });
  }, [sessions, type, status]);

  const groups = useMemo(() => {
    const g = filtered.reduce((acc, s) => {
      acc[s.date] = acc[s.date] || [];
      acc[s.date].push(s);
      return acc;
    }, {});
    Object.keys(g).forEach((k) => g[k].sort((a, b) => a.time.localeCompare(b.time)));
    return g;
  }, [filtered]);

  const orderedDates = Object.keys(groups).sort();
  const friendlyLabel = (iso) => {
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    if (iso === today) return 'Today';
    if (iso === tomorrow) return 'Tomorrow';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' });
  };

  // Status badge (unchanged)
  const badge = (text) => {
    const map = {
      Scheduled: { bg: '#E3F2FD', fg: '#1565C0' },
      Completed: { bg: '#E8F5E9', fg: '#2E7D32' },
      'No-show': { bg: '#FDECEA', fg: '#C62828' },
    };
    const { bg, fg } = map[text] || { bg: '#FFF3E0', fg: '#E65100' };
    return (
      <span style={{ fontSize: 12, background: bg, color: fg, padding: '4px 8px', borderRadius: 999 }}>
        {text}
      </span>
    );
  };

  // NEW: slimmer type pill (Strategy / Resume / Interview)
  const typePill = (text) => {
    // keep your existing orange tone, just make it tighter
    return (
      <span
        style={{
          fontSize: 11,
          background: '#FFF3E0',
          color: '#E65100',
          padding: '2px 6px', // tighter
          borderRadius: 999,
          lineHeight: 1.2,
          display: 'inline-block',
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </span>
    );
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '20px',
        padding: '120px 20px 20px',
        minHeight: '100vh',
        backgroundColor: '#ECEFF1',
      }}
    >
      <CoachingSidebar active="sessions" />

      <main style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ maxWidth: 860 }}>
          {/* Filters + Calendar View link */}
          <section
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: '1px solid #eee',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'center' }}>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: 10,
                  padding: '10px 12px',
                  outline: 'none',
                  background: 'white',
                }}
              >
                <option value="All">All Types</option>
                <option value="Strategy">Strategy</option>
                <option value="Resume">Resume</option>
                <option value="Interview">Interview</option>
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: 10,
                  padding: '10px 12px',
                  outline: 'none',
                  background: 'white',
                }}
              >
                <option value="All">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="No-show">No-show</option>
              </select>

              <Link href="/dashboard/coaching/sessions/calendar" style={{ color: '#FF7043', fontWeight: 700 }}>
                Calendar View →
              </Link>
            </div>
          </section>

          {/* Agenda */}
          <section
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: '1px solid #eee',
            }}
          >
            <h2 style={{ color: '#FF7043', marginTop: 0, marginBottom: 12 }}>Agenda</h2>

            {orderedDates.map((d) => (
              <div key={d} style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, marginBottom: 8, color: '#263238' }}>{friendlyLabel(d)}</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
                  {groups[d].map((s, idx) => (
                    <li
                      key={`${d}-${idx}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '90px 1fr 120px 120px', // slightly tightened third column
                        alignItems: 'center',
                        gap: 10,
                        border: '1px solid #eee',
                        borderRadius: 8,
                        padding: '8px 10px',
                        background: '#FAFAFA',
                      }}
                    >
                      <strong>{s.time}</strong>
                      <span style={{ color: '#455A64' }}>{s.client}</span>
                      <span>{typePill(s.type)}</span>
                      <span>{badge(s.status)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {orderedDates.length === 0 && <div style={{ color: '#90A4AE' }}>No sessions match your filters.</div>}
          </section>
        </div>
      </main>
    </div>
  );
}
