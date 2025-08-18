import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CoachingSidebar from '../../../components/coaching/CoachingSidebar';
import CoachingHeader from '../../../components/coaching/CoachingHeader';

const STORAGE_KEY = 'coachSessions_v1';

// --- Helpers to avoid UTC drift ---
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

// Seed data (used only if nothing is saved yet)
const seedSessions = [
  { date: '2025-08-12', time: '09:00', client: 'Alex Turner',  type: 'Strategy',  status: 'Scheduled' },
  { date: '2025-08-12', time: '11:30', client: 'Priya N.',     type: 'Resume',    status: 'Scheduled' },
  { date: '2025-08-12', time: '14:00', client: 'Michael R.',   type: 'Interview', status: 'Scheduled' },
  { date: '2025-08-13', time: '10:00', client: 'Dana C.',      type: 'Strategy',  status: 'Scheduled' },
  { date: '2025-08-15', time: '13:00', client: 'Robert L.',    type: 'Resume',    status: 'Completed' },
  { date: '2025-08-16', time: '09:30', client: 'Jia L.',       type: 'Interview', status: 'No-show'  },
];

export default function CoachingSessionsPage() {
  const [type, setType] = useState('All');
  const [status, setStatus] = useState('All');

  // Sessions state + persistence
  const [sessions, setSessions] = useState([]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(saved) && saved.length) setSessions(saved);
      else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seedSessions));
        setSessions(seedSessions);
      }
    } catch {}
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {}
  }, [sessions]);

  // Filtering
  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      const byType = type === 'All' ? true : s.type === type;
      const byStatus = status === 'All' ? true : s.status === status;
      return byType && byStatus;
    });
  }, [sessions, type, status]);

  // Group by date
  const groups = useMemo(() => {
    const g = filtered.reduce((acc, s) => {
      (acc[s.date] = acc[s.date] || []).push(s);
      return acc;
    }, {});
    Object.keys(g).forEach((k) =>
      g[k].sort((a, b) => toLocalDateTime(a.date, a.time) - toLocalDateTime(b.date, b.time))
    );
    return g;
  }, [filtered]);

  const orderedDates = Object.keys(groups).sort();
  const friendlyLabel = (iso) => {
    const todayISO = localISODate();
    const tomorrowISO = localISODate(new Date(Date.now() + 86400000));
    if (iso === todayISO) return 'Today';
    if (iso === tomorrowISO) return 'Tomorrow';
    const [yy, mm, dd] = iso.split('-').map(Number);
    const d = new Date(yy, mm - 1, dd);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' });
  };

  // Status badge
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

  // Slim orange type pill
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

  // ---------- Add/Edit/Delete Modal ----------
  const [modal, setModal] = useState({ open: false, mode: 'add', index: null });
  const [form, setForm] = useState({
    date: localISODate(),
    time: '09:00',
    client: '',
    type: 'Strategy',
    status: 'Scheduled',
  });
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => {
    setForm({ date: localISODate(), time: '09:00', client: '', type: 'Strategy', status: 'Scheduled' });
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

  // Find the index in the master sessions array for a rendered item
  const findIndexOf = (s) =>
    sessions.findIndex(
      (x) =>
        x.date === s.date &&
        x.time === s.time &&
        x.client === s.client &&
        x.type === s.type &&
        x.status === s.status
    );

  return (
    <>
      <CoachingHeader />

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
            {/* Filters + actions */}
            <section
              style={{
                background: 'white',
                borderRadius: 12,
                padding: '20px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                border: '1px solid #eee',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '12px', alignItems: 'center' }}>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '10px 12px', outline: 'none', background: 'white' }}
                >
                  <option value="All">All Types</option>
                  <option value="Strategy">Strategy</option>
                  <option value="Resume">Resume</option>
                  <option value="Interview">Interview</option>
                </select>

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '10px 12px', outline: 'none', background: 'white' }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="No-show">No-show</option>
                </select>

                <Link href="/dashboard/coaching/sessions/calendar" style={{ color: '#FF7043', fontWeight: 700 }}>
                  Calendar View →
                </Link>

                <button
                  type="button"
                  onClick={openAdd}
                  style={{
                    background: '#FF7043',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
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

            {/* Agenda */}
            <section
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                border: '1px solid #eee',
              }}
            >
              <h2 style={{ color: '#FF7043', marginTop: 0, marginBottom: '12px' }}>Agenda</h2>

              {/* Header row with Actions column */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '90px 1fr 120px 120px 110px',
                  gap: '10px',
                  padding: '6px 10px',
                  background: '#FAFAFA',
                  color: '#607D8B',
                  fontSize: '12px',
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  marginBottom: '6px',
                  fontWeight: 700,
                }}
              >
                <span>Time</span>
                <span>Name</span>
                <span>Topic</span>
                <span>Status</span>
                <span>Actions</span>
              </div>

              {orderedDates.map((d) => (
                <div key={d} style={{ marginBottom: '16px' }}>
                  <div style={{ fontWeight: 700, marginBottom: '8px', color: '#263238' }}>{friendlyLabel(d)}</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '8px' }}>
                    {groups[d].map((s, idx) => {
                      const masterIdx = findIndexOf(s);
                      return (
                        <li
                          key={`${d}-${idx}`}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '90px 1fr 120px 120px 110px',
                            alignItems: 'center',
                            gap: '10px',
                            border: '1px solid #eee',
                            borderRadius: '8px',
                            padding: '8px 10px',
                            background: '#FAFAFA',
                          }}
                        >
                          <strong>{s.time}</strong>
                          <span style={{ color: '#455A64' }}>{s.client}</span>
                          <span>{typePill(s.type)}</span>
                          <span>{badge(s.status)}</span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => openEdit(masterIdx)}
                              style={{
                                background: '#FFF3E0',
                                color: '#E65100',
                                border: '1px solid #E65100',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '11px',
                                cursor: 'pointer',
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSession(masterIdx)}
                              style={{
                                background: 'white',
                                color: '#C62828',
                                border: '1px solid #C62828',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '11px',
                                cursor: 'pointer',
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}

              {orderedDates.length === 0 && <div style={{ color: '#90A4AE' }}>No sessions match your filters.</div>}
            </section>
          </div>
        </main>

        {/* Modal */}
        {modal.open && (
          <div
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999,
            }}
          >
            <form
              onSubmit={modal.mode === 'add' ? saveAdd : saveEdit}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                width: '400px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <h3 style={{ margin: 0, color: '#FF7043' }}>
                {modal.mode === 'add' ? 'Add Session' : 'Edit Session'}
              </h3>

              <label>
                Date:
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => update('date', e.target.value)}
                  style={{ width: '100%', padding: '6px' }}
                />
              </label>
              <label>
                Time:
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => update('time', e.target.value)}
                  style={{ width: '100%', padding: '6px' }}
                />
              </label>
              <label>
                Client Name:
                <input
                  type="text"
                  value={form.client}
                  onChange={(e) => update('client', e.target.value)}
                  style={{ width: '100%', padding: '6px' }}
                />
              </label>
              <label>
                Type:
                <select value={form.type} onChange={(e) => update('type', e.target.value)} style={{ width: '100%', padding: '6px' }}>
                  <option value="Strategy">Strategy</option>
                  <option value="Resume">Resume</option>
                  <option value="Interview">Interview</option>
                </select>
              </label>
              <label>
                Status:
                <select value={form.status} onChange={(e) => update('status', e.target.value)} style={{ width: '100%', padding: '6px' }}>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="No-show">No-show</option>
                </select>
              </label>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                {modal.mode === 'edit' && (
                  <button
                    type="button"
                    onClick={() => deleteSession(modal.index)}
                    style={{
                      background: 'white',
                      color: '#C62828',
                      border: '1px solid #C62828',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="submit"
                    style={{
                      background: '#FF7043',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal({ open: false, mode: 'add', index: null })}
                    style={{
                      background: 'white',
                      color: '#FF7043',
                      border: '1px solid #FF7043',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
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
