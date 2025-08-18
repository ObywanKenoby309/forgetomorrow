// pages/dashboard/coaching/sessions/calendar.js
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CoachingSidebar from '../../../../components/coaching/CoachingSidebar';
import CoachingHeader from '../../../../components/coaching/CoachingHeader';

const STORAGE_KEY = 'coachSessions_v1';

// --- Helpers to avoid UTC drift (use LOCAL dates/times) ---
function localISODate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function toLocalDateTime(dateStr, timeStr = '00:00') {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0);
}

// Seed data (only used if storage is empty)
const seed = [
  { date: '2025-08-12', time: '09:00', client: 'Alex Turner',  type: 'Strategy',  status: 'Scheduled' },
  { date: '2025-08-12', time: '11:30', client: 'Priya N.',     type: 'Resume',    status: 'Scheduled' },
  { date: '2025-08-12', time: '14:00', client: 'Michael R.',   type: 'Interview', status: 'Scheduled' },
  { date: '2025-08-13', time: '10:00', client: 'Dana C.',      type: 'Strategy',  status: 'Scheduled' },
  { date: '2025-08-15', time: '13:00', client: 'Robert L.',    type: 'Resume',    status: 'Completed' },
  { date: '2025-08-16', time: '09:30', client: 'Jia L.',       type: 'Interview', status: 'No-show'  },
];

