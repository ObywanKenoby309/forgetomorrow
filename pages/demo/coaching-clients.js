// pages/demo/coaching-clients.js
import React, { useState } from 'react';
import Head from 'next/head';
import CoachingLayout from '@/components/layouts/CoachingLayout';

const ORANGE = '#FF7043';
const SLATE  = '#1E293B';
const MUTED  = '#64748B';
const GAP    = 16;
const RIGHT_COL_WIDTH = 280;

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};
const ORANGE_LIFT = {
  textShadow: '0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)',
  fontWeight: 900,
};

const AVATARS = [
  '/profile-avatars/avatar-coach-beacon.png',
  '/profile-avatars/avatar-creator-spectrum.png',
  '/profile-avatars/avatar-default-forge.png',
  '/profile-avatars/avatar-professional-path.png',
  '/profile-avatars/avatar-tech-nexus.png',
];

const CLIENTS = [
  { name: 'Sarah Mitchell',  email: 'sarah.m@email.com',    status: 'Active',     nextSession: 'Tomorrow 2:00 PM', lastContact: '2 days ago',  avatar: AVATARS[3] },
  { name: 'Marcus Thompson', email: 'marcus.t@email.com',   status: 'Active',     nextSession: 'Friday 10:00 AM',  lastContact: '5 days ago',  avatar: AVATARS[2] },
  { name: 'Jennifer Park',   email: 'jen.park@email.com',   status: 'Active',     nextSession: 'Monday 3:00 PM',   lastContact: '1 day ago',   avatar: AVATARS[0] },
  { name: 'David Chen',      email: 'david.c@email.com',    status: 'Active',     nextSession: 'Next Week',        lastContact: '3 days ago',  avatar: AVATARS[4] },
  { name: 'Alex Rivera',     email: 'alex.r@email.com',     status: 'Inactive',   nextSession: '—',                lastContact: '34 days ago', avatar: AVATARS[1] },
  { name: 'Priya Nair',      email: 'priya.n@email.com',    status: 'New Intake', nextSession: '—',                lastContact: '—',           avatar: AVATARS[2] },
];

