// components/calendar/CalendarInterface.js
import React, { useEffect, useMemo, useState } from 'react';

/**
 * Reusable month calendar with localStorage persistence and Add/Edit/Delete modal.
 *
 * Visual tuning (optional):
 * - eventNudge?: number        // px left/right shift of entry (default 0)
 * - eventWidthDeduct?: number  // px to subtract from full width (default 0)
 */
export default function CalendarInterface({
  storageKey = 'calendar_v1',
  seed = [],
  typeChoices = [],
  statusChoices = ['Scheduled', 'Completed', 'No-show'],
  title,
  backHref,
  addLabel = '+ Add Item',
  eventNudge = -8,
  eventWidthDeduct = -10,
}) {
  // --- date helpers (local time) ---
  const localISODate = (d = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const toLocalDateTime = (dateStr, timeStr = '00:00') => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [hh, mm] = timeStr.split(':').map(Number);
    return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0);
  };

  // month navigation
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-11

  // filters
  const [type, setType] = useState('All');
  const [status, setStatus] = useState('All');

  // items + persistence
  const [items, setItems] = useState([]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (Array.isArray(saved) && saved.length) setItems(saved);
      else if (seed.length) {
        localStorage.setItem(storageKey, JSON.stringify(seed));
        setItems(seed);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    }
  }, [storageKey, seed]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(storageKey, JSON.stringify(items)); } catch {}
  }, [items, storageKey]);

  // filtered view
  const filtered = useMemo(() => {
    return items.filter((s) => {
      const byType = type === 'All' ? true : s.type === type;
      const byStatus = status === 'All' ? true : s.status === status;
      return byType && byStatus;
    });
  }, [items, type, status]);

  // month grid (42 days)
  const monthLabel = new Date(year, month, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const gridDays = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const startDay = firstOfMonth.getDay(); // 0=Sun
    const start = new Date(firstOfMonth);
    start.setDate(firstOfMonth.getDate() - startDay);
    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = localISODate(d);
      days.push({
        iso,
        dayNum: d.getDate(),
        inMonth: d.getMonth() === month && d.getFullYear() === year,
        isToday: iso === localISODate(),
      });
    }
    return days;
  }, [year, month]);

  // group by date
  const itemsByDate = useMemo(() => {
    const map = {};
    for (const s of filtered) (map[s.date] = map[s.date] || []).push(s);
    Object.keys(map).forEach((k) =>
      map[k].sort((a, b) => toLocalDateTime(a.date, a.time) - toLocalDateTime(b.date, b.time))
    );
    return map;
  }, [filtered]);

  // modal state
  const [modal, setModal] = useState({ open: false, mode: 'add', index: null });
  const [form, setForm] = useState({
    date: localISODate(),
    time: '09:00',
    client: '',
    type: typeChoices[0] || '',
    status: statusChoices[0] || 'Scheduled',
  });
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openAddFor = (isoDate) => {
    setForm({
      date: isoDate || localISODate(),
      time: '09:00',
      client: '',
      type: typeChoices[0] || '',
      status: statusChoices[0] || 'Scheduled',
    });
    setModal({ open: true, mode: 'add', index: null });
  };
  const openEdit = (idx) => {
    const s = items[idx];
    setForm({ date: s.date, time: s.time, client: s.client, type: s.type, status: s.status });
    setModal({ open: true, mode: 'edit', index: idx });
  };

  const saveAdd = (e) => {
    e.preventDefault();
    if (!form.client.trim()) return alert('Please enter a title.');
    const rec = { ...form, client: form.client.trim() };
    setItems((prev) => {
      const next = [...prev, rec];
      next.sort((a, b) => toLocalDateTime(a.date, a.time) - toLocalDateTime(b.date, b.time));
      return next;
    });
    setModal({ open: false, mode: 'add', index: null });
  };
  const saveEdit = (e) => {
    e.preventDefault();
    if (modal.index == null) return;
    if (!form.client.trim()) return alert('Please enter a title.');
    setItems((prev) => {
      const next = [...prev];
      next[modal.index] = { ...form, client: form.client.trim() };
      next.sort((a, b) => toLocalDateTime(a.date, a.time) - toLocalDateTime(b.date, b.time));
      return next;
    });
    setModal({ open: false, mode: 'add', index: null });
  };
  const deleteItem = (idx) => {
    if (!confirm('Delete this entry?')) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
    setModal({ open: false, mode: 'add', index: null });
  };

  const findIndexOf = (s) =>
    items.findIndex(
      (x) =>
        x.date === s.date &&
        x.time === s.time &&
        x.client === s.client &&
        x.type === s.type &&
        x.status === s.status
    );

  // UI helpers
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

  const prevMonth = () => { const d = new Date(year, month, 1); d.setMonth(d.getMonth() - 1); setYear(d.getFullYear()); setMonth(d.getMonth()); };
  const nextMonth = () => { const d = new Date(year, month, 1); d.setMonth(d.getMonth() + 1); setYear(d.getFullYear()); setMonth(d.getMonth()); };

  return (
    <div style={{ display: 'grid', gap: 16, width: '100%', boxSizing: 'border-box' }}>
      {title && (
        <section style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 2px 6px rgba(0,0,0,0.06)', border: '1px solid #eee', textAlign: 'center' }}>
          <h2 style={{ margin: 0, color: '#FF7043' }}>{title}</h2>
        </section>
      )}

      {/* Toolbar */}
      <section style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 6px rgba(0,0,0,0.06)', border: '1px solid #eee' }}>
        <div style={{ display: 'grid', gridTemplateColumns: backHref ? '1fr 1fr auto auto' : '1fr 1fr auto', gap: 12, alignItems: 'center' }}>
          <select value={type} onChange={(e) => setType(e.target.value)} style={inputBase}><option value="All">All Types</option>{typeChoices.map((opt) => <option key={opt} value={opt}>{opt}</option>)}</select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputBase}><option value="All">All Statuses</option>{statusChoices.map((opt) => <option key={opt} value={opt}>{opt}</option>)}</select>
          {backHref && (<a href={backHref} style={{ color: '#FF7043', fontWeight: 700 }}>← Back</a>)}
          <button type="button" onClick={() => openAddFor(localISODate())} style={{ background: '#FF7043', color: 'white', border: 'none', borderRadius: 10, padding: '10px 12px', fontWeight: 700, cursor: 'pointer', justifySelf: 'end' }}>{addLabel}</button>
        </div>
      </section>

      {/* Calendar */}
      <section style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 6px rgba(0,0,0,0.06)', border: '1px solid #eee' }}>
        {/* Month header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button type="button" onClick={prevMonth} style={navBtn}>‹</button>
          <h3 style={{ color: '#FF7043', margin: 0 }}>{monthLabel}</h3>
          <button type="button" onClick={nextMonth} style={navBtn}>›</button>
        </div>

        {/* Weekday labels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 12, marginBottom: 8, minWidth: 0 }}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((w) => <div key={w} style={{ fontSize: 12, color: '#607D8B', fontWeight: 700, textAlign: 'center' }}>{w}</div>)}
        </div>

        {/* 6-week grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 12, minWidth: 0 }}>
          {gridDays.map(({ iso, dayNum, inMonth, isToday }) => {
            const dayItems = itemsByDate[iso] || [];
            return (
              <div
                key={iso}
                onClick={() => openAddFor(iso)}
                title={`Add item on ${iso}`}
                style={{
                  border: '1px solid #eee',
                  borderRadius: 10,
                  minHeight: 140,
                  background: inMonth ? '#FAFAFA' : '#F7F7F7',
                  opacity: inMonth ? 1 : 0.65,
                  padding: 10,
                  cursor: 'pointer',
                  outline: isToday ? '2px solid #FFE0B2' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  minWidth: 0,
                  boxSizing: 'border-box',
                  position: 'relative', // isolate stacking
                  zIndex: 0,
                  overflow: 'hidden',   // keep entries inside the day
                }}
              >
                <div style={{ fontWeight: 700, color: '#263238' }}>{dayNum}</div>

                <div style={{ display: 'grid', gap: 6, justifyItems: 'start' }}>
                  {dayItems.slice(0, 3).map((s, idx) => {
                    const masterIdx = findIndexOf(s);
                    const widthStyle = (typeof eventWidthDeduct === 'number' && eventWidthDeduct > 0)
                      ? `calc(100% - ${eventWidthDeduct}px)`
                      : '100%';
                    return (
                      <button
                        key={`${iso}-${idx}`}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openEdit(masterIdx); }}
                        style={{
                          display: 'block',
                          width: widthStyle,
                          maxWidth: '100%',
                          boxSizing: 'border-box',
                          alignSelf: 'start',
                          marginLeft: eventNudge || 0,
                          marginRight: 4,
                          zIndex: 1,              // render above neighbor day
                          textAlign: 'left',
                          background: 'white',
                          border: '1px solid #eee',
                          borderRadius: 8,
                          padding: '6px 8px',
                          cursor: 'pointer',
                          fontSize: 12,
                        }}
                      >
                        <div style={{ fontWeight: 700 }}>{s.time}</div>
                        <div style={{ color: '#455A64', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.client}</div>
                        <div style={{ marginTop: 4, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                          {typePill(s.type)} {badge(s.status)}
                        </div>
                      </button>
                    );
                  })}
                  {dayItems.length > 3 && <div style={{ fontSize: 12, color: '#607D8B' }}>+{dayItems.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modal */}
      {modal.open && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'grid', placeItems: 'center', zIndex: 50 }} onClick={() => setModal({ open: false, mode: 'add', index: null })}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={modal.mode === 'add' ? saveAdd : saveEdit} style={{ width: '100%', maxWidth: 520, background: 'white', borderRadius: 12, padding: 16, border: '1px solid #eee', boxShadow: '0 10px 24px rgba(0,0,0,0.12)', display: 'grid', gap: 10 }}>
            <div style={{ fontWeight: 800, color: '#263238', marginBottom: 4 }}>{modal.mode === 'add' ? 'Add Calendar Item' : 'Edit Calendar Item'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={label}>Date</label><input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} style={inputBase} required /></div>
              <div><label style={label}>Time</label><input type="time" value={form.time} onChange={(e) => update('time', e.target.value)} style={inputBase} required /></div>
            </div>
            <div><label style={label}>Title</label><input value={form.client} onChange={(e) => update('client', e.target.value)} style={inputBase} placeholder="e.g., Phone Screen — Acme" required /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={label}>Type</label><select value={form.type} onChange={(e) => update('type', e.target.value)} style={inputBase}>{typeChoices.map((opt) => <option key={opt}>{opt}</option>)}</select></div>
              <div><label style={label}>Status</label><select value={form.status} onChange={(e) => update('status', e.target.value)} style={inputBase}>{statusChoices.map((opt) => <option key={opt}>{opt}</option>)}</select></div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 6 }}>
              {modal.mode === 'edit' ? (
                <button type="button" onClick={() => deleteItem(modal.index)} style={{ background: 'white', color: '#C62828', border: '1px solid #C62828', borderRadius: 10, padding: '10px 12px', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
              ) : <span />}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setModal({ open: false, mode: 'add', index: null })} style={{ background: 'white', color: '#FF7043', border: '1px solid #FF7043', borderRadius: 10, padding: '10px 12px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ background: '#FF7043', color: 'white', border: 'none', borderRadius: 10, padding: '10px 12px', fontWeight: 700, cursor: 'pointer' }}>Save</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const label = { display: 'block', fontSize: 12, color: '#607D8B', marginBottom: 4, fontWeight: 700 };
const inputBase = { border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px', outline: 'none', background: 'white', width: '100%' };
const navBtn = { background: 'white', border: '1px solid #eee', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontWeight: 600, color: '#FF7043' };
