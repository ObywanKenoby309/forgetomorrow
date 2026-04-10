// components/coaching/modules/AppointmentRequestsModule.js
//
// Coach-side inbox for pending AppointmentRequests.
// Shows in Sessions page as a "Pending Requests" tab.
// Actions: Confirm (pick time) | Suggest Another Time | Decline
//
// On Confirm → /api/appointments/respond atomically creates:
//   Contact, CoachingClient, CoachingSession, ghost conversation
//   and notifies the seeker.

import React, { useCallback, useEffect, useMemo, useState } from 'react';

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const WHITE_CARD = {
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 12,
  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  boxSizing: 'border-box',
};

const ORANGE_HEADING_LIFT = {
  textShadow: '0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)',
  fontWeight: 900,
};

const inputStyle = {
  border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10,
  padding: '8px 12px', outline: 'none', width: '100%',
  background: 'rgba(255,255,255,0.9)', fontFamily: 'inherit', fontSize: 13,
  boxSizing: 'border-box',
};

function formatSlot(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  } catch { return iso; }
}

function StatusBadge({ status }) {
  const map = {
    PENDING:      { bg: '#FFF8E1', fg: '#F57F17' },
    RESCHEDULED:  { bg: '#E3F2FD', fg: '#1565C0' },
    CONFIRMED:    { bg: '#E8F5E9', fg: '#2E7D32' },
    DECLINED:     { bg: '#FDECEA', fg: '#C62828' },
  };
  const { bg, fg } = map[status] || map.PENDING;
  return (
    <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 999, fontWeight: 700, background: bg, color: fg, whiteSpace: 'nowrap' }}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Respond modal ────────────────────────────────────────────────────────────
