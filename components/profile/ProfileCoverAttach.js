// components/profile/ProfileCoverAttach.js
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function ProfileCoverAttach({ withChrome }) {
  const [covers, setCovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const loadCovers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/profile/cover');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load cover letters.');
      }
      const data = await res.json();
      setCovers(data.covers || []);
    } catch (err) {
      console.error('loadCovers', err);
      setError(err.message || 'Failed to load cover letters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCovers();
  }, []);

  const primary =
    covers.find((c) => c.isPrimary) || covers[0] || null;

  const handleNew = () => {
  if (withChrome) {
    window.location.href = withChrome('/resume-cover');
  } else {
    window.location.href = 'https://www.forgetomorrow.com/resume-cover';
  }
};

  const handleEdit = () => {
  if (!primary) return;

  if (withChrome) {
    // Route through the app shell (preserve chrome param)
    window.location.href = withChrome('/resume-cover');
  } else {
    // Fallback if outside the chrome layout
    window.location.href = 'https://www.forgetomorrow.com/resume-cover';
  }
};

  return (
    <section
      style={{
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 16,
        background: 'white',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
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
          Primary Cover Letter
        </h3>

        <div style={{ display: 'flex', gap: 8 }}>
          {primary && (
            <button
              type="button"
              onClick={handleEdit}
              style={{
                background: 'white',
                color: '#FF7043',
                border: '1px solid #FF7043',
                borderRadius: 10,
                padding: '6px 10px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Edit in builder
            </button>
          )}
          <button
            type="button"
            onClick={handleNew}
            style={{
              background: 'white',
              color: '#FF7043',
              border: '1px solid #FF7043',
              borderRadius: 10,
              padding: '6px 10px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            New cover letter
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ margin: 0, color: '#718096', fontSize: '0.9375rem' }}>
          Loading cover letters…
        </p>
      ) : covers.length === 0 ? (
        <p style={{ margin: 0, color: '#718096', fontSize: '0.9375rem' }}>
          No cover letters saved yet. Use the Cover Letter Builder to create one
          and set it as your primary.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={{ fontSize: 13, color: '#607D8B' }}>
            Primary:{' '}
            <strong style={{ color: '#263238' }}>
              {primary.name || `Cover ${primary.id}`}
            </strong>
          </div>
          {primary.updatedAt && (
            <div style={{ fontSize: 12, color: '#90A4AE' }}>
              Last updated:{' '}
              {new Date(primary.updatedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      {error && (
        <p
          style={{
            marginTop: 8,
            color: '#e53e3e',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </p>
      )}
    </section>
  );
}
