// components/calendar/RecruiterCalendarInterface.js
import React, { useMemo, useState } from 'react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_PER_DAY = 3;

// recruiter-oriented defaults (for future wiring if you want to use them)
const TYPE_CHOICES = ['Interview', 'Screen', 'Sourcing', 'Offer', 'Task', 'Appointment'];

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

/* ---------------- type colors (muted, recruiter-focused) ---------------- */
function typeColors(type) {
  const t = (type || '').toLowerCase();

  if (t === 'interview') {
    return {
      strip: '#1A4B8F',      // strong blue
      pillBg: '#E3EDF7',
      pillFg: '#102A43',
    };
  }
  if (t === 'screen' || t === 'phone screen') {
    return {
      strip: '#546E7A',      // slate
      pillBg: '#ECEFF1',
      pillFg: '#263238',
    };
  }
  if (t === 'offer') {
    return {
      strip: '#FF7043',      // orange highlight
      pillBg: '#FFF3E0',
      pillFg: '#C75B33',
    };
  }
  if (t === 'sourcing') {
    return {
      strip: '#90A4AE',
      pillBg: '#F5F7FB',
      pillFg: '#455A64',
    };
  }
  if (t === 'task' || t === 'appointment') {
    return {
      strip: '#B0BEC5',
      pillBg: '#F5F7F9',
      pillFg: '#37474F',
    };
  }

  // default neutral
  return {
    strip: '#90A4AE',
    pillBg: '#F5F7FB',
    pillFg: '#455A64',
  };
}

/* ---------------- component ---------------- */
export default function RecruiterCalendarInterface({
  title = 'Recruiter Calendar',
  // events: [{ id, date:"YYYY-MM-DD", time, title, type, candidate, company }]
  events = [],
}) {
  /* ---------- month nav ---------- */
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

  /* ---------- group by date ---------- */
  const eventsByDate = useMemo(() => {
    const map = {};
    for (const e of events || []) {
      if (!e || !e.date) continue;
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return map;
  }, [events]);

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

  /* ---------- styles ---------- */
  const shell = {
    background: '#F4F6F8',
    borderRadius: 16,
    border: '1px solid #E0E0E0',
    padding: 16,
    width: '100%',
    boxSizing: 'border-box',
  };

  const header = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  };

  const titleBlock = {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  };

  const titleStyle = {
    fontWeight: 800,
    fontSize: 18,
    color: '#112033',
  };

  const subtitleStyle = {
    fontSize: 12,
    color: '#607D8B',
  };

  const navGroup = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  };

  const navBtn = {
    background: '#FFFFFF',
    border: '1px solid #CFD8DC',
    color: '#455A64',
    padding: '4px 8px',
    borderRadius: 999,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 600,
    minWidth: 30,
  };

  const todayBtn = {
    ...navBtn,
    border: '1px solid #1A4B8F',
    color: '#1A4B8F',
  };

  const addBtn = {
    background: '#FF7043',
    border: 'none',
    color: 'white',
    padding: '6px 14px',
    borderRadius: 999,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 11,
    boxShadow: '0 6px 14px rgba(255,112,67,0.35)',
    whiteSpace: 'nowrap',
  };

  const weekdayRow = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(0,1fr))',
    marginBottom: 4,
  };

  const weekdayCell = {
    fontSize: 11,
    color: '#607D8B',
    textAlign: 'center',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(0,1fr))',
    gridAutoRows: 'minmax(110px,1fr)',
    gap: 6,
  };

  const cell = (inMonth, isToday) => ({
    background: isToday
      ? 'linear-gradient(135deg,#FFFFFF,#E3EDF5)'
      : inMonth
      ? '#FFFFFF'
      : '#F1F3F5',
    borderRadius: 12,
    padding: 8,
    border: isToday ? '1px solid rgba(255,112,67,0.75)' : '1px solid #E0E0E0',
    boxShadow: isToday
      ? '0 0 0 1px rgba(255,112,67,0.35)'
      : '0 1px 3px rgba(15,23,42,0.06)',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  });

  const dateBadge = (isToday) => ({
    alignSelf: 'flex-end',
    fontSize: 11,
    fontWeight: 800,
    color: isToday ? '#FF7043' : '#455A64',
    background: isToday ? '#FFFFFF' : 'transparent',
    borderRadius: 999,
    padding: isToday ? '2px 8px' : 0,
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
    width: '100%',
    background: '#F9FBFF',
    color: '#263238',
    fontSize: 11,
    display: 'grid',
    gridTemplateColumns: '3px 1fr',
    gap: 6,
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

  const eventSub = {
    fontSize: 10,
    color: '#78909C',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
    marginTop: 2,
  });

  const moreRow = {
    marginTop: 2,
    fontSize: 10,
    color: '#90A4AE',
  };

  /* ---------- render ---------- */
  return (
    <section style={shell}>
      {/* Header */}
      <div style={header}>
        <div style={titleBlock}>
          <div style={titleStyle}>{title}</div>
          <div style={subtitleStyle}>
            {monthName} · Plan interviews, screens, and hiring tasks at a glance.
          </div>
        </div>

        <div style={navGroup}>
          <button type="button" style={navBtn} onClick={toPrev} aria-label="Previous month">
            ◀
          </button>
          <button type="button" style={todayBtn} onClick={toToday}>
            Today
          </button>
          <button type="button" style={navBtn} onClick={toNext} aria-label="Next month">
            ▶
          </button>
          {/* Visual-only for now; wiring can come later */}
          <button type="button" style={addBtn}>
            + Add Item
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div style={weekdayRow}>
        {WEEKDAYS.map((d) => (
          <div key={d} style={weekdayCell}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={gridStyle}>
        {days.map(({ key, date, inMonth }) => {
          const isToday = key === todayStr;
          const list = eventsByDate[key] || [];
          const visible = list.slice(0, MAX_PER_DAY);
          const extra = list.length - visible.length;

          return (
            <div key={key} style={cell(inMonth, isToday)}>
              <div style={dateBadge(isToday)}>{date.getDate()}</div>

              <div style={eventsWrap}>
                {visible.map((e) => {
                  const { strip, pillBg, pillFg } = typeColors(e.type);

                  const title =
                    e.title ||
                    (e.candidate && e.type
                      ? `${e.candidate} – ${e.type}`
                      : e.candidate || e.type || 'Item');

                  const subtitle =
                    e.company || e.req || e.jobTitle || '';

                  return (
                    <div
                      key={e.id || `${key}-${e.time || ''}-${title}`}
                      style={eventCard(strip)}
                    >
                      <div style={eventStrip(strip)} />
                      <div style={eventContent}>
                        <div style={eventTopRow}>
                          <div style={eventTitle}>{title}</div>
                          <div style={eventTime}>{e.time || ''}</div>
                        </div>

                        {subtitle && <div style={eventSub}>{subtitle}</div>}

                        {e.type && (
                          <span style={typePill(pillBg, pillFg)}>
                            {e.type}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {extra > 0 && (
                  <div style={moreRow}>+{extra} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
