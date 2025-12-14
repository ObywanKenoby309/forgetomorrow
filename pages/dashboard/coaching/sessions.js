// pages/dashboard/coaching/sessions.js
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingRightColumn from '@/components/coaching/CoachingRightColumn';

// --- Helpers to avoid UTC drift in labels (local display only) ---
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

export default function CoachingSessionsPage() {
  const [type, setType] = useState('All');
  const [status, setStatus] = useState('All');

  // Sessions are now DB-backed via API
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load from API on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/coaching/sessions');
        if (!res.ok) {
          console.error('Failed to load sessions', res.status);
          if (!cancelled) setSessions([]);
          return;
        }
        const data = await res.json().catch(() => ({}));
        const list = Array.isArray(data.sessions) ? data.sessions : [];
        // sort by datetime so groups come out sane
        list.sort(
          (a, b) =>
            toLocalDateTime(a.date, a.time) - toLocalDateTime(b.date, b.time)
        );
        if (!cancelled) setSessions(list);
      } catch (err) {
        console.error('Error loading sessions', err);
        if (!cancelled) setSessions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

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
      g[k].sort(
        (a, b) => toLocalDateTime(a.date, a.time) - toLocalDateTime(b.date, b.time)
      )
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
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
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
      <span
        style={{
          fontSize: 12,
          background: bg,
          color: fg,
          padding: '4px 8px',
          borderRadius: 999,
          whiteSpace: 'nowrap',
        }}
      >
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
    setForm({
      date: localISODate(),
      time: '09:00',
      client: '',
      type: 'Strategy',
      status: 'Scheduled',
    });
    setModal({ open: true, mode: 'add', index: null });
  };

  const openEdit = (idx) => {
    const s = filtered[idx]; // index relative to filtered view
    if (!s) return;

    setForm({
      date: s.date,
      time: s.time,
      client: s.client,
      type: s.type,
      status: s.status,
    });

    // we store the session's ID as well so we can PUT/DELETE
    setModal({ open: true, mode: 'edit', index: s.id });
  };

  const saveAdd = async (e) => {
    e.preventDefault();
    if (!form.client.trim()) {
      alert('Please enter a client name.');
      return;
    }

    try {
      const res = await fetch('/api/coaching/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: form.date,
          time: form.time,
          client: form.client.trim(),
          type: form.type,
          status: form.status,
        }),
      });

      if (!res.ok) {
        console.error('Failed to create session', res.status);
        alert('Could not create session. Please try again.');
        return;
      }

      const data = await res.json().catch(() => ({}));
      const created = data.session;

      if (!created) return;

      setSessions((prev) => {
        const next = [...prev, created];
        next.sort(
          (a, b) =>
            toLocalDateTime(a.date, a.time) - toLocalDateTime(b.date, b.time)
        );
        return next;
      });

      setModal({ open: false, mode: 'add', index: null });
    } catch (err) {
      console.error('Error creating session', err);
      alert('Could not create session. Please try again.');
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!modal.index) return; // we stored the ID here
    if (!form.client.trim()) {
      alert('Please enter a client name.');
      return;
    }

    try {
      const res = await fetch('/api/coaching/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: modal.index,
          date: form.date,
          time: form.time,
          client: form.client.trim(),
          type: form.type,
          status: form.status,
        }),
      });

      if (!res.ok) {
        console.error('Failed to update session', res.status);
        alert('Could not update session. Please try again.');
        return;
      }

      const data = await res.json().catch(() => ({}));
      const updated = data.session;
      if (!updated) return;

      setSessions((prev) => {
        const next = prev.map((s) => (s.id === updated.id ? updated : s));
        next.sort(
          (a, b) =>
            toLocalDateTime(a.date, a.time) - toLocalDateTime(b.date, b.time)
        );
        return next;
      });

      setModal({ open: false, mode: 'add', index: null });
    } catch (err) {
      console.error('Error updating session', err);
      alert('Could not update session. Please try again.');
    }
  };

  const deleteSession = async (id) => {
    if (!id) return;
    if (!confirm('Delete this session?')) return;

    try {
      const res = await fetch('/api/coaching/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        console.error('Failed to delete session', res.status);
        alert('Could not delete session. Please try again.');
        return;
      }

      setSessions((prev) => prev.filter((s) => s.id !== id));
      setModal({ open: false, mode: 'add', index: null });
    } catch (err) {
      console.error('Error deleting session', err);
      alert('Could not delete session. Please try again.');
    }
  };

  // We need a stable way to go from each rendered row back to its ID.
  // filtered/grouped items already *are* the objects with `id`, so we pass `s.id`.
  return (
    <CoachingLayout
      title="Sessions | ForgeTomorrow"
      activeNav="sessions"
      headerDescription="Manage, add, and track your coaching sessions."
      right={<CoachingRightColumn />}
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      {/* Center column content */}
      <div style={{ display: 'grid', gap: 16, width: '100%' }}>
        {/* Filters + actions */}
        <section
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            border: '1px solid #eee',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr auto auto',
              gap: 12,
              alignItems: 'center',
            }}
          >
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

            <Link
              href="/dashboard/coaching/sessions/calendar"
              style={{ color: '#FF7043', fontWeight: 700 }}
            >
              Calendar View →
            </Link>

            <button
              type="button"
              onClick={openAdd}
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
          <h2 style={{ color: '#FF7043', marginTop: 0, marginBottom: 12 }}>
            Agenda
          </h2>

          {/* Header row with Actions column */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '90px 1fr 120px 120px 110px',
              gap: 10,
              padding: '6px 10px',
              background: '#FAFAFA',
              color: '#607D8B',
              fontSize: 12,
              border: '1px solid #eee',
              borderRadius: 8,
              marginBottom: 6,
              fontWeight: 700,
            }}
          >
            <span>Time</span>
            <span>Name</span>
            <span>Topic</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {loading && (
            <div style={{ color: '#90A4AE', fontSize: 14 }}>
              Loading sessions…
            </div>
          )}

          {!loading &&
            orderedDates.map((d) => (
              <div key={d} style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: 8,
                    color: '#263238',
                  }}
                >
                  {friendlyLabel(d)}
                </div>
                <ul
                  style={{
                    margin: 0,
                    padding: 0,
                    listStyle: 'none',
                    display: 'grid',
                    gap: 8,
                  }}
                >
                  {groups[d].map((s) => (
                    <li
                      key={s.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          '90px 1fr 120px 120px 110px',
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
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => openEdit(sessions.findIndex((x) => x.id === s.id))}
                          style={{
                            background: '#FFF3E0',
                            color: '#E65100',
                            border: '1px solid #E65100',
                            borderRadius: 6,
                            padding: '4px 8px',
                            fontSize: 11,
                            cursor: 'pointer',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSession(s.id)}
                          style={{
                            background: 'white',
                            color: '#C62828',
                            border: '1px solid #C62828',
                            borderRadius: 6,
                            padding: '4px 8px',
                            fontSize: 11,
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          {!loading && orderedDates.length === 0 && (
            <div style={{ color: '#90A4AE', fontSize: 14 }}>
              <p style={{ margin: 0 }}>No sessions yet.</p>
              <p style={{ margin: '2px 0 0' }}>
                Use “+ Add Session” above to start your agenda. If you
                expected to see sessions, try adjusting your filters.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Modal */}
      {modal.open && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
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
              borderRadius: 12,
              padding: 20,
              width: 400,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
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
                style={{ width: '100%', padding: 6 }}
              />
            </label>
            <label>
              Time:
              <input
                type="time"
                value={form.time}
                onChange={(e) => update('time', e.target.value)}
                style={{ width: '100%', padding: 6 }}
              />
            </label>
            <label>
              Client Name:
              <input
                type="text"
                value={form.client}
                onChange={(e) => update('client', e.target.value)}
                style={{ width: '100%', padding: 6 }}
              />
            </label>
            <label>
              Type:
              <select
                value={form.type}
                onChange={(e) => update('type', e.target.value)}
                style={{ width: '100%', padding: 6 }}
              >
                <option value="Strategy">Strategy</option>
                <option value="Resume">Resume</option>
                <option value="Interview">Interview</option>
              </select>
            </label>
            <label>
              Status:
              <select
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
                style={{ width: '100%', padding: 6 }}
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="No-show">No-show</option>
              </select>
            </label>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 10,
              }}
            >
              {modal.mode === 'edit' && (
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
              )}
              <div style={{ display: 'flex', gap: 8 }}>
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
                <button
                  type="button"
                  onClick={() =>
                    setModal({ open: false, mode: 'add', index: null })
                  }
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
          </form>
        </div>
      )}
    </CoachingLayout>
  );
}
