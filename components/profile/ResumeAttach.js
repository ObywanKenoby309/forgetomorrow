// components/profile/ResumeAttach.js
import React, { useEffect, useMemo, useState } from 'react';

/**
 * Minimal "Attach Resume" card for Profile
 * - Reads possible resumes from localStorage (heuristics for key names)
 * - Stores selection under PROFILE_SELECTED_RESUME_ID_V1
 * - Expects a withChrome(path) helper from the parent to preserve ?chrome=
 */
const SELECTED_KEY = 'PROFILE_SELECTED_RESUME_ID_V1';

// Try a few common keys you might have used elsewhere
const CANDIDATE_KEYS = ['resumes_v1', 'resume_list_v1', 'resumes'];

function readResumesFromLocalStorage() {
  try {
    for (const key of CANDIDATE_KEYS) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        // Normalize to { id, title, updatedAt } shape as best effort
        return parsed.map((r, idx) => ({
          id: String(r.id ?? idx + 1),
          title: r.title ?? r.name ?? `Resume ${idx + 1}`,
          updatedAt: r.updatedAt ?? r.updated_at ?? r.modifiedAt ?? null,
        }));
      }
    }
  } catch {}
  return [];
}

export default function ResumeAttach({ withChrome }) {
  const [resumes, setResumes] = useState([]);
  const [selectedId, setSelectedId] = useState('');

  // Initial load
  useEffect(() => {
    try {
      setResumes(readResumesFromLocalStorage());
      const saved = localStorage.getItem(SELECTED_KEY);
      if (saved) setSelectedId(saved);
    } catch {}
  }, []);

  // Persist selection
  useEffect(() => {
    try {
      if (selectedId) localStorage.setItem(SELECTED_KEY, selectedId);
      else localStorage.removeItem(SELECTED_KEY);
    } catch {}
  }, [selectedId]);

  const selected = useMemo(
    () => resumes.find((r) => String(r.id) === String(selectedId)) || null,
    [resumes, selectedId]
  );

  // Placeholder handlers (swap when your routes are ready)
  const handleView = () => {
    if (!selected) return;
    // TODO: replace this with your real route, e.g.: router.push(withChrome(`/seeker/resume/${selected.id}`))
    alert(`Open resume ${selected.title} (id: ${selected.id}) — wire route when ready.`);
  };
  const handleCreate = () => {
    // TODO: change to your actual builder route, e.g.: router.push(withChrome('/seeker/resume-builder'))
    alert('Open Resume Builder — wire route when ready.');
  };

  return (
    <section
      style={{
        background: 'white',
        borderRadius: 12,
        border: '1px solid #e6e9ef',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        padding: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <h3 style={{ margin: 0, color: '#263238', fontSize: 16, fontWeight: 700 }}>
          Attached Resume
        </h3>
        {selected && (
          <button
            type="button"
            onClick={handleView}
            style={{
              background: 'white',
              color: '#FF7043',
              border: '1px solid #FF7043',
              borderRadius: 10,
              padding: '6px 10px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            View
          </button>
        )}
      </div>

      {resumes.length === 0 ? (
        <div style={{ color: '#607D8B' }}>
          No resumes found yet. Create one and then attach it here.
          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              onClick={handleCreate}
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
              Create a resume
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ color: '#455A64', fontSize: 13, fontWeight: 600 }}>
            Choose a resume to attach
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              style={{
                marginTop: 6,
                border: '1px solid #ddd',
                borderRadius: 10,
                padding: '10px 12px',
                outline: 'none',
                background: 'white',
                width: '100%',
              }}
            >
              <option value="">— None —</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}{r.updatedAt ? ` — updated ${new Date(r.updatedAt).toLocaleDateString()}` : ''}
                </option>
              ))}
            </select>
          </label>

          {selected && (
            <div style={{ fontSize: 13, color: '#607D8B' }}>
              Attached: <strong style={{ color: '#263238' }}>{selected.title}</strong>
              {selected.updatedAt && ` (updated ${new Date(selected.updatedAt).toLocaleDateString()})`}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
