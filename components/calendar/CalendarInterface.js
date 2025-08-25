// components/calendar/CalendarInterface.js
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

/* ---------- small date helpers ---------- */
function localISODate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function toLocalDateTime(dateStr, timeStr = '00:00') {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = (timeStr || '00:00').split(':').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0);
}
function monthBounds(year, monthIdx /* 0-based */) {
  const first = new Date(year, monthIdx, 1);
  const last  = new Date(year, monthIdx + 1, 0);
  return { first, last };
}
function startOfCalendarGrid(firstOfMonth) {
  const d = new Date(firstOfMonth);
  // move back to the Sunday of the week containing the 1st
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

/* ---------- simple storage helpers ---------- */
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* =================================================================== */

export default function CalendarInterface({
  title = 'Month View',
  storageKey,
  seed = [],
  typeChoices = [],
  statusChoices = [],
  backHref,             // optional
  addLabel = '+ Add Item',
}) {
  /* ---- events state ---- */
  const [events, setEvents] = useState([]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = readJSON(storageKey, null);
    if (Array.isArray(saved)) {
      setEvents(saved);
    } else {
      writeJSON(storageKey, seed);
      setEvents(seed);
    }
  }, [storageKey, seed]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    writeJSON(storageKey, events);
  }, [storageKey, events]);

  /* ---- filters ---- */
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = useMemo(() => {
    return events.filter(e => {
      const byType   = typeFilter === 'All' ? true : e.type === typeFilter;
      const byStatus = statusFilter === 'All' ? true : e.status === statusFilter;
      return byType && byStatus;
    });
  }, [events, typeFilter, statusFilter]);

  /* ---- current month nav ---- */
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const { first, last } = monthBounds(cursor.getFullYear(), cursor.getMonth());
  const start = startOfCalendarGrid(first);

  // build 6x7 grid dates
  const gridDates = useMemo(() => {
    const arr = [];
    const d = new Date(start);
    for (let i = 0; i < 42; i++) {
      arr.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return arr;
  }, [start]);

  const eventsByDay = useMemo(() => {
    const map = {};
    for (const e of filtered) {
      (map[e.date] = map[e.date] || []).push(e);
    }
    Object.keys(map).forEach(k => map[k].sort((a,b) =>
      toLocalDateTime(a.date, a.time) - toLocalDateTime(b.date, b.time)
    ));
    return map;
  }, [filtered]);

  /* ---- modal (add/edit) ---- */
  const [modal, setModal] = useState({ open: false, mode: 'add', index: null });
  const [form, setForm] = useState({
    date: localISODate(today),
    time: '09:00',
    client: '',
    type: typeChoices[0] || '',
    status: statusChoices[0] || 'Scheduled',
  });
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function openAdd(prefillDate) {
    setForm({
      date: prefillDate || localISODate(today),
      time: '09:00',
      client: '',
      type: typeChoices[0] || '',
      status: statusChoices[0] || 'Scheduled',
    });
    setModal({ open: true, mode: 'add', index: null });
  }
  function openEdit(index, record) {
    setForm({ ...record });
    setModal({ open: true, mode: 'edit', index });
  }
  function saveAdd(e) {
    e.preventDefault();
    if (!form.client.trim()) return alert('Please enter a title.');
    const rec = { ...form, client: form.client.trim() };
    setEvents(prev => {
      const next = [...prev, rec];
      next.sort((a,b) => toLocalDateTime(a.date, a.time) - toLocalDateTime(b.date, b.time));
      return next;
    });
    setModal({ open: false, mode: 'add', index: null });
  }
  function saveEdit(e) {
    e.preventDefault();
    const i = modal.index;
    if (i == null) return;
    if (!form.client.trim()) return alert('Please enter a title.');
    setEvents(prev => {
      const next = [...prev];
      next[i] = { ...form, client: form.client.trim() };
      next.sort((a,b) => toLocalDateTime(a.date, a.time) - toLocalDateTime(b.date, b.time));
      return next;
    });
    setModal({ open: false, mode: 'add', index: null });
  }
  function deleteRecord(i) {
    if (!confirm('Delete this item?')) return;
    setEvents(prev => prev.filter((_, idx) => idx !== i));
    setModal({ open: false, mode: 'add', index: null });
  }

  /* ---- rendering helpers ---- */
  const weekdayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const monthLabel = cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  const asTwo = (n) => String(n).padStart(2, '0');

  function findIndexOf(rec) {
    return events.findIndex(
      x => x.date===rec.date && x.time===rec.time && x.client===rec.client && x.type===rec.type && x.status===rec.status
    );
  }

  const EventChip = ({ rec }) => {
    // COMPACT: time + title only (no type/status pills)
    return (
      <div
        title={`${rec.time} • ${rec.client}${rec.type ? ` • ${rec.type}` : ''}${rec.status ? ` • ${rec.status}` : ''}`}
        style={{
          background: 'white',
          border: '1px solid #eee',
          borderRadius: 10,
          padding: '6px 8px',
          display: 'grid',
          gridTemplateColumns: '52px 1fr',
          gap: 8,
          alignItems: 'center',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
        onClick={() => openEdit(findIndexOf(rec), rec)}
      >
        <div style={{ fontWeight: 800, color: '#263238', fontSize: 12 }}>
          {rec.time || '—'}
        </div>
        <div style={{
          color: '#37474F',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: 13,
        }}>
          {rec.client || '(Untitled)'}
        </div>
      </div>
    );
  };

  /* ============================== UI ============================== */
  return (
    <section
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        border: '1px solid #eee',
      }}
    >
      {/* Title row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: backHref ? '1fr 1fr auto' : '1fr auto auto',
          alignItems: 'center',
          gap: 12,
          marginBottom: 8,
        }}
      >
        <div style={{ fontWeight: 800, color: '#FF7043', textAlign: 'center', gridColumn: backHref ? '1 / -1' : '1 / -1' }}>
          {title}
        </div>
        {backHref && (
          <Link href={backHref} style={{ color: '#FF7043', fontWeight: 700, justifySelf: 'start' }}>
            ← Back
          </Link>
        )}
      </div>

      {/* Filters + Add */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr auto',
          gap: 12,
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={input}>
          <option value="All">All Types</option>
          {typeChoices.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={input}>
          <option value="All">All Statuses</option>
          {statusChoices.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          type="button"
          onClick={() => openAdd(localISODate(cursor))}
          style={primaryBtn}
        >
          {addLabel}
        </button>
      </div>

      {/* Month nav */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <button
          type="button"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth()-1, 1))}
          style={circleBtn}
          aria-label="Previous month"
        >‹</button>
        <div style={{ textAlign: 'center', color: '#455A64', fontWeight: 700 }}>{monthLabel}</div>
        <button
          type="button"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth()+1, 1))}
          style={circleBtn}
          aria-label="Next month"
        >›</button>
      </div>

      {/* Weekday header (always visible) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: 8,
          marginBottom: 6,
          color: '#607D8B',
          fontSize: 12,
          fontWeight: 700,
          padding: '0 2px',
        }}
      >
        {weekdayNames.map((w) => (
          <div key={w} style={{ textAlign: 'left' }}>{w}</div>
        ))}
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: 8,
        }}
      >
        {gridDates.map((d, idx) => {
          const iso = localISODate(d);
          const isThisMonth = d.getMonth() === cursor.getMonth();
          const dayNum = d.getDate(); // show only day number, not ISO

          const dayEvents = eventsByDay[iso] || [];

          return (
            <div
              key={idx}
              style={{
                background: 'white',
                border: '1px solid #eee',
                borderRadius: 12,
                minHeight: 100,
                padding: 8,
                opacity: isThisMonth ? 1 : 0.45,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {/* cell header: day number + small plus */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <div style={{ fontWeight: 700, color: '#263238' }}>{dayNum}</div>
                <button
                  onClick={() => openAdd(iso)}
                  title={`Add on ${iso}`}
                  style={{
                    border: '1px solid #eee',
                    background: 'white',
                    width: 24, height: 24,
                    borderRadius: 999,
                    lineHeight: '22px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    color: '#FF7043',
                    fontWeight: 800,
                  }}
                >
                  +
                </button>
              </div>

              {/* events list, compact */}
              <div style={{ display: 'grid', gap: 6 }}>
                {dayEvents.length === 0 ? (
                  <div style={{ color: '#CFD8DC', fontSize: 12 }}>—</div>
                ) : (
                  dayEvents.map((rec, i) => (
                    <EventChip key={`${rec.time}-${i}`} rec={rec} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal.open && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <form
            onSubmit={modal.mode === 'add' ? saveAdd : saveEdit}
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 16,
              width: 420,
              display: 'grid',
              gap: 10,
            }}
          >
            <h3 style={{ margin: 0, color: '#FF7043' }}>
              {modal.mode === 'add' ? 'Add Item' : 'Edit Item'}
            </h3>

            <label style={label}>Date
              <input type="date" value={form.date} onChange={(e)=>update('date', e.target.value)} style={input}/>
            </label>
            <label style={label}>Time
              <input type="time" value={form.time} onChange={(e)=>update('time', e.target.value)} style={input}/>
            </label>
            <label style={label}>Title
              <input value={form.client} onChange={(e)=>update('client', e.target.value)} placeholder="e.g., Phone Screen — Acme" style={input}/>
            </label>
            {typeChoices.length > 0 && (
              <label style={label}>Type
                <select value={form.type} onChange={(e)=>update('type', e.target.value)} style={input}>
                  {typeChoices.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            )}
            {statusChoices.length > 0 && (
              <label style={label}>Status
                <select value={form.status} onChange={(e)=>update('status', e.target.value)} style={input}>
                  {statusChoices.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              {modal.mode === 'edit' ? (
                <button type="button" onClick={() => deleteRecord(modal.index)} style={dangerBtn}>
                  Delete
                </button>
              ) : <span/>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={primaryBtn}>Save</button>
                <button type="button" onClick={() => setModal({ open:false, mode:'add', index:null })} style={secondaryBtn}>
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

/* ---------- tiny style tokens ---------- */
const input = {
  border: '1px solid #ddd',
  borderRadius: 10,
  padding: '10px 12px',
  outline: 'none',
  background: 'white',
  width: '100%',
};
const label = { display: 'grid', gap: 6, fontWeight: 700, color: '#263238', fontSize: 13 };
const primaryBtn = {
  background: '#FF7043',
  color: 'white',
  border: 'none',
  borderRadius: 10,
  padding: '10px 12px',
  fontWeight: 700,
  cursor: 'pointer',
};
const secondaryBtn = {
  background: 'white',
  color: '#FF7043',
  border: '1px solid #FF7043',
  borderRadius: 10,
  padding: '10px 12px',
  fontWeight: 700,
  cursor: 'pointer',
};
const dangerBtn = {
  background: 'white',
  color: '#C62828',
  border: '1px solid #C62828',
  borderRadius: 10,
  padding: '10px 12px',
  fontWeight: 700,
  cursor: 'pointer',
};
const circleBtn = {
  width: 32,
  height: 32,
  borderRadius: 999,
  border: '1px solid #eee',
  background: 'white',
  cursor: 'pointer',
  color: '#FF7043',
  fontWeight: 800,
  lineHeight: '30px',
  textAlign: 'center',
};
