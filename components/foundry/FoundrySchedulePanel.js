// components/foundry/FoundrySchedulePanel.js
// Inline scheduler panel for the Foundry lobby.
// Keeps FoundrySchedulerModal available for other launch points.

import { useState } from 'react';

const ORANGE = '#FF7043';

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
  'Europe/London': 'London (GMT)',
  'Europe/Paris': 'Paris (CET)',
  'Europe/Berlin': 'Berlin (CET)',
  'Asia/Tokyo': 'Tokyo (JST)',
  'Asia/Shanghai': 'Shanghai (CST)',
  'Australia/Sydney': 'Sydney (AEDT)',
};

const S = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12,
  },
  field: { marginBottom: 14 },
  row: { display: 'flex', gap: 10 },
  label: {
    fontSize: 11,
    fontWeight: 800,
    color: '#334155',
    marginBottom: 5,
    display: 'block',
  },
  input: {
    width: '100%',
    borderRadius: 9,
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.85)',
    border: '1px solid rgba(0,0,0,0.12)',
    color: '#112033',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    borderRadius: 9,
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.85)',
    border: '1px solid rgba(0,0,0,0.12)',
    color: '#112033',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    cursor: 'pointer',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid rgba(0,0,0,0.08)',
    margin: '16px 0',
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(255,112,67,0.08)',
    border: '1px solid rgba(255,112,67,0.2)',
    borderRadius: 20,
    padding: '4px 9px 4px 5px',
    fontSize: 11,
    color: '#C75B33',
    fontWeight: 700,
  },
  chipAvatar: {
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: '#5C6BC0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 8,
    fontWeight: 800,
    color: '#fff',
    flexShrink: 0,
  },
  chipRemove: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94A3B8',
    fontSize: 13,
    padding: 0,
    fontFamily: 'inherit',
    lineHeight: 1,
  },
  contactResult: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 8px',
    borderRadius: 8,
    cursor: 'pointer',
    background: 'rgba(0,0,0,0.03)',
    marginBottom: 5,
    border: '1px solid rgba(0,0,0,0.06)',
  },
  contactName: {
    fontSize: 12,
    color: '#112033',
    flex: 1,
    fontWeight: 700,
  },
  addBtn: {
    background: 'none',
    border: '1px solid rgba(255,112,67,0.4)',
    color: ORANGE,
    fontSize: 10,
    padding: '3px 8px',
    borderRadius: 5,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 800,
  },
  externalRow: { display: 'flex', gap: 6 },
  helper: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 5,
    lineHeight: 1.5,
    fontWeight: 600,
  },
  error: {
    color: '#c62828',
    fontSize: 11,
    marginBottom: 12,
    background: 'rgba(198,40,40,0.07)',
    border: '1px solid rgba(198,40,40,0.15)',
    borderRadius: 8,
    padding: '8px 10px',
  },
  successCard: {
    background: 'rgba(76,175,80,0.06)',
    border: '1px solid rgba(76,175,80,0.2)',
    borderRadius: 12,
    padding: 18,
    textAlign: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: '#112033',
    marginBottom: 6,
  },
  successSub: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 1.6,
    fontWeight: 600,
  },
  actions: {
    display: 'flex',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 18,
  },
  primaryBtn: (disabled) => ({
    background: disabled ? 'rgba(255,112,67,0.4)' : ORANGE,
    border: 'none',
    color: '#fff',
    fontSize: 13,
    fontWeight: 800,
    padding: '10px 18px',
    borderRadius: 9,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
  }),
  secondaryBtn: {
    background: 'rgba(255,255,255,0.62)',
    border: '1px solid rgba(0,0,0,0.12)',
    color: '#64748B',
    fontSize: 13,
    fontWeight: 800,
    padding: '10px 16px',
    borderRadius: 9,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  copyLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(0,0,0,0.04)',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: 7,
    padding: '8px 12px',
    marginTop: 12,
    cursor: 'pointer',
    fontSize: 11,
    color: '#546E7A',
    fontFamily: 'inherit',
    width: '100%',
    justifyContent: 'center',
    fontWeight: 800,
  },
};

