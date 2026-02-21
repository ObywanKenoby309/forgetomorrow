// components/applications/ApplicationForm.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom'; // ✅ FIX #1: portal to escape dnd-kit stacking context

export default function ApplicationForm({
  mode = 'add',
  initial,
  onClose,
  onSave,
  onDelete,
  stages = [],
}) {
  const [form, setForm] = useState({
    id: initial?.id || null,
    title: initial?.title || '',
    company: initial?.company || '',
    location: initial?.location || '',
    url: initial?.url || '',
    notes: initial?.notes || '',
    dateAdded: initial?.dateAdded || new Date().toISOString().split('T')[0],
    status: initial?.status || 'Applied',
    originalStage: initial?.originalStage || initial?.status || 'Applied',

    jobId: initial?.jobId ?? null,
    locked: initial?.locked ?? false,
    isRecruiterControlled: initial?.isRecruiterControlled ?? false,
  });

  const [dirty, setDirty] = useState(false);

  const titleRef = useRef(null);
  const notesRef = useRef(null);

  // ✅ FIX #2: isReadOnlyInternal now correctly reads from initial (which includes locked + isRecruiterControlled)
  const isReadOnlyInternal = useMemo(() => {
    const explicit =
      initial?.locked === true ||
      initial?.isRecruiterControlled === true ||
      form.locked === true ||
      form.isRecruiterControlled === true;

    const hasJobId = !!(initial?.jobId ?? form.jobId);
    const originalStage = String(initial?.originalStage || form.originalStage || '').trim();
    const isPinned = originalStage === 'Pinned';
    const inferredInternal = hasJobId && !isPinned;

    return explicit || inferredInternal;
  }, [initial, form.jobId, form.locked, form.isRecruiterControlled, form.originalStage]);

  useEffect(() => {
    if (isReadOnlyInternal) {
      if (notesRef.current) notesRef.current.focus();
    } else {
      if (titleRef.current) titleRef.current.focus();
    }

    const beforeUnload = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);

    const onEsc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEsc);

    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('keydown', onEsc);
    };
  }, [dirty, onClose, isReadOnlyInternal]);

  const handleChange = (e) => {
    if (isReadOnlyInternal && e.target.name !== 'notes') return;
    setDirty(true);
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isReadOnlyInternal) {
      onSave({
        ...form,
        title: initial?.title ?? form.title,
        company: initial?.company ?? form.company,
        location: initial?.location ?? form.location,
        url: initial?.url ?? form.url,
        dateAdded: initial?.dateAdded ?? form.dateAdded,
        status: initial?.status ?? form.status,
      });
      return;
    }

    if (!form.title.trim() || !form.company.trim()) {
      alert('Job Title and Company are required.');
      return;
    }

    onSave(form);
  };

  const handleDeleteClick = () => {
    if (!onDelete || !form.id) return;
    if (!confirm('Delete this application?')) return;
    onDelete(form.id, form.originalStage);
  };

  const inputStyle = {
    border: '1px solid #DADCE0',
    borderRadius: '8px',
    padding: '8px 10px',
    width: '100%',
    outline: 'none',
  };

  const labelStyle = {
    fontSize: 12,
    color: '#607D8B',
    marginBottom: 4,
    display: 'block',
  };

  const readOnlyStyle = isReadOnlyInternal
    ? { background: '#F8FAFC', color: '#475569', cursor: 'not-allowed' }
    : {};

  // ✅ FIX #1: modal JSX extracted so we can wrap in createPortal
  const modal = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '80px',
        zIndex: 9999, // ✅ bumped from 1000 — portal ensures this wins
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '0 0 16px 0',
          width: '100%',
          maxWidth: 480,
          maxHeight: '85vh',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #eee',
            position: 'sticky',
            top: 0,
            background: 'white',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
          }}
        >
          <div style={{ display: 'grid', gap: 2 }}>
            <h2 style={{ color: '#FF7043', margin: 0, fontSize: 18 }}>
              {mode === 'edit' ? 'Edit Application' : 'Add Application'}
            </h2>

            {isReadOnlyInternal ? (
              <div style={{ fontSize: 12, color: '#607D8B' }}>
                This application stage is recruiter-controlled. You can add notes, but other fields are read-only.
              </div>
            ) : null}
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              lineHeight: '1',
              cursor: 'pointer',
              color: '#999',
            }}
            aria-label="Close form"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'grid', gap: 8, padding: '16px', overflowY: 'auto' }}
        >
          <div>
            <label style={labelStyle}>Job Title {isReadOnlyInternal ? '' : '*'}</label>
            <input
              ref={titleRef}
              name="title"
              value={form.title}
              onChange={handleChange}
              style={{ ...inputStyle, ...readOnlyStyle }}
              required={!isReadOnlyInternal}
              readOnly={isReadOnlyInternal}
              tabIndex={isReadOnlyInternal ? -1 : 0}
            />
          </div>

          <div>
            <label style={labelStyle}>Company {isReadOnlyInternal ? '' : '*'}</label>
            <input
              name="company"
              value={form.company}
              onChange={handleChange}
              style={{ ...inputStyle, ...readOnlyStyle }}
              required={!isReadOnlyInternal}
              readOnly={isReadOnlyInternal}
              tabIndex={isReadOnlyInternal ? -1 : 0}
            />
          </div>

          <div>
            <label style={labelStyle}>Location</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              style={{ ...inputStyle, ...readOnlyStyle }}
              readOnly={isReadOnlyInternal}
              tabIndex={isReadOnlyInternal ? -1 : 0}
            />
          </div>

          <div>
            <label style={labelStyle}>Job URL (optional)</label>
            <input
              name="url"
              value={form.url}
              onChange={handleChange}
              style={{ ...inputStyle, ...readOnlyStyle }}
              readOnly={isReadOnlyInternal}
              tabIndex={isReadOnlyInternal ? -1 : 0}
            />
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              ref={notesRef}
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={labelStyle}>Date Added</label>
              <input
                type="date"
                name="dateAdded"
                value={form.dateAdded}
                onChange={handleChange}
                style={{ ...inputStyle, ...readOnlyStyle }}
                readOnly={isReadOnlyInternal}
                tabIndex={isReadOnlyInternal ? -1 : 0}
              />
            </div>

            <div>
              <label style={labelStyle}>Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                style={{ ...inputStyle, ...(isReadOnlyInternal ? readOnlyStyle : {}) }}
                disabled={isReadOnlyInternal}
                tabIndex={isReadOnlyInternal ? -1 : 0}
              >
                {stages.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
            {mode === 'edit' && onDelete && !isReadOnlyInternal && (
              <button
                type="button"
                onClick={handleDeleteClick}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid #e53935',
                  background: 'white',
                  color: '#e53935',
                  cursor: 'pointer',
                  marginRight: 'auto',
                }}
              >
                Delete
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #ccc',
                background: 'white',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              style={{
                backgroundColor: '#FF7043',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              {mode === 'edit' ? 'Save Changes' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // ✅ FIX #1: render into document.body so dnd-kit stacking context can't trap the modal
  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null;
}