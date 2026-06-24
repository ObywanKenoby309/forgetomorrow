// pages/demo/forge-vault.js
import React, { useState } from 'react';
import Head from 'next/head';
import SeekerLayout from '@/components/layouts/SeekerLayout';

const ORANGE = '#FF7043';
const GLASS = { background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 10px 28px rgba(15,23,42,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 18, padding: 16 };
const WHITE_CARD = { background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: 14 };

const DOCS = [
  { name: 'Eric James — Senior PM Resume.pdf', type: 'resume', size: '142 KB', updated: 'Jun 22, 2026', shared: 2, icon: '📄' },
  { name: 'Eric James — VP Product Resume.pdf', type: 'resume', size: '138 KB', updated: 'Jun 15, 2026', shared: 0, icon: '📄' },
  { name: 'Stripe — Cover Letter.pdf', type: 'cover', size: '64 KB', updated: 'Jun 21, 2026', shared: 1, icon: '✉️' },
  { name: 'Airbnb — Cover Letter.pdf', type: 'cover', size: '61 KB', updated: 'Jun 20, 2026', shared: 0, icon: '✉️' },
  { name: 'Career Pivot Roadmap — Q3 2026.pdf', type: 'roadmap', size: '88 KB', updated: 'Jun 18, 2026', shared: 1, icon: '🗺️' },
  { name: 'Offer Negotiation Analysis — Scale AI.pdf', type: 'offer', size: '72 KB', updated: 'Jun 10, 2026', shared: 0, icon: '💰' },
  { name: 'Professional Operating Profile.pdf', type: 'report', size: '95 KB', updated: 'Jun 5, 2026', shared: 3, icon: '🧠' },
  { name: 'Interview Prep — Anthropic PM Role.pdf', type: 'prep', size: '54 KB', updated: 'May 28, 2026', shared: 0, icon: '🎯' },
];

const SHARED = [
  { name: 'Senior PM Resume — Stripe Version', sharedBy: 'Jessica Chen · Stripe Recruiter', date: 'Jun 21', icon: '📄' },
  { name: 'Career Pivot Roadmap', sharedBy: 'Sarah K. · Career Coach', date: 'Jun 18', icon: '🗺️' },
  { name: 'Professional Operating Profile', sharedBy: 'Marcus W. · Airbnb Recruiter', date: 'Jun 12', icon: '🧠' },
];

const TYPE_COLORS = { resume: '#2563EB', cover: '#7C3AED', roadmap: '#D97706', offer: '#16A34A', report: '#0F766E', prep: '#DC2626' };

export default function DemoForgeVault() {
  const [tab, setTab] = useState('my-docs');
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? DOCS : DOCS.filter(d => d.type === filter);

  return (
    <>
      <Head><title>ForgeVault — ForgeTomorrow</title></Head>
      <SeekerLayout header={
        <div style={{ ...GLASS, textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: ORANGE, fontStyle: 'italic' }}>ForgeVault</div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Your secure career document vault — resumes, cover letters, roadmaps, and more.</div>
        </div>
      }>
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[['Documents', DOCS.length, '📁'], ['Shared Out', '6', '📤'], ['Shared With Me', SHARED.length, '📥'], ['Storage Used', '814 KB', '💾']].map(([label, val, icon]) => (
              <div key={label} style={{ ...GLASS, textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: ORANGE }}>{val}</div>
                <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ ...GLASS, padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              {[['my-docs', 'My Documents'], ['shared-with-me', 'Shared With Me']].map(([val, label]) => (
                <button key={val} onClick={() => setTab(val)}
                  style={{ padding: '13px 24px', fontWeight: tab === val ? 800 : 600, fontSize: 13, color: tab === val ? ORANGE : '#64748B', background: 'none', border: 'none', borderBottom: tab === val ? `2px solid ${ORANGE}` : '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {label}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center' }}>
                <button style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 999, padding: '7px 16px', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>+ Upload Document</button>
              </div>
            </div>

            {tab === 'my-docs' && (
              <div style={{ padding: 16 }}>
                {/* Filter pills */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  {[['all', 'All'], ['resume', 'Resumes'], ['cover', 'Cover Letters'], ['roadmap', 'Roadmaps'], ['offer', 'Offer Analysis'], ['report', 'Reports'], ['prep', 'Interview Prep']].map(([val, label]) => (
                    <button key={val} onClick={() => setFilter(val)}
                      style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 999, border: filter === val ? 'none' : '1px solid rgba(0,0,0,0.12)', background: filter === val ? ORANGE : 'transparent', color: filter === val ? '#fff' : '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  {filtered.map((doc, i) => (
                    <div key={i} onClick={() => setSelected(selected?.name === doc.name ? null : doc)}
                      style={{ ...WHITE_CARD, display: 'grid', gridTemplateColumns: '32px 1fr 100px 80px 80px auto', alignItems: 'center', gap: 14, cursor: 'pointer', border: selected?.name === doc.name ? `1.5px solid ${ORANGE}` : '1px solid rgba(0,0,0,0.07)', background: selected?.name === doc.name ? 'rgba(255,112,67,0.04)' : 'rgba(255,255,255,0.95)' }}>
                      <div style={{ fontSize: 22, textAlign: 'center' }}>{doc.icon}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{doc.name}</div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: `${TYPE_COLORS[doc.type]}15`, color: TYPE_COLORS[doc.type] }}>{doc.type}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>{doc.updated}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{doc.size}</div>
                      <div style={{ fontSize: 11, color: doc.shared > 0 ? ORANGE : '#94A3B8', fontWeight: doc.shared > 0 ? 700 : 400 }}>{doc.shared > 0 ? `Shared (${doc.shared})` : 'Private'}</div>
                      <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                        <button style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, border: `1px solid ${ORANGE}`, color: ORANGE, background: 'none', cursor: 'pointer', fontWeight: 700 }}>Share</button>
                        <button style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, border: '1px solid rgba(0,0,0,0.12)', color: '#64748B', background: 'none', cursor: 'pointer', fontWeight: 700 }}>Download</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'shared-with-me' && (
              <div style={{ padding: 16 }}>
                <div style={{ display: 'grid', gap: 10 }}>
                  {SHARED.map((doc, i) => (
                    <div key={i} style={{ ...WHITE_CARD, display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ fontSize: 24 }}>{doc.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{doc.name}</div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Shared by {doc.sharedBy}</div>
                      </div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>{doc.date}</div>
                      <button style={{ fontSize: 11, padding: '6px 14px', borderRadius: 999, background: ORANGE, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>View</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </SeekerLayout>
    </>
  );
}
