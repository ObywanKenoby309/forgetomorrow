// components/calendar/CoachingCalendarEventForm.js
import React, { useEffect, useRef, useState } from 'react';

const VIDEO_INVITEE_LIMIT = 5;

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Riga',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

const TIMEZONE_LABELS = {
  'America/New_York': 'Eastern (ET)',
  'America/Chicago': 'Central (CT)',
  'America/Denver': 'Mountain (MT)',
  'America/Los_Angeles': 'Pacific (PT)',
  'America/Anchorage': 'Alaska (AKT)',
  'Pacific/Honolulu': 'Hawaii (HT)',
  'Europe/London': 'London (GMT/BST)',
  'Europe/Paris': 'Paris (CET/CEST)',
  'Europe/Berlin': 'Berlin (CET/CEST)',
  'Europe/Riga': 'Riga (EET/EEST)',
  'Asia/Tokyo': 'Tokyo (JST)',
  'Asia/Shanghai': 'Shanghai (CST)',
  'Australia/Sydney': 'Sydney (AET)',
};

function getBrowserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
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

function buildScheduledAt(date, time, timezone = getBrowserTimezone()) {
  const [year, month, day] = String(date).split('-').map(Number);
  const [hour, minute] = String(time || '09:00').split(':').map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour || 0, minute || 0, 0));
  const offsetMs = getTimeZoneOffsetMs(utcGuess, timezone);
  return new Date(utcGuess.getTime() - offsetMs).toISOString();
}

