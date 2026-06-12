// components/calendar/CalendarDayPanel.js
// Persistent right-rail selected-day detail panel used by role calendars.

import React from 'react';

function typeColors(type) {
  const t = (type || '').toLowerCase();

  if (t === 'strategy' || t === 'coaching') {
    return { strip: '#FF7043', pillBg: '#FFF3E0', pillFg: '#E65100' };
  }
  if (t === 'resume') {
    return { strip: '#546E7A', pillBg: '#ECEFF1', pillFg: '#37474F' };
  }
  if (t === 'interview') {
    return { strip: '#1A4B8F', pillBg: '#E3EDF7', pillFg: '#102A43' };
  }
  if (t === 'screen' || t === 'phone screen') {
    return { strip: '#4CAF50', pillBg: '#E8F5E9', pillFg: '#2E7D32' };
  }
  if (t === 'offer') {
    return { strip: '#FF7043', pillBg: '#FFF3E0', pillFg: '#C75B33' };
  }
  if (t === 'sourcing') {
    return { strip: '#FF9800', pillBg: '#FFF8E1', pillFg: '#E65100' };
  }
  if (t === 'task' || t === 'appointment') {
    return { strip: '#B0BEC5', pillBg: '#F5F7F9', pillFg: '#37474F' };
  }

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
  const timezone = event?.timezone || event?.foundryTimezone;
  const abbr = getTimezoneAbbr(event?.date, time, timezone);
  return `${time} ${abbr}`;
}

function fmtLongDayLabel(dateStr) {
  if (!dateStr) return '';

  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  if (dateStr === todayStr) return 'Today';

  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getFoundryJoinUrl(event) {
  return (
    event?.foundryJoinUrl ||
    event?.foundryGuestJoinUrl ||
    event?.joinUrl ||
    event?.meetingUrl ||
    ''
  );
}

export default function CalendarDayPanel({ selectedDate, events = [], onAdd, onEdit, isMobile = false }) {
  const label = selectedDate ? fmtLongDayLabel(selectedDate) : 'Select a day';

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.68)',
        border: '1px solid rgba(255,255,255,0.22)',
        borderRadius: 14,
        boxShadow: '0 6px 20px rgba(15,23,42,0.10)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        marginBottom: 12,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 14px 10px',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#112033', lineHeight: 1.3 }}>
            {label}
          </div>
          {selectedDate && (
            <div style={{ fontSize: 11, color: '#90A4AE', marginTop: 2 }}>
              {events.length > 0 ? `${events.length} event${events.length !== 1 ? 's' : ''}` : 'No events'}
            </div>
          )}
        </div>

        {selectedDate && onAdd && (
          <button
            type="button"
            onClick={() => onAdd(selectedDate)}
            style={{
              background: '#FF7043',
              border: 'none',
              color: '#fff',
              borderRadius: 6,
              padding: '5px 10px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 3px 8px rgba(255,112,67,0.28)',
            }}
          >
            + Add
          </button>
        )}
      </div>

      <div
        style={{
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxHeight: isMobile ? 'none' : 320,
          overflowY: isMobile ? 'visible' : 'auto',
        }}
      >
        {!selectedDate && (
          <div style={{ textAlign: 'center', padding: '20px 8px', color: '#B0BEC5', fontSize: 12 }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>📅</div>
            {isMobile ? 'Tap any day to see its events' : 'Click any day to see its events'}
          </div>
        )}

        {selectedDate && events.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 8px', color: '#90A4AE', fontSize: 12 }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>🎉</div>
            <div style={{ fontWeight: 700, color: '#607D8B', marginBottom: 2 }}>No events</div>
            Enjoy your free time!
          </div>
        )}

        {events.map((e) => {
          const { strip, pillBg, pillFg } = typeColors(e.type);
          const joinUrl = getFoundryJoinUrl(e);

          const titleText =
            e.title ||
            e.client ||
            (e.candidateName && e.type
              ? `${e.candidateName} – ${e.type}`
              : e.candidateName || e.type || 'Item');

          const startTime = e.time || '09:00';
          const displayStartTime = formatEventTime(e);
          const [h, m] = startTime.split(':').map(Number);
          const endH = Number.isFinite(h) ? h + 1 : 10;
          const endTime = `${String(endH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;

          return (
            <button
              key={e.id || `${e.date}-${e.time}-${titleText}`}
              type="button"
              onClick={() => e.id && onEdit?.(e.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                border: '1px solid #E5E7EB',
                borderRadius: 10,
                background: '#fff',
                overflow: 'hidden',
                cursor: 'pointer',
                padding: 0,
                boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
              }}
            >
              <div style={{ height: 3, background: strip }} />

              <div style={{ padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: '#90A4AE', fontWeight: 700, marginBottom: 2 }}>
                  {displayStartTime} – {endTime}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#112033',
                    marginBottom: 4,
                    lineHeight: 1.3,
                  }}
                >
                  {titleText}
                </div>

                {e.candidateName && e.title && (
                  <div style={{ fontSize: 11, color: '#78909C', marginBottom: 4 }}>{e.candidateName}</div>
                )}

                {joinUrl && (
                  <a
                    href={joinUrl}
                    onClick={(event) => event.stopPropagation()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 6,
                      padding: '5px 9px',
                      borderRadius: 999,
                      background: '#1A4B8F',
                      color: '#FFFFFF',
                      fontSize: 11,
                      fontWeight: 800,
                      textDecoration: 'none',
                      boxShadow: '0 3px 8px rgba(26,75,143,0.22)',
                    }}
                  >
                    Join Meeting
                  </a>
                )}

                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 10,
                      background: pillBg,
                      color: pillFg,
                      padding: '1px 6px',
                      borderRadius: 999,
                      fontWeight: 700,
                    }}
                  >
                    {e.type}
                  </span>

                  {e.status && e.status !== 'Scheduled' && (
                    <span
                      style={{
                        fontSize: 10,
                        background: '#F5F7F9',
                        color: '#90A4AE',
                        padding: '1px 6px',
                        borderRadius: 999,
                        fontWeight: 700,
                      }}
                    >
                      {e.status}
                    </span>
                  )}

                  {e.enableVideo && (
                    <span
                      style={{
                        fontSize: 10,
                        background: 'rgba(26,75,143,0.10)',
                        color: '#1A4B8F',
                        padding: '1px 6px',
                        borderRadius: 999,
                        fontWeight: 700,
                      }}
                    >
                      Audio/Video
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}