// components/calendar/CoachSessionEditor.js
import React, { useEffect, useState } from 'react';

const API_URL = '/api/coaching/sessions';

const GLASS_MODAL = {
  background: 'rgba(255,255,255,0.88)',
  border: '1px solid rgba(255,255,255,0.55)',
  borderRadius: 18,
  boxShadow: '0 28px 70px rgba(15,23,42,0.32)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

const WHITE_FIELD = {
  border: '1px solid rgba(0,0,0,0.10)',
  borderRadius: 12,
  padding: '10px 12px',
  outline: 'none',
  width: '100%',
  background: 'rgba(255,255,255,0.94)',
  fontFamily: 'inherit',
  fontSize: 13,
  color: '#37474F',
  boxSizing: 'border-box',
};

const LABEL = {
  display: 'block',
  fontSize: 12,
  fontWeight: 800,
  color: '#607D8B',
  marginBottom: 6,
  letterSpacing: '0.02em',
};

const ORANGE_HEADING_LIFT = {
  textShadow: '0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)',
  fontWeight: 900,
};

export default function CoachSessionEditor({
  mode = 'add',
  initial = null,
  onClose,
  onSaved,
  onDeleted,
}) {
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    clientType: initial?.clientType || 'external',
    clientUserId: initial?.clientUserId || null,
    clientName: initial?.clientName || '',
    date: initial?.date || new Date().toISOString().slice(0, 10),
    time: initial?.time || '09:00',
    type: initial?.type || 'Strategy',
    status: initial?.status || 'Scheduled',
    notes: initial?.notes || '',
  });

  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (form.clientType !== 'internal' || !search.trim()) {
      setResults([]);
      return;
    }

    let alive = true;
    setSearching(true);

    fetch(`/api/contacts/search?q=${encodeURIComponent(search)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setResults(d.contacts || d.results || []);
      })
      .catch(() => {})
      .finally(() => alive && setSearching(false));

    return () => {
      alive = false;
    };
  }, [search, form.clientType]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();

    if (!form.date || !form.time) return alert('Date and time required.');
    if (form.clientType === 'external' && !form.clientName.trim()) {
      return alert('Client name required.');
    }
    if (form.clientType === 'internal' && !form.clientUserId) {
      return alert('Select a Forge contact.');
    }

    setSaving(true);
    try {
      const res = await fetch(API_URL, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: initial?.id,
          date: form.date,
          time: form.time,
          clientType: form.clientType,
          clientUserId: form.clientType === 'internal' ? form.clientUserId : null,
          clientName: form.clientName,
          type: form.type,
          status: form.status,
          notes: form.notes,
        }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      const session = data.session || data;

      // 🔥 AUTO-CREATE CLIENT (non-blocking)
      try {
        await fetch('/api/coaching/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            form.clientType === 'internal'
              ? {
                  mode: 'internal',
                  contactUserId: form.clientUserId,
                  status: 'Active',
                }
              : {
                  mode: 'external',
                  name: form.clientName.trim(),
                  status: 'Active',
                }
          ),
        });
      } catch (err) {
        console.warn('Client auto-create failed (non-blocking)', err);
      }

      onSaved?.(session);
    } catch {
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!initial?.id) return;
    if (!confirm('Delete this session?')) return;

    setSaving(true);
    try {
      await fetch(API_URL, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: initial.id }),
      });
      onDeleted?.(initial.id);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.58)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 1000,
        padding: 18,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          ...GLASS_MODAL,
          width: '100%',
          maxWidth: 640,
          overflow: 'hidden',
        }}
      >
        <form onSubmit={save} style={{ display: 'grid', gap: 0 }}>
          {/* Header */}
          <div
            style={{
              padding: '18px 20px 14px',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.08))',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 22,
                  color: '#FF7043',
                  lineHeight: 1.15,
                  letterSpacing: '-0.01em',
                  ...ORANGE_HEADING_LIFT,
                }}
              >
                {mode === 'edit' ? 'Edit Session' : 'Add Session'}
              </h3>
              <p
                style={{
                  margin: '6px 0 0',
                  color: '#607D8B',
                  fontSize: 13,
                  lineHeight: 1.55,
                }}
              >
                Create and manage coaching sessions with the same standard as the rest of your workspace.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#90A4AE',
                fontSize: 24,
                lineHeight: 1,
                cursor: 'pointer',
                padding: 0,
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: 20, display: 'grid', gap: 16 }}>
            {/* Client type */}
            <div>
              <label style={LABEL}>Client Type</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 6,
                  padding: 4,
                  borderRadius: 999,
                  background: 'rgba(15,23,42,0.05)',
                  border: '1px solid rgba(0,0,0,0.06)',
                }}
              >
                <button
                  type="button"
                  onClick={() => update('clientType', 'internal')}
                  style={{
                    border: 'none',
                    borderRadius: 999,
                    padding: '9px 12px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 13,
                    fontWeight: 800,
                    background: form.clientType === 'internal' ? '#FF7043' : 'transparent',
                    color: form.clientType === 'internal' ? 'white' : '#607D8B',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Forge User
                </button>
                <button
                  type="button"
                  onClick={() => update('clientType', 'external')}
                  style={{
                    border: 'none',
                    borderRadius: 999,
                    padding: '9px 12px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 13,
                    fontWeight: 800,
                    background: form.clientType === 'external' ? '#FF7043' : 'transparent',
                    color: form.clientType === 'external' ? 'white' : '#607D8B',
                    transition: 'all 0.15s ease',
                  }}
                >
                  External Client
                </button>
              </div>
            </div>

            {/* Client selector */}
            {form.clientType === 'internal' ? (
              <div style={{ display: 'grid', gap: 8 }}>
                <label style={LABEL}>Forge Contact</label>
                <input
                  placeholder="Search contacts…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={WHITE_FIELD}
                />

                <div
                  style={{
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.72)',
                    overflow: 'hidden',
                  }}
                >
                  {searching && (
                    <div style={{ padding: '10px 12px', fontSize: 12, color: '#90A4AE' }}>
                      Searching…
                    </div>
                  )}

                  {!searching && search.trim() && results.length === 0 && (
                    <div style={{ padding: '10px 12px', fontSize: 12, color: '#90A4AE' }}>
                      No matching contacts found.
                    </div>
                  )}

                  {results.map((r, idx) => {
                    const selected = form.clientUserId === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          update('clientUserId', r.id);
                          update('clientName', r.name || r.email);
                          setSearch(r.name || r.email || '');
                          setResults([]);
                        }}
                        style={{
                          width: '100%',
                          border: 'none',
                          borderTop: idx === 0 ? 'none' : '1px solid rgba(0,0,0,0.06)',
                          background: selected ? 'rgba(255,112,67,0.08)' : 'transparent',
                          padding: '11px 12px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#37474F' }}>
                          {r.name || r.email}
                        </div>
                        {r.email && (
                          <div style={{ fontSize: 12, color: '#78909C', marginTop: 2 }}>
                            {r.email}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <label style={LABEL}>Client Name</label>
                <input
                  placeholder="Client name"
                  value={form.clientName}
                  onChange={(e) => update('clientName', e.target.value)}
                  style={WHITE_FIELD}
                />
              </div>
            )}

            {/* Date + time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={LABEL}>Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => update('date', e.target.value)}
                  style={WHITE_FIELD}
                />
              </div>
              <div>
                <label style={LABEL}>Time</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => update('time', e.target.value)}
                  style={WHITE_FIELD}
                />
              </div>
            </div>

            {/* Type + status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={LABEL}>Session Type</label>
                <select value={form.type} onChange={(e) => update('type', e.target.value)} style={WHITE_FIELD}>
                  <option>Strategy</option>
                  <option>Resume</option>
                  <option>Interview</option>
                </select>
              </div>
              <div>
                <label style={LABEL}>Status</label>
                <select value={form.status} onChange={(e) => update('status', e.target.value)} style={WHITE_FIELD}>
                  <option>Scheduled</option>
                  <option>Completed</option>
                  <option>No-show</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={LABEL}>Notes</label>
              <textarea
                placeholder="Add any session notes, context, or reminders…"
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                rows={4}
                style={{ ...WHITE_FIELD, resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '16px 20px 18px',
              borderTop: '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={remove}
                  disabled={saving}
                  style={{
                    background: 'white',
                    color: '#C62828',
                    border: '1px solid rgba(198,40,40,0.22)',
                    borderRadius: 12,
                    padding: '10px 14px',
                    fontWeight: 800,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                    fontFamily: 'inherit',
                  }}
                >
                  Delete
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                style={{
                  background: 'rgba(255,255,255,0.92)',
                  color: '#607D8B',
                  border: '1px solid rgba(0,0,0,0.10)',
                  borderRadius: 12,
                  padding: '10px 14px',
                  fontWeight: 800,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  fontFamily: 'inherit',
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
                  borderRadius: 12,
                  padding: '10px 16px',
                  fontWeight: 800,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  boxShadow: '0 8px 20px rgba(255,112,67,0.28)',
                  opacity: saving ? 0.75 : 1,
                }}
              >
                {saving ? 'Saving…' : mode === 'edit' ? 'Save Changes' : 'Create Session'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}