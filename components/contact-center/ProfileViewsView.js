// components/contact-center/ProfileViewsView.js
import React from 'react';

export default function ProfileViewsView({ isMobile, views, loading, onViewProfile }) {
  const CARD = {
    background: 'white', borderRadius: 12, padding: isMobile ? 12 : 16,
    border: '1px solid #eee', boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    width: '100%', maxWidth: '100%', boxSizing: 'border-box', minWidth: 0, overflowX: 'hidden',
  };

  const formatDateTime = (iso) => {
    try { return new Date(iso).toLocaleString(); } catch { return ''; }
  };

  return (
    <section style={CARD}>
      <h2 style={{ color: '#FF7043', marginTop: 0, marginBottom: 8, fontSize: isMobile ? 17 : 20 }}>
        Who&apos;s looking at you
      </h2>
      <p style={{ color: '#607D8B', fontSize: 13, margin: '0 0 14px', lineHeight: 1.6 }}>
        See who has viewed your profile and when. No gatekeeping — just transparency.
      </p>
      {loading ? (
        <p style={{ color: '#607D8B', fontSize: 14 }}>Loading profile views…</p>
      ) : views.length === 0 ? (
        <p style={{ color: '#607D8B', fontSize: 14 }}>
          No profile views yet. Once recruiters, coaches, or peers visit your profile, you&apos;ll see them here.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
          {views.map((v) => (
            <li key={v.id} style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: isMobile ? 6 : 0,
              padding: '8px 10px', borderRadius: 8,
              background: '#F9FAFB', minWidth: 0,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontWeight: 600, color: v.viewer?.name ? '#111827' : '#6B7280', fontSize: 14, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                  {v.viewer?.name || 'Anonymous ForgeTomorrow member'}
                </span>
                <span style={{ fontSize: 12, color: '#6B7280', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                  Viewed your profile • {formatDateTime(v.createdAt)}
                </span>
              </div>
              {v.viewer?.id && v.viewer?.slug && (
                <button type="button" onClick={() => onViewProfile(v)}
                  style={{ fontSize: 12, padding: '6px 10px', borderRadius: 999, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', color: '#374151', fontWeight: 600, flexShrink: 0, alignSelf: isMobile ? 'flex-start' : 'center', fontFamily: 'inherit' }}>
                  View profile
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}