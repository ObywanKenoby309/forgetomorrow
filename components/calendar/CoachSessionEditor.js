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
      setSearch(initial.clientName || '');
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <form
        onSubmit={save}
        style={{
          background: 'white',
          width: 480,
          borderRadius: 12,
          padding: 20,
          display: 'grid',
          gap: 12,
        }}
      >
        <h3 style={{ margin: 0, color: '#FF7043' }}>
          {mode === 'add' ? 'Add Session' : 'Edit Session'}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>
            Date
            <input
              type="date"
              value={form.date}
              onChange={(e) => update('date', e.target.value)}
              style={{ width: '100%' }}
            />
          </label>
          <label>
            Time
            <input
              type="time"
              value={form.time}
              onChange={(e) => update('time', e.target.value)}
              style={{ width: '100%' }}
            />
          </label>
        </div>

        <div>
          <strong>Client Type</strong>
          <div style={{ display: 'flex', gap: 16 }}>
            <label>
              <input
                type="radio"
                checked={form.clientType === 'internal'}
                onChange={() =>
                  update('clientType', 'internal') ||
                  update('clientUserId', null)
                }
              />
              Forge user
            </label>
            <label>
              <input
                type="radio"
                checked={form.clientType === 'external'}
                onChange={() =>
                  update('clientType', 'external') ||
                  update('clientUserId', null)
                }
              />
              External
            </label>
          </div>
        </div>

        {form.clientType === 'internal' ? (
          <div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts…"
              style={{ width: '100%' }}
            />
            {searching && <div>Searching…</div>}
            {results.map((r) => (
              <div
                key={r.id}
                onClick={() => selectClient(r)}
                style={{ cursor: 'pointer', padding: 4 }}
              >
                {r.name || r.email}
              </div>
            ))}
          </div>
        ) : (
          <label>
            Client Name
            <input
              value={form.clientName}
              onChange={(e) => update('clientName', e.target.value)}
              style={{ width: '100%' }}
            />
          </label>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>
            Type
            <select
              value={form.type}
              onChange={(e) => update('type', e.target.value)}
            >
              <option>Strategy</option>
              <option>Resume</option>
              <option>Interview</option>
            </select>
          </label>
          <label>
            Status
            <select
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
            >
              <option>Scheduled</option>
              <option>Completed</option>
              <option>No-show</option>
            </select>
          </label>
        </div>

        <label>
          Notes
          <textarea
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            style={{
              width: '100%',
              minHeight: 90,
              border: '1px solid #ddd',
              resize: 'vertical',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
            }}
          />
        </label>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {mode === 'edit' && (
            <button
              type="button"
              onClick={remove}
              disabled={saving}
              style={{ color: '#C62828' }}
            >
              Delete
            </button>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={saving}>
              Save
            </button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
