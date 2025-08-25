// components/coaching/dashboard/UpcomingSessionsCard.js
import React from 'react';
import Link from 'next/link';

function getStatusStyles(status) {
  if (status === 'At Risk') return { background: '#FDECEA', color: '#C62828' };
  if (status === 'New Intake') return { background: '#E3F2FD', color: '#1565C0' };
  return { background: '#E8F5E9', color: '#2E7D32' };
}

export default function UpcomingSessionsCard({ sessions = [], linkHref = '/dashboard/coaching/sessions' }) {
  return (
    <div
      style={{
        background: '#FAFAFA',
        border: '1px solid #eee',
        borderRadius: 10,
        padding: 16,
        minHeight: 120,
        height: '100%',            // ← match height with neighbors
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Upcoming Sessions</div>

      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          display: 'grid',
          gap: 8,
          flex: 1,                 // ← list fills available space
        }}
      >
        {sessions.length === 0 ? (
          <li style={{ color: '#90A4AE' }}>No upcoming sessions.</li>
        ) : (
          sessions.map((s, idx) => {
            const { background, color } = getStatusStyles(s.status || 'Active');
            return (
              <li
                key={`${s.date}-${s.time}-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid #eee',
                  borderRadius: 8,
                  padding: '8px 10px',
                  background: 'white',
                  gap: 10,
                }}
              >
                <span style={{ fontWeight: 600, minWidth: 72 }}>{s.time}</span>
                <div style={{ display: 'grid', gap: 2, flex: 1 }}>
                  <span style={{ color: '#455A64' }}>{s.client}</span>
                  <span style={{ color: '#90A4AE', fontSize: 12 }}>{s.type}</span>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    background,
                    color,
                    padding: '4px 8px',
                    borderRadius: 999,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.status || 'Scheduled'}
                </span>
              </li>
            );
          })
        )}
      </ul>

      <div style={{ textAlign: 'right', marginTop: 10 }}>
        <Link href={linkHref} style={{ color: '#FF7043', fontWeight: 600 }}>
          View schedule
        </Link>
      </div>
    </div>
  );
}
