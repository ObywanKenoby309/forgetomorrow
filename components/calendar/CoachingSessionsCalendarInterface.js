// components/calendar/CoachingSessionsCalendarInterface.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import CoachingCalendarEventForm from './CoachingCalendarEventForm';

const WEEKDAYS       = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MAX_PER_DAY    = 3;

/* ─────────────────────────────
   Date helpers
───────────────────────────── */
function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}
function fmtYMD(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fmtDayLabel(dateStr) {
  const d        = new Date(dateStr + 'T00:00:00');
  const today    = fmtYMD(new Date());
  const tomorrow = fmtYMD(new Date(Date.now() + 86400000));
  if (dateStr === today)    return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

/* ─────────────────────────────
   Event type colors  (coach palette)
   Strategy  → orange (primary brand)
   Resume    → steel blue
   Interview → dark slate
───────────────────────────── */
function typeColors(type) {
  const t = (type || '').toLowerCase();
  if (t === 'strategy')  return { strip: '#FF7043', pillBg: '#FFF3E0', pillFg: '#E65100' };
  if (t === 'resume')    return { strip: '#546E7A', pillBg: '#ECEFF1', pillFg: '#37474F' };
  if (t === 'interview') return { strip: '#455A64', pillBg: '#E0E0E0', pillFg: '#263238' };
  return                        { strip: '#90A4AE', pillBg: '#F5F7FB', pillFg: '#455A64' };
}

/* ─────────────────────────────
   SSR-safe mobile hook
───────────────────────────── */
function useIsMobile(bp = 768) {
  const [val, setVal] = useState(null);
  useEffect(() => {
    const check = () => setVal(window.innerWidth < bp);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [bp]);
  return val;
}

/* ─────────────────────────────
   MiniMonth picker
───────────────────────────── */
function MiniMonth({ cursor, setCursor, selectedDate, onSelectDate, eventsByDate }) {
  const days = useMemo(() => {
    const first     = startOfMonth(cursor);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return { date: d, inMonth: d.getMonth() === cursor.getMonth(), key: fmtYMD(d) };
    });
  }, [cursor]);

  const todayStr  = fmtYMD(new Date());
  const monthName = cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div style={{
      background: 'rgba(255,255,255,0.95)',
      borderRadius: 16,
      padding: '14px 16px 10px',
      border: '1px solid rgba(255,112,67,0.15)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={() => setCursor(c => addMonths(c, -1))}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#607D8B', padding: '0 6px', lineHeight: 1 }}>
          ‹
        </button>
        <span style={{ fontWeight: 800, fontSize: 15, color: '#112033' }}>{monthName}</span>
        <button onClick={() => setCursor(c => addMonths(c, 1))}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#607D8B', padding: '0 6px', lineHeight: 1 }}>
          ›
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
        {WEEKDAYS_SHORT.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#90A4AE', textTransform: 'uppercase' }}>{d}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {days.map(({ key, date, inMonth }) => {
          const isToday    = key === todayStr;
          const isSelected = key === selectedDate;
          const hasEvents  = (eventsByDate[key] || []).length > 0;
          return (
            <button key={key} onClick={() => onSelectDate(key)}
              style={{
                background: isSelected ? '#FF7043' : isToday ? 'rgba(255,112,67,0.12)' : 'transparent',
                border: isToday && !isSelected ? '1px solid rgba(255,112,67,0.40)' : '1px solid transparent',
                borderRadius: 8, padding: '5px 0', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              }}>
              <span style={{
                fontSize: 12, fontWeight: isToday || isSelected ? 800 : 500,
                color: isSelected ? 'white' : isToday ? '#FF7043' : inMonth ? '#112033' : '#C5CAD0',
              }}>
                {date.getDate()}
              </span>
              {hasEvents && (
                <span style={{
                  width: 4, height: 4, borderRadius: 999,
                  background: isSelected ? 'rgba(255,255,255,0.8)' : '#FF7043',
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────
   AgendaEventRow
───────────────────────────── */
function AgendaEventRow({ session, onEdit }) {
  const { strip, pillBg, pillFg } = typeColors(session.type);

  return (
    <button onClick={() => session.id && onEdit(session.id)}
      style={{
        width: '100%', textAlign: 'left',
        background: 'rgba(255,255,255,0.95)',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 12, padding: '12px 14px 12px 0',
        cursor: 'pointer', display: 'flex', alignItems: 'stretch', gap: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
      <div style={{ width: 4, borderRadius: '4px 0 0 4px', background: strip, flexShrink: 0, marginRight: 12 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: '#112033',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session.client || 'Client'}
          </span>
          <span style={{ fontSize: 12, color: '#607D8B', flexShrink: 0, fontWeight: 600 }}>
            {session.time || ''}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {session.type && (
            <span style={{ fontSize: 11, background: pillBg, color: pillFg,
              padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
              {session.type}
            </span>
          )}
          {session.status && session.status !== 'Scheduled' && (
            <span style={{ fontSize: 11, background: '#F5F7F9', color: '#90A4AE',
              padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
              {session.status}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ─────────────────────────────
   AgendaView
───────────────────────────── */
function AgendaView({ sessions, selectedDate, onEdit }) {
  const agendaDays = useMemo(() => {
    const start = new Date(selectedDate + 'T00:00:00');
    return Array.from({ length: 60 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return fmtYMD(d);
    });
  }, [selectedDate]);

  const sessionsByDate = useMemo(() => {
    const map = {};
    for (const s of sessions) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [sessions]);

  const activeDays = useMemo(() =>
    agendaDays.filter(d => d === selectedDate || (sessionsByDate[d] || []).length > 0),
    [agendaDays, selectedDate, sessionsByDate]);

  if (activeDays.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🗓</div>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#112033', marginBottom: 8 }}>No sessions scheduled</div>
        <p style={{ color: '#607D8B', fontSize: 14, margin: '0 0 20px' }}>Add a session to get started.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {activeDays.map(dateStr => {
        const list       = sessionsByDate[dateStr] || [];
        const isToday    = dateStr === fmtYMD(new Date());
        const isSelected = dateStr === selectedDate;
        return (
          <div key={dateStr}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
              position: 'sticky', top: 0, zIndex: 10,
              background: 'linear-gradient(to bottom,rgba(236,239,241,1) 80%,rgba(236,239,241,0))',
              paddingTop: 4, paddingBottom: 8,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 999, flexShrink: 0,
                background: isToday ? '#FF7043' : isSelected ? 'rgba(255,112,67,0.15)' : 'rgba(0,0,0,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 13,
                color: isToday ? 'white' : isSelected ? '#FF7043' : '#455A64',
              }}>
                {new Date(dateStr + 'T00:00:00').getDate()}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: isToday ? '#FF7043' : '#112033' }}>
                  {fmtDayLabel(dateStr)}
                </div>
                {list.length > 0 && (
                  <div style={{ fontSize: 11, color: '#90A4AE', fontWeight: 600 }}>
                    {list.length} session{list.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
            {list.length === 0 ? (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                borderRadius: 10, fontSize: 13, color: '#546E7A',
                fontStyle: 'italic', fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.50)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}>
                No sessions — tap + to add one
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {list.map(s => <AgendaEventRow key={s.id || `${dateStr}-${s.time}`} session={s} onEdit={onEdit} />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────
   WeekView
───────────────────────────── */
function WeekView({ sessions, selectedDate, onSelectDate, onEdit }) {
  const weekDays = useMemo(() => {
    const d     = new Date(selectedDate + 'T00:00:00');
    const start = new Date(d);
    start.setDate(d.getDate() - d.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return { key: fmtYMD(day), date: day };
    });
  }, [selectedDate]);

  const sessionsByDate = useMemo(() => {
    const map = {};
    for (const s of sessions) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [sessions]);

  const todayStr = fmtYMD(new Date());

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 16 }}>
        {weekDays.map(({ key, date }) => {
          const isToday    = key === todayStr;
          const isSelected = key === selectedDate;
          const hasItems   = (sessionsByDate[key] || []).length > 0;
          return (
            <button key={key} onClick={() => onSelectDate(key)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '8px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: isSelected ? '#FF7043' : isToday ? 'rgba(255,112,67,0.10)' : 'rgba(255,255,255,0.80)',
                boxShadow: isSelected ? '0 4px 12px rgba(255,112,67,0.30)' : '0 1px 4px rgba(0,0,0,0.06)',
              }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                color: isSelected ? 'rgba(255,255,255,0.8)' : '#90A4AE' }}>
                {WEEKDAYS_SHORT[date.getDay()]}
              </span>
              <span style={{ fontSize: 15, fontWeight: 800,
                color: isSelected ? 'white' : isToday ? '#FF7043' : '#112033' }}>
                {date.getDate()}
              </span>
              {hasItems && (
                <span style={{ width: 4, height: 4, borderRadius: 999,
                  background: isSelected ? 'rgba(255,255,255,0.8)' : '#FF7043' }} />
              )}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(sessionsByDate[selectedDate] || []).length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '24px 20px',
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            borderRadius: 14, border: '1px solid rgba(255,255,255,0.50)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            color: '#546E7A', fontSize: 14, fontWeight: 600,
          }}>
            No sessions on this day
          </div>
        ) : (
          (sessionsByDate[selectedDate] || []).map(s => (
            <AgendaEventRow key={s.id || `${selectedDate}-${s.time}`} session={s} onEdit={onEdit} />
          ))
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────
   MobileCalendar wrapper
───────────────────────────── */
function MobileCalendar({ sessions, cursor, setCursor, onAdd, onEdit }) {
  const [mobileView, setMobileView]     = useState('agenda');
  const [selectedDate, setSelectedDate] = useState(fmtYMD(new Date()));

  const sessionsByDate = useMemo(() => {
    const map = {};
    for (const s of sessions) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [sessions]);

  const views = [
    { key: 'agenda', label: 'Agenda' },
    { key: 'week',   label: 'Week'   },
    { key: 'month',  label: 'Month'  },
  ];

  return (
    <div style={{ position: 'relative' }}>
      {/* View toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.70)',
          borderRadius: 999, padding: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
          {views.map(v => (
            <button key={v.key} onClick={() => setMobileView(v.key)}
              style={{
                padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                fontWeight: 800, fontSize: 12,
                background: mobileView === v.key ? '#FF7043' : 'transparent',
                color: mobileView === v.key ? 'white' : '#607D8B',
                boxShadow: mobileView === v.key ? '0 2px 8px rgba(255,112,67,0.30)' : 'none',
                transition: 'all 150ms ease',
              }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mini month — always visible */}
      <MiniMonth
        cursor={cursor} setCursor={setCursor}
        selectedDate={selectedDate} onSelectDate={setSelectedDate}
        eventsByDate={sessionsByDate}
      />

      {/* View content */}
      {mobileView === 'agenda' && (
        <AgendaView sessions={sessions} selectedDate={selectedDate} onEdit={onEdit} />
      )}
      {mobileView === 'week' && (
        <WeekView sessions={sessions} selectedDate={selectedDate}
          onSelectDate={setSelectedDate} onEdit={onEdit} />
      )}
      {mobileView === 'month' && (
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#112033', marginBottom: 10 }}>
            {fmtDayLabel(selectedDate)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(sessionsByDate[selectedDate] || []).length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '20px',
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                borderRadius: 12, border: '1px solid rgba(255,255,255,0.50)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                color: '#546E7A', fontSize: 14, fontWeight: 600,
              }}>
                No sessions on this day
              </div>
            ) : (
              (sessionsByDate[selectedDate] || []).map(s => (
                <AgendaEventRow key={s.id || `${selectedDate}-${s.time}`} session={s} onEdit={onEdit} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Floating add button */}
      <button onClick={() => onAdd(selectedDate)} style={{
        position: 'fixed', bottom: 100, right: 20, zIndex: 40,
        width: 52, height: 52, borderRadius: 999,
        background: '#FF7043', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(255,112,67,0.45)',
        fontSize: 26, color: 'white',
      }}>
        +
      </button>
    </div>
  );
}

/* ─────────────────────────────
   Main export
───────────────────────────── */
export default function CoachingSessionsCalendarInterface({
  title = 'Sessions Calendar',
  events = [],
  onRefresh,
}) {
  const isMobile = useIsMobile(768);

  const [cursor, setCursor]           = useState(() => startOfMonth(new Date()));
  const [editorOpen, setEditorOpen]   = useState(false);
  const [editorMode, setEditorMode]   = useState('add');
  const [editorInitial, setEditorInitial] = useState(null);
  const [editingId, setEditingId]     = useState(null);
  const [saving, setSaving]           = useState(false);

  const todayStr  = fmtYMD(new Date());
  const monthName = useMemo(() =>
    cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' }), [cursor]);

  /* ── open helpers ── */
  const openAdd = useCallback((dateKey) => {
    setEditorMode('add');
    setEditingId(null);
    setEditorInitial({
      date: dateKey || todayStr,
      time: '09:00',
      clientType: 'external',
      clientUserId: null,
      clientName: '',
      type: 'Strategy',
      status: 'Scheduled',
      notes: '',
    });
    setEditorOpen(true);
  }, [todayStr]);

  const openEditById = useCallback((id) => {
    const s = events.find(ev => ev.id === id);
    if (!s) return;
    const clientUserId       = s.clientUserId || s.clientId || null;
    const clientTypeExplicit = s.clientType === 'internal' || s.clientType === 'external' ? s.clientType : null;
    const clientType         = clientTypeExplicit || (clientUserId ? 'internal' : 'external');
    setEditorMode('edit');
    setEditingId(s.id);
    setEditorInitial({
      date: s.date, time: s.time,
      clientType, clientUserId,
      clientName: s.client || s.clientName || '',
      type: s.type, status: s.status, notes: s.notes || '',
    });
    setEditorOpen(true);
  }, [events]);

  const openEditFromSession = useCallback((s) => {
    const clientUserId       = s.clientUserId || s.clientId || null;
    const clientTypeExplicit = s.clientType === 'internal' || s.clientType === 'external' ? s.clientType : null;
    const clientType         = clientTypeExplicit || (clientUserId ? 'internal' : 'external');
    setEditorMode('edit');
    setEditingId(s.id);
    setEditorInitial({
      date: s.date, time: s.time,
      clientType, clientUserId,
      clientName: s.client || s.clientName || '',
      type: s.type, status: s.status, notes: s.notes || '',
    });
    setEditorOpen(true);
  }, []);

  const closeEditor = () => {
    if (saving) return;
    setEditorOpen(false);
    setEditorInitial(null);
    setEditingId(null);
    setEditorMode('add');
  };

  /* ── save / delete ── */
  const saveSession = async (form) => {
    if (!form.date || !form.time) {
      alert('Date and time are required.');
      return;
    }
    const name = (form.clientName || '').trim();
    if (form.clientType === 'internal') {
      if (!form.clientUserId) { alert('Please select a Forge contact for this client.'); return; }
    } else {
      if (!name) { alert('Please enter a client name.'); return; }
    }
    const payloadBase = {
      date: form.date, time: form.time,
      clientType: form.clientType,
      clientUserId: form.clientType === 'internal' ? form.clientUserId : null,
      clientName: name, type: form.type, status: form.status, notes: form.notes || '',
    };
    try {
      setSaving(true);
      const method = editorMode === 'edit' && editingId ? 'PUT' : 'POST';
      const res = await fetch('/api/coaching/sessions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(method === 'PUT' ? { id: editingId, ...payloadBase } : payloadBase),
      });
      if (!res.ok) {
        console.error('Failed to save coaching session (calendar)', res.status, await res.text().catch(() => ''));
        alert('Could not save session. Please try again.');
        return;
      }
    } catch (err) {
      console.error('Error saving coaching session (calendar):', err);
      alert('Could not save session. Please try again.');
    } finally {
      setSaving(false);
      closeEditor();
      onRefresh?.();
    }
  };

  const deleteSession = async () => {
    if (!editingId) return;
    if (!confirm('Delete this session?')) return;
    try {
      setSaving(true);
      const res = await fetch('/api/coaching/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId }),
      });
      if (!res.ok) {
        console.error('Failed to delete coaching session (calendar)', res.status, await res.text().catch(() => ''));
        alert('Could not delete session. Please try again.');
        return;
      }
    } catch (err) {
      console.error('Error deleting coaching session (calendar):', err);
      alert('Could not delete session. Please try again.');
    } finally {
      setSaving(false);
      closeEditor();
      onRefresh?.();
    }
  };

  /* ── Desktop grid data ── */
  const eventsByDate = useMemo(() => {
    const map = {};
    for (const s of events) {
      if (!s?.date) continue;
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [events]);

  const days = useMemo(() => {
    const first     = startOfMonth(cursor);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return { date: d, inMonth: d.getMonth() === cursor.getMonth(), key: fmtYMD(d) };
    });
  }, [cursor]);

  /* ── Styles ── */
  const shell = {
    background: '#F4F6F8', borderRadius: 16, border: '1px solid #E0E0E0',
    padding: 16, width: '100%', boxSizing: 'border-box',
  };
  const navBtn = {
    background: '#FFFFFF', border: '1px solid #CFD8DC', color: '#455A64',
    padding: '4px 8px', borderRadius: 999, cursor: 'pointer', fontSize: 11, fontWeight: 600, minWidth: 30,
  };
  const todayBtn = { ...navBtn, border: '1px solid #FF7043', color: '#FF7043' };
  const addBtn   = {
    background: '#FF7043', border: 'none', color: 'white',
    padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
    fontWeight: 700, fontSize: 11,
    boxShadow: '0 6px 14px rgba(255,112,67,0.35)', whiteSpace: 'nowrap',
  };
  const gridStyle = {
    display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))',
    gridAutoRows: 'minmax(110px,1fr)', gap: 6,
  };
  const cell = (inMonth, isToday) => ({
    background: isToday ? 'linear-gradient(135deg,#FFFFFF,#FFF3E0)' : inMonth ? '#FFFFFF' : '#F1F3F5',
    borderRadius: 12, padding: 8,
    border: isToday ? '1px solid rgba(255,112,67,0.55)' : '1px solid #E0E0E0',
    boxShadow: isToday ? '0 0 0 1px rgba(255,112,67,0.20)' : '0 1px 3px rgba(15,23,42,0.06)',
    display: 'flex', flexDirection: 'column', minWidth: 0, cursor: 'pointer',
  });

  /* ── SSR guard ── */
  if (isMobile === null) return <div style={shell} />;

  /* ── MOBILE ── */
  if (isMobile) {
    return (
      <>
        <div style={{ width: '100%', padding: '0 4px', boxSizing: 'border-box' }}>
          <div style={{
            marginBottom: 16,
            background: 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            borderRadius: 14, border: '1px solid rgba(255,255,255,0.40)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            padding: '14px 16px',
          }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#112033' }}>{title}</div>
            <div style={{ fontSize: 12, color: '#546E7A', marginTop: 3, fontWeight: 600 }}>
              Tap a date · manage your coaching schedule
            </div>
          </div>
          <MobileCalendar
            sessions={events}
            cursor={cursor} setCursor={setCursor}
            onAdd={openAdd} onEdit={openEditById}
          />
        </div>
        {editorOpen && (
          <CoachingCalendarEventForm
            mode={editorMode} initial={editorInitial}
            onClose={closeEditor} onSave={saveSession}
            onDelete={editorMode === 'edit' ? deleteSession : undefined}
            typeChoices={['Strategy', 'Resume', 'Interview']}
            statusChoices={['Scheduled', 'Completed', 'No-show']}
            saving={saving}
          />
        )}
      </>
    );
  }

  /* ── DESKTOP (original, untouched) ── */
  return (
    <section style={shell}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#263238' }}>{title}</div>
          <div style={{ fontSize: 12, color: '#607D8B' }}>{monthName}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" style={navBtn} onClick={() => setCursor(c => addMonths(c, -1))}>◀</button>
          <button type="button" style={todayBtn} onClick={() => setCursor(startOfMonth(new Date()))}>Today</button>
          <button type="button" style={navBtn} onClick={() => setCursor(c => addMonths(c, 1))}>▶</button>
          <button type="button" style={addBtn} onClick={() => openAdd()}>+ Add Session</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
        {WEEKDAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, color: '#607D8B', fontWeight: 700 }}>{d}</div>
        ))}
      </div>

      <div style={gridStyle}>
        {days.map(({ key, date, inMonth }) => {
          const isToday = key === todayStr;
          const list    = eventsByDate[key] || [];
          return (
            <div key={key} style={cell(inMonth, isToday)} onClick={() => openAdd(key)}>
              <div style={{ fontSize: 11, fontWeight: 800, color: isToday ? '#FF7043' : '#455A64' }}>
                {date.getDate()}
              </div>
              {list.slice(0, MAX_PER_DAY).map(s => {
                const c = typeColors(s.type);
                return (
                  <div key={s.id}
                    onClick={e => { e.stopPropagation(); openEditFromSession(s); }}
                    style={{
                      display: 'grid', gridTemplateColumns: '3px 1fr', gap: 6,
                      marginTop: 4, padding: 6, borderRadius: 8,
                      background: '#FAFAFA', border: '1px solid #E0E0E0', fontSize: 11, cursor: 'pointer',
                    }}>
                    <div style={{ background: c.strip }} />
                    <div>
                      <strong>{s.client}</strong>
                      <div style={{ color: '#607D8B' }}>{s.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {editorOpen && (
        <CoachingCalendarEventForm
          mode={editorMode} initial={editorInitial}
          onClose={closeEditor} onSave={saveSession}
          onDelete={editorMode === 'edit' ? deleteSession : undefined}
          typeChoices={['Strategy', 'Resume', 'Interview']}
          statusChoices={['Scheduled', 'Completed', 'No-show']}
          saving={saving}
        />
      )}
    </section>
  );
}