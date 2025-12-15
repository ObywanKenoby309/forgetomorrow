import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import CalendarEventForm from './CalendarEventForm';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_PER_DAY = 3;

/* ---------------- utils ---------------- */
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

/* ---------------- component ---------------- */
export default function CoachingSessionsCalendarInterface({
  title = 'Sessions Calendar',
}) {
  const router = useRouter();

  /* ---------- month nav ---------- */
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const monthName = useMemo(
    () => cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' }),
    [cursor]
  );
  const toPrev = () => setCursor((c) => addMonths(c, -1));
  const toNext = () => setCursor((c) => addMonths(c, 1));
  const toToday = () => setCursor(startOfMonth(new Date()));

  /* ---------- data ---------- */
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/coaching/sessions');
      const data = await res.json();
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch (err) {
      console.error('Calendar fetch failed', err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  /* ---------- group by date ---------- */
  const eventsByDate = useMemo(() => {
    const map = {};
    for (const s of sessions) {
      if (!s?.date) continue;
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [sessions]);

  /* ---------- grid ---------- */
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

  /* ---------- modal ---------- */
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [formInitial, setFormInitial] = useState(null);

  const openAdd = () => {
    setFormInitial({ date: todayStr });
    setFormMode('add');
    setFormOpen(true);
  };

  const openEdit = (session) => {
    setFormInitial(session);
    setFormMode('edit');
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormInitial(null);
  };

  const saveSession = async (payload) => {
    const method = payload.id ? 'PUT' : 'POST';
    await fetch('/api/coaching/sessions', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    closeForm();
    fetchSessions();
  };

  const deleteSession = async ({ id }) => {
    if (!id) return;
    await fetch('/api/coaching/sessions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    closeForm();
    fetchSessions();
  };

  /* ---------- colors ---------- */
  const typeColors = (type) => {
    switch ((type || '').toLowerCase()) {
      case 'strategy':
        return { strip: '#FF7043', pillBg: '#FFF3E0', pillFg: '#E65100' };
      case 'resume':
        return { strip: '#1E88E5', pillBg: '#E3F2FD', pillFg: '#1565C0' };
      case 'interview':
        return { strip: '#8E24AA', pillBg: '#F3E5F5', pillFg: '#6A1B9A' };
      default:
        return { strip: '#90A4AE', pillBg: '#ECEFF1', pillFg: '#455A64' };
    }
  };

  /* ---------- styles (trimmed but intentional) ---------- */
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(0,1fr))',
    gridAutoRows: 130,
    gap: 6,
  };

  const cell = (inMonth, isToday) => ({
    background: isToday
      ? 'linear-gradient(135deg,#FFF3E0,#E3F2FD)'
      : inMonth
      ? '#fff'
      : '#F5F7FB',
    border: '1px solid #E6E9EF',
    borderRadius: 12,
    padding: 8,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
  });

  /* ---------- render ---------- */
  return (
    <section>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <div style={{ fontSize: 12, color: '#607D8B' }}>
            {monthName} · Click a session to edit
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={toPrev}>◀</button>
          <button onClick={toToday}>Today</button>
          <button onClick={toNext}>▶</button>
          <button
            onClick={openAdd}
            style={{ background: '#FF7043', color: 'white', borderRadius: 999 }}
          >
            + Add Session
          </button>
        </div>
      </div>

      {/* Weekdays */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
        {WEEKDAYS.map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11 }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div style={gridStyle}>
        {days.map(({ key, date, inMonth }) => {
          const list = eventsByDate[key] || [];
          const visible = list.slice(0, MAX_PER_DAY);
          const extra = list.length - visible.length;

          return (
            <div
              key={key}
              style={cell(inMonth, key === todayStr)}
              onClick={() =>
                router.push(`/dashboard/coaching/sessions?date=${key}`)
              }
            >
              <div style={{ fontSize: 11, fontWeight: 700 }}>{date.getDate()}</div>

              <div style={{ display: 'grid', gap: 4, marginTop: 4 }}>
                {visible.map((s) => {
                  const c = typeColors(s.type);
                  return (
                    <div
                      key={s.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(s);
                      }}
                      style={{
                        border: '1px solid #E0E4EE',
                        borderRadius: 9,
                        padding: '6px 8px',
                        display: 'grid',
                        gridTemplateColumns: '3px 1fr',
                        gap: 6,
                        background: '#F9FBFF',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ background: c.strip, borderRadius: 999 }} />
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700 }}>
                          {s.client || 'Session'}
                        </div>
                        <div style={{ fontSize: 11, color: '#546E7A' }}>
                          {s.time}
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            background: c.pillBg,
                            color: c.pillFg,
                            borderRadius: 999,
                            padding: '2px 6px',
                          }}
                        >
                          {s.type}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {extra > 0 && (
                  <div style={{ fontSize: 10, color: '#90A4AE' }}>
                    +{extra} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {formOpen && (
        <CalendarEventForm
          mode={formMode}
          initial={formInitial}
          onClose={closeForm}
          onSave={saveSession}
          onDelete={deleteSession}
          typeChoices={['Strategy', 'Resume', 'Interview']}
          statusChoices={['Scheduled', 'Completed', 'No-show']}
        />
      )}
    </section>
  );
}
