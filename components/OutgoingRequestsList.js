// components/OutgoingRequestsList.js
import React from 'react';
import MemberAvatarActions from '@/components/member/MemberAvatarActions';

export default function OutgoingRequestsList({
  items = [],
  onCancel,
}) {
  if (!items.length) {
    return <div style={{ color: '#607D8B' }}>No outgoing requests.</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {items.map((p) => {
        const person      = p.to || p;
        const displayName = person.name || 'Member';
        const avatar      = person.avatarUrl || person.photo || '/demo-profile.jpg';
        const note        = p.note || person.headline || person.status || '';

        return (
          <div
            key={p.requestId || p.id}
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
              <div style={{ fontWeight: 700, color: '#263238', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                {displayName}
              </div>
              {note && (
                <div style={{ fontSize: 12, color: '#607D8B', marginTop: 2, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                  {note}
                </div>
              )}
            </div>

            {/* Cancel is contact-specific — stays as explicit button */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', flex: '1 1 120px', minWidth: 0 }}>
              <button
                type="button" onClick={() => onCancel?.(p)}
                style={{ background: 'white', color: '#B71C1C', border: '1px solid #FFCDD2', borderRadius: 8, padding: '6px 10px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
              >
                Cancel
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}