// components/calendar/CalendarInterface.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import CalendarEventForm from './CalendarEventForm';

function startOfMonth(date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function addMonths(date, delta) { return new Date(date.getFullYear(), date.getMonth() + delta, 1); }
function fmtYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function CalendarInterface({
  title = 'Calendar',
  storageKey = 'calendar_v1',
  seed = [],
  typeChoices = ['Interview', 'Application', 'Coaching', 'Task', 'Appointment'],
  statusChoices = ['Scheduled', 'Completed', 'Cancelled', 'No-show'],
  addLabel = '+',
  eventNudge = 0,
  eventWidthDeduct = 10,
}) {
  // ---------- storage ----------
  const [events, setEvents] = useState({});
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setEvents(JSON.parse(saved));
      else {
        const seeded = seed.reduce((acc, e) => {
          const key = e.date;
          acc[key] = acc[key] || [];
          acc[key].push(e);
          return acc;
        }, {});
        setEvents(seeded);
        localStorage.setItem(storageKey, JSON.stringify(seeded));
      }
    } catch {}
  }, [storageKey, seed]);

  const persist = useCallback((next) => {
    setEvents(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
  }, [storageKey]);

  // ---------- month nav ----------
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const monthName = useMemo(
    () => cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' }),
    [cursor]
  );
  const toPrev = () => setCursor((c) => addMonths(c, -1));
  const toNext = () => setCursor((c) => addMonths(c, 1));
  // keeping this (unused) in case you re-enable a “Today” control later
  const toToday = () => setCursor(startOfMonth(new Date()));

  // ---------- grid (7x6) ----------
  const days = useMemo(() => {
    const first = startOfMonth(cursor);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - first.getDay()); // Sunday-start
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return { date: d, inMonth: d.getMonth() === cursor.getMonth(), key: fmtYMD(d) };
    });
  }, [cursor]);

  // ---------- modal add/edit/delete ----------
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');          // 'add' | 'edit'
  const [formInitial, setFormInitial] = useState(null);     // { date, idx?, title, time, type, status }

  const addItem = (dateStr) => {
    setFormInitial({ date: dateStr });
    setFormMode('add');
    setFormOpen(true);
  };

  const editItem = (dateStr, item, idx) => {
    setFormInitial({ ...item, date: dateStr, idx });
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleSave = (payload) => {
    const { date, origDate, idx } = payload;

    const normalized = {
      date,
      time: payload.time || '',
      title: (payload.title || payload.client || '').trim(),
      client: (payload.title || payload.client || '').trim(),
      type: payload.type,
      status: payload.status,
      notes: payload.notes || '',
    };

    const next = structuredClone(events);

    if (formMode === 'edit' && typeof idx === 'number') {
      if (origDate && origDate !== date) {
        if (next[origDate]) {
          next[origDate].splice(idx, 1);
          if (next[origDate].length === 0) delete next[origDate];
        }
        next[date] = next[date] || [];
        next[date].push(normalized);
      } else {
        next[date][idx] = normalized;
      }
    } else {
      next[date] = next[date] || [];
      next[date].push(normalized);
    }

    persist(next);
    setFormOpen(false);
    setFormInitial(null);
  };

  // in-modal delete (no browser confirm)
  const handleDelete = ({ date, idx }) => {
    const next = structuredClone(events);
    if (!next[date]) return;
    next[date].splice(idx, 1);
    if (next[date].length === 0) delete next[date];
    persist(next);
    setFormOpen(false);
    setFormInitial(null);
  };

  // ---------- styles ----------
  const wrap = {
    background: 'white',
    borderRadius: 12,
    border: '1px solid #eee',
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    padding: 12,
    width: '100%',
    boxSizing: 'border-box',
  };
  const head = {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  };
  const headTitle = { textAlign: 'center', fontWeight: 800, color: '#263238' };
  const headBtns = { display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' };
  const navBtn = {
    background: 'transparent',
    border: 'none',
    color: '#455A64',
    padding: '4px 6px',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 700,
  };
  const navLabel = {
    padding: '4px 6px',
    color: '#607D8B',
    fontWeight: 700,
    userSelect: 'none',
  };

  const grid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gridAutoRows: 'minmax(110px, 1fr)',
    gap: 8,
  };
  const weekday = { fontSize: 12, color: '#607D8B', textAlign: 'center', fontWeight: 700 };
  const cell = (inMonth) => ({
    border: '1px solid #e6e9ef',
    borderRadius: 10,
    padding: 8,
    background: inMonth ? '#fff' : '#FAFAFA',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    position: 'relative',
  });
  const dateBadge = (isToday) => ({
    alignSelf: 'flex-end',
    fontSize: 12,
    fontWeight: 700,
    color: isToday ? 'white' : '#455A64',
    background: isToday ? '#FF7043' : 'transparent',
    borderRadius: 999,
    padding: isToday ? '2px 8px' : 0,
  });
  const ev = {
    marginTop: 6,
    padding: '6px 8px',
    borderRadius: 8,
    border: '1px solid #e6e9ef',
    position: 'relative',
    left: eventNudge,
    width: `calc(100% - ${eventWidthDeduct}px)`,
    background: '#F7FAFC',
    color: '#263238',
    fontSize: 12,
    display: 'grid',
    gap: 2,
    cursor: 'pointer',
  };
  const addBtn = {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 24,
    height: 24,
    borderRadius: 6,
    display: 'grid',
    placeItems: 'center',
    background: '#FF7043',
    color: 'white',
    border: 'none',
    fontSize: 16,
    lineHeight: 1,
    cursor: 'pointer',
    padding: 0,
  };

  const todayStr = fmtYMD(new Date());

  return (
    <section style={wrap}>
      {/* Header */}
      <div style={head}>
        <div />
        <div style={headTitle}>{monthName}</div>
        <div style={headBtns}>
          <button style={navBtn} onClick={toPrev} aria-label="Previous Month">◀</button>
          <span style={navLabel} aria-hidden="true">Month</span>
          <button style={navBtn} onClick={toNext} aria-label="Next Month">▶</button>
        </div>
      </div>

      {/* Weekday row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
        {WEEKDAYS.map((w) => <div key={w} style={weekday}>{w}</div>)}
      </div>

      {/* Grid */}
      <div style={grid}>
        {days.map(({ date, inMonth, key }) => {
          const isToday = key === todayStr;
          const list = events[key] || [];
          return (
            <div key={key} style={cell(inMonth)}>
              <div style={dateBadge(isToday)}>{date.getDate()}</div>

              <div style={{ display: 'grid', gap: 6 }}>
                {list.map((e, i) => (
                  <div
                    key={`${key}-${i}`}
                    style={ev}
                    onClick={() => editItem(key, e, i)}
                  >
                    {/* Show only time + truncated title */}
                    <div
                      style={{
                        fontWeight: 700,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {e.time ? `${e.time} — ` : ''}{e.title || e.client}
                    </div>
                  </div>
                ))}
              </div>

              <button style={addBtn} onClick={() => addItem(key)} aria-label="Add item">+</button>
            </div>
          );
        })}
      </div>

      {/* Modal form */}
      {formOpen && (
        <CalendarEventForm
          mode={formMode}
          initial={formInitial}
          onClose={() => { setFormOpen(false); setFormInitial(null); }}
          onSave={handleSave}
          onDelete={handleDelete} // confirmation handled inside the modal
          typeChoices={typeChoices}
          statusChoices={statusChoices}
        />
      )}
    </section>
  );
}
