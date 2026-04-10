// components/coaching/modules/SessionsModule.js
//
// Extracted from pages/dashboard/coaching/sessions.js.
// Renders inline — no CoachingLayout, no page wrapper.
// Used by:
//   - pages/dashboard/coaching/client-hub-update.js (inline in hub)
//   - pages/dashboard/coaching/sessions.js          (thin page wrapper)

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CoachSessionEditor from '@/components/calendar/CoachSessionEditor';

const API_URL = '/api/coaching/sessions';

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const ORANGE_HEADING_LIFT = {
  textShadow: '0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)',
  fontWeight: 900,
};

// ─── Date helpers ─────────────────────────────────────────────────────────────
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

function normalizeSessions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => {
    const date = s.date || s.sessionDate || null;
    const time = s.time || s.sessionTime || null;
    const client = s.client || s.clientName || s.client_name || '';
    let finalDate = date;
    let finalTime = time;
    if (!finalDate || !finalTime) {
      const start = s.startAt || s.start_at;
      if (start) {
        const dt = new Date(start);
        finalDate = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
        finalTime = `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
      }
    }
    const clientId = typeof s.clientId === 'string' && s.clientId.length > 0 ? s.clientId : s.clientUserId || null;
    const clientType = s.clientType === 'internal' || s.clientType === 'external' ? s.clientType : clientId ? 'internal' : 'external';
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

// ─── Badges ───────────────────────────────────────────────────────────────────
function StatusBadge({ text }) {
  const map = {
    Scheduled: { bg: '#E3F2FD', fg: '#1565C0' },
    Completed: { bg: '#E8F5E9', fg: '#2E7D32' },
    'No-show': { bg: '#FDECEA', fg: '#C62828' },
  };
  const { bg, fg } = map[text] || { bg: '#FFF3E0', fg: '#E65100' };
  return (
    <span style={{ fontSize: 11, background: bg, color: fg, padding: '3px 9px', borderRadius: 999, whiteSpace: 'nowrap', border: '1px solid rgba(148,163,184,0.3)' }}>
      {text}
    </span>
  );
}

function TypePill({ text }) {
  return (
    <span style={{ fontSize: 11, background: 'rgba(255,112,67,0.08)', color: '#FF7043', padding: '3px 8px', borderRadius: 999, lineHeight: 1.2, display: 'inline-block', whiteSpace: 'nowrap', border: '1px solid rgba(255,112,67,0.35)' }}>
      {text}
    </span>
  );
}

// ─── Module ───────────────────────────────────────────────────────────────────
export default function SessionsModule() {
  const [typeFilter, setTypeFilter]   = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sessions, setSessions]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);

  const [editorOpen, setEditorOpen]     = useState(false);
  const [editorMode, setEditorMode]     = useState('add');
  const [editorInitial, setEditorInitial] = useState(null);
  const [editingId, setEditingId]       = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res  = await fetch(API_URL);
        if (!res.ok) { if (!cancelled) setSessions([]); return; }
        const data = await res.json().catch(() => ({}));
        const raw  = Array.isArray(data) ? data : data.sessions || [];
        const norm = normalizeSessions(raw);
        if (!cancelled) {
          norm.sort((a, b) => toLocalDateTime(a.date, a.time) - toLocalDateTime(b.date, b.time));
          setSessions(norm);
        }
      } catch { if (!cancelled) setSessions([]); }
      finally  { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => sessions.filter((s) => {
    const byType   = typeFilter   === 'All' ? true : s.type   === typeFilter;
    const byStatus = statusFilter === 'All' ? true : s.status === statusFilter;
    return byType && byStatus;
  }), [sessions, typeFilter, statusFilter]);

  const groups = useMemo(() => {
    const g = filtered.reduce((acc, s) => { (acc[s.date] = acc[s.date] || []).push(s); return acc; }, {});
    Object.keys(g).forEach((k) => g[k].sort((a, b) => toLocalDateTime(a.date, a.time) - toLocalDateTime(b.date, b.time)));
    return g;
  }, [filtered]);

  const orderedDates = Object.keys(groups).sort();

  const friendlyLabel = (iso) => {
    const todayISO    = localISODate();
    const tomorrowISO = localISODate(new Date(Date.now() + 86400000));
    if (iso === todayISO)    return 'Today';
    if (iso === tomorrowISO) return 'Tomorrow';
    const [yy, mm, dd] = iso.split('-').map(Number);
    return new Date(yy || 1970, (mm || 1) - 1, dd || 1).toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' });
  };

  const openAdd = () => {
    setEditorMode('add');
    setEditingId(null);
    setEditorInitial({ date: localISODate(), time: '09:00', clientType: 'external', clientUserId: null, clientName: '', type: 'Strategy', status: 'Scheduled', notes: '' });
    setEditorOpen(true);
  };

  const openEdit = (id) => {
    const s = sessions.find((x) => x.id === id);
    if (!s) return;
    const clientUserId = s.clientId || null;
    const clientType   = s.clientType === 'internal' || s.clientType === 'external' ? s.clientType : clientUserId ? 'internal' : 'external';
    setEditorMode('edit');
    setEditingId(id);
    setEditorInitial({ date: s.date, time: s.time, clientType, clientUserId, clientName: s.client || '', type: s.type, status: s.status, notes: s.notes || '' });
    setEditorOpen(true);
  };

  const closeEditor = () => { if (saving) return; setEditorOpen(false); setEditorInitial(null); setEditingId(null); setEditorMode('add'); };

  const handleSave = async (form) => {
    const name = (form.clientName || '').trim();
    if (!form.date || !form.time) { alert('Date and time are required.'); return; }
    if (form.clientType === 'internal' && !form.clientUserId) { alert('Please select a Forge contact.'); return; }
    if (form.clientType === 'external' && !name) { alert('Please enter a client name.'); return; }
    const payload = { date: form.date, time: form.time, clientType: form.clientType, clientUserId: form.clientType === 'internal' ? form.clientUserId : null, clientName: name, type: form.type, status: form.status, notes: form.notes || '' };
    try {
      setSaving(true);
      const method = editorMode === 'edit' && editingId ? 'PUT' : 'POST';
      const res    = await fetch(API_URL, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(method === 'PUT' ? { id: editingId, ...payload } : payload) });
      if (!res.ok) { alert('Could not save session. Please try again.'); return; }
      const data = await res.json().catch(() => ({}));
      const [norm] = normalizeSessions([data.session || data]);
      setSessions((prev) => {
        let next = method === 'PUT' ? prev.map((s) => s.id === norm.id ? { ...s, ...norm } : s) : [...prev, norm];
        next.sort((a, b) => toLocalDateTime(a.date, a.time) - toLocalDateTime(b.date, b.time));
        return next;
      });
      closeEditor();
    } catch { alert('Could not save session. Please try again.'); }
    finally { setSaving(false); }
  };

  const deleteSession = async (id) => {
    if (!id || !confirm('Delete this session?')) return;
    try {
      setSaving(true);
      const res = await fetch(API_URL, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!res.ok) { alert('Could not delete session. Please try again.'); return; }
      setSessions((prev) => prev.filter((s) => s.id !== id));
      closeEditor();
    } catch { alert('Could not delete session. Please try again.'); }
    finally { setSaving(false); }
  };

  const selectStyle = {
    border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10, padding: '8px 12px',
    outline: 'none', background: 'rgba(255,255,255,0.9)', fontSize: 13,
    color: '#37474F', fontFamily: 'inherit',
  };

  return (
    <>
      <div style={{ display: 'grid', gap: 14 }}>

        {/* Filters + actions */}
        <div style={{ ...GLASS, padding: '14px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) auto auto', gap: 12, alignItems: 'center' }}>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={selectStyle}>
              <option value="All">All Types</option>
              <option value="Strategy">Strategy</option>
              <option value="Resume">Resume</option>
              <option value="Interview">Interview</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
              <option value="All">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="No-show">No-show</option>
            </select>
            <Link
              href="/dashboard/coaching/sessions/calendar"
              style={{ color: '#FF7043', fontWeight: 700, fontSize: 12, textDecoration: 'none', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,112,67,0.06)', border: '1px solid rgba(255,112,67,0.25)', display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
            >
              Calendar View ↗
            </Link>
            <button
              type="button"
              onClick={openAdd}
              style={{ background: '#FF7043', color: 'white', border: 'none', borderRadius: 999, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap', fontFamily: 'inherit', boxShadow: '0 6px 16px rgba(255,112,67,0.30)' }}
            >
              + Add Session
            </button>
          </div>
        </div>

        {/* Agenda */}
        <div style={{ ...GLASS, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 18, color: '#FF7043', ...ORANGE_HEADING_LIFT }}>Agenda</div>
            <div style={{ fontSize: 12, color: '#90A4AE' }}>{filtered.length} {filtered.length === 1 ? 'session' : 'sessions'}</div>
          </div>

          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 110px 110px 100px', gap: 10, padding: '8px 12px', background: 'linear-gradient(135deg,rgba(17,32,51,0.96),rgba(15,23,42,0.96))', color: '#E5E7EB', fontSize: 11, borderRadius: 10, marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <span>Time</span><span>Client</span><span>Topic</span><span>Status</span><span style={{ textAlign: 'right' }}>Actions</span>
          </div>

          {loading && <div style={{ color: '#90A4AE', fontSize: 13, padding: '8px 0' }}>Loading sessions…</div>}

          {!loading && orderedDates.map((d) => (
            <div key={d} style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 6, color: '#112033', fontSize: 13 }}>{friendlyLabel(d)}</div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
                {groups[d].map((s) => (
                  <li key={s.id} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 110px 110px 100px', alignItems: 'center', gap: 10, borderRadius: 10, padding: '9px 12px', background: 'linear-gradient(135deg,#F9FAFB,#EFF6FF)', border: '1px solid rgba(209,213,219,0.9)' }}>
                    <strong style={{ fontSize: 13, color: '#112033' }}>{s.time}</strong>
                    <span style={{ color: '#374151', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.client}</span>
                    <span><TypePill text={s.type} /></span>
                    <span><StatusBadge text={s.status} /></span>
                    <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => openEdit(s.id)} style={{ background: 'rgba(255,112,67,0.06)', color: '#D84315', border: '1px solid rgba(255,112,67,0.5)', borderRadius: 999, padding: '4px 9px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>Edit</button>
                      <button type="button" onClick={() => deleteSession(s.id)} style={{ background: '#FFFFFF', color: '#B91C1C', border: '1px solid rgba(248,113,113,0.9)', borderRadius: 999, padding: '4px 9px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {!loading && orderedDates.length === 0 && (
            <div style={{ padding: '32px 0', textAlign: 'center', color: '#90A4AE', fontSize: 13 }}>
              <p style={{ margin: 0 }}>No sessions yet.</p>
              <p style={{ margin: '4px 0 0' }}>Use "+ Add Session" above to start your agenda.</p>
            </div>
          )}
        </div>
      </div>

      {editorOpen && (
        <CoachSessionEditor
          mode={editorMode}
          initial={editorInitial}
          onClose={closeEditor}
          onSaved={handleSave}
          onDeleted={() => deleteSession(editingId)}
        />
      )}
    </>
  );
}