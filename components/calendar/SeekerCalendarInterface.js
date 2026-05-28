// components/calendar/SeekerCalendarInterface.js
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import SeekerCalendarEventForm from './SeekerCalendarEventForm';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_PER_DAY = 3;

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function fmtYMD(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function typeColors(type) {
  const t = (type || '').toLowerCase();

  if (t === 'interview') return { strip: '#1A4B8F', pillBg: '#E3EDF7', pillFg: '#102A43' };
  if (t === 'application') return { strip: '#0097A7', pillBg: '#E0F7FA', pillFg: '#006064' };
  if (t === 'deadline') return { strip: '#FF7043', pillBg: '#FFF3E0', pillFg: '#C75B33' };
  if (t === 'task') return { strip: '#546E7A', pillBg: '#ECEFF1', pillFg: '#263238' };
  if (t === 'appointment') return { strip: '#43A047', pillBg: '#E8F5E9', pillFg: '#1B5E20' };
  if (t === 'coaching' || t === 'strategy') return { strip: '#FF7043', pillBg: '#FFF3E0', pillFg: '#E65100' };

  return { strip: '#90A4AE', pillBg: '#F5F7FB', pillFg: '#455A64' };
}

function getTimeZoneOffsetMs(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);

  const values = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') values[part.type] = part.value;
  });

  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );

  return asUtc - date.getTime();
}

function buildScheduledAt(date, time, timezone) {
  const [year, month, day] = String(date).split('-').map(Number);
  const [hour, minute] = String(time || '09:00').split(':').map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour || 0, minute || 0, 0));
  const offsetMs = getTimeZoneOffsetMs(utcGuess, timezone);
  return new Date(utcGuess.getTime() - offsetMs).toISOString();
}

function getTimezoneAbbr(date, time, timezone) {
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';

  try {
    const instant = buildScheduledAt(date, time, tz);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short',
    }).formatToParts(new Date(instant));

    return parts.find((part) => part.type === 'timeZoneName')?.value || tz;
  } catch {
    return tz;
  }
}

function formatEventTime(event) {
  const time = event?.time || '09:00';
  const abbr = getTimezoneAbbr(event?.date, time, event?.timezone || event?.foundryTimezone);
  return `${time} ${abbr}`;
}

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

function ModalPortal({ children }) {
  if (typeof document === 'undefined') return children;
  return createPortal(children, document.body);
}