export default function CoachingSessionsCalendarPage() {
  // Month navigation
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-11

  // Filters
  const [type, setType] = useState('All');
  const [status, setStatus] = useState('All');

  // Sessions state + persistence (shared with Sessions + Dashboard)
  const [sessions, setSessions] = useState([]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(saved) && saved.length) setSessions(saved);
      else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
        setSessions(seed);
      }
    } catch { setSessions([]); }
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)); } catch {}
  }, [sessions]);

  // Derived: filter
  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      const byType = type === 'All' ? true : s.type === type;
      const byStatus = status === 'All' ? true : s.status === status;
      return byType && byStatus;
    });
  }, [sessions, type, status]);

  // Static 6-week grid (42 cells), start on Sunday before/at the 1st
  const monthLabel = new Date(year, month, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const gridDays = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const startDay = firstOfMonth.getDay(); // 0=Sun
    const start = new Date(firstOfMonth);
    start.setDate(firstOfMonth.getDate() - startDay);

    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = localISODate(d);
      days.push({
        iso,
        dayNum: d.getDate(),
        inMonth: d.getMonth() === month && d.getFullYear() === year,
        isToday: iso === localISODate(),
      });
    }
    return days;
  }, [year, month]);

  // Sessions by date
  const sessionsByDate = useMemo(() => {
    const map = {};
    for (const s of filtered) (map[s.date] = map[s.date] || []).push(s);
    Object.keys(map).forEach((k) =>
      map[k].sort((a, b) => toLocalDateTime(a.date, a.time) - toLocalDateTime(b.date, b.time))
    );
    return map;
  }, [filtered]);

  // ---------- Shared Add/Edit/Delete modal (matches Sessions page) ----------
  const [modal, setModal] = useState({ open: false, mode: 'add', index: null });
  const [form, setForm] = useState({
    date: localISODate(),
    time: '09:00',
    client: '',
    type: 'Strategy',
    status: 'Scheduled',
  });
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openAddFor = (isoDate) => {
    setForm({ date: isoDate || localISODate(), time: '09:00', client: '', type: 'Strategy', status: 'Scheduled' });
    setModal({ open: true, mode: 'add', index: null });
  };
  const openEdit = (idx) => {
    const s = sessions[idx];
    setForm({ date: s.date, time: s.time, client: s.client, type: s.type, status: s.status });
    setModal({ open: true, mode: 'edit', index: idx });
  };

  const saveAdd = (e) => {
    e.preventDefault();
    if (!form.client.trim()) return alert('Please enter a client name.');
    const rec = { ...form, client: form.client.trim() };
    setSessions((prev) => {
      const next = [...prev, rec];
      next.sort((a, b) => toLocalDateTime(a.date, a.time) - toLocalDateTime(b.date, b.time));
      return next;
    });
    setModal({ open: false, mode: 'add', index: null });
  };
  const saveEdit = (e) => {
    e.preventDefault();
    if (modal.index == null) return;
    if (!form.client.trim()) return alert('Please enter a client name.');
    setSessions((prev) => {
      const next = [...prev];
      next[modal.index] = { ...form, client: form.client.trim() };
      next.sort((a, b) => toLocalDateTime(a.date, a.time) - toLocalDateTime(b.date, b.time));
      return next;
    });
    setModal({ open: false, mode: 'add', index: null });
  };
  const deleteSession = (idx) => {
    if (!confirm('Delete this session?')) return;
    setSessions((prev) => prev.filter((_, i) => i !== idx));
    setModal({ open: false, mode: 'add', index: null });
  };

  // Find in master array (for editing items inside day cells)
  const findIndexOf = (s) =>
    sessions.findIndex(
      (x) =>
        x.date === s.date &&
        x.time === s.time &&
        x.client === s.client &&
        x.type === s.type &&
        x.status === s.status
    );

  // UI helpers (match Sessions + Clients styles)
  const badge = (text) => {
    const map = {
      Scheduled: { bg: '#E3F2FD', fg: '#1565C0' },
      Completed: { bg: '#E8F5E9', fg: '#2E7D32' },
      'No-show': { bg: '#FDECEA', fg: '#C62828' },
    };
    const { bg, fg } = map[text] || { bg: '#FFF3E0', fg: '#E65100' };
    return (
      <span style={{ fontSize: 12, background: bg, color: fg, padding: '4px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>
        {text}
      </span>
    );
  };
  const typePill = (text) => (
    <span
      style={{
        fontSize: 11,
        background: '#FFF3E0',
        color: '#E65100',
        padding: '2px 6px',
        borderRadius: 999,
        lineHeight: 1.2,
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );

  const prevMonth = () => {
    const d = new Date(year, month, 1);
    d.setMonth(d.getMonth() - 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };
  const nextMonth = () => {
    const d = new Date(year, month, 1);
    d.setMonth(d.getMonth() + 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  return (
    <>
      <CoachingHeader />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: '20px',
          padding: '40px 20px 20px', // reduced top padding
          minHeight: '100vh',
          backgroundColor: '#ECEFF1',
        }}
      >
        <CoachingSidebar active="sessions" />

        <main style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ maxWidth: 1120 }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 12, alignItems: 'center' }}>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={{ border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px', outline: 'none', background: 'white' }}
                >
                  <option value="All">All Types</option>
                  <option value="Strategy">Strategy</option>
                  <option value="Resume">Resume</option>
                  <option value="Interview">Interview</option>
                </select>

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px', outline: 'none', background: 'white' }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="No-show">No-show</option>
                </select>

                <Link href="/dashboard/coaching/sessions" style={{ color: '#FF7043', fontWeight: 700 }}>
                  ← Back to Agenda
                </Link>

                <button
                  type="button"
                  onClick={() => openAddFor(localISODate())}
                  style={{
                    background: '#FF7043',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    justifySelf: 'end',
                  }}
                >
                  + Add Session
                </button>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12, marginBottom: 8 }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => (
                  <div key={w} style={{ fontSize: 12, color: '#607D8B', fontWeight: 700, textAlign: 'center' }}>
                    {w}
                  </div>
                ))}
              </div>

              {/* Static 6-week grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12 }}>
                {gridDays.map(({ iso, dayNum, inMonth, isToday }) => {
                  const items = sessionsByDate[iso] || [];
                  return (
                    <div
                      key={iso}
                      onClick={() => openAddFor(iso)}
                      title={`Add session on ${iso}`}
                      style={{
                        border: '1px solid #eee',
                        borderRadius: 10,
                        minHeight: 140,
                        background: inMonth ? '#FAFAFA' : '#F7F7F7',
                        opacity: inMonth ? 1 : 0.65,
                        padding: 10,
                        cursor: 'pointer',
                        outline: isToday ? '2px solid #FFE0B2' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <div style={{ fontWeight: 700, color: '#263238' }}>{dayNum}</div>

                      <div style={{ display: 'grid', gap: 6 }}>
                        {items.slice(0, 3).map((s, idx) => {
                          const masterIdx = findIndexOf(s);
                          return (
                            <button
                              key={`${iso}-${idx}`}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit(masterIdx);
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
                                {typePill(s.type)}
                                {badge(s.status)}
                              </div>
                            </button>
                          );
                        })}
                        {items.length > 3 && <div style={{ fontSize: 12, color: '#607D8B' }}>+{items.length - 3} more</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </main>

        {/* Add/Edit Modal */}
        {modal.open && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.35)',
              display: 'grid',
              placeItems: 'center',
              zIndex: 50,
            }}
            onClick={() => setModal({ open: false, mode: 'add', index: null })}
          >
            <form
              onClick={(e) => e.stopPropagation()}
              onSubmit={modal.mode === 'add' ? saveAdd : saveEdit}
              style={{
                width: '100%',
                maxWidth: 520,
                background: 'white',
                borderRadius: 12,
                padding: 16,
                border: '1px solid #eee',
                boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
                display: 'grid',
                gap: 10,
              }}
            >
              <div style={{ fontWeight: 800, color: '#263238', marginBottom: 4 }}>
                {modal.mode === 'add' ? 'Add Session' : 'Edit Session'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={label}>Date</label>
                  <input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} style={input} required />
                </div>
                <div>
                  <label style={label}>Time</label>
                  <input type="time" value={form.time} onChange={(e) => update('time', e.target.value)} style={input} required />
                </div>
              </div>

              <div>
                <label style={label}>Client name</label>
                <input value={form.client} onChange={(e) => update('client', e.target.value)} style={input} placeholder="e.g., Jamie R." required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={label}>Topic</label>
                  <select value={form.type} onChange={(e) => update('type', e.target.value)} style={input}>
                    <option>Strategy</option>
                    <option>Resume</option>
                    <option>Interview</option>
                  </select>
                </div>
                <div>
                  <label style={label}>Status</label>
                  <select value={form.status} onChange={(e) => update('status', e.target.value)} style={input}>
                    <option>Scheduled</option>
                    <option>Completed</option>
                    <option>No-show</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 6 }}>
                {modal.mode === 'edit' ? (
                  <button
                    type="button"
                    onClick={() => deleteSession(modal.index)}
                    style={{
                      background: 'white',
                      color: '#C62828',
                      border: '1px solid #C62828',
                      borderRadius: 10,
                      padding: '10px 12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                ) : (
                  <span />
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setModal({ open: false, mode: 'add', index: null })}
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
                  <button
                    type="submit"
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
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}

const label = { display: 'block', fontSize: 12, color: '#607D8B', marginBottom: 4, fontWeight: 700 };
const input = { border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px', outline: 'none', width: '100%', background: 'white' };
