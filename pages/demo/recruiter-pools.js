// pages/demo/recruiter-pools.js
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';

const ORANGE = '#FF7043';
const GLASS = { background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 10px 28px rgba(15,23,42,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 18, padding: 16 };
const WHITE_CARD = { background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: 12 };

const POOLS = [
  { name: 'Senior Product Leaders', count: 18, tags: ['Product', 'B2B', 'SaaS'], updated: '2 hours ago', color: '#7C3AED' },
  { name: 'Engineering — Backend', count: 34, tags: ['Go', 'Rust', 'Distributed'], updated: 'Today', color: '#2563EB' },
  { name: 'Design Systems Specialists', count: 12, tags: ['Figma', 'Tokens', 'Systems'], updated: 'Yesterday', color: '#D97706' },
  { name: 'Enterprise Sales — SaaS', count: 27, tags: ['Enterprise', 'MEDDIC', 'SaaS'], updated: '3 days ago', color: '#16A34A' },
  { name: 'AI/ML Engineers', count: 9, tags: ['PyTorch', 'LLM', 'Infra'], updated: 'Today', color: '#DC2626' },
];

const POOL_CANDIDATES = [
  { name: 'Alexandra Chen', title: 'Senior PM', why: 94, avatar: '👩‍💼', added: '2 days ago' },
  { name: 'Marcus Johnson', title: 'Director of Product', why: 89, avatar: '🧑‍💻', added: '1 week ago' },
  { name: 'Priya Sharma', title: 'VP Product', why: 85, avatar: '👩‍🎨', added: '3 days ago' },
  { name: 'James Rivera', title: 'Group PM', why: 81, avatar: '🧑‍💼', added: '5 days ago' },
];

export default function DemoRecruiterPools() {
  const [selectedPool, setSelectedPool] = useState(POOLS[0]);

  return (
    <>
      <Head><title>Talent Pools — ForgeTomorrow</title></Head>
      <RecruiterLayout>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ ...GLASS, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: ORANGE, fontStyle: 'italic' }}>Talent Pools</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Curate, organize, and engage your best candidates by role, skill, and fit.</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
            {/* Pools list */}
            <div style={{ ...GLASS, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>My Pools</div>
                <button style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 999, padding: '6px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>+ New Pool</button>
              </div>
              {POOLS.map((pool, i) => (
                <div key={i} onClick={() => setSelectedPool(pool)}
                  style={{ padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer', background: selectedPool.name === pool.name ? 'rgba(255,112,67,0.06)' : 'transparent', borderLeft: selectedPool.name === pool.name ? `3px solid ${ORANGE}` : '3px solid transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: pool.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pool.name}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{pool.count} candidates · {pool.updated}</div>
                    </div>
                    <div style={{ fontWeight: 900, fontSize: 16, color: pool.color }}>{pool.count}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                    {pool.tags.map(t => <span key={t} style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999, background: `${pool.color}15`, color: pool.color }}>{t}</span>)}
                  </div>
                </div>
              ))}
            </div>

            {/* Pool detail */}
            <div style={{ ...GLASS, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 18, color: '#0F172A' }}>{selectedPool.name}</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{selectedPool.count} candidates · Updated {selectedPool.updated}</div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={{ background: 'none', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 999, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#334155' }}>Add Candidates</button>
                  <button style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 999, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Bulk Message</button>
                </div>
              </div>

              {/* Column headers */}
              <div style={{ padding: '8px 18px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'grid', gridTemplateColumns: '1fr 80px 100px 80px', gap: 12 }}>
                {['Candidate', 'WHY', 'Added', 'Actions'].map(h => <div key={h} style={{ fontSize: 10, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>)}
              </div>

              {POOL_CANDIDATES.map((c, i) => (
                <div key={i} style={{ padding: '12px 18px', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'grid', gridTemplateColumns: '1fr 80px 100px 80px', gap: 12, alignItems: 'center', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,112,67,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{c.avatar}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{c.title}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 900, fontSize: 16, color: c.why >= 90 ? '#16A34A' : '#D97706' }}>{c.why}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>{c.added}</div>
                  <button style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, border: `1px solid ${ORANGE}`, color: ORANGE, background: 'none', cursor: 'pointer', fontWeight: 700 }}>Message</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </RecruiterLayout>
    </>
  );
}
