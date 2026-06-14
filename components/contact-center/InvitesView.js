// components/contact-center/InvitesView.js
import React from 'react';
import IncomingRequestsList from '@/components/IncomingRequestsList';

export default function InvitesView({ isMobile, incoming, loading, onAccept, onDecline, onViewProfile }) {
  const CARD = {
    background: 'white', borderRadius: 12, padding: isMobile ? 12 : 16,
    border: '1px solid #eee', boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    width: '100%', maxWidth: '100%', boxSizing: 'border-box', minWidth: 0, overflowX: 'hidden',
  };
  return (
    <section style={CARD}>
      <h2 style={{ color: '#FF7043', marginTop: 0, marginBottom: 8, fontSize: isMobile ? 17 : 20 }}>
        Pending Invites
        {incoming.length > 0 && (
          <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,112,67,0.12)', color: '#FF7043', border: '1px solid rgba(255,112,67,0.25)' }}>
            {incoming.length}
          </span>
        )}
      </h2>
      <p style={{ color: '#607D8B', fontSize: 13, margin: '0 0 14px', lineHeight: 1.6 }}>
        These members have requested to connect with you. Accept or decline below.
      </p>
      {loading
        ? <p style={{ color: '#607D8B', fontSize: 14 }}>Loading invites…</p>
        : <IncomingRequestsList items={incoming} onAccept={onAccept} onDecline={onDecline} onViewProfile={onViewProfile} />
      }
    </section>
  );
}