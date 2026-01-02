// components/profile/ProfileHobbies.js

import React, { useState } from 'react';

export default function ProfileHobbies({ hobbies = [], setHobbies }) {
  const [newHobby, setNewHobby] = useState('');

  const addHobby = () => {
    const v = newHobby.trim();
    if (!v) return;

    const exists = hobbies.some((h) => String(h).toLowerCase() === v.toLowerCase());
    if (!exists) setHobbies([...hobbies, v]);

    setNewHobby('');
  };

  const removeHobby = (val) => {
    setHobbies(hobbies.filter((h) => h !== val));
  };

  return (
    <section
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        border: '1px solid #e6e9ef',
      }}
    >
      <div
        style={{
          marginBottom: 8,
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap', // ✅ mobile fix
          alignItems: 'stretch',
          width: '100%',
        }}
      >
        <input
          value={newHobby}
          onChange={(e) => setNewHobby(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addHobby();
            }
          }}
          placeholder="Add a hobby…"
          aria-label="New hobby"
          style={{
            border: '1px solid #ddd',
            borderRadius: 10,
            padding: '8px 10px',
            flex: '1 1 220px',
            minWidth: 0,
            outline: 'none',
            background: 'white',
          }}
        />
        <button
          type="button"
          onClick={addHobby}
          style={{
            background: 'white',
            color: '#FF7043',
            border: '1px solid #FF7043',
            borderRadius: 10,
            padding: '8px 12px',
            fontWeight: 700,
            cursor: 'pointer',
            flex: '0 0 auto',
            whiteSpace: 'nowrap',
          }}
        >
          + Add
        </button>
      </div>

      {hobbies.length === 0 ? (
        <div style={{ color: '#607D8B' }}>No hobbies yet.</div>
      ) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {hobbies.map((hobby) => (
            <Chip key={hobby} text={hobby} onRemove={() => removeHobby(hobby)} />
          ))}
        </div>
      )}
    </section>
  );
}

function Chip({ text, onRemove }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        background: '#F7FAFC',
        color: '#455A64',
        padding: '6px 10px',
        borderRadius: 999,
        border: '1px solid #e6e9ef',
        maxWidth: '100%',
      }}
    >
      <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{text}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${text}`}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#90A4AE',
          fontWeight: 700,
          flexShrink: 0,
        }}
        title="Remove"
      >
        ×
      </button>
    </span>
  );
}
