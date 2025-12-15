// components/calendar/CoachSessionEditor.js
import React, { useEffect, useState } from 'react';

const API_URL = '/api/coaching/sessions';

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
    if (form.clientType === 'external' && !form.clientName.trim())
      return alert('Client name required.');
    if (form.clientType === 'internal' && !form.clientUserId)
      return alert('Select a Forge contact.');

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

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.6)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 16,
          width: '100%',
          maxWidth: 520,
          boxShadow: '0 24px 60px rgba(15,23,42,0.4)',
        }}
      >
        <form
          onSubmit={save}
          style={{ display: 'grid', gap: 14, padding: 20 }}
        >
          <h3 style={{ margin: 0 }}>
            {mode === 'edit' ? 'Edit Session' : 'Add Session'}
          </h3>

          {/* Client type */}
          <div>
            <strong>Client Type</strong>
            <div style={{ display: 'flex', gap: 20, marginTop: 6 }}>
              <label>
                <input
                  type="radio"
                  checked={form.clientType === 'internal'}
                  onChange={() => update('clientType', 'internal')}
                />{' '}
                Forge user
              </label>
              <label>
                <input
                  type="radio"
                  checked={form.clientType === 'external'}
                  onChange={() => update('clientType', 'external')}
                />{' '}
                External client
              </label>
            </div>
          </div>

          {form.clientType === 'internal' ? (
            <div>
              <input
                placeholder="Search contacts…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {searching && <div>Searching…</div>}
              {results.map((r) => (
                <div
                  key={r.id}
                  onClick={() => {
                    update('clientUserId', r.id);
                    update('clientName', r.name || r.email);
                    setSearch('');
                    setResults([]);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <strong>{r.name}</strong> – {r.email}
                </div>
              ))}
            </div>
          ) : (
            <input
              placeholder="Client name"
              value={form.clientName}
              onChange={(e) => update('clientName', e.target.value)}
            />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} />
            <input type="time" value={form.time} onChange={(e) => update('time', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <select value={form.type} onChange={(e) => update('type', e.target.value)}>
              <option>Strategy</option>
              <option>Resume</option>
              <option>Interview</option>
            </select>
            <select value={form.status} onChange={(e) => update('status', e.target.value)}>
              <option>Scheduled</option>
              <option>Completed</option>
              <option>No-show</option>
            </select>
          </div>

          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {mode === 'edit' && (
              <button type="button" onClick={remove} disabled={saving}>
                Delete
              </button>
            )}
            <div>
              <button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
