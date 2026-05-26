// components/foundry/FoundrySchedulerModal.js
// Reusable Foundry scheduler — works in the lobby AND calendar pages.
// Props:
//   onClose() — dismiss
//   onScheduled({ roomId, guestToken }) — called on success
//   contacts — array of { id, name, avatarUrl } from host's contact list
//   dark — boolean, true = Foundry dark theme, false = platform glass theme

import { useState, useEffect } from 'react';

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

function getStyles(dark) {
  return {
    overlay: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20, fontFamily: "'DM Sans', sans-serif",
    },
    modal: {
      background: dark ? '#141720' : 'rgba(255,255,255,0.96)',
      border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
      borderRadius: 14, padding: '28px 28px 24px',
      width: '100%', maxWidth: 480,
      maxHeight: '90vh', overflowY: 'auto',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    title: { fontSize: 16, fontWeight: 700, color: dark ? '#f0f0f0' : '#112033' },
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: dark ? '#555' : '#aaa', fontFamily: 'inherit' },
    label: { fontSize: 11, fontWeight: 600, color: dark ? '#888' : '#546E7A', marginBottom: 4, display: 'block' },
    input: {
      width: '100%', borderRadius: 8, padding: '9px 12px',
      background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)',
      border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.12)',
      color: dark ? '#e0e0e0' : '#112033', fontSize: 13,
      outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
    },
    select: {
      width: '100%', borderRadius: 8, padding: '9px 12px',
      background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)',
      border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.12)',
      color: dark ? '#e0e0e0' : '#112033', fontSize: 13,
      outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', cursor: 'pointer',
    },
    row: { display: 'flex', gap: 10 },
    field: { marginBottom: 14 },
    // Invitees
    inviteeSearch: {
      width: '100%', borderRadius: 8, padding: '8px 12px',
      background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)',
      border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.12)',
      color: dark ? '#e0e0e0' : '#112033', fontSize: 12,
      outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
      marginBottom: 6,
    },
    contactResult: {
      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
      borderRadius: 6, cursor: 'pointer',
      background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
      marginBottom: 4, border: dark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.06)',
    },
    contactAvatar: (url) => ({
      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
      background: url ? `url(${url}) center/cover` : '#5C6BC0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 9, fontWeight: 600, color: '#fff',
    }),
    contactName: { fontSize: 12, color: dark ? '#ccc' : '#112033', flex: 1 },
    addContactBtn: {
      background: 'none', border: dark ? '1px solid rgba(255,112,67,0.3)' : '1px solid rgba(255,112,67,0.4)',
      color: ORANGE, fontSize: 10, padding: '2px 7px', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit',
    },
    // Invitee chips
    chips: { display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 },
    chip: {
      display: 'flex', alignItems: 'center', gap: 5,
      background: dark ? 'rgba(255,112,67,0.1)' : 'rgba(255,112,67,0.08)',
      border: dark ? '1px solid rgba(255,112,67,0.25)' : '1px solid rgba(255,112,67,0.2)',
      borderRadius: 20, padding: '3px 8px 3px 4px', fontSize: 11, color: dark ? '#FF9E80' : '#C75B33',
    },
    chipAvatar: { width: 18, height: 18, borderRadius: '50%', background: '#5C6BC0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 600, color: '#fff', flexShrink: 0 },
    chipRemove: { background: 'none', border: 'none', cursor: 'pointer', color: dark ? '#888' : '#aaa', fontSize: 13, padding: 0, fontFamily: 'inherit', lineHeight: 1 },
    // External email
    externalRow: { display: 'flex', gap: 6 },
    externalInput: {
      flex: 1, borderRadius: 8, padding: '8px 12px',
      background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)',
      border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.12)',
      color: dark ? '#e0e0e0' : '#112033', fontSize: 12,
      outline: 'none', fontFamily: 'inherit',
    },
    addExternalBtn: {
      background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
      border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
      color: dark ? '#888' : '#546E7A', fontSize: 11, padding: '6px 12px',
      borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
    },
    // Divider
    divider: { border: 'none', borderTop: dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)', margin: '16px 0' },
    // Error
    error: { color: '#ef5350', fontSize: 11, marginBottom: 10 },
    // Buttons
    actions: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 },
    cancelBtn: {
      background: 'none', border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.12)',
      color: dark ? '#666' : '#90A4AE', fontSize: 13, padding: '9px 16px', borderRadius: 8,
      cursor: 'pointer', fontFamily: 'inherit',
    },
    primaryBtn: (disabled) => ({
      background: disabled ? 'rgba(255,112,67,0.4)' : ORANGE,
      border: 'none', color: '#fff', fontSize: 13, fontWeight: 700,
      padding: '9px 20px', borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'inherit', transition: 'background 0.15s',
    }),
    successCard: {
      background: dark ? 'rgba(76,175,80,0.08)' : 'rgba(76,175,80,0.06)',
      border: dark ? '1px solid rgba(76,175,80,0.2)' : '1px solid rgba(76,175,80,0.2)',
      borderRadius: 10, padding: '20px', textAlign: 'center',
    },
    successIcon: { fontSize: 32, marginBottom: 10 },
    successTitle: { fontSize: 15, fontWeight: 700, color: dark ? '#f0f0f0' : '#112033', marginBottom: 6 },
    successSub: { fontSize: 12, color: dark ? '#888' : '#78909C', lineHeight: 1.6 },
    copyLink: {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
      borderRadius: 7, padding: '7px 12px', marginTop: 12, cursor: 'pointer',
      fontSize: 11, color: dark ? '#aaa' : '#546E7A', fontFamily: 'inherit',
      width: '100%', justifyContent: 'center',
    },
  };
}

