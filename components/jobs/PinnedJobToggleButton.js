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
        // UNPIN by jobId
        const res = await fetch(`/api/seeker/pinned-jobs?jobId=${jobId}`, {
          method: 'DELETE',
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
        title={isPinned ? 'Unpin this job' : 'Pin this job'}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: busy ? 'default' : 'pointer',
          fontSize: 20,
        }}
      >
        {isPinned ? '⭐' : '☆'}
      </button>
      {error && (
        <div style={{ color: '#e53e3e', fontSize: 11, marginTop: 2 }}>
          {error}
        </div>
      )}
    </div>
  );
}
