// components/IncomingRequestsList.js
import React from 'react';
import MemberAvatarActions from '@/components/member/MemberAvatarActions';

export default function IncomingRequestsList({
  items = [],
  onAccept,
  onDecline,
}) {
  if (!items.length) {
    return <div style={{ color: '#607D8B' }}>No incoming invites.</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {items.map((p) => {
        const person      = p.from || p;
        const displayName = person.name || 'Member';
        const avatar      = person.avatarUrl || person.photo || '/demo-profile.jpg';
        const headline    = person.headline || '';
        const location    = person.location || '';
        const statusText  = person.status   || '';
        const meta        = location && statusText
          ? `${location} • ${statusText}`
          : location || statusText;
        const requestKey  = p.requestId || p.id;

        return (
          <div
            key={requestKey}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              border: '1px solid #eee', borderRadius: 10, padding: 10,
              flexWrap: 'wrap',
            }}
          >
            {/* Avatar — MemberAvatarActions handles View portfolio */}
            <MemberAvatarActions
              targetUserId={person.id}
              targetUserSlug={person.slug}
              targetName={displayName}
            >
              <img
                src={avatar} alt={displayName} width={40} height={40}
                style={{ borderRadius: 999, objectFit: 'cover', flexShrink: 0, cursor: 'pointer' }}
              />
            </MemberAvatarActions>

            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: '#263238', fontSize: 14, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                {displayName}
              </div>
              {headline && (
                <div style={{ marginTop: 2, fontSize: 12, color: '#546E7A', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                  {headline}
                </div>
              )}
              {meta && (
                <div style={{ marginTop: 2, fontSize: 12, color: '#90A4AE', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                  {meta}
                </div>
              )}
            </div>

            {/* Accept / Decline are contact-specific actions — stay as explicit buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', flex: '1 1 180px', minWidth: 0 }}>
              <button
                type="button" onClick={() => onAccept?.(p)}
                style={{ background: '#E8F5E9', color: '#1B5E20', border: '1px solid #C8E6C9', borderRadius: 6, padding: '6px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer', minWidth: 70, flexShrink: 0 }}
              >
                Accept
              </button>
              <button
                type="button" onClick={() => onDecline?.(p)}
                style={{ background: '#FFEBEE', color: '#B71C1C', border: '1px solid #FFCDD2', borderRadius: 6, padding: '6px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer', minWidth: 70, flexShrink: 0 }}
              >
                Decline
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}