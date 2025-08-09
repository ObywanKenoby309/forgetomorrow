// components/ResumeTrackerPreview.js
import React from 'react';

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

function ListSection({ label, items }) {
  return (
    <div
      style={{
        border: '1px solid #eee',
        borderRadius: '10px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ fontWeight: 700, color: '#37474F' }}>{label}</div>
      {items.length === 0 ? (
        <div style={{ color: '#90A4AE' }}>No items.</div>
      ) : (
        items.slice(0, 3).map((it) => (
          <div
            key={it.id}
            style={{
              display: 'flex',
              alignItems: 'center',
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
  );
}

export default function ResumeTrackerPreview() {
  return (
    <div
      style={{
        display: 'grid',
        gap: 12,
        gridTemplateColumns: '1fr 1fr',
      }}
    >
      <ListSection label="Pinned" items={mockTracker.pinned} />
      <ListSection label="Applied" items={mockTracker.applied} />
      <ListSection label="Interviewing" items={mockTracker.interviewing} />
      <ListSection label="Offers" items={mockTracker.offers} />
      <ListSection label="Rejected" items={mockTracker.rejected} />
    </div>
  );
}