function initials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

export default function FoundrySchedulerModal({
  onClose,
  onScheduled,
  contacts = [],
  dark = true,
}) {
  const S = getStyles(dark);

  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
  );

  // Invitees
  const [ftInvitees, setFtInvitees] = useState([]); // [{id, name, avatarUrl}]
  const [externalInvitees, setExternalInvitees] = useState([]); // [{email, name}]
  const [contactQuery, setContactQuery] = useState('');
  const [externalEmail, setExternalEmail] = useState('');
  const [externalName, setExternalName] = useState('');

  // State
  const [submitting, setSubmitting] = useState(false);
  const [sendingInvites, setSendingInvites] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { roomId, guestToken }
  const [copied, setCopied] = useState(false);

  // Filter contacts by query, exclude already added
  const addedIds = new Set(ftInvitees.map(i => i.id));
  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(contactQuery.toLowerCase()) && !addedIds.has(c.id)
  );

  const addFtInvitee = (contact) => {
    setFtInvitees(prev => [...prev, contact]);
    setContactQuery('');
  };

  const removeFtInvitee = (id) => setFtInvitees(prev => prev.filter(i => i.id !== id));

  const addExternalInvitee = () => {
    if (!externalEmail.trim()) return;
    const email = externalEmail.trim();
    const name = externalName.trim() || email;
    if (externalInvitees.find(i => i.email === email)) { setExternalEmail(''); setExternalName(''); return; }
    setExternalInvitees(prev => [...prev, { email, name }]);
    setExternalEmail('');
    setExternalName('');
  };

  const removeExternalInvitee = (email) => setExternalInvitees(prev => prev.filter(i => i.email !== email));

  const totalInvitees = ftInvitees.length + externalInvitees.length;

  // Create the scheduled room
  const handleSchedule = async () => {
    if (!title.trim()) { setError('Please enter a session title.'); return; }
    if (!date) { setError('Please select a date.'); return; }
    if (!time) { setError('Please select a time.'); return; }
    if (totalInvitees === 0) { setError('Please add at least one participant.'); return; }

    setError('');
    setSubmitting(true);

    try {
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
      const invitees = [
        ...ftInvitees.map(i => ({ userId: i.id, name: i.name })),
        ...externalInvitees.map(i => ({ email: i.email, name: i.name })),
      ];

      const res = await fetch('/api/foundry/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), scheduledAt, timezone, invitees }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Could not schedule Foundry.'); return; }

      setResult({ roomId: data.roomId, guestToken: data.guestToken });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Send invites after room is created
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
        onClose?.();
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
    navigator.clipboard.writeText(guestUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div style={S.modal}>
        <div style={S.header}>
          <span style={S.title}>🔨 Schedule a Foundry</span>
          <button style={S.closeBtn} onClick={onClose} aria-label="Close">×</button>
        </div>

        {error && <div style={S.error}>{error}</div>}

        {/* Success state */}
        {result ? (
          <div>
            <div style={S.successCard}>
              <div style={S.successIcon}>✅</div>
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
            <div style={{ ...S.actions, marginTop: 16 }}>
              <button style={S.cancelBtn} onClick={onClose}>Close</button>
              <button
                style={S.primaryBtn(sendingInvites)}
                onClick={handleSendInvites}
                disabled={sendingInvites}
              >
                {sendingInvites ? 'Sending…' : 'Send invites now'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Title */}
            <div style={S.field}>
              <label style={S.label}>Session title</label>
              <input
                style={S.input}
                placeholder="e.g. Career Strategy Session — Q4 Review"
                value={title}
                onChange={e => setTitle(e.target.value)}
                aria-label="Session title"
              />
            </div>

            {/* Date + Time */}
            <div style={{ ...S.row, ...S.field }}>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Date</label>
                <input
                  type="date"
                  style={S.input}
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  aria-label="Session date"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={S.label}>Time</label>
                <input
                  type="time"
                  style={S.input}
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  aria-label="Session time"
                />
              </div>
            </div>

            {/* Timezone */}
            <div style={S.field}>
              <label style={S.label}>Timezone</label>
              <select
                style={S.select}
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                aria-label="Timezone"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>{TIMEZONE_LABELS[tz] || tz}</option>
                ))}
              </select>
            </div>

            <hr style={S.divider} />

            {/* FT Contacts */}
            <div style={S.field}>
              <label style={S.label}>Invite from your contacts</label>

              {/* Chips */}
              {ftInvitees.length > 0 && (
                <div style={S.chips}>
                  {ftInvitees.map(i => (
                    <div key={i.id} style={S.chip}>
                      <div style={S.chipAvatar}>{initials(i.name)}</div>
                      <span>{i.name}</span>
                      <button style={S.chipRemove} onClick={() => removeFtInvitee(i.id)} aria-label={`Remove ${i.name}`}>×</button>
                    </div>
                  ))}
                </div>
              )}

              <input
                style={S.inviteeSearch}
                placeholder="Search contacts…"
                value={contactQuery}
                onChange={e => setContactQuery(e.target.value)}
                aria-label="Search contacts"
              />

              {contactQuery && filteredContacts.length === 0 && (
                <div style={{ fontSize: 11, color: dark ? '#555' : '#90A4AE', padding: '4px 0' }}>
                  No contacts match. Only contacts can join as FT users.
                </div>
              )}

              {contactQuery && filteredContacts.slice(0, 5).map(c => (
                <div key={c.id} style={S.contactResult}>
                  {c.avatarUrl ? (
                    <img src={c.avatarUrl} alt={c.name} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={S.contactAvatar(null)}>{initials(c.name)}</div>
                  )}
                  <span style={S.contactName}>{c.name}</span>
                  <button style={S.addContactBtn} onClick={() => addFtInvitee(c)}>+ Add</button>
                </div>
              ))}
            </div>

            <hr style={S.divider} />

            {/* External guests */}
            <div style={S.field}>
              <label style={S.label}>Invite external guests (by email)</label>

              {externalInvitees.length > 0 && (
                <div style={S.chips}>
                  {externalInvitees.map(i => (
                    <div key={i.email} style={S.chip}>
                      <span>✉ {i.name}</span>
                      <button style={S.chipRemove} onClick={() => removeExternalInvitee(i.email)} aria-label={`Remove ${i.name}`}>×</button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ ...S.row, marginBottom: 5 }}>
                <input
                  style={{ ...S.externalInput, flex: 1 }}
                  placeholder="Name (optional)"
                  value={externalName}
                  onChange={e => setExternalName(e.target.value)}
                  aria-label="Guest name"
                />
              </div>
              <div style={S.externalRow}>
                <input
                  style={S.externalInput}
                  placeholder="email@example.com"
                  type="email"
                  value={externalEmail}
                  onChange={e => setExternalEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addExternalInvitee()}
                  aria-label="Guest email"
                />
                <button style={S.addExternalBtn} onClick={addExternalInvitee}>+ Add</button>
              </div>
              <div style={{ fontSize: 10, color: dark ? '#444' : '#B0BEC5', marginTop: 5, lineHeight: 1.5 }}>
                External guests get a branded email with a guest join link. No ForgeTomorrow account needed.
              </div>
            </div>

            <div style={S.actions}>
              <button style={S.cancelBtn} onClick={onClose}>Cancel</button>
              <button
                style={S.primaryBtn(submitting || totalInvitees === 0 || !title || !date || !time)}
                onClick={handleSchedule}
                disabled={submitting || totalInvitees === 0 || !title || !date || !time}
              >
                {submitting ? 'Scheduling…' : 'Schedule Foundry'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}