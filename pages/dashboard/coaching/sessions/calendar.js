// pages/dashboard/coaching/sessions/calendar.js
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import CoachingSidebar from '../../../../components/coaching/CoachingSidebar';

export default function CoachingSessionsCalendarPage() {
  // Month navigation state
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-11

  // Filters (kept simple)
  const [type, setType] = useState('All');
  const [status, setStatus] = useState('All');

  // --- Mock data (seed sessions) ---
  const [sessions, setSessions] = useState([
    { date: '2025-08-12', time: '09:00', client: 'Alex Turner', type: 'Strategy', status: 'Scheduled' },
    { date: '2025-08-12', time: '11:30', client: 'Priya N.', type: 'Resume', status: 'Scheduled' },
    { date: '2025-08-12', time: '14:00', client: 'Michael R.', type: 'Interview', status: 'Scheduled' },
    { date: '2025-08-13', time: '10:00', client: 'Dana C.', type: 'Strategy', status: 'Scheduled' },
    { date: '2025-08-15', time: '13:00', client: 'Robert L.', type: 'Resume', status: 'Completed' },
    { date: '2025-08-16', time: '09:30', client: 'Jia L.', type: 'Interview', status: 'No-show' },
  ]);
  // ----------------------------------

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      const byType = type === 'All' ? true : s.type === type;
      const byStatus = status === 'All' ? true : s.status === status;
      return byType && byStatus;
    });
  }, [sessions, type, status]);

  // Calendar helpers
  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay(); // 0=Sun
  const daysInThisMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = new Date(year, month, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    const d = new Date(year, month, 1);
    d.setMonth(d.getMonth() - 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setSelectedDay(null);
    setDraft(null);
  };

  const nextMonth = () => {
    const d = new Date(year, month, 1);
    d.setMonth(d.getMonth() + 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setSelectedDay(null);
    setDraft(null);
  };

  const isoOf = (y, m, d) => {
    const mm = (m + 1).toString().padStart(2, '0');
    const dd = d.toString().padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  // Sessions by date (after filters)
  const sessionsByDate = useMemo(() => {
    const map = {};
    for (const s of filtered) {
      map[s.date] = map[s.date] || [];
      map[s.date].push(s);
    }
    Object.keys(map).forEach((k) => map[k].sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, [filtered]);

  // Add-session draft
  const [selectedDay, setSelectedDay] = useState(null); // ISO date
  const [draft, setDraft] = useState(null);
  const beginDraft = (iso) => {
    setSelectedDay(iso);
    setDraft({
      date: iso,
      time: '09:00',
      client: '',
      type: 'Strategy',
      status: 'Scheduled',
    });
  };

  const submitDraft = () => {
    if (!draft || !draft.client || !draft.time) {
      alert('Please enter a client name and time.');
      return;
    }
    setSessions((prev) => [...prev, draft]);
    setDraft(null);
    alert('Session added (local only).');
  };

  const badge = (text) => {
    const map = {
      Scheduled: { bg: '#E3F2FD', fg: '#1565C0' },
      Completed: { bg: '#E8F5E9', fg: '#2E7D32' },
      'No-show': { bg: '#FDECEA', fg: '#C62828' },
    };
    const { bg, fg } = map[text] || { bg: '#FFF3E0', fg: '#E65100' };
    return (
      <span style={{ fontSize: 11, background: bg, color: fg, padding: '2px 6px', borderRadius: 999 }}>
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
          {/* Top controls */}
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

              <Link href="/dashboard/coaching/sessions" style={{ color: '#FF7043', fontWeight: 700 }}>
                ← Back to Agenda
              </Link>
            </div>
          </section>

          {/* Calendar */}
          <section
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: '1px solid #eee',
            }}
          >
            {/* Month header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <button
                type="button"
                onClick={prevMonth}
                style={{
                  background: 'white',
                  border: '1px solid #eee',
                  borderRadius: 8,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#FF7043',
                }}
              >
                ‹
              </button>
              <h2 style={{ color: '#FF7043', margin: 0 }}>{monthLabel}</h2>
              <button
                type="button"
                onClick={nextMonth}
                style={{
                  background: 'white',
                  border: '1px solid #eee',
                  borderRadius: 8,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#FF7043',
                }}
              >
                ›
              </button>
            </div>

            {/* Weekday labels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 8 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => (
                <div key={w} style={{ fontSize: 12, color: '#607D8B', fontWeight: 700, textAlign: 'center' }}>
                  {w}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
              {/* Empty cells before day 1 */}
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInThisMonth }).map((_, i) => {
                const dayNum = i + 1;
                const iso = isoOf(year, month, dayNum);
                const items = sessionsByDate[iso] || [];
                const isToday = iso === new Date().toISOString().slice(0, 10);

                return (
                  <div
                    key={iso}
                    onClick={() => {
                      setSelectedDay(iso);
                      beginDraft(iso);
                    }}
                    title={`Add session on ${iso}`}
                    style={{
                      border: '1px solid #eee',
                      borderRadius: 10,
                      minHeight: 110,
                      background: '#FAFAFA',
                      padding: 8,
                      cursor: 'pointer',
                      outline: selectedDay === iso ? '2px solid #FFAB91' : isToday ? '2px solid #FFE0B2' : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#263238' }}>{dayNum}</div>

                    <div style={{ display: 'grid', gap: 6 }}>
                      {items.slice(0, 3).map((s, idx) => (
                        <button
                          key={`${iso}-${idx}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`${s.time} • ${s.client}\n${s.type} • ${s.status}`);
                          }}
                          style={{
                            textAlign: 'left',
                            background: 'white',
                            border: '1px solid #eee',
                            borderRadius: 8,
                            padding: '6px 8px',
                            cursor: 'pointer',
                            fontSize: 12,
                          }}
                        >
                          <div style={{ fontWeight: 700 }}>{s.time}</div>
                          <div style={{ color: '#455A64' }}>{s.client}</div>
                          <div style={{ marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span
                              style={{
                                fontSize: 11,
                                background: '#FFF3E0',
                                color: '#E65100',
                                padding: '2px 6px',
                                borderRadius: 999,
                              }}
                            >
                              {s.type}
                            </span>
                            {badge(s.status)}
                          </div>
                        </button>
                      ))}

                      {items.length > 3 && (
                        <div style={{ fontSize: 12, color: '#607D8B' }}>+{items.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add-session form (appears after clicking a day) */}
            {draft && (
              <div
                style={{
                  marginTop: 16,
                  borderTop: '1px solid #eee',
                  paddingTop: 16,
                  display: 'grid',
                  gap: 12,
                }}
              >
                <div style={{ fontWeight: 700, color: '#263238' }}>
                  Add Session — <span style={{ color: '#FF7043' }}>{draft.date}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 150px 150px', gap: 12 }}>
                  <input
                    value={draft.time}
                    onChange={(e) => setDraft({ ...draft, time: e.target.value })}
                    placeholder="Time (e.g., 09:00)"
                    style={{ border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px' }}
                  />
                  <input
                    value={draft.client}
                    onChange={(e) => setDraft({ ...draft, client: e.target.value })}
                    placeholder="Client name"
                    style={{ border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px' }}
                  />
                  <select
                    value={draft.type}
                    onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                    style={{ border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px', background: 'white' }}
                  >
                    <option value="Strategy">Strategy</option>
                    <option value="Resume">Resume</option>
                    <option value="Interview">Interview</option>
                  </select>
                  <select
                    value={draft.status}
                    onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                    style={{ border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px', background: 'white' }}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="No-show">No-show</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={submitDraft}
                    style={{
                      background: '#FF7043',
                      color: 'white',
                      border: 'none',
                      borderRadius: 10,
                      padding: '10px 12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Save Session
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(null);
                      setSelectedDay(null);
                    }}
                    style={{
                      background: 'white',
                      color: '#FF7043',
                      border: '1px solid #FF7043',
                      borderRadius: 10,
                      padding: '10px 12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
