// components/calendar/CoachSessionEditor.js
import React, { useEffect, useState } from 'react';

const API_URL = '/api/coaching/sessions';

export default function CoachSessionEditor({
  mode = 'add', // 'add' | 'edit'
  initial,
  onClose,
  onSaved,
  onDeleted,
}) {
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    date: '',
    time: '',
    clientName: '',
    clientType: 'external', // 'internal' | 'external'
    clientUserId: null,
    type: 'Strategy',
    status: 'Scheduled',
    notes: '',
  });

  // --- contacts search ---
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm((f) => ({ ...f, ...initial }));
      setSearch(initial.clientName || initial.client || '');
    }
  }, [initial]);

  useEffect(() => {
    if (form.clientType !== 'internal') return;
    if (!search.trim()) {
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

  const selectClient = (c) => {
    const display = c.name || c.email;
    setForm((f) => ({
      ...f,
      clientType: 'internal',
      clientUserId: c.id,
      clientName: display,
    }));
    setSearch(display);
    setResults([]);
  };

  const save = async (e) => {
    e.preventDefault();

    if (!form.date || !form.time) return alert('Date and time required');

    if (form.clientType === 'internal' && !form.clientUserId) {
      return alert('Select a Forge contact');
    }

    if (form.clientType === 'external' && !form.clientName.trim()) {
      return alert('Enter a client name');
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
          clientUserId:
            form.clientType === 'internal' ? form.clientUserId : null,
          clientName: form.clientName,
          type: form.type,
          status: form.status,
          notes: form.notes,
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      onSaved?.(data.session || data);
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

  // ─────────────────────────────
  // Shared styles (match calendar modal)
  // ─────────────────────────────
  const label = {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    display: 'block',
  };

  const input = {
    border: '1px solid rgba(148,163,184,0.7)',
    borderRadius: 10,
    padding: '8px 10px',
    width: '100%',
    outline: 'none',
    background: '#FFFFFF',
    color: '#0f172a',
    fontSize: 14,
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.60)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg,#FFFFFF,#F9FAFB)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 520,
          boxShadow: '0 24px 60px rgba(15,23,42,0.55)',
          overflow: 'hidden',
          color: '#0f172a',
          border: '1px solid rgba(148,163,184,0.7)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 18px',
            borderBottom: '1px solid rgba(226,232,240,0.9)',
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                color: '#112033',
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {mode === 'add' ? 'Add Session' : 'Edit Session'}
            </h3>
          </div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              color: '#90A4AE',
              marginRight: 8,
            }}
          >
            Coaching
          </div>
        </div>

        {/* Body */}
        <form
          onSubmit={save}
          style={{ display: 'grid', gap: 14, padding: '16px 18px 18px' }}
        >
          {/* Date / Time */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            <div>
              <label style={label}>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => update('date', e.target.value)}
                style={input}
              />
            </div>
            <div>
              <label style={label}>Time</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => update('time', e.target.value)}
                style={input}
              />
            </div>
          </div>

          {/* Client type */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 4,
              }}
            >
              <span style={label}>Client Type</span>
            </div>
            <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
              <label style={{ cursor: 'pointer', color: '#111827' }}>
                <input
                  type="radio"
                  name="clientType"
                  checked={form.clientType === 'internal'}
                  onChange={() => {
                    update('clientType', 'internal');
                    update('clientUserId', null);
                  }}
                  style={{ marginRight: 6 }}
                />
                Forge user (from my contacts)
              </label>
              <label style={{ cursor: 'pointer', color: '#111827' }}>
                <input
                  type="radio"
                  name="clientType"
                  checked={form.clientType === 'external'}
                  onChange={() => {
                    update('clientType', 'external');
                    update('clientUserId', null);
                  }}
                  style={{ marginRight: 6 }}
                />
                External client (not in Forge)
              </label>
            </div>
          </div>

          {/* Internal / external client blocks */}
          {form.clientType === 'internal' ? (
            <div>
              <div style={label}>Client (from your contacts)</div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type a name, email, or headline…"
                style={{ ...input, marginBottom: 6 }}
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
                    onClick={() => {
                      update('clientUserId', null);
                      update('clientName', '');
                      setSearch('');
                    }}
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
              {searching && (
                <div style={{ fontSize: 12, color: '#90A4AE' }}>
                  Searching…
                </div>
              )}
              {results.length > 0 && (
                <ul
                  style={{
                    listStyle: 'none',
                    margin: '4px 0 0',
                    padding: 0,
                    maxHeight: 160,
                    overflowY: 'auto',
                    border: '1px solid #E2E8F0',
                    borderRadius: 8,
                    background: '#FFFFFF',
                  }}
                >
                  {results.map((r) => (
                    <li
                      key={r.id}
                      onClick={() => selectClient(r)}
                      style={{
                        padding: '6px 8px',
                        fontSize: 13,
                        cursor: 'pointer',
                        borderBottom: '1px solid #F1F5F9',
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{r.name}</div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#607D8B',
                        }}
                      >
                        {r.email}
                        {r.headline ? ` • ${r.headline}` : ''}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div>
              <label style={label}>Client</label>
              <input
                value={form.clientName}
                onChange={(e) => update('clientName', e.target.value)}
                style={input}
                placeholder="e.g. Jane Doe (Acme Corp)"
              />
            </div>
          )}

          {/* Type / Status */}
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
                value={form.type}
                onChange={(e) => update('type', e.target.value)}
                style={input}
              >
                <option value="Strategy">Strategy</option>
                <option value="Resume">Resume</option>
                <option value="Interview">Interview</option>
              </select>
            </div>
            <div>
              <label style={label}>Status</label>
              <select
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
                style={input}
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="No-show">No-show</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={label}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              style={{
                ...input,
                minHeight: 100,
                resize: 'vertical',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
              }}
            />
          </div>

          {/* Footer buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 4,
            }}
          >
            {mode === 'edit' ? (
              <button
                type="button"
                onClick={remove}
                disabled={saving}
                style={{
                  background: '#FFFFFF',
                  color: '#B91C1C',
                  border: '1px solid rgba(248,113,113,0.9)',
                  padding: '8px 16px',
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            ) : (
              <span />
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(255,112,67,0.8)',
                  color: '#FF7043',
                  padding: '8px 16px',
                  borderRadius: 999,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  background: '#FF7043',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: '0 12px 26px rgba(255,112,67,0.45)',
                }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
