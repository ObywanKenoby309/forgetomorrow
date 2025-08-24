// pages/dashboard/coaching/clients/requests.js
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import CoachingRightColumn from '@/components/coaching/CoachingRightColumn';

const REQUESTS_KEY = 'coachClientRequests_v1';

function readRequests() {
  try {
    const arr = JSON.parse(localStorage.getItem(REQUESTS_KEY) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function writeRequests(list) {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(list));
}
function fmt(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export default function ClientRequestsPage() {
  const router = useRouter();
  const [all, setAll] = useState([]);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('pending'); // 'pending' | 'approved' | 'declined'

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const items = readRequests();
    // lightweight seed if empty (dev only)
    if (items.length === 0) {
      const seed = [
        { id: 'req_101', name: 'Jamie Park', source: 'Self-signup', requestedAt: new Date().toISOString(), status: 'pending', notes: '' },
        { id: 'req_102', name: 'Luis Alvarez', source: 'Referral', requestedAt: new Date(Date.now() - 3600e3).toISOString(), status: 'pending', notes: 'Resume help' },
      ];
      writeRequests(seed);
      setAll(seed);
    } else {
      setAll(items);
    }
  }, []);

  // read URL hints (?tab=, ?id=)
  useEffect(() => {
    if (!router.isReady) return;
    const t = (router.query.tab || 'pending').toString();
    setTab(['pending', 'approved', 'declined'].includes(t) ? t : 'pending');
    // if an id is provided, jump the list to show it first (simple UX)
    const id = router.query.id ? router.query.id.toString() : null;
    if (id) {
      setAll(prev => {
        const idx = prev.findIndex(x => x.id === id);
        if (idx <= 0) return prev;
        const copy = [...prev];
        const [item] = copy.splice(idx, 1);
        return [item, ...copy];
      });
    }
  }, [router.isReady, router.query.tab, router.query.id]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all
      .filter(r => (r.status || 'pending') === tab)
      .filter(r => !term || r.name.toLowerCase().includes(term) || (r.source || '').toLowerCase().includes(term));
  }, [all, q, tab]);

  const counts = useMemo(() => {
    const x = { pending: 0, approved: 0, declined: 0 };
    for (const r of all) x[(r.status || 'pending')]++;
    return x;
  }, [all]);

  function updateStatus(id, status) {
    setAll(prev => {
      const copy = prev.map(r => (r.id === id ? { ...r, status } : r));
      writeRequests(copy);
      return copy;
    });
  }

  function remove(id) {
    setAll(prev => {
      const copy = prev.filter(r => r.id !== id);
      writeRequests(copy);
      return copy;
    });
  }

  const HeaderBox = (
    <section
      style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        textAlign: 'center',
      }}
    >
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
        Client Requests
      </h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
        View and triage new client intakes. Approve to add to your roster, or decline with notes.
      </p>
    </section>
  );

  return (
    <CoachingLayout
      title="Client Requests | ForgeTomorrow"
      header={HeaderBox}
      activeNav="clients"
      right={<CoachingRightColumn />}
    >
      <div style={{ display: 'grid', gap: 16, maxWidth: 980 }}>
        {/* Tabs + search row */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            background: 'white',
            border: '1px solid #eee',
            borderRadius: 12,
            padding: 12,
          }}
        >
          {['pending', 'approved', 'declined'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: tab === t ? '#FF7043' : 'white',
                color: tab === t ? 'white' : '#FF7043',
                border: '1px solid #FF7043',
                borderRadius: 999,
                padding: '8px 12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {t[0].toUpperCase() + t.slice(1)}{' '}
              <span style={{ opacity: 0.8 }}>
                ({counts[t] || 0})
              </span>
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search name or source…"
              style={{
                border: '1px solid #ccc',
                borderRadius: 8,
                padding: '8px 10px',
                minWidth: 240,
              }}
            />
            <Link href="/dashboard/coaching/clients" style={{ alignSelf: 'center', color: '#FF7043', fontWeight: 600 }}>
              Go to Clients
            </Link>
          </div>
        </div>

        {/* Requests list */}
        <div style={{ display: 'grid', gap: 10 }}>
          {filtered.length === 0 ? (
            <div
              style={{
                background: 'white',
                border: '1px solid #eee',
                borderRadius: 12,
                padding: 16,
                color: '#90A4AE',
              }}
            >
              No {tab} requests.
            </div>
          ) : (
            filtered.map(r => (
              <div
                key={r.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(200px, 1fr) 1fr 220px',
                  alignItems: 'center',
                  gap: 12,
                  background: 'white',
                  border: '1px solid #eee',
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#263238' }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: '#607D8B' }}>
                    {r.source || '—'} • {fmt(r.requestedAt)}
                  </div>
                </div>

                <div style={{ fontSize: 13, color: '#455A64' }}>
                  {r.notes || <span style={{ color: '#90A4AE' }}>(No notes)</span>}
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  {tab !== 'approved' && (
                    <button
                      onClick={() => updateStatus(r.id, 'approved')}
                      style={{
                        background: '#E8F5E9',
                        color: '#2E7D32',
                        border: '1px solid #C8E6C9',
                        borderRadius: 8,
                        padding: '8px 10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Approve
                    </button>
                  )}
                  {tab !== 'declined' && (
                    <button
                      onClick={() => updateStatus(r.id, 'declined')}
                      style={{
                        background: '#FDECEA',
                        color: '#C62828',
                        border: '1px solid #F5C6CB',
                        borderRadius: 8,
                        padding: '8px 10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Decline
                    </button>
                  )}
                  <button
                    onClick={() => remove(r.id)}
                    style={{
                      background: 'white',
                      color: '#607D8B',
                      border: '1px solid #CFD8DC',
                      borderRadius: 8,
                      padding: '8px 10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    title="Remove request"
                    aria-label="Remove request"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </CoachingLayout>
  );
}
