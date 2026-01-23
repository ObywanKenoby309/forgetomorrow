// components/profile/ProfileEducation.js
import React, { useState } from 'react';

export default function ProfileEducation({ education = [], setEducation }) {
  const [school, setSchool] = useState('');
  const [degree, setDegree] = useState('');
  const [field, setField] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');

  const addEducation = () => {
    const s = school.trim();
    if (!s) return;

    const entry = {
      id: `${Date.now()}`,
      school: s,
      degree: degree.trim(),
      field: field.trim(),
      startYear: startYear.trim(),
      endYear: endYear.trim(),
    };

    // ✅ functional update (prevents stale prop issues)
    setEducation((prev) => [entry, ...(Array.isArray(prev) ? prev : [])]);

    setSchool('');
    setDegree('');
    setField('');
    setStartYear('');
    setEndYear('');
  };

  const removeEducation = (id) => {
    // ✅ functional update (prevents stale prop issues)
    setEducation((prev) =>
      Array.isArray(prev) ? prev.filter((e) => e.id !== id) : []
    );
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
      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 800, color: '#455A64' }}>
            School
          </label>
          <input
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="University / College / Program"
            style={{
              border: '1px solid #ddd',
              borderRadius: 10,
              padding: '8px 10px',
              outline: 'none',
              background: 'white',
              width: '100%',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 800, color: '#455A64' }}>
              Degree
            </label>
            <input
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              placeholder="BS, AA, Diploma, Certificate"
              style={{
                border: '1px solid #ddd',
                borderRadius: 10,
                padding: '8px 10px',
                outline: 'none',
                background: 'white',
                width: '100%',
              }}
            />
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 800, color: '#455A64' }}>
              Field
            </label>
            <input
              value={field}
              onChange={(e) => setField(e.target.value)}
              placeholder="Computer Science, Business, etc."
              style={{
                border: '1px solid #ddd',
                borderRadius: 10,
                padding: '8px 10px',
                outline: 'none',
                background: 'white',
                width: '100%',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 800, color: '#455A64' }}>
              Start year
            </label>
            <input
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
              placeholder="2012"
              style={{
                border: '1px solid #ddd',
                borderRadius: 10,
                padding: '8px 10px',
                outline: 'none',
                background: 'white',
                width: '100%',
              }}
            />
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 800, color: '#455A64' }}>
              End year
            </label>
            <input
              value={endYear}
              onChange={(e) => setEndYear(e.target.value)}
              placeholder="2016 (or Present)"
              style={{
                border: '1px solid #ddd',
                borderRadius: 10,
                padding: '8px 10px',
                outline: 'none',
                background: 'white',
                width: '100%',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={addEducation}
            style={{
              background: 'white',
              color: '#FF7043',
              border: '1px solid #FF7043',
              borderRadius: 10,
              padding: '8px 12px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            + Add
          </button>
        </div>

        {education.length === 0 ? (
          <div style={{ color: '#607D8B' }}>No education added yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {education.map((e) => (
              <div
                key={e.id}
                style={{
                  border: '1px solid #e6e9ef',
                  borderRadius: 12,
                  padding: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 900, color: '#263238' }}>{e.school}</div>
                  <div style={{ fontSize: 13, color: '#455A64' }}>
                    {[e.degree, e.field].filter(Boolean).join(' • ')}
                  </div>
                  <div style={{ fontSize: 12, color: '#90A4AE' }}>
                    {[e.startYear, e.endYear].filter(Boolean).join(' – ')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeEducation(e.id)}
                  style={{
                    border: '1px solid #C62828',
                    color: '#C62828',
                    background: 'white',
                    borderRadius: 999,
                    padding: '6px 10px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    height: 'fit-content',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
