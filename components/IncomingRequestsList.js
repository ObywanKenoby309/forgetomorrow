// components/IncomingRequestsList.js
import React from 'react';

export default function IncomingRequestsList({
  items = [],
  onAccept,
  onDecline,
  onViewProfile,
}) {
  if (!items.length) {
    return <div style={{ color: '#607D8B' }}>No incoming invites.</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {items.map((p) => {
        // API shape from /api/contacts/summary:
        // { id, requestId, createdAt, from: { ...user fields... } }
        const person = p.from || p;
        const displayName = person.name || 'Member';
        const avatar =
          person.avatarUrl || person.photo || '/demo-profile.jpg';
        const note =
          p.note || person.headline || person.status || '';

        const requestKey = p.requestId || p.id;

        return (
          <div
            key={requestKey}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              border: '1px solid #eee',
              borderRadius: 10,
              padding: 10,
            }}
          >
            <img
              src={avatar}
              alt={displayName}
              width={40}
              height={40}
              style={{ borderRadius: 999, objectFit: 'cover' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 700,
                  color: '#263238',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {displayName}
              </div>
              {note ? (
                <div style={{ fontSize: 12, color: '#607D8B' }}>{note}</div>
              ) : null}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => onAccept?.(p)}
                style={{
                  background: '#E8F5E9',
                  color: '#1B5E20',
                  border: '1px solid #C8E6C9',
                  borderRadius: 8,
                  padding: '6px 10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => onDecline?.(p)}
                style={{
                  background: '#FFEBEE',
                  color: '#B71C1C',
                  border: '1px solid #FFCDD2',
                  borderRadius: 8,
                  padding: '6px 10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => onViewProfile?.(p)}
                style={{
                  background: 'white',
                  color: '#455A64',
                  border: '1px solid #CFD8DC',
                  borderRadius: 8,
                  padding: '6px 10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                View
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
