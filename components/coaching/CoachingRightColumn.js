// components/coaching/CoachingRightColumn.js
import React from 'react';
import Link from 'next/link';

export default function CoachingRightColumn({ variant = 'dashboard' }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Shortcuts */}
      <div style={{ background: '#1f1f1f', color: '#fff', borderRadius: 10, padding: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Shortcuts</div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
          <li>
            <Link href="/dashboard/coaching/sessions" style={{ color: '#FFAB91' }}>
              Open Sessions
            </Link>
          </li>
          <li>
            <Link href="/dashboard/coaching/clients" style={{ color: '#FFAB91' }}>
              View Clients
            </Link>
          </li>
          <li>
            <Link href="/dashboard/coaching/feedback" style={{ color: '#FFAB91' }}>
              CSAT Feedback
            </Link>
          </li>
        </ul>
      </div>

      {/* You can add more blocks here later, e.g., Alerts, Tips, etc. */}
    </div>
  );
}
