// components/coaching/dashboard/ClientRequestsCard.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const REQUESTS_KEY = 'coachClientRequests_v1';

function formatWhen(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export default function ClientRequestsCard({ linkHref = '/dashboard/coaching/clients/requests' }) {
  const [pending, setPending] = useState([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const arr = JSON.parse(localStorage.getItem(REQUESTS_KEY) || '[]');
      const items = Array.isArray(arr) ? arr : [];
      const pendingOnly = items.filter(r => (r.status || 'pending') === 'pending');
      pendingOnly.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
      setPending(pendingOnly.slice(0, 3));
    } catch {
      setPending([]);
    }
  }, []);

  return (
    <div
      style={{
        background: '#FAFAFA',
        border: '1px solid #eee',
        borderRadius: 10,
        padding: 16,
        minHeight: 120,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
        <span>New Client Requests</span>
        <span
          style={{
            background: '#E3F2FD',
            color: '#1565C0',
            fontSize: 12,
            borderRadius: 999,
            padding: '2px 8px',
          }}
          aria-label="pending count badge"
        >
          {pending.length > 0 ? `+${pending.length}` : '0'}
        </span>
      </div>

      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8, flex: 1 }}>
        {pending.length === 0 ? (
          <li style={{ color: '#90A4AE' }}>No new requests.</li>
        ) : (
          pending.map(r => (
            <li
              key={r.id}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                border: '1px solid #eee',
                background: '#fff',
                padding: '8px 10px',
                borderRadius: 8,
              }}
            >
              <div style={{ fontWeight: 600, minWidth: 140, color: '#263238' }}>{r.name}</div>
              <div style={{ fontSize: 12, color: '#607D8B', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {r.source ? `${r.source} • ` : ''}{formatWhen(r.requestedAt)}
              </div>
              <Link
                href={`${linkHref}?id=${encodeURIComponent(r.id)}`}
                style={{ color: '#FF7043', fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                Review
              </Link>
            </li>
          ))
        )}
      </ul>

      <div style={{ textAlign: 'right', marginTop: 10 }}>
        <Link href={linkHref} style={{ color: '#FF7043', fontWeight: 600 }}>
          Review all requests
        </Link>
      </div>
    </div>
  );
}
