// components/profile/ProfileAbout.js
import React, { useState } from 'react';

export default function ProfileAbout({ about, setAbout }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(about || '');

  const handleSave = () => {
    setAbout(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(about || '');
    setIsEditing(false);
  };

  return (
    <section
      style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h3 style={{ margin: 0, color: '#FF7043', fontWeight: 700, fontSize: '1.1rem' }}>
          About Me
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              background: 'white',
              color: '#FF7043',
              border: '1px solid #FF7043',
              padding: '6px 16px',
              borderRadius: 999,
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              minWidth: 72
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#FFF5F0')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'white')}
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div style={{ display: 'grid', gap: 12 }}>
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Add a short summary about yourself..."
            rows={4}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 8,
              border: '1px solid #cbd5e0',
              fontSize: '1rem',
              resize: 'vertical',
              outline: 'none'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              onClick={handleCancel}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: '1px solid #cbd5e0',
                background: 'white',
                color: '#4a5568',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                background: '#FF7043',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <p
          style={{
            margin: 0,
            color: about ? '#2d3748' : '#718096',
            fontSize: '1rem',
            lineHeight: 1.6,
            minHeight: 48,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {about || 'Add a short summary about yourself...'}
        </p>
      )}
    </section>
  );
}