function RespondModal({ request, onClose, onDone }) {
  const [action, setAction]         = useState('CONFIRM');
  const [confirmedTime, setConfirmedTime] = useState('');
  const [suggestedTime, setSuggestedTime] = useState('');
  const [coachNotes, setCoachNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  // Pre-fill first preferred slot
  useEffect(() => {
    const slots = Array.isArray(request.preferredSlots) ? request.preferredSlots : [];
    if (slots[0]) {
      try {
        const d = new Date(slots[0]);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        setConfirmedTime(d.toISOString().slice(0, 16));
      } catch {}
    }
  }, [request]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (action === 'CONFIRM' && !confirmedTime) { setError('Please select a confirmed time.'); return; }
    if (action === 'SUGGEST' && !suggestedTime) { setError('Please enter a suggested time.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/appointments/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentRequestId: request.id,
          action,
          confirmedTime: action === 'CONFIRM' ? new Date(confirmedTime).toISOString() : undefined,
          suggestedTime: action === 'SUGGEST' ? new Date(suggestedTime).toISOString() : undefined,
          coachNotes:    coachNotes.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Failed to respond');
      onDone(request.id, action);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  const slots = Array.isArray(request.preferredSlots) ? request.preferredSlots : [];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 14, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px 12px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 15, color: '#112033' }}>Respond to request</div>
            <div style={{ fontSize: 12, color: '#90A4AE', marginTop: 2 }}>from {request.requesterName}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#90A4AE', padding: 0, lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '16px 20px', display: 'grid', gap: 14 }}>

          {/* Preferred slots summary */}
          {slots.length > 0 && (
            <div style={{ background: 'rgba(255,112,67,0.05)', border: '0.5px solid rgba(255,112,67,0.2)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#993C1D', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Requester's preferred times
              </div>
              {slots.map((s, i) => (
                <div key={i} style={{ fontSize: 13, color: '#455A64', marginBottom: 3 }}>
                  {i + 1}. {formatSlot(s)}
                </div>
              ))}
              {request.timezone && (
                <div style={{ fontSize: 11, color: '#90A4AE', marginTop: 4 }}>Timezone: {request.timezone}</div>
              )}
            </div>
          )}

          {/* Message */}
          {request.message && (
            <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#455A64', lineHeight: 1.6, fontStyle: 'italic' }}>
              "{request.message}"
            </div>
          )}

          {/* Action selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {[
              { val: 'CONFIRM', label: '✓ Confirm',        color: '#2E7D32', bg: '#E8F5E9', border: '#A5D6A7' },
              { val: 'SUGGEST', label: '↻ Suggest time',   color: '#1565C0', bg: '#E3F2FD', border: '#90CAF9' },
              { val: 'DECLINE', label: '✕ Decline',        color: '#C62828', bg: '#FDECEA', border: '#FFCDD2' },
            ].map(opt => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setAction(opt.val)}
                style={{
                  padding: '8px 6px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  background: action === opt.val ? opt.bg : 'white',
                  color:      action === opt.val ? opt.color : '#607D8B',
                  border:     action === opt.val ? `1.5px solid ${opt.border}` : '1px solid rgba(0,0,0,0.1)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Confirm time picker */}
          {action === 'CONFIRM' && (
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#607D8B', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Confirmed date & time
              </label>
              <input
                type="datetime-local"
                value={confirmedTime}
                onChange={e => setConfirmedTime(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
          )}

          {/* Suggest time picker */}
          {action === 'SUGGEST' && (
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#607D8B', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your suggested time
              </label>
              <input
                type="datetime-local"
                value={suggestedTime}
                onChange={e => setSuggestedTime(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
          )}

          {/* Optional note */}
          {action !== 'DECLINE' && (
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#607D8B', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Note to requester <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
              </label>
              <textarea
                value={coachNotes}
                onChange={e => setCoachNotes(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder="Any context or instructions for the requester…"
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          )}

          {action === 'DECLINE' && (
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#607D8B', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Reason <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
              </label>
              <textarea
                value={coachNotes}
                onChange={e => setCoachNotes(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder="Let the requester know why you're unable to accept…"
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          )}

          {error && (
            <div style={{ background: '#FDECEA', border: '1px solid #FFCDD2', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#C62828' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, background: 'white', color: '#607D8B', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10, padding: '9px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 2, border: 'none', borderRadius: 10, padding: '9px 0',
                fontSize: 13, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                background: action === 'CONFIRM' ? '#FF7043' : action === 'SUGGEST' ? '#1565C0' : '#C62828',
                color: 'white', opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Sending…' : action === 'CONFIRM' ? 'Confirm Session' : action === 'SUGGEST' ? 'Send Suggestion' : 'Decline Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Request card ─────────────────────────────────────────────────────────────
function RequestCard({ request, onRespond }) {
  const slots = Array.isArray(request.preferredSlots) ? request.preferredSlots : [];
  return (
    <div style={{ ...WHITE_CARD, padding: '14px 16px', display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#112033' }}>{request.requesterName}</div>
          <div style={{ fontSize: 12, color: '#90A4AE', marginTop: 1 }}>{request.requesterEmail || ''}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <StatusBadge status={request.status} />
          <span style={{ fontSize: 11, color: '#90A4AE' }}>
            {new Date(request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Preferred slots */}
      {slots.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {slots.map((s, i) => (
            <span key={i} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: 'rgba(255,112,67,0.08)', color: '#993C1D', fontWeight: 500 }}>
              {formatSlot(s)}
            </span>
          ))}
        </div>
      )}

      {/* Message */}
      {request.message && (
        <div style={{ fontSize: 13, color: '#546E7A', lineHeight: 1.6, fontStyle: 'italic', borderLeft: '3px solid rgba(255,112,67,0.3)', paddingLeft: 10 }}>
          "{request.message}"
        </div>
      )}

      {/* Suggested time (if coach already proposed one) */}
      {request.suggestedAt && (
        <div style={{ fontSize: 12, color: '#1565C0', background: '#E3F2FD', borderRadius: 8, padding: '6px 10px' }}>
          You suggested: {formatSlot(request.suggestedAt)}
        </div>
      )}

      {(request.status === 'PENDING' || request.status === 'RESCHEDULED') && (
        <button
          type="button"
          onClick={() => onRespond(request)}
          style={{
            background: '#FF7043', color: 'white', border: 'none',
            borderRadius: 8, padding: '8px 16px', fontSize: 13,
            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            justifySelf: 'start',
          }}
        >
          Respond
        </button>
      )}
    </div>
  );
}

// ─── Module ───────────────────────────────────────────────────────────────────
export default function AppointmentRequestsModule() {
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [filter, setFilter]         = useState('active'); // active | all
  const [responding, setResponding] = useState(null); // request being responded to

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/appointments/requests');
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Failed to load requests');
      setRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (filter === 'active') return requests.filter(r => r.status === 'PENDING' || r.status === 'RESCHEDULED');
    return requests;
  }, [requests, filter]);

  const activeCount = useMemo(() => requests.filter(r => r.status === 'PENDING' || r.status === 'RESCHEDULED').length, [requests]);

  function handleDone(id, action) {
    const statusMap = { CONFIRM: 'CONFIRMED', SUGGEST: 'RESCHEDULED', DECLINE: 'DECLINED' };
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: statusMap[action] || r.status } : r));
    setResponding(null);
  }

  return (
    <>
      <div style={{ display: 'grid', gap: 14 }}>

        {/* Header + filter */}
        <div style={{ ...GLASS, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 18, color: '#FF7043', ...ORANGE_HEADING_LIFT }}>Session Requests</div>
              {activeCount > 0 && (
                <span style={{ background: '#FF7043', color: 'white', borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '2px 8px' }}>
                  {activeCount} pending
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[{ val: 'active', label: 'Pending' }, { val: 'all', label: 'All' }].map(f => (
                <button
                  key={f.val}
                  type="button"
                  onClick={() => setFilter(f.val)}
                  style={{
                    fontSize: 12, padding: '5px 14px', borderRadius: 20, border: '1px solid',
                    borderColor: filter === f.val ? '#334155' : 'rgba(0,0,0,0.12)',
                    background:  filter === f.val ? '#334155' : 'transparent',
                    color:       filter === f.val ? 'white' : '#607D8B',
                    cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List */}
        <div style={{ display: 'grid', gap: 10 }}>
          {error && (
            <div style={{ background: '#FDECEA', border: '1px solid #FFCDD2', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#C62828' }}>
              {error}
            </div>
          )}

          {loading && (
            <div style={{ ...GLASS, padding: '16px 20px', color: '#90A4AE', fontSize: 13 }}>
              Loading session requests…
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ ...GLASS, padding: '40px 24px', textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: '#37474F', fontSize: 14, marginBottom: 6 }}>
                {filter === 'active' ? 'No pending session requests' : 'No session requests yet'}
              </div>
              <div style={{ color: '#90A4AE', fontSize: 13, lineHeight: 1.6 }}>
                {filter === 'active'
                  ? 'When seekers request a session from your Spotlight, they\'ll appear here.'
                  : 'Requests will appear here once seekers discover your Spotlight.'}
              </div>
            </div>
          )}

          {!loading && filtered.map(r => (
            <RequestCard key={r.id} request={r} onRespond={setResponding} />
          ))}
        </div>
      </div>

      {responding && (
        <RespondModal
          request={responding}
          onClose={() => setResponding(null)}
          onDone={handleDone}
        />
      )}
    </>
  );
}