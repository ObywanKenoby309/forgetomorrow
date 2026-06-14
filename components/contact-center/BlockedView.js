// components/contact-center/BlockedView.js
import React from 'react';

export default function BlockedView({ isMobile, blockedUsers, loading, onUnblock }) {
  const CARD = {
    background: 'white', borderRadius: 12, padding: isMobile ? 12 : 16,
    border: '1px solid #eee', boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    width: '100%', maxWidth: '100%', boxSizing: 'border-box', minWidth: 0, overflowX: 'hidden',
  };

  const formatDate = (iso) => {
    try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return ''; }
  };

  const AvatarBlock = ({ user }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
      {user.avatarUrl
        ? <img src={user.avatarUrl} alt={user.name} style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }} />
        : <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontWeight: 600, flexShrink: 0 }}>
            {user.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
      }
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: '#111827', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
          {user.name || 'Member'}
        </div>
      </div>
    </div>
  );

  return (
    <section style={CARD}>
      <h2 style={{ color: '#FF7043', marginTop: 0, marginBottom: 8, fontSize: isMobile ? 17 : 20 }}>
        Blocked Users
      </h2>
      <p style={{ color: '#607D8B', fontSize: 13, margin: '0 0 14px', lineHeight: 1.6 }}>
        You won&apos;t see posts from these members in your feed, and they can&apos;t message you.
      </p>
      {loading ? (
        <p style={{ color: '#607D8B', fontSize: 14 }}>Loading blocked users…</p>
      ) : blockedUsers.length === 0 ? (
        <p style={{ color: '#607D8B', fontSize: 14 }}>No blocked members yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {blockedUsers.map((user) => isMobile ? (
            <div key={user.id} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, borderRadius: 10, background: '#F9FAFB', border: '1px solid #eee', minWidth: 0 }}>
              <AvatarBlock user={user} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                <div style={{ minWidth: 0, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                  <span style={{ fontWeight: 600, color: '#374151' }}>Reason: </span>
                  <span style={{ color: '#607D8B' }}>{user.reason || 'No reason provided'}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 600, color: '#374151' }}>Blocked on: </span>
                  <span style={{ color: '#607D8B' }}>{formatDate(user.createdAt)}</span>
                </div>
              </div>
              <button onClick={() => onUnblock(user.id, user.name)}
                style={{ padding: '10px 16px', borderRadius: 8, background: '#FF7043', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', width: '100%', fontFamily: 'inherit' }}>
                Unblock
              </button>
            </div>
          ) : (
            <div key={user.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 16, padding: '12px 16px', borderRadius: 10, background: '#F9FAFB', border: '1px solid #eee' }}>
              <AvatarBlock user={user} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div><span style={{ fontWeight: 600, color: '#374151' }}>Reason:</span> <span style={{ color: '#607D8B' }}>{user.reason || 'No reason provided'}</span></div>
                <div><span style={{ fontWeight: 600, color: '#374151' }}>Blocked on:</span> <span style={{ color: '#607D8B' }}>{formatDate(user.createdAt)}</span></div>
              </div>
              <button onClick={() => onUnblock(user.id, user.name)}
                style={{ padding: '8px 16px', borderRadius: 8, background: '#FF7043', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Unblock
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}