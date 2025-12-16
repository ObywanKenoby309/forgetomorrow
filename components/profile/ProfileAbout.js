// components/profile/ProfileAbout.js
import React, { useEffect, useState } from 'react';

export default function ProfileAbout({ about, setAbout }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(about || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loadingFromServer, setLoadingFromServer] = useState(false);

  // Keep local editValue in sync if parent about changes
  useEffect(() => {
    setEditValue(about || '');
  }, [about]);

  // Initial load from /api/profile/details when we don't already have a real value
  useEffect(() => {
    // ✅ FIX: only skip fetch if about is a non-empty string
    if (typeof about === 'string' && about.trim().length > 0) return;

    let cancelled = false;
    setLoadingFromServer(true);

    (async () => {
      try {
        const res = await fetch('/api/profile/details');
        if (!res.ok) throw new Error('Failed to load profile details');

        const data = await res.json();

        // ✅ robust read (supports different payload shapes)
        const serverAbout =
          data?.user?.aboutMe ??
          data?.user?.about ??
          data?.aboutMe ??
          '';

        if (!cancelled) {
          setEditValue(serverAbout || '');
          if (typeof setAbout === 'function') {
            setAbout(serverAbout || '');
          }
        }
      } catch (err) {
        console.error('Failed to load About Me', err);
      } finally {
        if (!cancelled) setLoadingFromServer(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [about, setAbout]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/profile/details', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aboutMe: editValue,
        }),
      });

      let data = {};
      if (!res.ok) {
        try {
          data = await res.json();
        } catch (_) {}
        throw new Error(data.error || 'Failed to save About Me');
      }

      if (typeof setAbout === 'function') {
        setAbout(editValue);
      }

      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save About Me', err);
      setError(err.message || 'Failed to save About Me');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(about || '');
    setIsEditing(false);
    setError(null);
  };

  const displayText =
    loadingFromServer && !(about && about.trim().length)
      ? 'Loading your summary…'
      : (about && about.trim().length)
      ? about
      : 'Add a short summary about yourself...';

  return (
    <section
      style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        position: 'relative',
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
        <h3
          style={{
            margin: 0,
            color: '#FF7043',
            fontWeight: 700,
            fontSize: '1.1rem',
          }}
        >
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
              minWidth: 72,
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
              outline: 'none',
            }}
          />
          {error && <small style={{ color: '#d32f2f' }}>{error}</small>}
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
                fontSize: '0.875rem',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                background: '#FF7043',
                color: 'white',
                fontWeight: 600,
                cursor: saving ? 'default' : 'pointer',
                fontSize: '0.875rem',
                opacity: saving ? 0.8 : 1,
              }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <p
          style={{
            margin: 0,
            color: about && about.trim().length ? '#2d3748' : '#718096',
            fontSize: '1rem',
            lineHeight: 1.6,
            minHeight: 48,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {displayText}
        </p>
      )}
    </section>
  );
}
