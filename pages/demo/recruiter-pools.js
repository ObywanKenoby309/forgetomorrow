// pages/demo/recruiter-pools.js
// Force Redeploy
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
  'Uncategorized':          [{ name: 'Eric James', title: 'Founder & CEO of ForgeTomorrow', type: 'External', warm: true, email: 'eric.james@forgetomorrow.com', fit: '-', whySaved: 'No snapshot yet.', notes: 'Alignment summary: Emerging alignment (20%). Capability coverage: matched 1/2 core (Tier A) and 3/6 supporting (Tier B). Supporting coverage: 2/19 skill clusters present.\n\nAlignment score: 20%\nStrengths: Governance, risk & compliance, Healthcare administration, Education / training, Public safety / security\nGaps: Employee benefits / workers compensation, Government / military environment, HR / people operations', updated: 'May 19' }],
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
              <div style={{ borderRight: '1px solid #eee', padding: '12px 0', overflowY: 'auto' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: MUTED, padding: '0 14px 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your pools</div>
                {POOLS.map((pool, i) => (
                  <div
                    key={i}
                    onClick={() => selectPool(pool)}
                    style={{ padding: '12px 14px', cursor: 'pointer', background: selectedPool.name === pool.name ? 'rgba(255,112,67,0.06)' : 'transparent', borderLeft: selectedPool.name === pool.name ? `3px solid ${ORANGE}` : '3px solid transparent', marginBottom: 2 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: SLATE, flex: 1, marginRight: 8 }}>{pool.name}</div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: pool.color, flexShrink: 0 }}>{pool.count}</div>
                    </div>
                    <div style={{ fontSize: 11, color: MUTED, marginBottom: 6, lineHeight: 1.4 }}>{pool.desc}</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                      {pool.tags.map(t => (
                        <span key={t} style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: `${pool.color}18`, color: pool.color }}>{t}</span>
                      ))}
                    </div>
                    <div style={{ fontSize: 10, color: '#94A3B8' }}>Updated: {pool.updated}</div>
                  </div>
                ))}
                <div style={{ padding: '14px', borderTop: '1px solid #eee', marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>
                    <strong style={{ color: ORANGE }}>ForgeTomorrow advantage:</strong> every saved candidate carries a "why saved" snapshot so you keep signal, not just names.
                  </div>
                </div>
              </div>

              {/* Col 2: Candidate list */}
              <div style={{ borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px 14px', borderBottom: '1px solid #eee' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: SLATE, marginBottom: 2 }}>{selectedPool.name}</div>
                  <div style={{ fontSize: 11, color: MUTED, marginBottom: 10 }}>{candidates.length} candidate{candidates.length !== 1 ? 's' : ''} shown</div>
                  <input
                    placeholder="Search candidates..."
                    style={{ width: '100%', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, padding: '7px 12px', fontSize: 12, outline: 'none', background: 'rgba(0,0,0,0.02)', boxSizing: 'border-box', color: SLATE }}
                  />
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {candidates.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No candidates in this pool yet.</div>
                  ) : candidates.map((c, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedCandidate(c)}
                      style={{ padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', background: selectedCandidate?.name === c.name ? 'rgba(255,112,67,0.06)' : 'transparent', borderLeft: selectedCandidate?.name === c.name ? `3px solid ${ORANGE}` : '3px solid transparent' }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: SLATE }}>{c.name}</div>
                      {c.title && <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{c.title}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Col 3: At a glance detail */}
              <div style={{ padding: '16px 18px', overflowY: 'auto' }}>
                {selectedCandidate ? (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 800, color: ORANGE, marginBottom: 10 }}>At a glance...</div>
                    <div style={{ fontSize: 17, fontWeight: 900, color: SLATE, marginBottom: 4 }}>{selectedCandidate.name}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Professional Summary</div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                      <TypeTag label={selectedCandidate.type} />
                      {selectedCandidate.warm && <TypeTag label="Warm" />}
                    </div>
                    <div style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>Email: <span style={{ color: SLATE }}>{selectedCandidate.email}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ fontSize: 12, color: MUTED }}>Fit: <span style={{ color: SLATE, fontWeight: 700 }}>{selectedCandidate.fit}</span></div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>Last updated: {selectedCandidate.updated}</div>
                    </div>

                    <div style={{ fontSize: 12, fontWeight: 800, color: SLATE, marginBottom: 6 }}>Why saved</div>
                    <div style={{ fontSize: 12, color: MUTED, marginBottom: 14, lineHeight: 1.5 }}>{selectedCandidate.whySaved}</div>

                    <div style={{ fontSize: 12, fontWeight: 800, color: SLATE, marginBottom: 6 }}>Notes</div>
                    <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6, marginBottom: 18, whiteSpace: 'pre-line' }}>{selectedCandidate.notes}</div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button style={{ background: 'rgba(255,112,67,0.1)', color: ORANGE, border: '1px solid rgba(255,112,67,0.3)', borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Message</button>
                      <button style={{ background: 'none', color: SLATE, border: '1px solid rgba(0,0,0,0.14)', borderRadius: 8, padding: '8px 16px', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>View Full Details</button>
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