const SeekerCalendarInterface = forwardRef(function SeekerCalendarInterface(
  {
    title = 'My Calendar',
    events = [],
    onRefresh,
    onDaySelect,
    selectedDate: externalSelectedDate,
  },
  ref
) {
  const isMobile = useIsMobile(768);

  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('add');
  const [editorInitial, setEditorInitial] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [calView, setCalView] = useState('month');

  const todayStr = fmtYMD(new Date());
  const monthName = useMemo(
    () => cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' }),
    [cursor]
  );

  const eventsByDate = useMemo(() => {
    const map = {};

    for (const event of events || []) {
      if (!event?.date) continue;
      if (!map[event.date]) map[event.date] = [];
      map[event.date].push(event);
    }

    Object.keys(map).forEach((dateKey) => {
      map[dateKey].sort((a, b) =>
        `${a.date}T${a.time || '00:00'}`.localeCompare(`${b.date}T${b.time || '00:00'}`)
      );
    });

    return map;
  }, [events]);

  const openAdd = useCallback(
    (dateKey) => {
      setEditorMode('add');
      setEditingId(null);
      setEditorInitial({
        date: dateKey || externalSelectedDate || todayStr,
        time: '09:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
        title: '',
        type: 'Interview',
        status: 'Scheduled',
        notes: '',
      });
      setEditorOpen(true);
    },
    [externalSelectedDate, todayStr]
  );

  const openEditById = useCallback(
    (id) => {
      const event = events.find((ev) => ev.id === id);
      if (!event) return;

      setEditorMode('edit');
      setEditingId(event.id);
      setEditorInitial({
        date: event.date || todayStr,
        time: event.time || '09:00',
        timezone:
          event.timezone ||
          event.foundryTimezone ||
          Intl.DateTimeFormat().resolvedOptions().timeZone ||
          'America/New_York',
        title: event.title || '',
        type: event.type || 'Interview',
        status: event.status || 'Scheduled',
        notes: event.notes || '',
        enableVideo: Boolean(event.enableVideo),
        foundryJoinUrl: event.foundryJoinUrl || '',
        foundryGuestJoinUrl: event.foundryGuestJoinUrl || '',
      });
      setEditorOpen(true);
    },
    [events, todayStr]
  );

  useImperativeHandle(
    ref,
    () => ({
      openAdd,
      openEdit: openEditById,
    }),
    [openAdd, openEditById]
  );

  const closeEditor = () => {
    if (saving) return;
    setEditorOpen(false);
    setEditorInitial(null);
    setEditingId(null);
    setEditorMode('add');
  };

  const saveItem = async (form) => {
    if (!form.date || !form.time || !form.title?.trim()) {
      alert('Date, time, and title are required.');
      return;
    }

    const payloadBase = {
      date: form.date,
      time: form.time,
      timezone: form.timezone,
      title: form.title.trim(),
      type: form.type,
      status: form.status,
      notes: form.notes || '',
    };

    try {
      setSaving(true);

      const method = editorMode === 'edit' && editingId ? 'PUT' : 'POST';
      const res = await fetch('/api/seeker/calendar', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(method === 'PUT' ? { id: editingId, ...payloadBase } : payloadBase),
      });

      if (!res.ok) {
        console.error('Failed to save seeker calendar item', res.status, await res.text().catch(() => ''));
        alert('Could not save event. Please try again.');
        return;
      }
    } catch (err) {
      console.error('Error saving seeker calendar item:', err);
      alert('Could not save event. Please try again.');
    } finally {
      setSaving(false);
      closeEditor();
      onRefresh?.();
    }
  };

  const deleteItem = async () => {
    if (!editingId) return;
    if (!confirm('Delete this event?')) return;

    try {
      setSaving(true);

      const res = await fetch('/api/seeker/calendar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId }),
      });

      if (!res.ok) {
        console.error('Failed to delete seeker calendar item', res.status, await res.text().catch(() => ''));
        alert('Could not delete event. Please try again.');
        return;
      }
    } catch (err) {
      console.error('Error deleting seeker calendar item:', err);
      alert('Could not delete event. Please try again.');
    } finally {
      setSaving(false);
      closeEditor();
      onRefresh?.();
    }
  };

  const days = useMemo(() => {
    const first = startOfMonth(cursor);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - first.getDay());

    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return { date: d, inMonth: d.getMonth() === cursor.getMonth(), key: fmtYMD(d) };
    });
  }, [cursor]);

  const shell = {
    background: '#F4F6F8',
    borderRadius: 16,
    border: '1px solid #E0E0E0',
    padding: 16,
    width: '100%',
    boxSizing: 'border-box',
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

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7,minmax(0,1fr))',
    gridAutoRows: 'minmax(76px,1fr)',
    gap: 6,
  };

  const cell = (inMonth, isToday, isSelected) => ({
    background: isToday ? 'linear-gradient(135deg,#FFFFFF,#E3EDF5)' : inMonth ? '#FFFFFF' : '#F1F3F5',
    borderRadius: 12,
    padding: 8,
    border: isSelected
      ? '1px solid rgba(26,75,143,0.95)'
      : isToday
      ? '1px solid rgba(26,75,143,0.55)'
      : '1px solid #E0E0E0',
    boxShadow: isSelected
      ? '0 0 0 1px rgba(26,75,143,0.35)'
      : isToday
      ? '0 0 0 1px rgba(26,75,143,0.20)'
      : '0 1px 3px rgba(15,23,42,0.06)',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    cursor: 'pointer',
  });

  const LEGEND = [
    { label: 'Interview', color: '#1A4B8F' },
    { label: 'Application', color: '#0097A7' },
    { label: 'Deadline', color: '#FF7043' },
    { label: 'Task', color: '#546E7A' },
  ];

  if (isMobile === null) return <div style={shell} />;

  if (isMobile) {
    return (
      <>
        <section style={shell}>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#112033', marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 12, color: '#607D8B', marginBottom: 12 }}>
            Tap a date · track your job search
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                style={{
                  fontSize: 11,
                  color: '#607D8B',
                  textAlign: 'center',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {d.slice(0, 1)}
              </div>
            ))}
          </div>

          <div style={gridStyle}>
            {days.map(({ key, date, inMonth }) => {
              const isToday = key === todayStr;
              const list = eventsByDate[key] || [];

              return (
                <div
                  key={key}
                  style={cell(inMonth, isToday, key === externalSelectedDate)}
                  onClick={() => onDaySelect?.(key, eventsByDate[key] || [])}
                >
                  <div
                    style={{
                      alignSelf: 'flex-end',
                      fontSize: 11,
                      fontWeight: 800,
                      color: isToday ? '#1A4B8F' : '#455A64',
                      background: isToday ? '#FFFFFF' : 'transparent',
                      borderRadius: 999,
                      padding: isToday ? '2px 8px' : 0,
                    }}
                  >
                    {date.getDate()}
                  </div>

                  {list.length > 0 && (
                    <div style={{ marginTop: 6, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {list.slice(0, 4).map((event) => {
                        const { strip } = typeColors(event.type);
                        return (
                          <span
                            key={event.id || `${key}-${event.time}-${event.title}`}
                            style={{ width: 6, height: 6, borderRadius: 999, background: strip }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => openAdd(externalSelectedDate || todayStr)}
            style={{
              marginTop: 14,
              width: '100%',
              background: '#FF7043',
              border: 'none',
              color: '#FFFFFF',
              borderRadius: 999,
              padding: '10px 14px',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: '0 6px 14px rgba(255,112,67,0.35)',
            }}
          >
            + Add Event
          </button>
        </section>

        {editorOpen && (
          <ModalPortal>
            <SeekerCalendarEventForm
              mode={editorMode}
              initial={editorInitial}
              onClose={closeEditor}
              onSave={saveItem}
              onDelete={editorMode === 'edit' ? deleteItem : undefined}
              saving={saving}
            />
          </ModalPortal>
        )}
      </>
    );
  }

  return (
    <>
      <section style={shell}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#112033' }}>{title}</div>
            <div style={{ fontSize: 12, color: '#607D8B' }}>{monthName}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button type="button" style={todayBtn} onClick={() => setCursor(startOfMonth(new Date()))}>
              Today
            </button>
            <button type="button" style={navBtn} onClick={() => setCursor((c) => addMonths(c, -1))} aria-label="Previous month">
              ‹
            </button>
            <span style={{ fontWeight: 800, fontSize: 14, color: '#112033', minWidth: 110, textAlign: 'center' }}>
              {monthName}
            </span>
            <button type="button" style={navBtn} onClick={() => setCursor((c) => addMonths(c, 1))} aria-label="Next month">
              ›
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', background: '#F1F3F5', borderRadius: 8, padding: 2, gap: 2 }}>
              {['Month', 'List'].map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setCalView(view.toLowerCase())}
                  style={{
                    background: calView === view.toLowerCase() ? '#fff' : 'transparent',
                    border: calView === view.toLowerCase() ? '1px solid #E0E0E0' : '1px solid transparent',
                    color: calView === view.toLowerCase() ? '#112033' : '#90A4AE',
                    borderRadius: 6,
                    padding: '3px 10px',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                    boxShadow: calView === view.toLowerCase() ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {view}
                </button>
              ))}
            </div>

            <button type="button" style={addBtn} onClick={() => openAdd(externalSelectedDate || todayStr)}>
              + Add Event
            </button>
          </div>
        </div>

        {calView === 'list' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#90A4AE', fontSize: 13 }}>No events scheduled.</div>
            ) : (
              events.map((event) => {
                const { strip, pillBg, pillFg } = typeColors(event.type);
                const titleText = event.title || event.type || 'Item';

                return (
                  <div
                    key={event.id || `${event.date}-${event.time}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '4px 100px 1fr',
                      border: '1px solid #E5E7EB',
                      borderRadius: 10,
                      overflow: 'hidden',
                      background: '#fff',
                      cursor: 'pointer',
                    }}
                    onClick={() => event.id && openEditById(event.id)}
                  >
                    <div style={{ background: strip }} />
                    <div style={{ padding: '10px 10px', borderRight: '1px solid #EEF2F7', fontSize: 11, fontWeight: 700, color: '#455A64' }}>
                      <div>{event.date}</div>
                      <div style={{ color: '#90A4AE', fontWeight: 500 }}>{formatEventTime(event)}</div>
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#112033', marginBottom: 4 }}>{titleText}</div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, background: pillBg, color: pillFg, padding: '2px 6px', borderRadius: 999, fontWeight: 700 }}>
                          {event.type}
                        </span>
                        {event.status && event.status !== 'Scheduled' && (
                          <span style={{ fontSize: 10, background: '#F5F7F9', color: '#90A4AE', padding: '2px 6px', borderRadius: 999, fontWeight: 700 }}>
                            {event.status}
                          </span>
                        )}
                        {event.enableVideo && (
                          <span style={{ fontSize: 10, background: 'rgba(26,75,143,0.10)', color: '#1A4B8F', padding: '2px 6px', borderRadius: 999, fontWeight: 700 }}>
                            Audio/Video
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  style={{
                    textAlign: 'center',
                    fontSize: 11,
                    color: '#607D8B',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            <div style={gridStyle}>
              {days.map(({ key, date, inMonth }) => {
                const isToday = key === todayStr;
                const isSelected = key === externalSelectedDate;
                const list = eventsByDate[key] || [];
                const visible = list.slice(0, MAX_PER_DAY);
                const extra = list.length - visible.length;

                return (
                  <div
                    key={key}
                    style={cell(inMonth, isToday, isSelected)}
                    onClick={() => onDaySelect?.(key, eventsByDate[key] || [])}
                  >
                    <div
                      style={{
                        alignSelf: 'flex-end',
                        fontSize: 11,
                        fontWeight: 800,
                        color: isToday ? '#1A4B8F' : '#455A64',
                        background: isToday ? '#FFFFFF' : 'transparent',
                        borderRadius: 999,
                        padding: isToday ? '2px 8px' : 0,
                      }}
                    >
                      {date.getDate()}
                    </div>

                    <div style={{ display: 'grid', gap: 4, marginTop: 4 }}>
                      {visible.map((event) => {
                        const { strip, pillBg, pillFg } = typeColors(event.type);
                        const titleText = event.title || event.type || 'Item';

                        return (
                          <div
                            key={event.id || `${key}-${event.time || ''}-${titleText}`}
                            style={{
                              marginTop: 2,
                              padding: '6px 8px 6px 6px',
                              borderRadius: 9,
                              border: '1px solid #E0E4EE',
                              background: '#F9FBFF',
                              color: '#263238',
                              fontSize: 11,
                              display: 'grid',
                              gridTemplateColumns: '3px 1fr',
                              gap: 6,
                              cursor: 'pointer',
                            }}
                            onClick={(evt) => {
                              evt.stopPropagation();
                              if (event.id) openEditById(event.id);
                            }}
                          >
                            <div style={{ width: 3, borderRadius: 999, background: strip }} />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'center' }}>
                                <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>
                                  {titleText}
                                </div>
                                <div style={{ fontSize: 11, color: '#546E7A', whiteSpace: 'nowrap' }}>{formatEventTime(event)}</div>
                              </div>

                              <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
                                {event.type && (
                                  <span style={{ fontSize: 10, background: pillBg, color: pillFg, padding: '2px 6px', borderRadius: 999, lineHeight: 1.2 }}>
                                    {event.type}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {extra > 0 && <div style={{ marginTop: 2, fontSize: 10, color: '#90A4AE' }}>+{extra} more</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10, paddingTop: 10, borderTop: '1px solid #E0E0E0' }}>
              {LEGEND.map(({ label, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#607D8B', fontWeight: 600 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
                  {label}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {editorOpen && (
        <ModalPortal>
          <SeekerCalendarEventForm
            mode={editorMode}
            initial={editorInitial}
            onClose={closeEditor}
            onSave={saveItem}
            onDelete={editorMode === 'edit' ? deleteItem : undefined}
            saving={saving}
          />
        </ModalPortal>
      )}
    </>
  );
});

export default SeekerCalendarInterface;
