// components/signal/ConversationHeader.js
import React, { useState } from 'react';

export default function ConversationHeader({
  name = '—',
  status = 'Online',           // or 'Offline' / custom text
  isMuted = false,             // controls label: Mute/Unmute
  onViewProfile,               // () => void
  onToggleMute,                // (nextMuted: boolean) => void
  onDelete,                    // () => void  (fires after confirm)
}) {
  const [confirming, setConfirming] = useState(false);

  const wrap = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '10px 14px',
    border: '1px solid #EEF2F7',
    borderRadius: 12,
    background: 'white',
  };

  const left = { display: 'grid', gap: 2 };
  const title = { fontWeight: 800, color: '#111827', margin: 0, lineHeight: 1.2 };
  const meta = { fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 };

  const dot = (color) => ({
    width: 8,
    height: 8,
    borderRadius: 999,
    background: color,
    display: 'inline-block',
  });

  const actions = { display: 'flex', gap: 8, alignItems: 'center' };

  const btnBase = {
    fontSize: 13,
    padding: '6px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    border: '1px solid #E5E7EB',
    background: 'white',
    color: '#111827',
    fontWeight: 700,
  };

  const dangerOutline = {
    ...btnBase,
    color: '#B71C1C',
    border: '1px solid #F5C6CB',
    background: 'white',
  };

  const dangerSolid = {
    ...btnBase,
    background: '#E53935',
    color: 'white',
    border: '1px solid #E53935',
  };

  return (
    <header style={wrap}>
      <div style={left}>
        <h3 style={title}>{name}</h3>
        <div style={meta}>
          <span style={dot(status?.toLowerCase() === 'online' ? '#22C55E' : '#94A3B8')} />
          <span>{status}</span>
        </div>
      </div>

      {/* Actions */}
      {confirming ? (
        <div style={{ ...actions, gap: 10 }}>
          <span style={{ fontSize: 12, color: '#64748B' }}>Delete this conversation?</span>
          <button
            type="button"
            style={btnBase}
            onClick={() => setConfirming(false)}
            aria-label="Cancel delete"
          >
            Cancel
          </button>
          <button
            type="button"
            style={dangerSolid}
            onClick={() => {
              setConfirming(false);
              onDelete?.();
            }}
            aria-label="Confirm delete"
          >
            Confirm Delete
          </button>
        </div>
      ) : (
        <div style={actions}>
          <button
            type="button"
            style={btnBase}
            onClick={() => onViewProfile?.()}
            aria-label="View profile"
          >
            View profile
          </button>

          <button
            type="button"
            style={btnBase}
            onClick={() => onToggleMute?.(!isMuted)}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </button>

          <button
            type="button"
            style={dangerOutline}
            onClick={() => setConfirming(true)}
            aria-label="Delete conversation"
          >
            Delete
          </button>
        </div>
      )}
    </header>
  );
}
