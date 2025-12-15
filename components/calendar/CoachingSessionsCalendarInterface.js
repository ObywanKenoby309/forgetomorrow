// components/calendar/CoachingSessionsCalendarInterface.js
import React, { useMemo, useState } from 'react';
import CoachingCalendarEventForm from './CoachingCalendarEventForm';

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
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_PER_DAY = 3;

/* ─────────────────────────────
   Component
───────────────────────────── */
export default function CoachingSessionsCalendarInterface({
  title = 'Sessions Calendar',
  events = [],
  onRefresh,
}) {
  /* ───────── Month nav ───────── */
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const monthName = useMemo(
    () =>
      cursor.toLocaleString(undefined, {
        month: 'long',
        year: 'numeric',
      }),
    [cursor]
  );
  const toPrev = () => setCursor((c) => addMonths(c, -1));
  const toNext = () => setCursor((c) => addMonths(c, 1));
  const toToday = () => setCursor(startOfMonth(new Date()));

  /* ───────── Group sessions ───────── */
  const eventsByDate = useMemo(() => {
    const map = {};
    for (const s of events) {
      if (!s?.date) continue;
      (map[s.date] = map[s.date] || []).push(s);
    }
    return map;
  }, [events]);

  /* ───────── Calendar grid ───────── */
  const days = useMemo(() => {
    const first = startOfMonth(cursor);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return {
        date: d,
        inMonth: d.getMonth() === cursor.getMonth(),
        key: fmtYMD(d),
      };
    });
  }, [cursor]);

  const todayStr = fmtYMD(new Date());

  /* ───────── Editor state ───────── */
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('add');
  const [editorInitial, setEditorInitial] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const openAdd = (date) => {
    setEditorMode('add');
    setEditingId(null);
    setEditorInitial({
      title: '',
      date: date || todayStr,
      time: '09:00',
      type: 'Strategy',
      status: 'Scheduled',
      notes: '',
    });
    setEditorOpen(true);
  };

  const openEdit = (s) => {
    setEditorMode('edit');
    setEditingId(s.id);
    setEditorInitial({
      title: s.client || s.title || '',
      date: s.date,
      time: s.time,
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
  };

  /* ───────── Save / delete ───────── */
  const saveSession = async (form) => {
    if (!form.date || !form.time) {
      alert('Date and time are required.');
      return;
    }

    try {
      setSaving(true);
      await fetch('/api/coaching/sessions', {
        method: editorMode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editorMode === 'edit'
            ? {
                id: editingId,
                date: form.date,
                time: form.time,
                type: form.type,
                status: form.status,
                notes: form.notes,
              }
            : {
                date: form.date,
                time: form.time,
                clientType: 'external',
                clientName: form.title || 'Coaching Session',
                type: form.type,
                status: form.status,
                notes: form.notes,
              }
        ),
      });
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
      await fetch('/api/coaching/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId }),
      });
    } finally {
      setSaving(false);
      closeEditor();
      onRefresh?.();
    }
  };

  /* ───────── Visual system ───────── */
  const typeStyle = (type) => {
    switch ((type || '').toLowerCase()) {
      case 'strategy':
        return { strip: '#FF7043', bg: '#FFF3E0', fg: '#E65100' };
      case 'resume':
        return { strip: '#546E7A', bg: '#ECEFF1', fg: '#37474F' };
      case 'interview':
        return { strip: '#455A64', bg: '#E0E0E0', fg: '#263238' };
      default:
        return { strip: '#90A4AE', bg: '#F5F7FB', fg: '#455A64' };
    }
  };

  /* ───────── Styles ───────── */
  const shell = {
    background: '#F4F6F8',
    borderRadius: 16,
    border: '1px solid #E0E0E0',
    padding: 16,
  };

  const header = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 12,
  };

  const titleStyle = { fontWeight: 800, fontSize: 18, color: '#263238' };
  const subtitle = { fontSize: 12, color: '#607D8B' };

  const grid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gridAutoRows: 'minmax(110px,1fr)',
    gap: 6,
  };

  const cell = (inMonth, isToday) => ({
    background: inMonth ? '#FFFFFF' : '#F1F3F5',
    border: '1px solid #E0E0E0',
    borderRadius: 12,
    padding: 8,
    boxShadow: isToday ? '0 0 0 2px rgba(255,112,67,.35)' : 'none',
    cursor: 'pointer',
  });

  /* ───────── Render ───────── */
  return (
    <section style={shell}>
      <div style={header}>
        <div>
          <div style={titleStyle}>{title}</div>
          <div style={subtitle}>{monthName}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={toPrev}>◀</button>
          <button onClick={toToday}>Today</button>
          <button onClick={toNext}>▶</button>
          <button
            style={{
              background: '#FF7043',
              color: 'white',
              borderRadius: 999,
              padding: '6px 14px',
              border: 'none',
              fontWeight: 700,
            }}
            onClick={() => openAdd()}
          >
            + Add Session
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            style={{
              textAlign: 'center',
              fontSize: 11,
              color: '#607D8B',
              fontWeight: 700,
            }}
          >
            {d}
          </div>
        ))}
      </div>

      <div style={grid}>
        {days.map(({ key, date, inMonth }) => {
          const isToday = key === todayStr;
          const list = eventsByDate[key] || [];
          return (
            <div
              key={key}
              style={cell(inMonth, isToday)}
              onClick={() => openAdd(key)}
            >
              <div style={{ fontSize: 11, fontWeight: 800 }}>
                {date.getDate()}
              </div>
              {list.slice(0, MAX_PER_DAY).map((s) => {
                const c = typeStyle(s.type);
                return (
                  <div
                    key={s.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(s);
                    }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '3px 1fr',
                      gap: 6,
                      marginTop: 4,
                      padding: 6,
                      borderRadius: 8,
                      background: '#FAFAFA',
                      border: '1px solid #E0E0E0',
                      fontSize: 11,
                    }}
                  >
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
          mode={editorMode}
          initial={editorInitial}
          onClose={closeEditor}
          onSave={saveSession}
          onDelete={editorMode === 'edit' ? deleteSession : undefined}
          typeChoices={['Strategy', 'Resume', 'Interview']}
          statusChoices={['Scheduled', 'Completed', 'No-show']}
        />
      )}
    </section>
  );
}
