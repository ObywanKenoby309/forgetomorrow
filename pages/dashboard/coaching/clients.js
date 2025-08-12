// pages/dashboard/coaching/clients.js
import React from 'react';
import CoachingSidebar from '../../../components/coaching/CoachingSidebar';

export default function CoachingClientsPage() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '20px',
        padding: '120px 20px 20px',
        minHeight: '100vh',
        backgroundColor: '#ECEFF1',
      }}
    >
      <CoachingSidebar active="clients" />
      <main style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ maxWidth: 860 }}>
          <section
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              border: '1px solid #eee',
            }}
          >
            <h2 style={{ color: '#FF7043', margin: 0 }}>Clients</h2>
            <p style={{ color: '#607D8B', marginTop: 12 }}>Coming soon…</p>
          </section>
        </div>
      </main>
    </div>
  );
}
