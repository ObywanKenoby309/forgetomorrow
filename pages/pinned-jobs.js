// pages/pinned-jobs.js
import React from 'react';
import SeekerSidebar from '../components/SeekerSidebar';

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
    company: 'Northwind',
    location: 'Nashville, TN',
    datePinned: '2025-08-06',
  },
  {
    id: 'pj-1001',
    title: 'Director of Support',
    company: 'OpenPhone',
    location: 'Remote',
    datePinned: '2025-08-04',
  },
  {
    id: 'pj-0999',
    title: 'Client Success Lead',
    company: 'Pledge It',
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

export default function PinnedJobsPage() {
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

      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <section
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          }}
        >
          <h1 style={{ color: '#FF7043', marginTop: 0 }}>Pinned Jobs</h1>

          <div style={{ display: 'grid', gap: 12 }}>
            {mockPinned.map((job) => (
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

            {mockPinned.length === 0 && (
              <div style={{ color: '#607D8B' }}>No pinned jobs yet.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