function initials(name) {
  return (name || '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

export default function FoundrySchedulePanel({ contacts = [], onScheduled }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
  );

  const [ftInvitees, setFtInvitees] = useState([]);
  const [externalInvitees, setExternalInvitees] = useState([]);
  const [contactQuery, setContactQuery] = useState('');
  const [externalEmail, setExternalEmail] = useState('');
  const [externalName, setExternalName] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [duration, setDuration] = useState(60);
  const [sendingInvites, setSendingInvites] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const addedIds = new Set(ftInvitees.map((i) => i.id));
  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(contactQuery.toLowerCase()) && !addedIds.has(c.id)
  );

  const totalInvitees = ftInvitees.length + externalInvitees.length;

  const addFtInvitee = (contact) => {
    setFtInvitees((prev) => [...prev, contact]);
    setContactQuery('');
  };

  const removeFtInvitee = (id) => {
    setFtInvitees((prev) => prev.filter((i) => i.id !== id));
  };

  const addExternalInvitee = () => {
    if (!externalEmail.trim()) return;

    const email = externalEmail.trim();
    const name = externalName.trim() || email;

    if (externalInvitees.find((i) => i.email === email)) {
      setExternalEmail('');
      setExternalName('');
      return;
    }

    setExternalInvitees((prev) => [...prev, { email, name }]);
    setExternalEmail('');
    setExternalName('');
  };

  const removeExternalInvitee = (email) => {
    setExternalInvitees((prev) => prev.filter((i) => i.email !== email));
  };

  const handleSchedule = async () => {
    if (!title.trim()) { setError('Please enter a session title.'); return; }
    if (!date) { setError('Please select a date.'); return; }
    if (!time) { setError('Please select a time.'); return; }
    if (totalInvitees === 0) { setError('Please add at least one participant.'); return; }

    setError('');
    setSubmitting(true);

    try {
      // Correct timezone conversion — browser local time ≠ selected timezone
      const naiveMs = new Date(`${date}T${time}:00`).getTime();
      const tzOffsetMs = (() => {
        try {
          const utcDate = new Date(naiveMs);
          const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
          }).formatToParts(utcDate);
          const get = (type) => parseInt(parts.find(p => p.type === type)?.value || '0');
          const tzMs = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
          return naiveMs - tzMs;
        } catch { return 0; }
      })();
      const scheduledAt = new Date(naiveMs + tzOffsetMs).toISOString();

      const invitees = [
        ...ftInvitees.map((i) => ({ userId: i.id, name: i.name })),
        ...externalInvitees.map((i) => ({ email: i.email, name: i.name })),
      ];

      const res = await fetch('/api/foundry/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), scheduledAt, timezone, invitees, durationMinutes: duration }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Could not schedule Foundry.');
        return;
      }

      setResult({ roomId: data.roomId, guestToken: data.guestToken });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendInvites = async () => {
    if (!result?.roomId) return;

    setSendingInvites(true);

    try {
      const res = await fetch('/api/foundry/send-invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: result.roomId }),
      });

      const data = await res.json();

      if (res.ok) {
        onScheduled?.(result);
      } else {
        setError(data.error || 'Could not send invites.');
      }
    } catch {
      setError('Network error sending invites.');
    } finally {
      setSendingInvites(false);
    }
  };

  const guestUrl = result?.guestToken
    ? `${window.location.origin}/foundry/join/${result.roomId}?code=${result.guestToken}`
    : '';

  const copyLink = () => {
    navigator.clipboard.writeText(guestUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (result) {
    return (
      <div>
        {error && <div style={S.error}>{error}</div>}

        <div style={S.successCard}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>✅</div>
          <div style={S.successTitle}>Foundry scheduled</div>
          <div style={S.successSub}>
            Ready to send invites? ForgeTomorrow users will get a notification and calendar event. External guests will get an email with a join link.
          </div>

          {guestUrl && (
            <button style={S.copyLink} onClick={copyLink}>
              🔗 {copied ? 'Copied!' : 'Copy guest invite link'}
            </button>
          )}
        </div>

        <div style={S.actions}>
          <button style={S.secondaryBtn} onClick={() => onScheduled?.(result)}>
            Done
          </button>

          <button
            style={S.primaryBtn(sendingInvites)}
            onClick={handleSendInvites}
            disabled={sendingInvites}
          >
            {sendingInvites ? 'Sending…' : 'Send invites now'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && <div style={S.error}>{error}</div>}

      <div style={S.field}>
        <label style={S.label}>Session title</label>
        <input
          style={S.input}
          placeholder="e.g. Career Strategy Session — Q4 Review"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Session title"
        />
      </div>

      <div
  style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 10,
    marginBottom: 14,
  }}
>
  <div>
    <label style={S.label}>Date</label>
    <input
      type="date"
      style={S.input}
      value={date}
      onChange={(e) => setDate(e.target.value)}
      min={new Date().toISOString().slice(0, 10)}
      aria-label="Session date"
    />
  </div>

  <div>
    <label style={S.label}>Time</label>
    <input
      type="time"
      style={S.input}
      value={time}
      onChange={(e) => setTime(e.target.value)}
      aria-label="Session time"
    />
  </div>

  <div>
    <label style={S.label}>Timezone</label>
    <select
      style={S.select}
      value={timezone}
      onChange={(e) => setTimezone(e.target.value)}
      aria-label="Timezone"
    >
      {TIMEZONES.map((tz) => (
        <option key={tz} value={tz}>{TIMEZONE_LABELS[tz] || tz}</option>
      ))}
    </select>
  </div>
</div>

      {/* Duration picker — video cap: max 1 hour */}
      <div style={S.field}>
        <label style={S.label}>Duration</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { label: '15 min', value: 15 },
            { label: '30 min', value: 30 },
            { label: '45 min', value: 45 },
            { label: '1 hour', value: 60 },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDuration(opt.value)}
              style={{
                flex: 1, padding: '9px 6px', borderRadius: 8, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s', border: 'none',
                outline: duration === opt.value ? '1.5px solid #FF7043' : '1px solid rgba(255,255,255,0.1)',
                background: duration === opt.value ? 'rgba(255,112,67,0.12)' : 'rgba(255,255,255,0.04)',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 800, color: duration === opt.value ? '#FF7043' : '#e0e0e0' }}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#555', marginTop: 5, lineHeight: 1.5 }}>
          Foundry video meetings are capped at 1 hour. Lobby opens 15 min early for prep.
        </div>
      </div>

      <hr style={S.divider} />

      <div style={S.grid}>
        <div>
          <div style={S.field}>
            <label style={S.label}>Invite from your contacts</label>

            {ftInvitees.length > 0 && (
              <div style={S.chips}>
                {ftInvitees.map((i) => (
                  <div key={i.id} style={S.chip}>
                    <div style={S.chipAvatar}>{initials(i.name)}</div>
                    <span>{i.name}</span>
                    <button style={S.chipRemove} onClick={() => removeFtInvitee(i.id)} aria-label={`Remove ${i.name}`}>×</button>
                  </div>
                ))}
              </div>
            )}

            <input
              style={S.input}
              placeholder="Search contacts…"
              value={contactQuery}
              onChange={(e) => setContactQuery(e.target.value)}
              aria-label="Search contacts"
            />

            {contactQuery && filteredContacts.length === 0 && (
              <div style={S.helper}>No contacts match. Only contacts can join as ForgeTomorrow users.</div>
            )}

            {contactQuery && filteredContacts.slice(0, 5).map((c) => (
              <div key={c.id} style={S.contactResult}>
                {c.avatarUrl ? (
                  <img src={c.avatarUrl} alt={c.name} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={S.chipAvatar}>{initials(c.name)}</div>
                )}

                <span style={S.contactName}>{c.name}</span>
                <button style={S.addBtn} onClick={() => addFtInvitee(c)}>+ Add</button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={S.field}>
            <label style={S.label}>Invite external guests</label>

            {externalInvitees.length > 0 && (
              <div style={S.chips}>
                {externalInvitees.map((i) => (
                  <div key={i.email} style={S.chip}>
                    <span>✉ {i.name}</span>
                    <button style={S.chipRemove} onClick={() => removeExternalInvitee(i.email)} aria-label={`Remove ${i.name}`}>×</button>
                  </div>
                ))}
              </div>
            )}

            <input
              style={{ ...S.input, marginBottom: 6 }}
              placeholder="Name (optional)"
              value={externalName}
              onChange={(e) => setExternalName(e.target.value)}
              aria-label="Guest name"
            />

            <div style={S.externalRow}>
              <input
                style={S.input}
                placeholder="email@example.com"
                type="email"
                value={externalEmail}
                onChange={(e) => setExternalEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addExternalInvitee()}
                aria-label="Guest email"
              />

              <button style={{ ...S.addBtn, height: 39, marginTop: 0 }} onClick={addExternalInvitee}>
                + Add
              </button>
            </div>

            <div style={S.helper}>
              External guests get a branded email with a guest join link. No ForgeTomorrow account needed.
            </div>
          </div>
        </div>
      </div>

      <div style={S.actions}>
        <button
          style={S.primaryBtn(submitting || totalInvitees === 0 || !title || !date || !time)}
          onClick={handleSchedule}
          disabled={submitting || totalInvitees === 0 || !title || !date || !time}
        >
          {submitting ? 'Scheduling…' : 'Schedule Foundry'}
        </button>
      </div>
    </div>
  );
}