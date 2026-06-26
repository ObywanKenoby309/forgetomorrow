// pages/demo/recruiter-pools.js
import React, { useState } from 'react';
import Head from 'next/head';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';

const ORANGE = '#FF7043';
const SLATE  = '#1E293B';
const MUTED  = '#64748B';
const GAP    = 16;

const GLASS = {
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.28)',
  background: 'rgba(255,255,255,0.74)',
  boxShadow: '0 8px 22px rgba(15,23,42,0.10)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};
const PANEL = {
  background: 'white',
  border: '1px solid #eee',
  borderRadius: 14,
  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
};
const ORANGE_LIFT = {
  textShadow: '0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)',
  fontWeight: 900,
};

const POOLS = [
  { name: 'Uncategorized',           desc: 'Default intake pool for uncategorized external candidates.', count: 1,  tags: ['uncategorized', 'external'], updated: 'May 19', color: '#94A3B8' },
  { name: 'Nashville Talent',        desc: 'Local candidates to the HQ',                                 count: 1,  tags: ['Local'],                     updated: 'Feb 9',  color: '#2563EB' },
  { name: 'Silver Medalists',        desc: 'Top Candidates From Interviews',                             count: 2,  tags: ['silver'],                    updated: 'Feb 6',  color: '#D97706' },
  { name: 'Senior Product Leaders',  desc: 'Strong senior IC and leadership PM pipeline',                count: 18, tags: ['Product', 'B2B', 'SaaS'],    updated: '2 hours ago', color: '#7C3AED' },
  { name: 'Engineering — Backend',   desc: 'Systems and infrastructure engineers',                       count: 34, tags: ['Go', 'Rust', 'Distributed'], updated: 'Today',  color: '#16A34A' },
];

const POOL_CANDIDATES = {
  'Uncategorized':          [{ name: 'Carl Jones', title: 'Social Media Content Advisor', type: 'External', warm: true, email: 'c.jones368@email.com', fit: '-', whySaved: 'No snapshot yet.', notes: 'Alignment summary: Strong alignment (81%). Capability coverage: matched 5/6 core (Tier A) and 6/8 supporting (Tier B). Supporting coverage: 15/22 skill clusters present.\n\nAlignment score: 81%\nStrengths: Social media strategy, Content creation, Audience engagement, Content calendars, Brand voice development, Community management, Campaign analytics, Platform optimization\nGaps: Paid social advertising, Video production, Influencer marketing partnerships' }],
  'Nashville Talent':       [{ name: 'Jordan Lee', title: 'Operations Manager', type: 'Internal', warm: false, email: 'jordan.l@email.com', fit: '74%', whySaved: 'Strong local ops signal with team leadership experience.', notes: 'Solid match for Nashville HQ roles. Prefers hybrid. Has managed teams of 10+.', updated: 'Feb 9' }],
  'Silver Medalists':       [{ name: 'Priya Sharma', title: 'Head of Design', type: 'Internal', warm: true, email: 'priya.s@email.com', fit: '91%', whySaved: 'Finalist for design lead role — strong systems background.', notes: 'Reached final round. Passed on offer due to comp gap. Worth revisiting in Q3.', updated: 'Feb 6' }, { name: 'Marcus Johnson', title: 'VP of Engineering', type: 'Internal', warm: false, email: 'marcus.j@email.com', fit: '88%', whySaved: 'Strong technical leadership signal.', notes: 'Second finalist for VP Eng. Accepted offer elsewhere. Keep warm for future roles.', updated: 'Feb 6' }],
  'Senior Product Leaders': [{ name: 'Alexandra Chen', title: 'Senior Product Manager', type: 'Internal', warm: true, email: 'alex.c@email.com', fit: '94%', whySaved: 'Top WHY score for PM pipeline.', notes: 'Strong B2B SaaS background. Active seeker. Reach out before end of month.', updated: '2 hours ago' }, { name: 'James Rivera', title: 'Director of Sales', type: 'Internal', warm: false, email: 'james.r@email.com', fit: '88%', whySaved: 'Cross-functional leadership signal.', notes: 'Transitioning from sales to product. Interesting background worth watching.', updated: '3 days ago' }],
  'Engineering — Backend':  [{ name: 'Taylor Kim', title: 'Principal Data Scientist', type: 'Internal', warm: true, email: 'taylor.k@email.com', fit: '85%', whySaved: 'Strong ML infra signal.', notes: 'PyTorch + LLM infra experience. Open to relocation. Follow up after Q2.', updated: 'Today' }],
};

