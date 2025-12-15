// pages/dashboard/coaching/sessions.js
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingRightColumn from '@/components/coaching/CoachingRightColumn';

const API_URL = '/api/coaching/sessions';

// --- Helpers to avoid UTC drift ---
function localISODate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toLocalDateTime(dateStr, timeStr = '00:00') {
  const [y, m, d] = (dateStr || '').split('-').map(Number);
  const [hh, mm] = (timeStr || '00:00').split(':').map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1, hh || 0, mm || 0);
}

// Normalize API shape → UI shape
function normalizeSessions(raw) {
  if (!Array.isArray(raw)) return [];

  return raw.map((s) => {
    const date = s.date || s.sessionDate || null;
    const time = s.time || s.sessionTime || null;
    const client =
      s.client ||
      s.clientName ||
      s.client_name ||
      '';

    let finalDate = date;
    let finalTime = time;

    if (!finalDate || !finalTime) {
      const start = s.startAt || s.start_at;
      if (start) {
        const dt = new Date(start);
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const d = String(dt.getDate()).padStart(2, '0');
        const hh = String(dt.getHours()).padStart(2, '0');
        const mm = String(dt.getMinutes()).padStart(2, '0');
        finalDate = `${y}-${m}-${d}`;
        finalTime = `${hh}:${mm}`;
      }
    }

    const clientId =
      typeof s.clientId === 'string' && s.clientId.length > 0
        ? s.clientId
        : null;

    const clientType =
      s.clientType === 'internal' || s.clientType === 'external'
        ? s.clientType
        : clientId
        ? 'internal'
        : 'external';

    return {
      id: s.id,
      date: finalDate || localISODate(),
      time: finalTime || '09:00',
      client,
      type: s.type || 'Strategy',
      status: s.status || 'Scheduled',
      clientId,
      clientType,
    };
  });
}

