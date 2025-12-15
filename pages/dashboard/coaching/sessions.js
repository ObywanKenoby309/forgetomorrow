// pages/dashboard/coaching/sessions.js
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingRightColumn from '@/components/coaching/CoachingRightColumn';
import CoachingCalendarEventForm from '@/components/calendar/CoachingCalendarEventForm';

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
        : s.clientUserId || null;

    const clientTypeExplicit =
      s.clientType === 'internal' || s.clientType === 'external'
        ? s.clientType
        : null;

    const clientType =
      clientTypeExplicit ||
      (clientId ? 'internal' : 'external');

    return {
      id: s.id,
      date: finalDate || localISODate(),
      time: finalTime || '09:00',
      client,
      type: s.type || 'Strategy',
      status: s.status || 'Scheduled',
      clientId,
      clientType,
      notes: s.notes || '',
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

  // Editor modal state (shared UI with calendar)
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('add'); // 'add' | 'edit'
  const [editorInitial, setEditorInitial] = useState(null);
  const [editingId, setEditingId] = useState(null);

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

  // ---------- Editor helpers (shared layout with calendar) ----------
  const openAdd = () => {
    setEditorMode('add');
    setEditingId(null);
    setEditorInitial({
      date: localISODate(),
      time: '09:00',
      clientType: 'external',
      clientUserId: null,
      clientName: '',
      type: 'Strategy',
      status: 'Scheduled',
      notes: '',
    });
    setEditorOpen(true);
  };

  const openEdit = (id) => {
    const s = sessions.find((x) => x.id === id);
    if (!s) return;

    const clientUserId = s.clientId || null;
    const clientType =
      s.clientType === 'internal' || s.clientType === 'external'
        ? s.clientType
        : clientUserId
        ? 'internal'
        : 'external';

    setEditorMode('edit');
    setEditingId(id);
    setEditorInitial({
      date: s.date,
      time: s.time,
      clientType,
      clientUserId,
      clientName: s.client || '',
      type: s.type,
      status: s.status,
      notes: s.notes || '',
    });
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (saving) return;
    setEditorOpen(false);
    setEditorInitial(null);
    setEditingId(null);
    setEditorMode('add');
  };

  // ---- Create / Update via shared form ----
  const handleSave = async (form) => {
    const name = (form.clientName || '').trim();

    if (!form.date || !form.time) {
      alert('Date and time are required.');
      return;
    }

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

    const payloadBase = {
      date: form.date,
      time: form.time,
      clientType: form.clientType,
      clientUserId:
        form.clientType === 'internal' ? form.clientUserId : null,
      clientName: name,
      type: form.type,
      status: form.status,
      notes: form.notes || '',
    };

    try {
      setSaving(true);

      const method =
        editorMode === 'edit' && editingId ? 'PUT' : 'POST';

      const res = await fetch(API_URL, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          method === 'PUT'
            ? { id: editingId, ...payloadBase }
            : payloadBase
        ),
      });

      if (!res.ok) {
        console.error(
          'Failed to save session',
          res.status,
          await res.text().catch(() => '')
        );
        alert('Could not save session. Please try again.');
        return;
      }

      const data = await res.json().catch(() => ({}));
      const saved = data.session || data;
      const [normalized] = normalizeSessions([saved]);

      setSessions((prev) => {
        let next;
        if (method === 'PUT') {
          next = prev.map((s) =>
            s.id === normalized.id ? { ...s, ...normalized } : s
          );
        } else {
          next = [...prev, normalized];
        }
        next.sort(
          (a, b) =>
            toLocalDateTime(a.date, a.time) -
            toLocalDateTime(b.date, b.time)
        );
        return next;
      });

      closeEditor();
    } catch (err) {
      console.error('Error saving session', err);
      alert('Could not save session. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ---- Delete (from list or modal) ----
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
      closeEditor();
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
                  {groups[d].map((s) => (
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
                  ))}
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
                Use “+ Add Session” above to start your agenda. If you
                expected to see sessions, try adjusting your filters.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Shared editor modal (same layout as calendar) */}
      {editorOpen && (
        <CoachingCalendarEventForm
          mode={editorMode}
          initial={editorInitial}
          onClose={closeEditor}
          onSave={handleSave}
          onDelete={
            editorMode === 'edit'
              ? () => deleteSession(editingId)
              : undefined
          }
          typeChoices={['Strategy', 'Resume', 'Interview']}
          statusChoices={['Scheduled', 'Completed', 'No-show']}
          saving={saving}
        />
      )}
    </CoachingLayout>
  );
}
