// pages/settings/profile-url.js
'use client';

import React, { useState, useEffect } from 'react';

export default function ProfileUrlSettings() {
  const [slug, setSlug] = useState('');
  const [currentSlug, setCurrentSlug] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Load the user slug
  useEffect(() => {
    let cancel = false;

    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!data?.user || cancel) return;

        const savedSlug = data.user.slug || '';
        setCurrentSlug(savedSlug);
        setSlug(savedSlug);
      } catch (err) {
        if (!cancel) console.error(err);
      }
    })();

    return () => {
      cancel = true;
    };
  }, []);

  const handleSave = async () => {
    const cleanSlug = (slug || '').trim();
    setSlug(cleanSlug);
    setSaving(true);
    setMessage(null);
    setError(null);

    if (!cleanSlug) {
      setError('Please enter a profile URL.');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/profile/slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ desiredSlug: cleanSlug }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update profile URL');
        setSaving(false);
        return;
      }

      setMessage('Your profile URL has been updated.');
      setCurrentSlug(data.slug);
      setSlug(data.slug);
    } catch (err) {
      setError('Unexpected error.');
    }

    setSaving(false);
  };

  const previewUrl = slug ? `https://forgetomorrow.com/u/${slug}` : '';

  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '40px 20px',
        minHeight: '80vh',
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20 }}>
        Public Profile URL
      </h1>

      <p style={{ color: '#455A64', marginBottom: 20 }}>
        Choose a unique public URL for your ForgeTomorrow profile. This link can be
        shared on resumes, LinkedIn, or with recruiters.
      </p>

      {/* Current URL (if any) */}
      {currentSlug && (
        <div
          style={{
            marginBottom: 20,
            padding: '10px 14px',
            borderRadius: 8,
            background: '#ECEFF1',
            fontSize: 14,
            color: '#263238',
          }}
        >
          Current URL:{' '}
          <strong>{`https://forgetomorrow.com/u/${currentSlug}`}</strong>
        </div>
      )}

      {/* Input label */}
      <label
        style={{
          display: 'block',
          marginBottom: 6,
          color: '#37474F',
          fontWeight: 600,
        }}
      >
        Profile URL
      </label>

      {/* URL base + slug input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 14,
            color: '#546E7A',
            padding: '10px 12px',
            background: '#ECEFF1',
            borderRadius: 8,
            border: '1px solid #cfd8dc',
            whiteSpace: 'nowrap',
          }}
        >
          https://forgetomorrow.com/u/
        </span>

        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="yourname"
          style={{
            flex: 1,
            padding: '10px 14px',
            fontSize: 16,
            borderRadius: 8,
            border: '1px solid #ccc',
          }}
        />
      </div>

      {/* URL Preview */}
      {slug && (
        <div
          style={{
            marginBottom: 14,
            background: '#ECEFF1',
            padding: '8px 12px',
            borderRadius: 6,
            fontSize: 14,
            color: '#263238',
          }}
        >
          Preview: {previewUrl}
        </div>
      )}

      {/* Helper text */}
      <p style={{ fontSize: 13, color: '#78909C', marginBottom: 18 }}>
        Use 3–40 characters. Letters, numbers, and hyphens only. Some words are
        blocked to keep ForgeTomorrow professional.
      </p>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          background: '#FF7043',
          color: 'white',
          padding: '10px 16px',
          borderRadius: 8,
          border: 'none',
          cursor: 'pointer',
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        {saving ? 'Saving…' : 'Save'}
      </button>

      {/* Feedback */}
      {message && (
        <p style={{ color: '#388E3C', marginTop: 18, fontWeight: 600 }}>
          {message}
        </p>
      )}

      {error && (
        <p style={{ color: '#D32F2F', marginTop: 18, fontWeight: 600 }}>
          {error}
        </p>
      )}
    </main>
  );
}
