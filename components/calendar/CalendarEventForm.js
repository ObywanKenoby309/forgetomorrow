// components/calendar/SeekerCalendarEventForm.js
import React, { useEffect, useRef, useState } from 'react';

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

export default function SeekerCalendarEventForm({
  mode = 'add',
  initial = null,
  onClose,
  onSave,
  onDelete,
  typeChoices = ['Interview', 'Application', 'Deadline', 'Reminder', 'Task', 'Appointment'],
  statusChoices = ['Scheduled', 'Completed', 'Cancelled'],
  saving = false,
}) {
  const firstRef = useRef(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [form, setForm] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);

    return {
      date: initial?.date || today,
      time: initial?.time || '09:00',
      timezone:
        initial?.timezone ||
        initial?.foundryTimezone ||
        getBrowserTimezone(),
      title: initial?.title || '',
      type: initial?.type || typeChoices[0] || 'Interview',
      status: initial?.status || statusChoices[0] || 'Scheduled',
      notes: initial?.notes || '',
      enableVideo: Boolean(initial?.enableVideo),
      foundryJoinUrl: initial?.foundryJoinUrl || '',
      foundryGuestJoinUrl: initial?.foundryGuestJoinUrl || '',
    };
  });

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

  const update = (key, value) =>
    setForm((f) => ({
      ...f,
      [key]: value,
    }));

  const joinUrl = form.foundryGuestJoinUrl || form.foundryJoinUrl || '';

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.date || !form.time || !form.title.trim()) {
      alert('Date, time, and title are required.');
      return;
    }

    onSave?.({
      ...form,
      title: form.title.trim(),
    });
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
            {mode === 'edit' ? 'Edit Event' : 'Add Event'}
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
            Seeker
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
          {form.enableVideo && joinUrl && (
            <div
              style={{
                border: '1px solid rgba(26,75,143,0.18)',
                background: 'rgba(26,75,143,0.07)',
                borderRadius: 14,
                padding: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#102A43' }}>
                  Audio/Video meeting
                </div>
                <div style={{ fontSize: 11, color: '#607D8B', marginTop: 2 }}>
                  You were invited to attend this meeting.
                </div>
              </div>

              <a
                href={joinUrl}
                style={{
                  background: '#1A4B8F',
                  color: '#FFFFFF',
                  borderRadius: 999,
                  padding: '8px 12px',
                  textDecoration: 'none',
                  fontSize: 12,
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                }}
              >
                Join
              </a>
            </div>
          )}

          <div>
            <label style={label}>
              Title <span style={{ color: '#EF6C00' }}>*</span>
            </label>
            <input
              ref={firstRef}
              type="text"
              name="title"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              style={input}
              placeholder="e.g. Recruiter call, application deadline, follow-up"
              disabled={saving}
            />
          </div>

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
                disabled={saving}
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
                disabled={saving}
              />
            </div>

            <div>
              <label style={label}>Timezone</label>
              <select
                name="timezone"
                value={form.timezone}
                onChange={(e) => update('timezone', e.target.value)}
                style={input}
                disabled={saving}
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
                disabled={saving}
              >
                {(typeChoices.length
                  ? typeChoices
                  : ['Interview', 'Application', 'Deadline', 'Reminder', 'Task', 'Appointment']
                ).map((t) => (
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
                disabled={saving}
              >
                {(statusChoices.length ? statusChoices : ['Scheduled', 'Completed', 'Cancelled']).map((s) => (
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
              placeholder="Add details, links, prep notes, or reminders for your future self."
              disabled={saving}
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
                  disabled={saving}
                  style={{
                    background: 'white',
                    color: '#B71C1C',
                    border: '1px solid #F5C6CB',
                    padding: '6px 10px',
                    borderRadius: 999,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  Delete
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#B71C1C', fontSize: 12 }}>Delete this event?</span>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={saving}
                    style={{
                      background: 'white',
                      border: '1px solid #ccc',
                      padding: '6px 10px',
                      borderRadius: 6,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: 13,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete?.()}
                    disabled={saving}
                    style={{
                      background: '#E53935',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: 6,
                      cursor: saving ? 'not-allowed' : 'pointer',
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
                  disabled={saving}
                  style={{
                    background: 'white',
                    border: '1px solid #CFD8DC',
                    padding: '8px 12px',
                    borderRadius: 8,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    color: '#455A64',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: '#FF7043',
                    color: 'white',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: 999,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: 14,
                    boxShadow: '0 4px 12px rgba(255,112,67,0.4)',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
