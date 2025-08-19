// components/applications/ApplicationForm.js
import React, { useEffect, useState, useRef } from 'react';

export default function ApplicationForm({
  mode = 'add',
  initial,
  onClose,
  onSave,
  stages = []
}) {
  const [form, setForm] = useState({
    id: initial?.id || null,
    title: initial?.title || '',
    company: initial?.company || '',
    location: initial?.location || '',
    link: initial?.link || '',
    notes: initial?.notes || '',
    dateAdded: initial?.dateAdded || new Date().toISOString().split('T')[0],
    status: initial?.status || 'Pinned',
    originalStage: initial?.originalStage || 'Pinned',
  });

  const [dirty, setDirty] = useState(false);
  const firstFieldRef = useRef(null);

  useEffect(() => {
    if (firstFieldRef.current) firstFieldRef.current.focus();

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
  }, [dirty, onClose]);

  const handleChange = (e) => {
    setDirty(true);
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.company.trim()) {
      alert('Job Title and Company are required.');
      return;
    }
    onSave(form);
  };

  // 🔻 slightly tighter inputs to reduce overall height
  const inputStyle = {
    border: '1px solid #DADCE0',
    borderRadius: '8px',
    padding: '8px 10px', // was 10px 12px
    width: '100%',
    outline: 'none',
  };

  const labelStyle = { fontSize: 12, color: '#607D8B', marginBottom: 4, display: 'block' };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'flex-start',  // push modal to the top
        justifyContent: 'center',
        paddingTop: '80px',  // adjust this to control how far below navbar
        zIndex: 1000,
		overflowY: 'auto',  // so it scrolls if content is taller than screen
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '0 0 16px 0', // was 20px bottom
          width: '100%',
          maxWidth: 480,
          maxHeight: '85vh',     // ✅ cap overall height
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',    // ✅ let inner body scroll instead
        }}
      >
        {/* Sticky header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px', // was 16px 20px
            borderBottom: '1px solid #eee',
            position: 'sticky',
            top: 0,
            background: 'white',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
          }}
        >
          <h2 style={{ color: '#FF7043', margin: 0, fontSize: 18 }}>
            {mode === 'edit' ? 'Edit Application' : 'Add Application'}
          </h2>
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
            &times;
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'grid',
            gap: 8,               // was 12
            padding: '16px',      // was 20px
            overflowY: 'auto',    // ✅ body scrolls if needed
          }}
        >
          <div>
            <label style={labelStyle}>Job Title *</label>
            <input
              ref={firstFieldRef}
              name="title"
              value={form.title}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Company *</label>
            <input
              name="company"
              value={form.company}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Location</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Job Link (optional)</label>
            <input
              name="link"
              value={form.link}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}                          // was 3
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 /* was 10 */ }}>
            <div>
              <label style={labelStyle}>Date Added</label>
              <input
                type="date"
                name="dateAdded"
                value={form.dateAdded}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                style={inputStyle}
              >
                {stages.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,            // was 10
              marginTop: 6,      // was 8
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '6px 10px', // was 8px 12px
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
                padding: '6px 12px', // was 8px 14px
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
}