const STATUS_COLORS = {
  'Active':     { bg: 'rgba(22,163,74,0.12)',  color: '#16A34A' },
  'Inactive':   { bg: 'rgba(100,116,139,0.12)', color: '#64748B' },
  'New Intake': { bg: 'rgba(255,112,67,0.12)', color: ORANGE },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS['Inactive'];
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

export default function DemoCoachingClients() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [expandedId, setExpandedId] = useState(null);

  const filtered = CLIENTS.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All Statuses' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <>
      <Head><title>Client Hub — ForgeTomorrow Coaching</title></Head>
      <CoachingLayout
        title="Client Hub | ForgeTomorrow"
        activeNav="client-hub"
        contentFullBleed
        sidebarInitialOpen={{ coaching: true, seeker: false }}
      >
        <div style={{ width: '100%', paddingRight: 16, boxSizing: 'border-box' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `minmax(0,1fr) ${RIGHT_COL_WIDTH}px`,
            gridTemplateRows: 'auto auto',
            gap: GAP,
            width: '100%',
            boxSizing: 'border-box',
          }}>

            {/* Title card — col 1 row 1 */}
            <div style={{ ...GLASS, padding: '18px 24px', textAlign: 'center', gridColumn: '1/2', gridRow: '1' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: ORANGE, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>GOOD MORNING</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: ORANGE, fontStyle: 'italic', ...ORANGE_LIFT }}>Client Hub</div>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>Your coaching workspace — clients, sessions, and feedback all in one place.</div>
            </div>

            {/* Ad — col 2 rows 1–2, no glass backing */}
            <aside style={{
              gridColumn: '2/3',
              gridRow: '1/3',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              boxSizing: 'border-box',
              alignSelf: 'stretch',
            }}>
              <div style={{ flex: 1, minHeight: 160 }}>
                <img
                  src="/ads/house/coach-house-ad.png"
                  alt="Advertise with ForgeTomorrow"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14, display: 'block' }}
                />
              </div>
            </aside>

            {/* Main content — col 1 row 2 */}
            <div style={{ gridColumn: '1/2', gridRow: '2' }}>
              <div style={{ ...GLASS, padding: 20 }}>

                {/* Section header */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: ORANGE, fontStyle: 'italic', marginBottom: 4, ...ORANGE_LIFT }}>Clients</div>
                  <div style={{ fontSize: 13, color: MUTED }}>Review client records, progress, and account activity.</div>
                </div>

                {/* Breadcrumb + controls */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                  <button style={{ background: 'rgba(255,112,67,0.12)', color: ORANGE, border: '1px solid rgba(255,112,67,0.3)', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Client Hub Main
                  </button>
                  <div style={{ flex: 1 }} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, padding: '8px 14px', fontSize: 13, outline: 'none', background: 'rgba(255,255,255,0.9)', color: SLATE, width: 240, boxSizing: 'border-box' }}
                  />
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, padding: '8px 14px', fontSize: 13, outline: 'none', background: 'rgba(255,255,255,0.9)', color: SLATE, cursor: 'pointer' }}
                  >
                    {['All Statuses', 'Active', 'Inactive', 'New Intake'].map(s => <option key={s}>{s}</option>)}
                  </select>
                  <button style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                    + Add Client
                  </button>
                </div>

                {/* Table */}
                <div style={{ background: 'rgba(255,255,255,0.88)', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.07)' }}>

                  {/* Count */}
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: ORANGE, fontStyle: 'italic', ...ORANGE_LIFT }}>Clients</div>
                    <div style={{ fontSize: 12, color: MUTED }}>{filtered.length} clients</div>
                  </div>

                  {/* Header row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 120px 160px 140px 120px', gap: 0, padding: '8px 16px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    {['NAME', 'EMAIL', 'STATUS', 'NEXT SESSION', 'LAST CONTACT', 'ACTIONS'].map(h => (
                      <div key={h} style={{ fontSize: 10, fontWeight: 900, color: '#94A3B8', letterSpacing: '0.07em' }}>{h}</div>
                    ))}
                  </div>

                  {/* Rows */}
                  {filtered.map((c, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 120px 160px 140px 120px', gap: 0, padding: '12px 16px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none', alignItems: 'center', background: i % 2 === 1 ? 'rgba(0,0,0,0.01)' : 'transparent' }}>
                      {/* Name + avatar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={c.avatar} alt={c.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        <div style={{ fontSize: 13, fontWeight: 700, color: SLATE }}>{c.name}</div>
                      </div>
                      {/* Email */}
                      <div style={{ fontSize: 12, color: MUTED }}>{c.email}</div>
                      {/* Status */}
                      <div><StatusBadge status={c.status} /></div>
                      {/* Next session */}
                      <div style={{ fontSize: 12, color: SLATE }}>{c.nextSession}</div>
                      {/* Last contact */}
                      <div style={{ fontSize: 12, color: MUTED }}>{c.lastContact}</div>
                      {/* Actions */}
                      <div>
                        <button
                          onClick={() => setExpandedId(expandedId === i ? null : i)}
                          style={{ background: 'none', border: `1px solid rgba(255,112,67,0.35)`, borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: ORANGE, cursor: 'pointer' }}
                        >
                          Actions {expandedId === i ? '▲' : '▾'}
                        </button>
                      </div>

                      {/* Expanded actions row */}
                      {expandedId === i && (
                        <div style={{ gridColumn: '1 / -1', marginTop: 8, display: 'flex', gap: 8 }}>
                          {['Schedule Session', 'Send Message', 'View Profile', 'Archive'].map(action => (
                            <button key={action} style={{ fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 999, border: action === 'Schedule Session' ? 'none' : `1px solid rgba(0,0,0,0.12)`, background: action === 'Schedule Session' ? ORANGE : 'rgba(255,255,255,0.9)', color: action === 'Schedule Session' ? '#fff' : action === 'Archive' ? '#DC2626' : SLATE, cursor: 'pointer' }}>
                              {action}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </CoachingLayout>
    </>
  );
}