function TypeTag({ label }) {
  const colors = {
    External: { bg: 'rgba(37,99,235,0.1)',  color: '#2563EB' },
    Internal: { bg: 'rgba(22,163,74,0.1)',  color: '#16A34A' },
    Warm:     { bg: 'rgba(217,119,6,0.1)',  color: '#D97706' },
  };
  const s = colors[label] || { bg: 'rgba(0,0,0,0.06)', color: MUTED };
  return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: s.bg, color: s.color }}>{label}</span>;
}

export default function DemoRecruiterPools() {
  const [selectedPool, setSelectedPool] = useState(POOLS[0]);
  const [selectedCandidate, setSelectedCandidate] = useState(POOL_CANDIDATES['Uncategorized'][0]);
  const candidates = POOL_CANDIDATES[selectedPool.name] || [];

  function selectPool(pool) {
    setSelectedPool(pool);
    const poolCandidates = POOL_CANDIDATES[pool.name] || [];
    setSelectedCandidate(poolCandidates[0] || null);
  }

  return (
    <>
      <Head><title>Talent Pools — ForgeTomorrow</title></Head>
      <RecruiterLayout
        title="Talent Pools | ForgeTomorrow"
        activeNav="candidate-center"
        right={
          <img
            src="/ads/house/recruiter-house-ad.png"
            alt="Advertise with ForgeTomorrow"
            style={{ width: '100%', borderRadius: 14, display: 'block' }}
          />
        }
        rightVariant="light"
      >
        <div style={{ display: 'grid', gap: GAP }}>

          {/* Title card */}
          <div style={{ ...GLASS, padding: '18px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: ORANGE, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>GOOD EVENING</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: ORANGE, fontStyle: 'italic', ...ORANGE_LIFT }}>Candidate Center</div>
            <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>Choose the recruiter tool you want to open. Each workspace stays separate and loads inside Candidate Center.</div>
          </div>

          {/* Section header */}
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: ORANGE, fontStyle: 'italic', ...ORANGE_LIFT, marginBottom: 2 }}>Talent Pools</div>
            <div style={{ fontSize: 13, color: MUTED, marginBottom: 10 }}>Saved candidate pools for review, follow-up, and future hiring needs.</div>
            <button style={{ background: 'none', color: ORANGE, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0 }}>Candidate Center Main</button>
          </div>

          {/* Pools workspace */}
          <div style={{ ...PANEL, padding: 0, overflow: 'hidden' }}>

            {/* Workspace header */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: SLATE }}>Pools workspace</div>
                <div style={{ fontSize: 12, color: MUTED }}>Pick a pool, scan candidates, and take action without jumping between pages.</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={{ background: 'white', color: SLATE, border: '1px solid rgba(0,0,0,0.15)', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>New pool</button>
                <button style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Add candidates</button>
              </div>
            </div>

            {/* 3-col layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '240px 260px 1fr', minHeight: 480 }}>

              {/* Col 1: Pools list */}
              <div style={{ borderRight: '1px solid #eee', padding: '14px 12px', overflowY: 'auto', background: 'white' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: SLATE, marginBottom: 12 }}>Your pools</div>
                {POOLS.map((pool, i) => (
                  <div
                    key={i}
                    onClick={() => selectPool(pool)}
                    style={{
                      padding: '12px 14px',
                      cursor: 'pointer',
                      borderRadius: 10,
                      border: selectedPool.name === pool.name ? '1px solid rgba(255,112,67,0.3)' : '1px solid #eee',
                      background: selectedPool.name === pool.name ? 'rgba(255,112,67,0.04)' : 'white',
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: SLATE, flex: 1, marginRight: 8 }}>{pool.name}</div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: SLATE, background: '#f1f5f9', borderRadius: 6, padding: '1px 7px', flexShrink: 0 }}>{pool.count}</div>
                    </div>
                    <div style={{ fontSize: 11, color: MUTED, marginBottom: 8, lineHeight: 1.4 }}>{pool.desc}</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                      {pool.tags.map(t => (
                        <span key={t} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: '#f1f5f9', color: MUTED }}>{t}</span>
                      ))}
                    </div>
                    <div style={{ fontSize: 10, color: '#94A3B8' }}>Updated: {pool.updated}</div>
                  </div>
                ))}
                <div style={{ marginTop: 4, padding: '10px 2px' }}>
                  <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>
                    <strong style={{ color: ORANGE }}>ForgeTomorrow advantage:</strong> every saved candidate carries a "why saved" snapshot so you keep signal, not just names.
                  </div>
                </div>
              </div>

              {/* Col 2: Candidate list */}
              <div style={{ borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', background: 'white' }}>
                <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid #eee' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: SLATE, marginBottom: 2 }}>{selectedPool.name}</div>
                  <div style={{ fontSize: 11, color: MUTED, marginBottom: 10 }}>{candidates.length} candidate{candidates.length !== 1 ? 's' : ''} shown</div>
                  <input
                    placeholder="Search candidates..."
                    style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', fontSize: 12, outline: 'none', background: 'white', boxSizing: 'border-box', color: SLATE }}
                  />
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
                  {candidates.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No candidates in this pool yet.</div>
                  ) : candidates.map((c, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedCandidate(c)}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderRadius: 8,
                        marginBottom: 6,
                        background: selectedCandidate?.name === c.name ? 'rgba(255,112,67,0.08)' : '#f8fafc',
                        border: selectedCandidate?.name === c.name ? '1px solid rgba(255,112,67,0.25)' : '1px solid #f1f5f9',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: SLATE }}>{c.name}</div>
                      {c.title && <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{c.title}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Col 3: At a glance detail */}
              <div style={{ padding: '16px 20px', overflowY: 'auto', background: 'white' }}>
                {selectedCandidate ? (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 800, color: ORANGE, marginBottom: 10 }}>At a glance...</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: SLATE, marginBottom: 4 }}>{selectedCandidate.name}</div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Professional Summary</div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                      <TypeTag label={selectedCandidate.type} />
                      {selectedCandidate.warm && <TypeTag label="Warm" />}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: SLATE, marginBottom: 8 }}>Email: <span style={{ color: MUTED, fontWeight: 400 }}>{selectedCandidate.email}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: 12, color: MUTED }}>Fit: <span style={{ color: SLATE, fontWeight: 700 }}>{selectedCandidate.fit}</span></div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>Last updated: {selectedCandidate.updated}</div>
                    </div>

                    <div style={{ fontSize: 12, fontWeight: 800, color: SLATE, marginBottom: 6 }}>Why saved</div>
                    <div style={{ fontSize: 12, color: MUTED, marginBottom: 16, lineHeight: 1.5 }}>{selectedCandidate.whySaved}</div>

                    <div style={{ fontSize: 12, fontWeight: 800, color: SLATE, marginBottom: 8 }}>Notes</div>
                    <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6, marginBottom: 18, whiteSpace: 'pre-line', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px', background: '#f8fafc' }}>{selectedCandidate.notes}</div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button style={{ background: 'rgba(255,112,67,0.1)', color: ORANGE, border: '1px solid rgba(255,112,67,0.2)', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Message</button>
                      <button style={{ background: 'none', color: SLATE, border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>View Full Details</button>
                      <button style={{ background: 'none', color: ORANGE, border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', padding: '8px 4px' }}>Edit</button>
                    </div>
                  </>
                ) : (
                  <div style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', marginTop: 40 }}>Select a candidate to see details.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </RecruiterLayout>
    </>
  );
}