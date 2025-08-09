// pages/applications.js
import React from 'react';
import SeekerSidebar from '../components/SeekerSidebar';

const mockTracker = {
  pinned: [
    { id: 'p1', title: 'Success Manager — Acme', dateAdded: '2025-08-08' },
    { id: 'p2', title: 'Ops Manager — Northwind', dateAdded: '2025-08-06' },
  ],
  applied: [
    { id: 'a1', title: 'Director of Support — OpenPhone', dateAdded: '2025-08-05' },
    { id: 'a2', title: 'Customer Success Lead — Rhythm', dateAdded: '2025-08-04' },
  ],
  interviewing: [
    { id: 'i1', title: 'Strategic Ops Manager — Taproot', dateAdded: '2025-08-07' },
  ],
  offers: [
    { id: 'o1', title: 'Client Success Leader — Experity', dateAdded: '2025-08-03' },
  ],
  rejected: [
    { id: 'r1', title: 'EA — Belay', dateAdded: '2025-08-02' },
  ],
};

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function Section({ label, items }) {
  return (
    <section
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      }}
    >
      <h2 style={{ color: '#FF7043', marginTop: 0 }}>{label}</h2>
      <div style={{ display: 'grid', gap: 10 }}>
        {items.length === 0 ? (
          <div style={{ color: '#90A4AE' }}>No items in this stage.</div>
        ) : (
          items.map((it) => (
            <div
              key={it.id}
              style={{
                border: '1px solid #eee',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ color: '#455A64' }}>{it.title}</div>
              <div style={{ fontSize: 12, color: '#607D8B' }}>
                Added: {formatDate(it.dateAdded)}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default function ApplicationsPage() {
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
      <SeekerSidebar />

      <main style={{ display: 'grid', gap: 20 }}>
        <Section label="Pinned" items={mockTracker.pinned} />
        <Section label="Applied" items={mockTracker.applied} />
        <Section label="Interviewing" items={mockTracker.interviewing} />
        <Section label="Offers" items={mockTracker.offers} />
        <Section label="Rejected" items={mockTracker.rejected} />
      </main>
    </div>
  );
}
