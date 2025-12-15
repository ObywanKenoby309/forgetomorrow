// components/calendar/RecruiterCalendar.js
import React, { useEffect, useMemo, useState } from 'react';
import RecruiterCalendarEventForm from './RecruiterCalendarEventForm';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_PER_DAY = 3;

// Recruiter-oriented type palette (muted gray/blue + orange accents)
function typeColors(type) {
  const t = (type || '').toLowerCase();

  if (t === 'interview') {
    return {
      strip: '#1A4B8F', // strong blue
      pillBg: '#E3EDF7',
      pillFg: '#102A43',
    };
  }
  if (t === 'screen' || t === 'phone screen') {
    return {
      strip: '#546E7A', // slate
      pillBg: '#ECEFF1',
      pillFg: '#263238',
    };
  }
  if (t === 'offer') {
    return {
      strip: '#FF7043', // orange highlight
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

// utils
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

// Normalize event data into a stable internal shape
function normalizeEvent(raw) {
  if (!raw) return null;

  const date =
    raw.date ||
    raw.sessionDate ||
    raw.startDate ||
    null;

  const time =
    raw.time ||
    raw.sessionTime ||
    raw.startTime ||
    '';

  const candidateName =
    raw.candidateName ||
    raw.candidate ||
    raw.clientName ||
    raw.client ||
    '';

  const candidateUserId =
    raw.candidateUserId ||
    raw.clientUserId ||
    raw.userId ||
    null;

  const candidateType =
    raw.candidateType === 'internal' || raw.candidateType === 'external'
      ? raw.candidateType
      : candidateUserId
      ? 'internal'
      : 'external';

  // 🔹 unify scope/calendarScope, default to 'personal'
  const rawScope = raw.scope || raw.calendarScope;
  const scope =
    rawScope === 'personal' || rawScope === 'team'
      ? rawScope
      : 'personal';

  return {
    id: raw.id,
    date: date || new Date().toISOString().slice(0, 10),
    time: time || '09:00',
    title: raw.title || '',
    type: raw.type || 'Interview',
    status: raw.status || 'Scheduled',
    notes: raw.notes || '',
    candidateName,
    candidateUserId,
    candidateType,
    company: raw.company || '',
    jobTitle: raw.jobTitle || raw.job || '',
    req: raw.req || raw.requisition || '',
    scope,
  };
}

function normalizeEvents(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map(normalizeEvent)
    .filter(Boolean)
    .sort((a, b) => {
      const aTime = new Date(`${a.date}T${a.time || '00:00'}`);
      const bTime = new Date(`${b.date}T${b.time || '00:00'}`);
      return aTime - bTime;
    });
}

/**
 * RecruiterCalendar
 *
 * Props:
 *   title: string
 *   seed: optional initial events array
 *   storageKey: ignored (legacy)
 *
 *  Events are loaded from /api/recruiter/calendar if available.
 *  If that endpoint is not yet implemented, the calendar still works
 *  in-memory for now.
 */
export default function RecruiterCalendar({
  title = 'Recruiter Calendar',
  seed = [],
  // storageKey is accepted for compatibility but not used (no localStorage).
  storageKey,
}) {
  // Month navigation
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

  // 🔹 Personal is the default view; team is the secondary/shared view.
  const [viewScope, setViewScope] = useState('personal'); // 'team' | 'personal'

  // Events and loading
  const [events, setEvents] = useState(() => normalizeEvents(seed));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [modal, setModal] = useState({
    open: false,
    mode: 'add',
    eventId: null,
    initial: null,
  });

  const TYPE_CHOICES = ['Interview', 'Screen', 'Sourcing', 'Offer', 'Task', 'Appointment'];
  const STATUS_CHOICES = ['Scheduled', 'Completed', 'Rescheduled', 'Cancelled'];

  // Load from API (if available)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/recruiter/calendar');
        if (!res.ok) {
          console.warn('Recruiter calendar API not ready:', res.status);
          return;
        }
        const data = await res.json().catch(() => ({}));
        const raw = Array.isArray(data)
          ? data
          : data.events || data.items || [];
        if (!cancelled) {
          setEvents(normalizeEvents(raw));
        }
      } catch (err) {
        console.warn(
          'Recruiter calendar load failed (using seed/local only):',
          err
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter by scope for rendering
  // 🔹 Team view: ONLY team events
  // 🔹 Personal view: team + personal (everything relevant to me)
  const scopedEvents = useMemo(() => {
    return events.filter((e) =>
      viewScope === 'team'
        ? e.scope === 'team'
        : true
    );
  }, [events, viewScope]);

  // Group by date
  const eventsByDate = useMemo(() => {
    const map = {};
    for (const e of scopedEvents || []) {
      if (!e || !e.date) continue;
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return map;
  }, [scopedEvents]);

  // Grid
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

  // ───────────────────────── Styles ─────────────────────────
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
    flexWrap: 'wrap',
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
    flexWrap: 'wrap',
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

  const scopeToggleWrap = {
    display: 'flex',
    gap: 8,
    marginBottom: 6,
  };

  const scopeBtnBase = {
    padding: '4px 10px',
    borderRadius: 999,
    border: '1px solid #CFD8DC',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    background: '#FFFFFF',
    color: '#455A64',
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
    cursor: 'pointer',
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

  // ───────────────────────── Modal handlers ─────────────────────────

  const openAdd = () => {
    const today = new Date().toISOString().slice(0, 10);
    const defaultScope =
      viewScope === 'team' ? 'team' : 'personal';

    setModal({
      open: true,
      mode: 'add',
      eventId: null,
      initial: {
        title: '',
        date: today,
        time: '09:00',
        type: 'Interview',
        status: 'Scheduled',
        notes: '',
        candidateType: 'external',
        candidateUserId: null,
        candidateName: '',
        // seed both names so form + normalization stay in sync
        calendarScope: defaultScope,
        scope: defaultScope,
      },
    });
  };

  const openEdit = (eventId) => {
    const existing = events.find((e) => e.id === eventId);
    if (!existing) return;
    setModal({
      open: true,
      mode: 'edit',
      eventId,
      // form knows how to read scope/calendarScope; we pass both here
      initial: {
        ...existing,
        calendarScope: existing.scope,
      },
    });
  };

  const closeModal = () => {
    setModal({
      open: false,
      mode: 'add',
      eventId: null,
      initial: null,
    });
    setSaving(false);
  };

  const upsertLocal = (eventData, mode, eventId) => {
    const normalized = normalizeEvent({
      ...eventData,
      id: mode === 'edit' ? eventId : eventData.id || Date.now().toString(),
    });

    setEvents((prev) => {
      if (mode === 'edit') {
        const next = prev.map((e) => (e.id === normalized.id ? normalized : e));
        return normalizeEvents(next);
      }
      const next = [...prev, normalized];
      return normalizeEvents(next);
    });
  };

  const handleSave = async (formData) => {
    const mode = modal.mode;
    const eventId = modal.eventId || formData.id;

    try {
      setSaving(true);

      const scopeFromForm =
        formData.calendarScope === 'team' || formData.calendarScope === 'personal'
          ? formData.calendarScope
          : 'personal';

      const payload = {
        id: eventId,
        title: formData.title,
        date: formData.date,
        time: formData.time,
        type: formData.type,
        status: formData.status,
        notes: formData.notes,
        candidateType: formData.candidateType,
        candidateUserId: formData.candidateUserId,
        candidateName: formData.candidateName,
        // 🔹 backend + local both use `scope`
        scope: scopeFromForm,
      };

      let finalEvent = payload;

      try {
        const res = await fetch('/api/recruiter/calendar', {
          method: mode === 'edit' ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const raw = data.event || data.item || data;
          finalEvent = {
            ...payload,
            ...(raw || {}),
          };
        } else {
          console.warn(
            'Recruiter calendar save failed (using optimistic local update). Status:',
            res.status
          );
        }
      } catch (err) {
        console.warn(
          'Recruiter calendar save API error (using optimistic local update):',
          err
        );
      }

      upsertLocal(finalEvent, mode, eventId);
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const eventId = modal.eventId;
    if (!eventId) return;

    try {
      setSaving(true);

      try {
        const res = await fetch('/api/recruiter/calendar', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: eventId }),
        });

        if (!res.ok) {
          console.warn(
            'Recruiter calendar delete failed (removing locally anyway). Status:',
            res.status
          );
        }
      } catch (err) {
        console.warn(
          'Recruiter calendar delete API error (removing locally anyway):',
          err
        );
      }

      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  // ───────────────────────── Render ─────────────────────────
  return (
    <>
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
            <button
              type="button"
              style={navBtn}
              onClick={toPrev}
              aria-label="Previous month"
            >
              ◀
            </button>
            <button type="button" style={todayBtn} onClick={toToday}>
              Today
            </button>
            <button
              type="button"
              style={navBtn}
              onClick={toNext}
              aria-label="Next month"
            >
              ▶
            </button>
            <button type="button" style={addBtn} onClick={openAdd}>
              + Add Item
            </button>
          </div>
        </div>

        {/* Personal / Team toggle — personal first */}
        <div style={scopeToggleWrap}>
          <button
            type="button"
            onClick={() => setViewScope('personal')}
            style={{
              ...scopeBtnBase,
              border:
                viewScope === 'personal'
                  ? '1px solid #FF7043'
                  : scopeBtnBase.border,
              background:
                viewScope === 'personal'
                  ? 'rgba(255,112,67,0.08)'
                  : scopeBtnBase.background,
              color:
                viewScope === 'personal'
                  ? '#FF7043'
                  : scopeBtnBase.color,
            }}
          >
            Personal (me)
          </button>
          <button
            type="button"
            onClick={() => setViewScope('team')}
            style={{
              ...scopeBtnBase,
              border:
                viewScope === 'team'
                  ? '1px solid #1A4B8F'
                  : scopeBtnBase.border,
              background:
                viewScope === 'team'
                  ? 'rgba(26,75,143,0.08)'
                  : scopeBtnBase.background,
              color:
                viewScope === 'team'
                  ? '#1A4B8F'
                  : scopeBtnBase.color,
            }}
          >
            Team (shared)
          </button>
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

                    const titleText =
                      e.title ||
                      (e.candidateName && e.type
                        ? `${e.candidateName} – ${e.type}`
                        : e.candidateName || e.type || 'Item');

                    const subtitle =
                      e.company || e.req || e.jobTitle || '';

                    const scopeTag =
                      e.scope === 'personal' ? 'Personal' : 'Team';

                    return (
                      <div
                        key={e.id || `${key}-${e.time || ''}-${titleText}`}
                        style={eventCard(strip)}
                        onClick={() => e.id && openEdit(e.id)}
                      >
                        <div style={eventStrip(strip)} />
                        <div style={eventContent}>
                          <div style={eventTopRow}>
                            <div style={eventTitle}>{titleText}</div>
                            <div style={eventTime}>{e.time || ''}</div>
                          </div>

                          {subtitle && <div style={eventSub}>{subtitle}</div>}

                          <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                            {e.type && (
                              <span style={typePill(pillBg, pillFg)}>
                                {e.type}
                              </span>
                            )}
                            <span
                              style={typePill(
                                e.scope === 'personal'
                                  ? 'rgba(255,112,67,0.12)'
                                  : '#ECEFF1',
                                e.scope === 'personal'
                                  ? '#C75B33'
                                  : '#607D8B'
                              )}
                            >
                              {scopeTag}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {extra > 0 && (
                    <div style={moreRow}>+{extra} more</div>
                  )}

                  {loading && list.length === 0 && key === todayStr && (
                    <div
                      style={{
                        fontSize: 11,
                        color: '#90A4AE',
                        marginTop: 4,
                      }}
                    >
                      Loading…
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {modal.open && (
        <RecruiterCalendarEventForm
          mode={modal.mode}
          initial={modal.initial}
          onClose={closeModal}
          onSave={handleSave}
          onDelete={modal.mode === 'edit' ? handleDelete : undefined}
          typeChoices={TYPE_CHOICES}
          statusChoices={STATUS_CHOICES}
          saving={saving}
        />
      )}
    </>
  );
}
