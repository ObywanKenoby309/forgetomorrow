// components/PinnedJobsPreview.js
import React from 'react';

const mockPinned = [
  {
    id: 'pj-1003',
    title: 'Customer Success Manager',
    company: 'Acme Corp',
    location: 'Remote',
    datePinned: '2025-08-08',
  },
  {
    id: 'pj-1002',
    title: 'Operations Manager',
    company: 'NovaTech Solutions',
    location: 'Nashville, TN',
    datePinned: '2025-08-06',
  },
  {
    id: 'pj-1001',
    title: 'Director of Support',
    company: 'Catalyst Growth',
    location: 'Remote',
    datePinned: '2025-08-04',
  },
  {
    id: 'pj-0999',
    title: 'Client Success Lead',
    company: 'Beacon Systems',
    location: 'Remote',
    datePinned: '2025-08-01',
  },
];

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

export default function PinnedJobsPreview() {
  // Show latest 3 by datePinned descending
  const items = [...mockPinned].sort(
    (a, b) => new Date(b.datePinned) - new Date(a.datePinned)
  ).slice(0, 3);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {items.map((job) => (
        <div
          key={job.id}
          style={{
            border: '1px solid #eee',
            borderRadius: '10px',
            padding: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>{job.title}</div>
            <div style={{ color: '#546E7A' }}>
              {job.company} • {job.location}
            </div>
          </div>
          <div style={{ color: '#455A64', fontSize: 13 }}>
            Pinned: {formatDate(job.datePinned)}
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <div style={{ color: '#607D8B' }}>No pinned jobs yet.</div>
      )}
    </div>
  );
}
