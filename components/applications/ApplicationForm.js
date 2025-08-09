// components/applications/ApplicationForm.js
import React, { useEffect, useState } from 'react';

export default function ApplicationForm({ mode = 'add', initial, onClose, onSave, stages = [] }) {
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

  useEffect(() => {
    const onEsc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.company) {
      alert('Title and Company are required');
      return;
    }
    onSave(form);
  };

  const inputStyle = {
    border: '1px solid #DADCE0',
    borderRadius: '8px',
    padding: '10px 12px',
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
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        }}
      >
        <h2 style={{ color: '#FF7043', marginTop: 0 }}>
          {mode === 'edit' ? 'Edit Application' : 'Add Application'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={labelStyle}>Job Title *</label>
            <input name="title" value={form.title} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Company *</label>
            <input name="company" value={form.company} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Location</label>
            <input name="location" value={form.location} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Job Link (optional)</label>
            <input name="link" value={form.link} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Date Added</label>
              <input type="date" name="dateAdded" value={form.dateAdded} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
                {stages.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 12px', borderRadius: 6 }}>Cancel</button>
            <button type="submit" style={{ backgroundColor: '#FF7043', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px' }}>
              {mode === 'edit' ? 'Save Changes' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
