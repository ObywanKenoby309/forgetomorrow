// components/applications/AddApplicationForm.js
import React, { useState, useEffect } from 'react';

export default function AddApplicationForm({ onClose, onSave }) {
  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    status: 'Pinned',
    link: '',
    notes: '',
  });

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.company) {
      alert('Title and Company are required');
      return;
    }
    onSave(form);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          width: '100%',
          maxWidth: '400px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ color: '#FF7043', marginTop: 0 }}>Add Application</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input name="title" placeholder="Job Title" value={form.title} onChange={handleChange} />
          <input name="company" placeholder="Company" value={form.company} onChange={handleChange} />
          <input name="location" placeholder="Location" value={form.location} onChange={handleChange} />
          <input name="link" placeholder="Job Link (optional)" value={form.link} onChange={handleChange} />
          <textarea name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} rows="3" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ padding: '6px 12px' }}>Cancel</button>
            <button type="submit" style={{ backgroundColor: '#FF7043', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px' }}>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
