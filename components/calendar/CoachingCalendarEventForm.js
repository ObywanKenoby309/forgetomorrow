// components/calendar/CoachingCalendarEventForm.js
import React, { useEffect, useRef, useState } from 'react';

export default function CoachingCalendarEventForm({
  mode = 'add',
  initial = null,
  onClose,
  onSave,
  onDelete,
  typeChoices = [],
  statusChoices = [],
  saving = false, // receive saving from parent, default false
}) {
  const firstRef = useRef(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [form, setForm] = useState(() => ({
    title: initial?.title || initial?.client || '',
    time: initial?.time || '',
    type: initial?.type || (typeChoices[0] || 'Strategy'),
    status: initial?.status || (statusChoices[0] || 'Scheduled'),
    notes: initial?.notes || '',
    date: initial?.date || new Date().toISOString().slice(0, 10),
    idx: typeof initial?.idx === 'number' ? initial.idx : null,
    origDate: initial?.date || null,
    participants: initial?.participants || '',
  }));

  useEffect(() => {
    if (firstRef.current) firstRef.current.focus();
    const onEsc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

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
        background: 'rgba(15,23,42,0.60)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
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
          maxWidth: 480,
          boxShadow: '0 24px 60px rgba(15,23,42,0.55)',
          overflow: 'hidden',
          color: '#0f172a',
          border: '1px solid rgba(148,163,184,0.7)',
          padding: 20,
          display: 'grid',
          gap: 12,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
          }}
        >
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
          <span
            style={{
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#94A3B8',
            }}
          >
            Coaching
          </span>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          style={{ display: 'grid', gap: 12, marginTop: 4 }}
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
              gap: 12,
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
              gap: 12,
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
              style={{
                ...input,
                resize: 'vertical',
                minHeight: 90,
                whiteSpace: 'pre-wrap',
              }}
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
                    background: '#FFFFFF',
                    color: '#B91C1C',
                    border: '1px solid rgba(248,113,113,0.8)',
                    padding: '7px 12px',
                    borderRadius: 999,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                  disabled={saving}
                >
                  Delete
                </button>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: '#B91C1C' }}>
                    Delete this session?
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid rgba(148,163,184,0.8)',
                      padding: '5px 10px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                    disabled={saving}
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
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                    disabled={saving}
                  >
                    Confirm
                  </button>
                </div>
              )
            ) : (
              <span />
            )}

            {!confirmingDelete && (
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(255,112,67,0.8)',
                    padding: '8px 14px',
                    borderRadius: 999,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#FF7043',
                  }}
                  disabled={saving}
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
                    padding: '8px 18px',
                    borderRadius: 999,
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 14,
                    boxShadow: '0 12px 26px rgba(255,112,67,0.45)',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {mode === 'edit'
                    ? saving
                      ? 'Saving…'
                      : 'Save Changes'
                    : saving
                    ? 'Saving…'
                    : 'Save'}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