export default function CoachingSessionsPage() {
  const [type, setType] = useState('All');
  const [status, setStatus] = useState('All');

  // Sessions from DB
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // -------- Load from DB --------
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(API_URL);
        if (!res.ok) {
          console.error('Failed to load sessions', res.status);
          if (!cancelled) setSessions([]);
          return;
        }
        const data = await res.json().catch(() => ({}));
        const raw = Array.isArray(data) ? data : data.sessions || [];
        const normalized = normalizeSessions(raw);
        if (!cancelled) {
          normalized.sort(
            (a, b) =>
              toLocalDateTime(a.date, a.time) -
              toLocalDateTime(b.date, b.time)
          );
          setSessions(normalized);
        }
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

  // -------- Filters --------
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
        (a, b) =>
          toLocalDateTime(a.date, a.time) -
          toLocalDateTime(b.date, b.time)
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
    const d = new Date(yy || 1970, (mm || 1) - 1, dd || 1);
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
          padding: '4px 10px',
          borderRadius: 999,
          whiteSpace: 'nowrap',
          border: '1px solid rgba(148,163,184,0.3)',
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
        background: 'rgba(255,112,67,0.08)',
        color: '#FF7043',
        padding: '3px 8px',
        borderRadius: 999,
        lineHeight: 1.2,
        display: 'inline-block',
        whiteSpace: 'nowrap',
        border: '1px solid rgba(255,112,67,0.35)',
      }}
    >
      {text}
    </span>
  );

  // ---------- Add/Edit/Delete Modal ----------
  const [modal, setModal] = useState({ open: false, mode: 'add', id: null });

  const [form, setForm] = useState({
    date: localISODate(),
    time: '09:00',
    clientName: '',
    clientType: 'external', // 'internal' | 'external'
    clientUserId: null,
    type: 'Strategy',
    status: 'Scheduled',
  });

  const update = (k, v) =>
    setForm((f) => ({
      ...f,
      [k]: v,
    }));

  // Search state for internal clients
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [clientResults, setClientResults] = useState([]);
  const [clientSearchLoading, setClientSearchLoading] = useState(false);
  const [clientSearchError, setClientSearchError] = useState('');

  // Fetch contacts when searching internal clients
  useEffect(() => {
    if (form.clientType !== 'internal') return;

    const term = clientSearchTerm.trim();
    if (!term) {
      setClientResults([]);
      setClientSearchError('');
      return;
    }

    let active = true;
    const controller = new AbortController();

    async function run() {
      try {
        setClientSearchLoading(true);
        setClientSearchError('');

        // unified contacts search endpoint
        const res = await fetch(
          `/api/contacts/search?q=${encodeURIComponent(term)}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          if (!active) return;
          console.error('Contacts search failed:', await res.text());
          setClientResults([]);
          setClientSearchError('Search failed. Try again.');
          return;
        }

        const data = await res.json().catch(() => ({}));

        let results = [];
        if (Array.isArray(data.contacts)) {
          results = data.contacts;
        } else if (Array.isArray(data.results)) {
          results = data.results;
        }

        if (active) {
          setClientResults(results);
        }
      } catch (err) {
        if (!active) return;
        if (err.name === 'AbortError') return;
        console.error('Client search error', err);
        setClientResults([]);
        setClientSearchError('Search failed. Try again.');
      } finally {
        if (active) {
          setClientSearchLoading(false);
        }
      }
    }

    run();
    return () => {
      active = false;
      controller.abort();
    };
  }, [clientSearchTerm, form.clientType]);

  const selectClient = (c) => {
    const display = c.name || c.email;
    setForm((f) => ({
      ...f,
      clientType: 'internal',
      clientUserId: c.id,
      clientName: display,
    }));
    setClientSearchTerm(display);
    setClientResults([]);
    setClientSearchError('');
  };

  const clearSelectedClient = () => {
    setForm((f) => ({
      ...f,
      clientUserId: null,
      clientName: '',
    }));
    setClientSearchTerm('');
    setClientResults([]);
    setClientSearchError('');
  };

  const openAdd = () => {
    setForm({
      date: localISODate(),
      time: '09:00',
      clientName: '',
      clientType: 'external',
      clientUserId: null,
      type: 'Strategy',
      status: 'Scheduled',
    });
    setClientSearchTerm('');
    setClientResults([]);
    setClientSearchError('');
    setModal({ open: true, mode: 'add', id: null });
  };

  const openEdit = (id) => {
    const s = sessions.find((x) => x.id === id);
    if (!s) return;

    const isInternal = !!s.clientId;

    setForm({
      date: s.date,
      time: s.time,
      clientName: s.client,
      clientType: isInternal ? 'internal' : 'external',
      clientUserId: isInternal ? s.clientId : null,
      type: s.type,
      status: s.status,
    });

    setClientSearchTerm(s.client || '');
    setClientResults([]);
    setClientSearchError('');
    setModal({ open: true, mode: 'edit', id });
  };

  // ---- Create ----
  const saveAdd = async (e) => {
    e.preventDefault();
    const name = (form.clientName || '').trim();

    if (form.clientType === 'internal') {
      if (!form.clientUserId) {
        alert('Please select a Forge contact for this client.');
        return;
      }
    } else {
      if (!name) {
        alert('Please enter a client name.');
        return;
      }
    }

    try {
      setSaving(true);
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: form.date,
          time: form.time,
          clientType: form.clientType,
          clientUserId:
            form.clientType === 'internal' ? form.clientUserId : null,
          clientName: name,
          type: form.type,
          status: form.status,
        }),
      });
      if (!res.ok) {
        console.error('Failed to create session', res.status);
        alert('Could not save session. Please try again.');
        return;
      }
      const data = await res.json().catch(() => ({}));
      const created = data.session || data;
      const [normalized] = normalizeSessions([created]);

      setSessions((prev) => {
        const next = [...prev, normalized];
        next.sort(
          (a, b) =>
            toLocalDateTime(a.date, a.time) -
            toLocalDateTime(b.date, b.time)
        );
        return next;
      });

      setModal({ open: false, mode: 'add', id: null });
    } catch (err) {
      console.error('Error creating session', err);
      alert('Could not save session. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ---- Update ----
  const saveEdit = async (e) => {
    e.preventDefault();
    if (!modal.id) return;

    const name = (form.clientName || '').trim();

    if (form.clientType === 'internal') {
      if (!form.clientUserId) {
        alert('Please select a Forge contact for this client.');
        return;
      }
    } else {
      if (!name) {
        alert('Please enter a client name.');
        return;
      }
    }

    try {
      setSaving(true);
      const res = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: modal.id,
          date: form.date,
          time: form.time,
          clientType: form.clientType,
          clientUserId:
            form.clientType === 'internal' ? form.clientUserId : null,
          clientName: name,
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
      const updated = data.session || data;
      const [normalized] = normalizeSessions([updated]);

      setSessions((prev) => {
        const next = prev.map((s) =>
          s.id === normalized.id ? normalized : s
        );
        next.sort(
          (a, b) =>
            toLocalDateTime(a.date, a.time) -
            toLocalDateTime(b.date, b.time)
        );
        return next;
      });

      setModal({ open: false, mode: 'add', id: null });
    } catch (err) {
      console.error('Error updating session', err);
      alert('Could not update session. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ---- Delete ----
  const deleteSession = async (id) => {
    if (!id) return;
    if (!confirm('Delete this session?')) return;

    try {
      setSaving(true);
      const res = await fetch(API_URL, {
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
      setModal({ open: false, mode: 'add', id: null });
    } catch (err) {
      console.error('Error deleting session', err);
      alert('Could not delete session. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <CoachingLayout
      title="Sessions | ForgeTomorrow"
      activeNav="sessions"
      headerDescription="Manage, add, and track your coaching sessions."
      right={<CoachingRightColumn />}
      sidebarInitialOpen={{ coaching: true, seeker: false }}
    >
      {/* Center column content */}
      <div
        style={{
          display: 'grid',
          gap: 20,
          width: '100%',
          maxWidth: 980,
          margin: '0 auto',
          paddingTop: 4,
        }}
      >
        {/* Filters + actions */}
        <section
          style={{
            background: 'linear-gradient(135deg,#FFFFFF,#F8FAFC)',
            borderRadius: 16,
            padding: 18,
            boxShadow: '0 14px 30px rgba(15,23,42,0.08)',
            border: '1px solid rgba(148,163,184,0.4)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) auto auto',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{
                border: '1px solid rgba(148,163,184,0.6)',
                borderRadius: 999,
                padding: '9px 14px',
                outline: 'none',
                background: 'white',
                fontSize: 13,
                color: '#0f172a',
                boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
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
                border: '1px solid rgba(148,163,184,0.6)',
                borderRadius: 999,
                padding: '9px 14px',
                outline: 'none',
                background: 'white',
                fontSize: 13,
                color: '#0f172a',
                boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="No-show">No-show</option>
            </select>

            <Link
              href="/dashboard/coaching/sessions/calendar"
              style={{
                color: '#FF7043',
                fontWeight: 700,
                fontSize: 13,
                textDecoration: 'none',
                justifySelf: 'flex-end',
                padding: '8px 12px',
                borderRadius: 999,
                background: 'rgba(255,112,67,0.06)',
                border: '1px solid rgba(255,112,67,0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>Calendar View</span>
              <span style={{ fontSize: 14 }}>↗</span>
            </Link>

            <button
              type="button"
              onClick={openAdd}
              style={{
                background: '#FF7043',
                color: 'white',
                border: 'none',
                borderRadius: 999,
                padding: '10px 16px',
                fontWeight: 700,
                cursor: 'pointer',
                justifySelf: 'end',
                fontSize: 13,
                boxShadow: '0 10px 20px rgba(255,112,67,0.35)',
              }}
            >
              + Add Session
            </button>
          </div>
        </section>

        {/* Agenda */}
        <section
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            padding: 20,
            boxShadow: '0 18px 40px rgba(15,23,42,0.10)',
            border: '1px solid rgba(148,163,184,0.45)',
          }}
        >
          <h2
            style={{
              color: '#112033',
              marginTop: 0,
              marginBottom: 10,
              fontSize: 20,
              letterSpacing: '0.01em',
            }}
          >
            Agenda
          </h2>
          <p
            style={{
              margin: 0,
              marginBottom: 12,
              fontSize: 13,
              color: '#6b7280',
            }}
          >
            A clear, time-ordered view of your upcoming coaching work.
          </p>

          {/* Header row with Actions column */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '90px 1fr 120px 120px 110px',
              gap: 10,
              padding: '8px 12px',
              background:
                'linear-gradient(135deg,rgba(17,32,51,0.96),rgba(15,23,42,0.96))',
              color: '#E5E7EB',
              fontSize: 11,
              borderRadius: 10,
              marginBottom: 8,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            <span>Time</span>
            <span>Name</span>
            <span>Topic</span>
            <span>Status</span>
            <span style={{ textAlign: 'right' }}>Actions</span>
          </div>

          {loading && (
            <div
              style={{
                color: '#9CA3AF',
                fontSize: 14,
                padding: '8px 2px',
              }}
            >
              Loading sessions…
            </div>
          )}

          {!loading &&
            orderedDates.map((d) => (
              <div key={d} style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: 6,
                    color: '#111827',
                    fontSize: 14,
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
                  {groups[d].map((s) => {
                    return (
                      <li
                        key={s.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns:
                            '90px 1fr 120px 120px 110px',
                          alignItems: 'center',
                          gap: 10,
                          borderRadius: 10,
                          padding: '9px 12px',
                          background:
                            'linear-gradient(135deg,#F9FAFB,#EFF6FF)',
                          border: '1px solid rgba(209,213,219,0.9)',
                        }}
                      >
                        <strong
                          style={{
                            fontSize: 13,
                            color: '#111827',
                          }}
                        >
                          {s.time}
                        </strong>
                        <span
                          style={{
                            color: '#374151',
                            fontSize: 13,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {s.client}
                        </span>
                        <span>{typePill(s.type)}</span>
                        <span>{badge(s.status)}</span>
                        <div
                          style={{
                            display: 'flex',
                            gap: 6,
                            justifyContent: 'flex-end',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => openEdit(s.id)}
                            style={{
                              background: 'rgba(255,112,67,0.06)',
                              color: '#D84315',
                              border: '1px solid rgba(255,112,67,0.5)',
                              borderRadius: 999,
                              padding: '5px 10px',
                              fontSize: 11,
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSession(s.id)}
                            style={{
                              background: '#FFFFFF',
                              color: '#B91C1C',
                              border: '1px solid rgba(248,113,113,0.9)',
                              borderRadius: 999,
                              padding: '5px 10px',
                              fontSize: 11,
                              cursor: 'pointer',
                              fontWeight: 600,
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

          {!loading && orderedDates.length === 0 && (
            <div
              style={{
                color: '#9CA3AF',
                fontSize: 14,
                paddingTop: 4,
              }}
            >
              <p style={{ margin: 0 }}>No sessions yet.</p>
              <p style={{ margin: '2px 0 0' }}>
                Use “+ Add Session” above to start your agenda. If you expected
                to see sessions, try adjusting your filters.
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
            background: 'rgba(15,23,42,0.60)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)',
          }}
        >
          <form
            onSubmit={modal.mode === 'add' ? saveAdd : saveEdit}
            style={{
              background: 'linear-gradient(135deg,#FFFFFF,#F9FAFB)',
              borderRadius: 16,
              padding: 22,
              width: 460,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              boxShadow: '0 24px 60px rgba(15,23,42,0.55)',
              border: '1px solid rgba(148,163,184,0.7)',
            }}
          >
            <h3
              style={{
                margin: 0,
                color: '#112033',
                fontSize: 18,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>
                {modal.mode === 'add' ? 'Add Session' : 'Edit Session'}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#9CA3AF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                }}
              >
                Coaching
              </span>
            </h3>

            <label style={{ fontSize: 13, color: '#4B5563' }}>
              <span style={{ display: 'block', marginBottom: 4 }}>Date</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => update('date', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  borderRadius: 10,
                  border: '1px solid rgba(148,163,184,0.9)',
                  fontSize: 13,
                }}
              />
            </label>
            <label style={{ fontSize: 13, color: '#4B5563' }}>
              <span style={{ display: 'block', marginBottom: 4 }}>Time</span>
              <input
                type="time"
                value={form.time}
                onChange={(e) => update('time', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  borderRadius: 10,
                  border: '1px solid rgba(148,163,184,0.9)',
                  fontSize: 13,
                }}
              />
            </label>

            {/* Client type toggle */}
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 4,
                  color: '#374151',
                }}
              >
                Client Type
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <label
                  style={{
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#111827',
                  }}
                >
                  <input
                    type="radio"
                    name="clientType"
                    value="internal"
                    checked={form.clientType === 'internal'}
                    onChange={() => {
                      update('clientType', 'internal');
                      update('clientUserId', null);
                      setClientSearchTerm(form.clientName || '');
                      setClientResults([]);
                      setClientSearchError('');
                    }}
                    style={{ marginRight: 0 }}
                  />
                  <span>Forge user (from my contacts)</span>
                </label>
                <label
                  style={{
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#111827',
                  }}
                >
                  <input
                    type="radio"
                    name="clientType"
                    value="external"
                    checked={form.clientType === 'external'}
                    onChange={() => {
                      update('clientType', 'external');
                      update('clientUserId', null);
                      setClientSearchTerm('');
                      setClientResults([]);
                      setClientSearchError('');
                    }}
                    style={{ marginRight: 0 }}
                  />
                  <span>External client (not in Forge)</span>
                </label>
              </div>
            </div>

            {/* Internal client search */}
            {form.clientType === 'internal' && (
              <div>
                <div
                  style={{
                    fontSize: 13,
                    marginBottom: 4,
                    fontWeight: 500,
                    color: '#374151',
                  }}
                >
                  Client (from your contacts)
                </div>
                <input
                  type="text"
                  placeholder="Type a name, email, or headline…"
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 8,
                    marginBottom: 4,
                    borderRadius: 10,
                    border: '1px solid rgba(148,163,184,0.9)',
                    fontSize: 13,
                  }}
                />
                {form.clientUserId && (
                  <div
                    style={{
                      fontSize: 12,
                      marginBottom: 4,
                      color: '#4B5563',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>Selected: {form.clientName || '(no name)'}</span>
                    <button
                      type="button"
                      onClick={clearSelectedClient}
                      style={{
                        fontSize: 11,
                        border: 'none',
                        background: 'transparent',
                        color: '#B91C1C',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      Clear
                    </button>
                  </div>
                )}
                {clientSearchLoading && (
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                    Searching…
                  </div>
                )}
                {clientSearchError && (
                  <div style={{ fontSize: 12, color: '#C62828' }}>
                    {clientSearchError}
                  </div>
                )}
                {clientResults.length > 0 && (
                  <ul
                    style={{
                      listStyle: 'none',
                      margin: '4px 0 0',
                      padding: 0,
                      maxHeight: 160,
                      overflowY: 'auto',
                      border: '1px solid #E5E7EB',
                      borderRadius: 10,
                      background: '#FFFFFF',
                    }}
                  >
                    {clientResults.map((r) => (
                      <li
                        key={r.id}
                        onClick={() => selectClient(r)}
                        style={{
                          padding: '7px 9px',
                          fontSize: 13,
                          cursor: 'pointer',
                          borderBottom: '1px solid #F3F4F6',
                        }}
                      >
                        <div style={{ fontWeight: 600, color: '#111827' }}>
                          {r.name}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: '#6B7280',
                          }}
                        >
                          {r.email}
                          {r.headline ? ` • ${r.headline}` : ''}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {clientResults.length === 0 &&
                  clientSearchTerm.trim() &&
                  !clientSearchLoading &&
                  !clientSearchError && (
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                      No contacts matched that search.
                    </div>
                  )}
              </div>
            )}

            {/* External client name input */}
            {form.clientType === 'external' && (
              <label style={{ fontSize: 13, color: '#4B5563' }}>
                <span style={{ display: 'block', marginBottom: 4 }}>
                  Client Name
                </span>
                <input
                  type="text"
                  value={form.clientName}
                  onChange={(e) => update('clientName', e.target.value)}
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 10,
                    border: '1px solid rgba(148,163,184,0.9)',
                    fontSize: 13,
                  }}
                  placeholder="e.g. John Doe (Acme Corp)"
                />
              </label>
            )}

            <label style={{ fontSize: 13, color: '#4B5563' }}>
              <span style={{ display: 'block', marginBottom: 4 }}>Type</span>
              <select
                value={form.type}
                onChange={(e) => update('type', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  borderRadius: 10,
                  border: '1px solid rgba(148,163,184,0.9)',
                  fontSize: 13,
                }}
              >
                <option value="Strategy">Strategy</option>
                <option value="Resume">Resume</option>
                <option value="Interview">Interview</option>
              </select>
            </label>
            <label style={{ fontSize: 13, color: '#4B5563' }}>
              <span style={{ display: 'block', marginBottom: 4 }}>Status</span>
              <select
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  borderRadius: 10,
                  border: '1px solid rgba(148,163,184,0.9)',
                  fontSize: 13,
                }}
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
                alignItems: 'center',
              }}
            >
              {modal.mode === 'edit' && (
                <button
                  type="button"
                  onClick={() => deleteSession(modal.id)}
                  style={{
                    background: 'white',
                    color: '#B91C1C',
                    border: '1px solid rgba(248,113,113,0.9)',
                    borderRadius: 999,
                    padding: '9px 14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                  disabled={saving}
                >
                  Delete
                </button>
              )}
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <button
                  type="submit"
                  style={{
                    background: '#FF7043',
                    color: 'white',
                    border: 'none',
                    borderRadius: 999,
                    padding: '9px 16px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: 13,
                    boxShadow: '0 12px 26px rgba(255,112,67,0.45)',
                  }}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setModal({ open: false, mode: 'add', id: null })
                  }
                  style={{
                    background: 'white',
                    color: '#FF7043',
                    border: '1px solid rgba(255,112,67,0.8)',
                    borderRadius: 999,
                    padding: '9px 16px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                  disabled={saving}
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
