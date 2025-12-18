// components/profile/ProfileSkills.js
import React, { useState } from 'react';

export default function ProfileSkills({ skills = [], setSkills }) {
  const [newSkill, setNewSkill] = useState('');

  const addSkill = () => {
    const v = newSkill.trim();
    if (!v) return;

    const exists = skills.some((s) => s.toLowerCase() === v.toLowerCase());
    if (!exists) setSkills([...skills, v]);

    setNewSkill('');
  };

  const removeSkill = (val) => {
    setSkills(skills.filter((s) => s !== val));
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
      <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
        <input
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addSkill();
            }
          }}
          placeholder="Add a skill…"
          aria-label="New skill"
          style={{
            border: '1px solid #ddd',
            borderRadius: 10,
            padding: '8px 10px',
            flex: 1,
            outline: 'none',
            background: 'white',
          }}
        />
        <button
          type="button"
          onClick={addSkill}
          style={{
            background: 'white',
            color: '#FF7043',
            border: '1px solid #FF7043',
            borderRadius: 10,
            padding: '8px 12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          + Add
        </button>
      </div>

      {skills.length === 0 ? (
        <div style={{ color: '#607D8B' }}>No skills yet.</div>
      ) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {skills.map((skill) => (
            <Chip key={skill} text={skill} onRemove={() => removeSkill(skill)} />
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
      }}
    >
      {text}
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
        }}
        title="Remove"
      >
        ×
      </button>
    </span>
  );
}
