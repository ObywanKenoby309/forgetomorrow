// components/calendar/CoachingCalendarEventForm.js
import React, { useEffect, useRef, useState } from 'react';

export default function CoachingCalendarEventForm({
  mode = 'add',           // 'add' | 'edit'
  initial = null,         // { date, time, clientType, clientUserId, clientName, type, status, notes }
  onClose,
  onSave,
  onDelete,
  typeChoices = [],
  statusChoices = [],
  saving = false,         // passed from parent, default false
}) {
  const firstRef = useRef(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
      clientType: initialClientType,
      clientUserId: initial?.clientUserId || null,
      clientName:
        initial?.clientName ||
        initial?.client ||
        initial?.title ||
        '',
      type: initial?.type || typeChoices[0] || 'Strategy',
      status: initial?.status || statusChoices[0] || 'Scheduled',
      notes: initial?.notes || '',
    };
  });

  // Contacts search state (for internal clients)
  const [clientSearchTerm, setClientSearchTerm] = useState(
    (initial?.clientType === 'internal' && (initial?.clientName || initial?.client)) || ''
  );
  const [clientResults, setClientResults] = useState([]);
  const [clientSearchLoading, setClientSearchLoading] = useState(false);
  const [clientSearchError, setClientSearchError] = useState('');

  useEffect(() => {
    if (firstRef.current) firstRef.current.focus();
    const onEsc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  // Shared styles
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
  };

  const update = (key, value) =>
    setForm((f) => ({
      ...f,
      [key]: value,
    }));

  // Internal contacts search
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

        const res = await fetch(
          `/api/contacts/search?q=${encodeURIComponent(term)}`,
          { signal: controller.signal }
        );

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
    }));
    setClientSearchTerm('');
    setClientResults([]);
    setClientSearchError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.date || !form.time) {
      alert('Date and time are required.');
      return;
    }

    const name = (form.clientName || '').trim();

    if (form.clientType === 'internal') {
      if (!form.clientUserId) {
        alert('Please select a Forge contact for this client.');
        return;
      }
    } else {
      if (!name) {
        alert('Please enter a client name.');
        return;
      }
    }

    onSave?.({
      ...form,
      clientName: name,
    });
  };

  return (
    <div
      onClick={onClose}
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
          color: '#263238',
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
            borderBottom: '1px solid #E5E7EB',
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
              {mode === 'edit' ? 'Edit Session' : 'Add Session'}
            </h3>
          </div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#90A4AE',
              marginRight: 8,
              fontWeight: 600,
            }}
          >
            Coaching
          </div>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
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
                ref={firstRef}
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
                External client (not in Forge)
              </label>
            </div>
          </div>

          {/* Internal client search */}
          {form.clientType === 'internal' && (
            <div>
              <div style={label}>Client (from your contacts)</div>
              <input
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
              {clientSearchLoading && (
                <div style={{ fontSize: 12, color: '#90A4AE' }}>
                  Searching…
                </div>
              )}
              {clientSearchError && (
                <div style={{ fontSize: 12, color: '#C62828' }}>
                  {clientSearchError}
                </div>
              )}
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
                      <div style={{ fontWeight: 600, color: '#111827' }}>
                        {r.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#6B7280',
                        }}
                      >
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
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                    No contacts matched that search.
                  </div>
                )}
            </div>
          )}

          {/* External client name input */}
          {form.clientType === 'external' && (
            <div>
              <label style={label}>Client Name</label>
              <input
                type="text"
                value={form.clientName}
                onChange={(e) => update('clientName', e.target.value)}
                style={input}
                placeholder="e.g. John Doe (Acme Corp)"
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
                name="type"
                value={form.type}
                onChange={(e) => update('type', e.target.value)}
                style={input}
              >
                {(typeChoices.length ? typeChoices : ['Strategy', 'Resume', 'Interview']).map(
                  (t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  )
                )}
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
                {(statusChoices.length
                  ? statusChoices
                  : ['Scheduled', 'Completed', 'No-show']
                ).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
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

          {/* Footer */}
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
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  Delete
                </button>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ color: '#B71C1C', fontSize: 12 }}>
                    Delete this session?
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={saving}
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
                    disabled={saving}
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
                  disabled={saving}
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
                  disabled={saving}
                  style={{
                    background: '#FF7043',
                    color: 'white',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: 999,
                    cursor: 'pointer',
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
