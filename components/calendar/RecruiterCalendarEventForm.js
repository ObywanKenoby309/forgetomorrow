// components/calendar/RecruiterCalendarEventForm.js
import React, { useEffect, useRef, useState } from 'react';

export default function RecruiterCalendarEventForm({
  mode = 'add', // 'add' | 'edit'
  initial = null, // { id?, title, date, time, candidateType, candidateUserId, candidateName, type, status, notes, calendarScope }
  onClose,
  onSave,
  onDelete,
  typeChoices = [],
  statusChoices = [],
  saving = false,
}) {
  const firstRef = useRef(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // ───────────── Form state ─────────────
  const [form, setForm] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);

    const candidateType =
      initial?.candidateType === 'internal' || initial?.candidateType === 'external'
        ? initial.candidateType
        : initial?.candidateUserId
        ? 'internal'
        : 'external';

    const calendarScope =
      initial?.calendarScope === 'personal' || initial?.calendarScope === 'team'
        ? initial.calendarScope
        : 'team';

    return {
      title: initial?.title || '',
      date: initial?.date || today,
      time: initial?.time || '09:00',
      candidateType,
      candidateUserId: initial?.candidateUserId || null,
      candidateName:
        initial?.candidateName ||
        initial?.candidate ||
        '',
      type: initial?.type || typeChoices[0] || 'Interview',
      status: initial?.status || statusChoices[0] || 'Scheduled',
      notes: initial?.notes || '',
      calendarScope, // 'team' | 'personal'
    };
  });

  const update = (key, value) =>
    setForm((f) => ({
      ...f,
      [key]: value,
    }));

  // ───────────── Contacts search (internal candidates) ─────────────
  const [candidateSearchTerm, setCandidateSearchTerm] = useState(
    (initial?.candidateType === 'internal' &&
      (initial?.candidateName || initial?.candidate)) ||
      ''
  );
  const [candidateResults, setCandidateResults] = useState([]);
  const [candidateSearchLoading, setCandidateSearchLoading] = useState(false);
  const [candidateSearchError, setCandidateSearchError] = useState('');

  useEffect(() => {
    if (firstRef.current) firstRef.current.focus();
    const onEsc = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  useEffect(() => {
    if (form.candidateType !== 'internal') return;

    const term = candidateSearchTerm.trim();
    if (!term) {
      setCandidateResults([]);
      setCandidateSearchError('');
      return;
    }

    let active = true;
    const controller = new AbortController();

    async function run() {
      try {
        setCandidateSearchLoading(true);
        setCandidateSearchError('');

        const res = await fetch(
          `/api/contacts/search?q=${encodeURIComponent(term)}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          if (!active) return;
          console.error('Contacts search failed:', await res.text());
          setCandidateResults([]);
          setCandidateSearchError('Search failed. Try again.');
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
          setCandidateResults(results);
        }
      } catch (err) {
        if (!active) return;
        if (err.name === 'AbortError') return;
        console.error('Candidate search error', err);
        setCandidateResults([]);
        setCandidateSearchError('Search failed. Try again.');
      } finally {
        if (active) {
          setCandidateSearchLoading(false);
        }
      }
    }

    run();
    return () => {
      active = false;
      controller.abort();
    };
  }, [candidateSearchTerm, form.candidateType]);

  const selectCandidate = (c) => {
    const display = c.name || c.email;
    setForm((f) => ({
      ...f,
      candidateType: 'internal',
      candidateUserId: c.id,
      candidateName: display,
    }));
    setCandidateSearchTerm(display);
    setCandidateResults([]);
    setCandidateSearchError('');
  };

  const clearSelectedCandidate = () => {
    setForm((f) => ({
      ...f,
      candidateUserId: null,
      candidateName: '',
    }));
    setCandidateSearchTerm('');
    setCandidateResults([]);
    setCandidateSearchError('');
  };

  // ───────────── Styles ─────────────
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

  const calendarToggleButton = (active) => ({
    borderRadius: 999,
    border: active ? '1px solid #1A4B8F' : '1px solid #CFD8DC',
    background: active ? 'rgba(26,75,143,0.08)' : '#FFFFFF',
    color: active ? '#1A4B8F' : '#455A64',
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    minWidth: 70,
  });

  // ───────────── Submit ─────────────
  const handleSubmit = (e) => {
    e.preventDefault();

    const title = (form.title || '').trim();
    if (!title) {
      alert('Title is required.');
      return;
    }
    if (!form.date || !form.time) {
      alert('Date and time are required.');
      return;
    }

    const name = (form.candidateName || '').trim();

    if (form.candidateType === 'internal') {
      if (!form.candidateUserId) {
        alert('Please select a Forge candidate from your contacts.');
        return;
      }
    } else {
      if (!name) {
        alert('Please enter a candidate name.');
        return;
      }
    }

    onSave?.({
      ...form,
      title,
      candidateName: name,
    });
  };

  // ───────────── Render ─────────────
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
          maxWidth: 860,
          boxShadow: '0 24px 60px rgba(15,23,42,0.55)',
          overflow: 'hidden',
          color: '#263238',
          border: '1px solid rgba(148,163,184,0.7)',
        }}
      >
        {/* Header with title + calendar toggle (Option 2 layout) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderBottom: '1px solid #E5E7EB',
            gap: 16,
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
              {mode === 'edit' ? 'Edit Calendar Item' : 'Add Calendar Item'}
            </h3>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 6,
            }}
          >
            <span
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#90A4AE',
                fontWeight: 600,
              }}
            >
              Calendar
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => update('calendarScope', 'team')}
                style={calendarToggleButton(form.calendarScope === 'team')}
                disabled={saving}
              >
                Team
              </button>
              <button
                type="button"
                onClick={() => update('calendarScope', 'personal')}
                style={calendarToggleButton(form.calendarScope === 'personal')}
                disabled={saving}
              >
                Personal (only me)
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'grid',
            gap: 14,
            padding: '16px 20px 20px',
          }}
        >
          {/* Title */}
          <div>
            <label style={label}>
              Title <span style={{ color: '#EF6C00' }}>*</span>
            </label>
            <input
              ref={firstRef}
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              style={input}
              placeholder="e.g., Phone Screen with Acme"
            />
          </div>

          {/* Candidate type */}
          <div>
            <div style={{ ...label, marginBottom: 4 }}>Candidate Type</div>
            <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
              <label style={{ cursor: 'pointer', color: '#37474F' }}>
                <input
                  type="radio"
                  name="candidateType"
                  checked={form.candidateType === 'internal'}
                  onChange={() => {
                    update('candidateType', 'internal');
                    update('candidateUserId', null);
                    setCandidateSearchTerm(form.candidateName || '');
                    setCandidateResults([]);
                    setCandidateSearchError('');
                  }}
                  style={{ marginRight: 6 }}
                />
                Forge candidate (from my contacts)
              </label>
              <label style={{ cursor: 'pointer', color: '#37474F' }}>
                <input
                  type="radio"
                  name="candidateType"
                  checked={form.candidateType === 'external'}
                  onChange={() => {
                    update('candidateType', 'external');
                    update('candidateUserId', null);
                    setCandidateSearchTerm('');
                    setCandidateResults([]);
                    setCandidateSearchError('');
                  }}
                  style={{ marginRight: 6 }}
                />
                External candidate
              </label>
            </div>
          </div>

          {/* Internal candidate search */}
          {form.candidateType === 'internal' && (
            <div>
              <div style={label}>Search Contacts</div>
              <input
                type="text"
                placeholder="Search name or email..."
                value={candidateSearchTerm}
                onChange={(e) => setCandidateSearchTerm(e.target.value)}
                style={{ ...input, marginBottom: 4 }}
              />
              {form.candidateUserId && (
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
                  <span>
                    Selected: {form.candidateName || '(no name provided)'}
                  </span>
                  <button
                    type="button"
                    onClick={clearSelectedCandidate}
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
              {candidateSearchLoading && (
                <div style={{ fontSize: 12, color: '#90A4AE' }}>
                  Searching…
                </div>
              )}
              {candidateSearchError && (
                <div style={{ fontSize: 12, color: '#C62828' }}>
                  {candidateSearchError}
                </div>
              )}
              {candidateResults.length > 0 && (
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
                  {candidateResults.map((r) => (
                    <li
                      key={r.id}
                      onClick={() => selectCandidate(r)}
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
              {candidateResults.length === 0 &&
                candidateSearchTerm.trim() &&
                !candidateSearchLoading &&
                !candidateSearchError && (
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                    No contacts matched that search.
                  </div>
                )}
            </div>
          )}

          {/* External candidate name */}
          {form.candidateType === 'external' && (
            <div>
              <label style={label}>Candidate Name</label>
              <input
                type="text"
                value={form.candidateName}
                onChange={(e) => update('candidateName', e.target.value)}
                style={input}
                placeholder="e.g., Jane Doe (Acme Corp)"
              />
            </div>
          )}

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
                {(typeChoices.length
                  ? typeChoices
                  : ['Interview', 'Screen', 'Sourcing', 'Offer', 'Task', 'Appointment']
                ).map((t) => (
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
                onChange={(e) => update('status', e.target.value)}
                style={input}
              >
                {(statusChoices.length
                  ? statusChoices
                  : ['Scheduled', 'Completed', 'Canceled']
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
                    Delete this calendar item?
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
                  {saving
                    ? 'Saving…'
                    : mode === 'edit'
                    ? 'Save Changes'
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
