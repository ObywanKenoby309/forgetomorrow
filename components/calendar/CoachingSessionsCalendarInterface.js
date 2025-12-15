// components/calendar/CoachingSessionsCalendarInterface.js
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import CalendarEventForm from './CalendarEventForm';

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

export default function CoachingSessionsCalendarInterface({
  title = 'Calendar',
  storageKey = 'calendar_v1', // kept for API compatibility; no longer used
  seed = [],
  typeChoices = ['Strategy', 'Resume', 'Interview'],
  statusChoices = ['Scheduled', 'Completed', 'No-show'],
  addLabel = '+ Add Session',
  eventNudge = 0,
  eventWidthDeduct = 10,
}) {
  // ---------- events derived from seed (DB is source of truth) ----------
  const [events, setEvents] = useState({});

  useEffect(() => {
    const seeded = (Array.isArray(seed) ? seed : []).reduce((acc, e) => {
      if (!e?.date) return acc;
      const key = e.date;
      acc[key] = acc[key] || [];
      acc[key].push(e);
      return acc;
    }, {});
    setEvents(seeded);
  }, [seed]);

  // Local edits only live in React state for now
  const persist = useCallback((next) => {
    setEvents(next);
  }, []);

  // ---------- month nav ----------
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

  // ---------- grid (7x6) ----------
  const days = useMemo(() => {
    const first = startOfMonth(cursor);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - first.getDay()); // Sunday-start
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

  // ---------- modal add/edit/delete ----------
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' | 'edit'
  const [formInitial, setFormInitial] = useState(null); // { date, idx?, title, time, type, status }

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
      participants: payload.participants || '',
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

  const handleDelete = ({ date, idx }) => {
    const next = structuredClone(events);
    if (!next[date]) return;
    next[date].splice(idx, 1);
    if (next[date].length === 0) delete next[date];
    persist(next);
    setFormOpen(false);
    setFormInitial(null);
  };

  // Header “Add Session” button uses today as default date
  const todayStr = fmtYMD(new Date());
  const handleAddFromHeader = () => addItem(todayStr);

  // ---------- visual helpers ----------
  const typeColors = (type) => {
    const t = (type || '').toLowerCase();
    if (t === 'strategy') {
      return { strip: '#FF7043', pillBg: '#FFF3E0', pillFg: '#E65100' };
    }
    if (t === 'resume') {
      return { strip: '#1E88E5', pillBg: '#E3F2FD', pillFg: '#1565C0' };
    }
    if (t === 'interview') {
      return { strip: '#8E24AA', pillBg: '#F3E5F5', pillFg: '#6A1B9A' };
    }
    return { strip: '#90A4AE', pillBg: '#ECEFF1', pillFg: '#455A64' };
  };

  const statusDotColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed') return '#2E7D32';
    if (s === 'no-show') return '#C62828';
    if (s === 'cancelled') return '#C62828';
    return '#1565C0'; // Scheduled / default
  };

  // ---------- styles ----------
  const wrap = {
    background:
      'linear-gradient(145deg, rgba(17,32,51,0.96), rgba(25,118,210,0.85))',
    borderRadius: 18,
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow:
      '0 18px 45px rgba(0,0,0,0.38), 0 0 0 1px rgba(255,255,255,0.03)',
    padding: 16,
    width: '100%',
    boxSizing: 'border-box',
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
  };

  const innerCard = {
    background: 'rgba(255,255,255,0.96)',
    borderRadius: 14,
    padding: 14,
    boxShadow: '0 10px 25px rgba(0,0,0,0.18)',
    border: '1px solid #e0e4ee',
    color: '#263238',
  };

  const head = {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.8fr)',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  };

  const headLeft = {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  };

  const headTitle = {
    fontWeight: 800,
    fontSize: 18,
    color: '#102027',
  };

  const headSubtitle = {
    fontSize: 12,
    color: '#607D8B',
  };

  const headRight = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    alignItems: 'flex-end',
  };

  const monthChipRow = {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  };

  const monthChip = {
    padding: '6px 10px',
    borderRadius: 999,
    background: '#102A43',
    color: '#E3F2FD',
    fontSize: 13,
    fontWeight: 700,
    border: '1px solid rgba(255,255,255,0.12)',
  };

  const headBtns = {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  };

  const navBtn = {
    background: 'rgba(255,255,255,0.96)',
    border: '1px solid #CFD8DC',
    color: '#455A64',
    padding: '4px 7px',
    borderRadius: 999,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 11,
    minWidth: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const todayPill = {
    background: 'transparent',
    border: '1px solid #90CAF9',
    color: '#1565C0',
    padding: '4px 10px',
    borderRadius: 999,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 11,
  };

  const headerAddBtn = {
    background: '#FF7043',
    border: 'none',
    color: 'white',
    padding: '6px 14px',
    borderRadius: 999,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 11,
    boxShadow: '0 6px 16px rgba(255,112,67,0.55)',
    whiteSpace: 'nowrap',
  };

  const legendRow = {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 10,
    padding: '6px 8px',
    borderRadius: 999,
    background: '#F5F7FB',
  };

  const legendItem = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: '#546E7A',
  };

  const legendSwatch = (bg) => ({
    width: 14,
    height: 4,
    borderRadius: 999,
    background: bg,
  });

  const grid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
    gridAutoRows: 'minmax(110px, 1fr)',
    gap: 6,
  };

  const weekday = {
    fontSize: 11,
    color: '#607D8B',
    textAlign: 'center',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  const cell = (inMonth, isToday) => ({
    borderRadius: 12,
    padding: 8,
    background: isToday
      ? 'linear-gradient(135deg, #FFF3E0, #E3F2FD)'
      : inMonth
      ? '#FFFFFF'
      : '#F5F7FB',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    position: 'relative',
    boxShadow: isToday
      ? '0 0 0 1px rgba(255,112,67,0.45)'
      : '0 1px 3px rgba(15,23,42,0.06)',
    border: isToday ? '1px solid rgba(255,112,67,0.75)' : '1px solid #E6E9EF',
  });

  const dateBadge = (isToday) => ({
    alignSelf: 'flex-end',
    fontSize: 11,
    fontWeight: 800,
    color: isToday ? '#FF7043' : '#455A64',
    background: isToday ? 'white' : 'transparent',
    borderRadius: 999,
    padding: isToday ? '2px 8px' : 0,
    boxShadow: isToday ? '0 0 0 1px rgba(255,112,67,0.25)' : 'none',
  });

  const eventsWrap = {
    display: 'grid',
    gap: 4,
    marginTop: 4,
    paddingRight: 2,
  };

  const eventCard = (stripColor) => ({
    marginTop: 2,
    padding: '6px 8px 6px 6px',
    borderRadius: 9,
    border: '1px solid #E0E4EE',
    position: 'relative',
    left: eventNudge,
    width: `calc(100% - ${eventWidthDeduct}px)`,
    background: '#F9FBFF',
    color: '#263238',
    fontSize: 11,
    display: 'grid',
    gridTemplateColumns: '3px 1fr',
    gap: 6,
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(15,23,42,0.15)',
  });

  const eventStrip = (stripColor) => ({
    width: 3,
    borderRadius: 999,
    background: stripColor,
  });

  const eventContent = {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  };

  const eventTopRow = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 6,
    alignItems: 'center',
  };

  const eventTitle = {
    fontWeight: 700,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: 11,
  };

  const eventTime = {
    fontSize: 11,
    color: '#546E7A',
    whiteSpace: 'nowrap',
  };

  const eventBottomRow = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  };

  const typePill = (bg, fg) => ({
    fontSize: 10,
    background: bg,
    color: fg,
    padding: '2px 6px',
    borderRadius: 999,
    lineHeight: 1.2,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  });

  const statusRow = {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 10,
    color: '#607D8B',
  };

  const statusDot = (color) => ({
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: color,
  });

  const participantsRow = {
    fontSize: 10,
    color: '#78909C',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  // ---------- render ----------
  return (
    <section style={wrap}>
      <div style={innerCard}>
        {/* Header */}
        <div style={head}>
          <div style={headLeft}>
            <div style={headTitle}>{title}</div>
            <div style={headSubtitle}>
              Tap a session to edit. Use “{addLabel}” to schedule new time.
            </div>
          </div>

          <div style={headRight}>
            <div style={monthChipRow}>
              <div style={monthChip}>{monthName}</div>
            </div>
            <div style={headBtns}>
              <button
                style={navBtn}
                onClick={toPrev}
                aria-label="Previous Month"
              >
                ◀
              </button>
              <button style={todayPill} onClick={toToday}>
                Today
              </button>
              <button
                style={navBtn}
                onClick={toNext}
                aria-label="Next Month"
              >
                ▶
              </button>
              <button
                type="button"
                style={headerAddBtn}
                onClick={handleAddFromHeader}
              >
                {addLabel}
              </button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={legendRow}>
          <div style={legendItem}>
            <span style={legendSwatch('#FF7043')} />
            Strategy
          </div>
          <div style={legendItem}>
            <span style={legendSwatch('#1E88E5')} />
            Resume
          </div>
          <div style={legendItem}>
            <span style={legendSwatch('#8E24AA')} />
            Interview
          </div>
          <div style={legendItem}>
            <span style={legendSwatch('#90A4AE')} />
            Other
          </div>
        </div>

        {/* Weekday row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            marginBottom: 4,
          }}
        >
          {WEEKDAYS.map((w) => (
            <div key={w} style={weekday}>
              {w}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={grid}>
          {days.map(({ date, inMonth, key }) => {
            const isToday = key === todayStr;
            const list = events[key] || [];
            return (
              <div key={key} style={cell(inMonth, isToday)}>
                <div style={dateBadge(isToday)}>{date.getDate()}</div>

                <div style={eventsWrap}>
                  {list.map((e, i) => {
                    const { strip, pillBg, pillFg } = typeColors(e.type);
                    const statusColor = statusDotColor(e.status);

                    return (
                      <div
                        key={`${key}-${i}`}
                        style={eventCard(strip)}
                        onClick={() => editItem(key, e, i)}
                      >
                        <div style={eventStrip(strip)} />
                        <div style={eventContent}>
                          <div style={eventTopRow}>
                            <div style={eventTitle}>
                              {e.title || e.client || 'Session'}
                            </div>
                            <div style={eventTime}>
                              {e.time ? e.time : ''}
                            </div>
                          </div>

                          {e.participants && (
                            <div style={participantsRow}>
                              {e.participants}
                            </div>
                          )}

                          <div style={eventBottomRow}>
                            <div style={typePill(pillBg, pillFg)}>
                              <span>{e.type || 'Session'}</span>
                            </div>
                            <div style={statusRow}>
                              <span style={statusDot(statusColor)} />
                              <span>{e.status || 'Scheduled'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal form */}
      {formOpen && (
        <CalendarEventForm
          mode={formMode}
          initial={formInitial}
          onClose={() => {
            setFormOpen(false);
            setFormInitial(null);
          }}
          onSave={handleSave}
          onDelete={handleDelete}
          typeChoices={typeChoices}
          statusChoices={statusChoices}
        />
      )}
    </section>
  );
}
