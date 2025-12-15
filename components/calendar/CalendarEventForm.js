// components/calendar/CalendarEventForm.js
import React, { useEffect, useRef, useState } from 'react';

export default function CalendarEventForm({
  mode = 'add',
  initial = null,
  onClose,
  onSave,
  onDelete,
  typeChoices = [],
  statusChoices = [],
}) {
  const firstRef = useRef(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [form, setForm] = useState(() => ({
    title: initial?.title || initial?.client || '',
    time: initial?.time || '',
    type: initial?.type || (typeChoices[0] || 'Task'),
    status: initial?.status || (statusChoices[0] || 'Scheduled'),
    notes: initial?.notes || '',
    date: initial?.date || new Date().toISOString().slice(0, 10),
    idx: typeof initial?.idx === 'number' ? initial.idx : null,
    origDate: initial?.date || null,
    participants: initial?.participants || '', // 🔹 NEW
  }));

  useEffect(() => {
    if (firstRef.current) firstRef.current.focus();
    const onEsc = (e) => e.key === 'Escape' && onClose();
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
    borderRadius: 8,
    padding: '8px 10px',
    width: '100%',
    outline: 'none',
  };

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return alert('Title is required.');
    onSave(form);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 12,
          width: '100%',
          maxWidth: 520,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #eee',
          }}
        >
          <h3 style={{ margin: 0, color: '#FF7043' }}>
            {mode === 'edit' ? 'Edit Calendar Item' : 'Add Calendar Item'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 22,
              lineHeight: 1,
              cursor: 'pointer',
              color: '#999',
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          style={{ display: 'grid', gap: 12, padding: 16 }}
        >
          <div>
            <label style={label}>Title *</label>
            <input
              ref={firstRef}
              name="title"
              value={form.title}
              onChange={handleChange}
              style={input}
              placeholder="e.g., Strategy Session with Jane Doe"
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}
          >
            <div>
              <label style={label}>Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                style={input}
              />
            </div>
            <div>
              <label style={label}>Time</label>
              <input
                name="time"
                value={form.time}
                onChange={handleChange}
                style={input}
                placeholder="09:00"
              />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}
          >
            <div>
              <label style={label}>Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                style={input}
              >
                {typeChoices.map((t) => (
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
                onChange={handleChange}
                style={input}
              >
                {statusChoices.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={label}>Participants (names / emails)</label>
            <input
              name="participants"
              value={form.participants}
              onChange={handleChange}
              style={input}
              placeholder="e.g., Jane Doe (jane@example.com)"
            />
          </div>

          <div>
            <label style={label}>Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              style={{ ...input, resize: 'vertical' }}
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
                  style={{
                    background: 'white',
                    color: '#B71C1C',
                    border: '1px solid #F5C6CB',
                    padding: '6px 10px',
                    borderRadius: 6,
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
                  <span
                    style={{ color: '#B71C1C', fontSize: 12 }}
                  >
                    Delete this item?
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
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
                    onClick={() =>
                      onDelete?.({
                        date: form.origDate || form.date,
                        idx: form.idx,
                      })
                    }
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
                  style={{
                    background: 'white',
                    border: '1px solid #ccc',
                    padding: '8px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#FF7043',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {mode === 'edit' ? 'Save Changes' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
