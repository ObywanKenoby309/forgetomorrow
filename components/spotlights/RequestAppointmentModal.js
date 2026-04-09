// components/spotlights/RequestAppointmentModal.js
//
// Opens when a seeker clicks "Book" on a SpotlightCard or SpotlightDetail.
// Collects up to 3 preferred date/time slots, timezone, and an optional message.
// Submits to POST /api/appointments/request.
//
// Props:
//   spotlight  — the full spotlight object (needs id, userId, name, hook, headline)
//   onClose    — fn to close the modal

import React, { useState, useMemo } from 'react';

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
];

function guessTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
  } catch {
    return 'America/New_York';
  }
}

// Minimum datetime for input — now
function minDateTime() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const glassBase = {
  background: 'rgba(255,255,255,0.78)',
  border: '1px solid rgba(255,255,255,0.55)',
  borderRadius: 14,
  boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
};

const WHITE_CARD = {
  background: 'rgba(255,255,255,0.92)',
  border: '0.5px solid rgba(0,0,0,0.08)',
  borderRadius: 10,
  boxSizing: 'border-box',
};

const inputStyle = {
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 10,
  padding: '9px 12px',
  outline: 'none',
  width: '100%',
  background: 'rgba(255,255,255,0.9)',
  fontFamily: 'inherit',
  fontSize: 13,
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: '#607D8B',
  marginBottom: 5,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

export default function RequestAppointmentModal({ spotlight, onClose }) {
  const [slots, setSlots]       = useState(['', '', '']);
  const [timezone, setTimezone] = useState(guessTimezone());
  const [message, setMessage]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  const filledSlots = useMemo(
    () => slots.filter((s) => s.trim() !== ''),
    [slots]
  );

  const canSubmit = filledSlots.length > 0 && !submitting;

  function updateSlot(i, val) {
    setSlots((prev) => {
      const next = [...prev];
      next[i] = val;
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/appointments/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coachId:        spotlight.userId,
          spotlightId:    spotlight.id,
          preferredSlots: filledSlots,
          timezone,
          message: message.trim() || null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 409) {
        setError('You already have a pending request with this coach. Check back once they respond.');
        setSubmitting(false);
        return;
      }
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to submit request');
      }

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  const coachName = spotlight.name || spotlight.headline || 'this coach';
  const displayTitle = spotlight.hook || spotlight.headline || 'Session request';

  return (
    // Faux viewport overlay (no position:fixed — uses normal flow min-height)
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }}>
      <div style={{
        ...glassBase,
        width: '100%', maxWidth: 520,
        padding: 0, overflow: 'hidden',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{
          padding: '18px 20px 14px',
          borderBottom: '0.5px solid rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#112033', lineHeight: 1.2 }}>
              Request a session
            </div>
            <div style={{ fontSize: 12, color: '#90A4AE', marginTop: 3 }}>
              with {coachName}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 20, color: '#90A4AE', lineHeight: 1, padding: 0, flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1 }}>

          {success ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: '#E8F5E9', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 14px',
                fontSize: 22, color: '#2E7D32',
              }}>
                ✓
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#112033', marginBottom: 8 }}>
                Request sent
              </div>
              <div style={{ fontSize: 13, color: '#607D8B', lineHeight: 1.6, maxWidth: 340, margin: '0 auto 20px' }}>
                {coachName} will review your preferred times and follow up to confirm.
                You'll receive a notification when they respond.
              </div>
              <button
                onClick={onClose}
                style={{
                  background: '#FF7043', color: 'white', border: 'none',
                  borderRadius: 10, padding: '9px 24px', fontSize: 13,
                  fontWeight: 700, cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>

              {/* Context card */}
              <div style={{ ...WHITE_CARD, padding: '10px 14px', background: 'rgba(255,112,67,0.05)', border: '0.5px solid rgba(255,112,67,0.2)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#993C1D' }}>Requesting</div>
                <div style={{ fontSize: 13, color: '#112033', marginTop: 2 }}>{displayTitle}</div>
              </div>

              {/* Preferred slots */}
              <div>
                <label style={labelStyle}>
                  Preferred times
                  <span style={{ fontWeight: 400, color: '#90A4AE', textTransform: 'none', letterSpacing: 0 }}>
                    {' '}— add up to 3 options
                  </span>
                </label>
                <div style={{ display: 'grid', gap: 8 }}>
                  {slots.map((slot, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        background: slot ? '#FF7043' : 'rgba(0,0,0,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700,
                        color: slot ? 'white' : '#90A4AE',
                      }}>
                        {i + 1}
                      </div>
                      <input
                        type="datetime-local"
                        value={slot}
                        min={minDateTime()}
                        onChange={(e) => updateSlot(i, e.target.value)}
                        style={inputStyle}
                      />
                      {slot && (
                        <button
                          type="button"
                          onClick={() => updateSlot(i, '')}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#90A4AE', fontSize: 16, padding: 0, flexShrink: 0,
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: '#90A4AE', marginTop: 6 }}>
                  The coach will confirm one of your preferred times or suggest an alternative.
                </div>
              </div>

              {/* Timezone */}
              <div>
                <label style={labelStyle}>Your timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  style={inputStyle}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <label style={labelStyle}>
                  Message
                  <span style={{ fontWeight: 400, color: '#90A4AE', textTransform: 'none', letterSpacing: 0 }}>
                    {' '}— optional
                  </span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="What would you like to focus on? Any context that would help the coach prepare."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
                <div style={{ fontSize: 11, color: '#90A4AE', textAlign: 'right', marginTop: 3 }}>
                  {message.length}/500
                </div>
              </div>

              {error && (
                <div style={{
                  background: '#FDECEA', border: '1px solid #FFCDD2',
                  borderRadius: 8, padding: '10px 14px',
                  fontSize: 13, color: '#C62828',
                }}>
                  {error}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.85)', color: '#607D8B',
                    border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10,
                    padding: '10px 0', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  style={{
                    flex: 2, background: canSubmit ? '#FF7043' : 'rgba(255,112,67,0.4)',
                    color: 'white', border: 'none', borderRadius: 10,
                    padding: '10px 0', fontSize: 13, fontWeight: 700,
                    cursor: canSubmit ? 'pointer' : 'not-allowed',
                    fontFamily: 'inherit', transition: 'background 0.15s',
                  }}
                >
                  {submitting ? 'Sending request…' : 'Send request'}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}