export default function CoachingCalendarEventForm({
  mode = 'add',
  initial = null,
  onClose,
  onSave,
  onDelete,
  typeChoices = [],
  statusChoices = [],
  saving = false,
}) {
  const firstRef = useRef(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [foundryScheduling, setFoundryScheduling] = useState(false);
  const busy = saving || foundryScheduling;

  const [form, setForm] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);

    const initialClientType =
      initial?.clientType === 'internal' || initial?.clientType === 'external'
        ? initial.clientType
        : initial?.clientUserId
        ? 'internal'
        : 'external';

    return {
      date: initial?.date || today,
      time: initial?.time || '09:00',
      timezone:
        initial?.timezone ||
        initial?.foundryTimezone ||
        getBrowserTimezone(),
      clientType: initialClientType,
      clientUserId: initial?.clientUserId || null,
      clientName: initial?.clientName || initial?.client || initial?.title || '',
      clientEmail: initial?.clientEmail || '',
      meetingMode:
        initial?.meetingMode === 'audio_video' || initial?.enableVideo
          ? 'audio_video'
          : 'calendar_only',
      type: initial?.type || typeChoices[0] || 'Strategy',
      status: initial?.status || statusChoices[0] || 'Scheduled',
      notes: initial?.notes || '',
    };
  });

  const [clientSearchTerm, setClientSearchTerm] = useState(
    (initial?.clientType === 'internal' && (initial?.clientName || initial?.client)) || ''
  );
  const [clientResults, setClientResults] = useState([]);
  const [clientSearchLoading, setClientSearchLoading] = useState(false);
  const [clientSearchError, setClientSearchError] = useState('');

  useEffect(() => {
    if (firstRef.current) firstRef.current.focus();
    const onEsc = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const label = {
    fontSize: 12,
    color: '#607D8B',
    marginBottom: 4,
    display: 'block',
  };

  const input = {
    border: '1px solid #DADCE0',
    borderRadius: 10,
    padding: '8px 10px',
    width: '100%',
    outline: 'none',
    background: '#FFFFFF',
    color: '#263238',
    fontSize: 14,
    boxSizing: 'border-box',
  };

  const sectionCard = {
    border: '1px solid #E5E7EB',
    borderRadius: 14,
    padding: 12,
    background: 'rgba(255,255,255,0.72)',
  };

  const meetingModeButton = (active) => ({
    borderRadius: 12,
    border: active ? '1px solid #FF7043' : '1px solid #CFD8DC',
    background: active ? 'rgba(255,112,67,0.09)' : '#FFFFFF',
    color: active ? '#C75B33' : '#455A64',
    padding: '10px 12px',
    fontSize: 13,
    fontWeight: 700,
    cursor: busy ? 'not-allowed' : 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    minHeight: 64,
    opacity: busy ? 0.72 : 1,
  });

  const meetingModeTitle = {
    display: 'block',
    fontSize: 13,
    fontWeight: 800,
    marginBottom: 2,
  };

  const meetingModeHelper = {
    display: 'block',
    fontSize: 11,
    color: '#78909C',
    lineHeight: 1.35,
    fontWeight: 500,
  };

  const update = (key, value) =>
    setForm((f) => ({
      ...f,
      [key]: value,
    }));

  useEffect(() => {
    if (form.clientType !== 'internal') return;

    const term = clientSearchTerm.trim();
    if (!term) {
      setClientResults([]);
      setClientSearchError('');
      return;
    }

    let active = true;
    const controller = new AbortController();

    async function run() {
      try {
        setClientSearchLoading(true);
        setClientSearchError('');

        const res = await fetch(`/api/contacts/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          if (!active) return;
          console.error('Contacts search failed:', await res.text());
          setClientResults([]);
          setClientSearchError('Search failed. Try again.');
          return;
        }

        const data = await res.json().catch(() => ({}));

        let results = [];
        if (Array.isArray(data.contacts)) {
          results = data.contacts;
        } else if (Array.isArray(data.results)) {
          results = data.results;
        }

        if (active) {
          setClientResults(results);
        }
      } catch (err) {
        if (!active) return;
        if (err.name === 'AbortError') return;
        console.error('Client search error', err);
        setClientResults([]);
        setClientSearchError('Search failed. Try again.');
      } finally {
        if (active) {
          setClientSearchLoading(false);
        }
      }
    }

    run();
    return () => {
      active = false;
      controller.abort();
    };
  }, [clientSearchTerm, form.clientType]);

  const selectClient = (c) => {
    const display = c.name || c.email;
    setForm((f) => ({
      ...f,
      clientType: 'internal',
      clientUserId: c.id,
      clientName: display,
      clientEmail: c.email || '',
    }));
    setClientSearchTerm(display);
    setClientResults([]);
    setClientSearchError('');
  };

  const clearSelectedClient = () => {
    setForm((f) => ({
      ...f,
      clientUserId: null,
      clientName: '',
      clientEmail: '',
    }));
    setClientSearchTerm('');
    setClientResults([]);
    setClientSearchError('');
  };

  const scheduleFoundryRoom = async ({ title, payloadInvitees }) => {
    const timezone = form.timezone || getBrowserTimezone();
    const scheduledAt = buildScheduledAt(form.date, form.time, timezone);

    const foundryInvitees = payloadInvitees.map((i) => {
      if (i.type === 'internal') {
        return {
          userId: i.userId,
          name: i.name,
        };
      }

      return {
        email: i.email,
        name: i.name || i.email,
      };
    });

    const res = await fetch('/api/foundry/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        scheduledAt,
        timezone,
        invitees: foundryInvitees,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || 'Could not schedule Foundry room.');
    }

    return {
      roomId: data.roomId,
      guestToken: data.guestToken,
      joinUrl: data.roomId ? `/foundry/${data.roomId}` : '',
      guestJoinUrl:
        data.roomId && data.guestToken
          ? `/foundry/join/${data.roomId}?code=${data.guestToken}`
          : '',
      scheduledAt,
      timezone,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.date || !form.time) {
      alert('Date and time are required.');
      return;
    }

    const name = (form.clientName || '').trim();
    const videoLimitActive = form.meetingMode === 'audio_video';

    if (form.clientType === 'internal') {
      if (!form.clientUserId) {
        alert('Please select a Forge contact for this client.');
        return;
      }
    } else if (!name) {
      alert('Please enter a client name.');
      return;
    }

    if (videoLimitActive && form.clientType === 'external' && !form.clientEmail.trim()) {
      alert('External clients need an email address for Audio/Video invites.');
      return;
    }

    const payloadInvitees =
      form.clientType === 'internal'
        ? [
            {
              type: 'internal',
              userId: form.clientUserId,
              name,
              email: form.clientEmail || '',
            },
          ]
        : [
            {
              type: 'external',
              name,
              email: form.clientEmail.trim(),
            },
          ];

    if (videoLimitActive && payloadInvitees.length > VIDEO_INVITEE_LIMIT) {
      alert(`Audio/Video meetings are limited to ${VIDEO_INVITEE_LIMIT} invitees.`);
      return;
    }

    let foundry = null;
    let finalNotes = form.notes || '';

    try {
      if (videoLimitActive) {
        setFoundryScheduling(true);
        foundry = await scheduleFoundryRoom({
          title: `Coaching session${name ? ` with ${name}` : ''}`,
          payloadInvitees,
        });

        const roomNote = `Foundry room: ${foundry.joinUrl}`;
        finalNotes = finalNotes.trim() ? `${finalNotes.trim()}

${roomNote}` : roomNote;
      }

      await onSave?.({
        ...form,
        notes: finalNotes,
        clientName: name,
        participants: name,
        clientEmail: form.clientEmail || '',
        invitees: payloadInvitees,
        enableVideo: videoLimitActive,
        foundryRoomId: foundry?.roomId || null,
        foundryGuestToken: foundry?.guestToken || null,
        foundryJoinUrl: foundry?.joinUrl || null,
        foundryGuestJoinUrl: foundry?.guestJoinUrl || null,
        foundryScheduledAt: foundry?.scheduledAt || null,
        foundryTimezone: foundry?.timezone || null,
      });
    } catch (err) {
      console.error('Coaching calendar VC scheduling error:', err);
      alert(err?.message || 'Could not schedule the Audio/Video meeting.');
    } finally {
      setFoundryScheduling(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.60)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 'clamp(88px, 12vh, 128px)',
        paddingBottom: 40,
        paddingLeft: 16,
        paddingRight: 16,
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg,#FFFFFF,#F9FAFB)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 700,
          maxHeight: 'calc(100vh - 150px)',
          overflowY: 'auto',
          boxShadow: '0 24px 60px rgba(15,23,42,0.55)',
          color: '#263238',
          border: '1px solid rgba(148,163,184,0.7)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderBottom: '1px solid #E5E7EB',
            gap: 16,
          }}
        >
          <h3
            style={{
              margin: 0,
              color: '#112033',
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {mode === 'edit' ? 'Edit Session' : 'Add Session'}
          </h3>

          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#90A4AE',
              fontWeight: 600,
            }}
          >
            Coaching
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'grid',
            gap: 14,
            padding: '16px 20px 20px',
          }}
        >
          <div style={sectionCard}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 12,
                marginBottom: 8,
              }}
            >
              <div style={{ ...label, marginBottom: 0 }}>Meeting Mode</div>
              <div style={{ fontSize: 11, color: '#90A4AE', lineHeight: 1.45 }}>
                {form.meetingMode === 'audio_video'
                  ? `1/${VIDEO_INVITEE_LIMIT} video invitee`
                  : 'Calendar-only session'}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={() => update('meetingMode', 'calendar_only')}
                style={meetingModeButton(form.meetingMode === 'calendar_only')}
                disabled={busy}
              >
                <span style={meetingModeTitle}>No Audio/Video</span>
                <span style={meetingModeHelper}>
                  Calendar session only. Use this for calls handled outside ForgeMeeting or in-person sessions.
                </span>
              </button>

              <button
                type="button"
                onClick={() => update('meetingMode', 'audio_video')}
                style={meetingModeButton(form.meetingMode === 'audio_video')}
                disabled={busy}
              >
                <span style={meetingModeTitle}>Audio/Video</span>
                <span style={meetingModeHelper}>
                  Creates a scheduled ForgeMeeting room for this coaching session.
                </span>
              </button>
            </div>
          </div>

          <div>
            <div style={{ ...label, marginBottom: 4 }}>Client Type</div>
            <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
              <label style={{ cursor: 'pointer', color: '#37474F' }}>
                <input
                  type="radio"
                  name="clientType"
                  checked={form.clientType === 'internal'}
                  onChange={() => {
                    update('clientType', 'internal');
                    update('clientUserId', null);
                    setClientSearchTerm(form.clientName || '');
                    setClientResults([]);
                    setClientSearchError('');
                  }}
                  style={{ marginRight: 6 }}
                />
                Forge user (from my contacts)
              </label>

              <label style={{ cursor: 'pointer', color: '#37474F' }}>
                <input
                  type="radio"
                  name="clientType"
                  checked={form.clientType === 'external'}
                  onChange={() => {
                    update('clientType', 'external');
                    update('clientUserId', null);
                    setClientSearchTerm('');
                    setClientResults([]);
                    setClientSearchError('');
                  }}
                  style={{ marginRight: 6 }}
                />
                External client
              </label>
            </div>
          </div>

          {form.clientType === 'internal' && (
            <div>
              <div style={label}>Client Contact</div>
              <input
                ref={firstRef}
                type="text"
                placeholder="Type a name, email, or headline…"
                value={clientSearchTerm}
                onChange={(e) => setClientSearchTerm(e.target.value)}
                style={{ ...input, marginBottom: 4 }}
              />

              {form.clientUserId && (
                <div
                  style={{
                    fontSize: 12,
                    marginBottom: 4,
                    color: '#455A64',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>Selected: {form.clientName || '(no name)'}</span>
                  <button
                    type="button"
                    onClick={clearSelectedClient}
                    style={{
                      fontSize: 11,
                      border: 'none',
                      background: 'transparent',
                      color: '#C62828',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Clear
                  </button>
                </div>
              )}

              {clientSearchLoading && <div style={{ fontSize: 12, color: '#90A4AE' }}>Searching…</div>}
              {clientSearchError && <div style={{ fontSize: 12, color: '#C62828' }}>{clientSearchError}</div>}

              {clientResults.length > 0 && (
                <ul
                  style={{
                    listStyle: 'none',
                    margin: '4px 0 0',
                    padding: 0,
                    maxHeight: 160,
                    overflowY: 'auto',
                    border: '1px solid #E5E7EB',
                    borderRadius: 10,
                    background: '#FFFFFF',
                  }}
                >
                  {clientResults.map((r) => (
                    <li
                      key={r.id}
                      onClick={() => selectClient(r)}
                      style={{
                        padding: '7px 9px',
                        fontSize: 13,
                        cursor: 'pointer',
                        borderBottom: '1px solid #F3F4F6',
                      }}
                    >
                      <div style={{ fontWeight: 600, color: '#111827' }}>{r.name}</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>
                        {r.email}
                        {r.headline ? ` • ${r.headline}` : ''}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {clientResults.length === 0 &&
                clientSearchTerm.trim() &&
                !clientSearchLoading &&
                !clientSearchError && (
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>No contacts matched that search.</div>
                )}
            </div>
          )}

          {form.clientType === 'external' && (
            <div>
              <label style={label}>Client Name</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: form.meetingMode === 'audio_video' ? '1fr 1fr' : '1fr',
                  gap: 12,
                }}
              >
                <input
                  ref={firstRef}
                  type="text"
                  value={form.clientName}
                  onChange={(e) => update('clientName', e.target.value)}
                  style={input}
                  placeholder="e.g. John Doe (Acme Corp)"
                />

                {form.meetingMode === 'audio_video' && (
                  <input
                    type="email"
                    value={form.clientEmail}
                    onChange={(e) => update('clientEmail', e.target.value)}
                    style={input}
                    placeholder="client@email.com"
                  />
                )}
              </div>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1.2fr',
              gap: 12,
            }}
          >
            <div>
              <label style={label}>Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={(e) => update('date', e.target.value)}
                style={input}
              />
            </div>

            <div>
              <label style={label}>Time</label>
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={(e) => update('time', e.target.value)}
                style={input}
              />
            </div>

            <div>
              <label style={label}>Timezone</label>
              <select
                name="timezone"
                value={form.timezone}
                onChange={(e) => update('timezone', e.target.value)}
                style={input}
                disabled={busy}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {TIMEZONE_LABELS[tz] || tz}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            <div>
              <label style={label}>Type</label>
              <select
                name="type"
                value={form.type}
                onChange={(e) => update('type', e.target.value)}
                style={input}
              >
                {(typeChoices.length ? typeChoices : ['Strategy', 'Resume', 'Interview']).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={label}>Status</label>
              <select
                name="status"
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
                style={input}
              >
                {(statusChoices.length ? statusChoices : ['Scheduled', 'Completed', 'No-show']).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={label}>Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={3}
              style={{ ...input, resize: 'vertical', minHeight: 90 }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 4,
            }}
          >
            {mode === 'edit' ? (
              !confirmingDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  disabled={busy}
                  style={{
                    background: 'white',
                    color: '#B71C1C',
                    border: '1px solid #F5C6CB',
                    padding: '6px 10px',
                    borderRadius: 999,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  Delete
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#B71C1C', fontSize: 12 }}>Delete this session?</span>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={busy}
                    style={{
                      background: 'white',
                      border: '1px solid #ccc',
                      padding: '6px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete?.()}
                    disabled={busy}
                    style={{
                      background: '#E53935',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    Confirm Delete
                  </button>
                </div>
              )
            ) : (
              <span />
            )}

            {!confirmingDelete && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={busy}
                  style={{
                    background: 'white',
                    border: '1px solid #CFD8DC',
                    padding: '8px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    color: '#455A64',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  style={{
                    background: '#FF7043',
                    color: 'white',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: 999,
                    cursor: busy ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: 14,
                    boxShadow: '0 4px 12px rgba(255,112,67,0.4)',
                    opacity: busy ? 0.7 : 1,
                  }}
                >
                  {foundryScheduling
                    ? 'Creating room…'
                    : saving
                    ? 'Saving…'
                    : mode === 'edit'
                    ? 'Save Changes'
                    : 'Save'}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
