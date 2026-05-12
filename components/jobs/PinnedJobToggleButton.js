// components/jobs/PinnedJobToggleButton.js
'use client';
import React, { useState, useEffect } from 'react';

export default function PinnedJobToggleButton({ jobId, initiallyPinned }) {
  const [isPinned, setIsPinned] = useState(!!initiallyPinned);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsPinned(!!initiallyPinned);
  }, [initiallyPinned]);

  const handleClick = async () => {
    if (!jobId || busy) return;
    setBusy(true);
    setError('');
    try {
      if (!isPinned) {
        // PIN
        const res = await fetch('/api/seeker/pinned-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to pin job');
        }
        setIsPinned(true);
      } else {
        // UNPIN — now sends body { jobId } (matches our API)
        const res = await fetch('/api/seeker/pinned-jobs', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to unpin job');
        }
        setIsPinned(false);
      }
    } catch (err) {
      console.error('[PinnedJobToggleButton] error', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <button
  type="button"
  onClick={handleClick}
  disabled={busy}
  title={isPinned ? 'Remove saved job' : 'Save this job'}
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    borderRadius: 999,
    border: `1px solid ${isPinned ? '#FF7043' : 'rgba(15,23,42,0.12)'}`,
    background: isPinned ? 'rgba(255,112,67,0.10)' : 'white',
    color: isPinned ? '#FF7043' : '#455A64',
    fontWeight: 700,
    fontSize: 13,
    cursor: busy ? 'default' : 'pointer',
    transition: 'all 150ms ease',
    boxShadow: isPinned
      ? '0 4px 12px rgba(255,112,67,0.12)'
      : '0 2px 8px rgba(15,23,42,0.05)',
  }}
>
  <span style={{ fontSize: 14 }}>
    {isPinned ? '★' : '☆'}
  </span>

  <span>
    {isPinned ? 'Saved' : 'Save Job'}
  </span>
</button>
      {error && (
        <div style={{ color: '#e53e3e', fontSize: 11, marginTop: 2 }}>
          {error}
        </div>
      )}
    </div>
  );
}