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
        const res = await fetch(
          `/api/coaching/client-search?q=${encodeURIComponent(term)}`,
          { signal: controller.signal }
        );
        if (!res.ok) {
          if (!active) return;
          setClientResults([]);
          setClientSearchError('Search failed. Try again.');
          return;
        }
        const data = await res.json().catch(() => ({}));
        const results = Array.isArray(data.results) ? data.results : [];
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
          <h2
            style={{
              color: '#FF7043',
              marginTop: 0,
              marginBottom: 12,
            }}
          >
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
                          onClick={() => openEdit(s.id)}
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
              width: 440,
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

            {/* Client type toggle */}
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Client Type
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="clientType"
                    value="internal"
                    checked={form.clientType === 'internal'}
                    onChange={() => {
                      update('clientType', 'internal');
                      // When switching to internal, clear external-only fields
                      update('clientUserId', null);
                      setClientSearchTerm(form.clientName || '');
                      setClientResults([]);
                      setClientSearchError('');
                    }}
                    style={{ marginRight: 6 }}
                  />
                  Forge user (from my contacts)
                </label>
                <label style={{ fontSize: 13, cursor: 'pointer' }}>
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
                    style={{ marginRight: 6 }}
                  />
                  External client (not in Forge)
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
                  }}
                >
                  Client (from your contacts)
                </div>
                <input
                  type="text"
                  placeholder="Type a name, email, or headline…"
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: 6, marginBottom: 4 }}
                />
                {form.clientUserId && (
                  <div
                    style={{
                      fontSize: 12,
                      marginBottom: 4,
                      color: '#455A64',
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
                        color: '#C62828',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      Clear
                    </button>
                  </div>
                )}
                {clientSearchLoading && (
                  <div style={{ fontSize: 12, color: '#90A4AE' }}>
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
                      border: '1px solid #eee',
                      borderRadius: 8,
                    }}
                  >
                    {clientResults.map((r) => (
                      <li
                        key={r.id}
                        onClick={() => selectClient(r)}
                        style={{
                          padding: '6px 8px',
                          fontSize: 13,
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{r.name}</div>
                        <div
                          style={{
                            fontSize: 12,
                            color: '#607D8B',
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
                    <div style={{ fontSize: 12, color: '#90A4AE' }}>
                      No contacts matched that search.
                    </div>
                  )}
              </div>
            )}

            {/* External client name input */}
            {form.clientType === 'external' && (
              <label>
                Client Name:
                <input
                  type="text"
                  value={form.clientName}
                  onChange={(e) => update('clientName', e.target.value)}
                  style={{ width: '100%', padding: 6 }}
                  placeholder="e.g. John Doe (Acme Corp)"
                />
              </label>
            )}

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
                  onClick={() => deleteSession(modal.id)}
                  style={{
                    background: 'white',
                    color: '#C62828',
                    border: '1px solid #C62828',
                    borderRadius: 10,
                    padding: '10px 12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  disabled={saving}
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
                    border: '1px solid #FF7043',
                    borderRadius: 10,
                    padding: '10px 12px',
                    fontWeight: 700,
                    cursor: 'pointer',
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
