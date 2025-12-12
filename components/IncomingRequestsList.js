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
        // Shape from /api/contacts/summary:
        // {
        //   id, requestId, createdAt,
        //   from: { id, name, headline, location, status, avatarUrl }
        // }
        const person = p.from || p;
        const displayName = person.name || 'Member';
        const avatar =
          person.avatarUrl || person.photo || '/demo-profile.jpg';

        const headline = person.headline || '';
        const location = person.location || '';
        const statusText = person.status || '';

        // meta line: "Location • Status" or just one of them
        let meta = '';
        if (location && statusText) meta = `${location} • ${statusText}`;
        else meta = location || statusText;

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
              {/* Name */}
              <div
                style={{
                  fontWeight: 700,
                  color: '#263238',
                  fontSize: 14,
                  overflowWrap: 'anywhere',
                }}
              >
                {displayName}
              </div>

              {/* Headline / role */}
              {headline ? (
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 12,
                    color: '#546E7A',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {headline}
                </div>
              ) : null}

              {/* Location • Status */}
              {meta ? (
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 12,
                    color: '#90A4AE',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {meta}
                </div>
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
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  minWidth: 70,
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
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  minWidth: 70,
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
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  minWidth: 70,
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
