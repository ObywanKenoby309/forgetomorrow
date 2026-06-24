// pages/demo/jobs.js
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import SeekerLayout from '@/components/layouts/SeekerLayout';

const ORANGE = '#FF7043';
const GLASS = { background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 10px 28px rgba(15,23,42,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 18, padding: 16 };
const WHITE_CARD = { background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: 14 };

const JOBS = [
  { id: 1, title: 'Senior Product Manager — Platform', company: 'Stripe', location: 'Remote', salary: '$180K–$240K', type: 'Full-time', why: 94, posted: '2 days ago', logo: '💳', tags: ['Product', 'B2B', 'Payments'], desc: 'Lead the platform product strategy for Stripe\'s developer-facing APIs. Work with engineering, design, and go-to-market to define the future of payments infrastructure.' },
  { id: 2, title: 'VP of Product', company: 'Airbnb', location: 'San Francisco, CA', salary: '$260K–$320K', type: 'Full-time', why: 91, posted: '1 day ago', logo: '🏠', tags: ['Leadership', 'Consumer', 'Marketplace'], desc: 'Own the product vision for Airbnb\'s host experience. Lead a team of 12 PMs across supply, trust, and community products.' },
  { id: 3, title: 'Principal Product Manager', company: 'Anthropic', location: 'Remote', salary: '$200K–$280K', type: 'Full-time', why: 89, posted: 'Today', logo: '🤖', tags: ['AI', 'Developer Tools', 'B2B'], desc: 'Shape the future of AI-powered developer tools at Anthropic. Partner with research and engineering to bring frontier models to production.' },
  { id: 4, title: 'Director of Product — Growth', company: 'Notion', location: 'New York, NY', salary: '$190K–$250K', type: 'Full-time', why: 86, posted: '3 days ago', logo: '📝', tags: ['Growth', 'PLG', 'SaaS'], desc: 'Drive Notion\'s self-serve growth engine. Own acquisition, activation, and retention metrics for millions of users worldwide.' },
  { id: 5, title: 'Group Product Manager', company: 'Figma', location: 'Remote', salary: '$210K–$270K', type: 'Full-time', why: 83, posted: '4 days ago', logo: '🎨', tags: ['Design Tools', 'Collaboration', 'SaaS'], desc: 'Lead multiple product squads working on Figma\'s collaborative design platform. Drive the next generation of design workflows.' },
  { id: 6, title: 'Head of Product — AI Features', company: 'Linear', location: 'Remote', salary: '$170K–$230K', type: 'Full-time', why: 81, posted: '5 days ago', logo: '📐', tags: ['AI', 'Productivity', 'B2B'], desc: 'Own Linear\'s AI product roadmap. Work closely with founders to embed intelligence throughout the engineering workflow.' },
];

export default function DemoJobs() {
  const [selected, setSelected] = useState(JOBS[0]);
  const [query, setQuery] = useState('Senior Product Manager');

  return (
    <>
      <Head><title>Job Search — ForgeTomorrow</title></Head>
      <SeekerLayout hideDesktopRightRail header={
        <div style={{ ...GLASS, padding: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: ORANGE, fontStyle: 'italic', marginBottom: 12, textAlign: 'center' }}>Find Your Next Role</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Job title, skill, or company..."
              style={{ flex: 1, border: '1px solid rgba(0,0,0,0.12)', borderRadius: 999, padding: '12px 18px', fontSize: 14, outline: 'none', background: 'rgba(255,255,255,0.9)' }} />
            <input defaultValue="Remote, San Francisco CA" placeholder="Location..."
              style={{ width: 220, border: '1px solid rgba(0,0,0,0.12)', borderRadius: 999, padding: '12px 18px', fontSize: 14, outline: 'none', background: 'rgba(255,255,255,0.9)' }} />
            <button style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 999, padding: '12px 28px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>Search</button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {['Remote', 'Full-time', '$150K+', 'Product', 'Leadership', 'AI/ML'].map(f => (
              <button key={f} style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(255,112,67,0.3)', background: 'rgba(255,112,67,0.08)', color: ORANGE, cursor: 'pointer' }}>{f}</button>
            ))}
          </div>
        </div>
      }>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 16, alignItems: 'start' }}>
          {/* Job list */}
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>{JOBS.length} roles matched — sorted by WHY Score</div>
            {JOBS.map((job) => (
              <div key={job.id} onClick={() => setSelected(job)}
                style={{ ...WHITE_CARD, cursor: 'pointer', border: selected.id === job.id ? `2px solid ${ORANGE}` : '1px solid rgba(0,0,0,0.07)', boxShadow: selected.id === job.id ? `0 0 0 3px rgba(255,112,67,0.12)` : undefined }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(255,112,67,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{job.logo}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>{job.title}</div>
                      <div style={{ flexShrink: 0, fontWeight: 900, fontSize: 15, color: job.why >= 90 ? '#16A34A' : job.why >= 80 ? '#D97706' : '#64748B' }}>{job.why}<span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>/100</span></div>
                    </div>
                    <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>{job.company} · {job.location}</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{job.salary} · {job.type} · {job.posted}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {job.tags.map(t => <span key={t} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,112,67,0.08)', color: ORANGE }}>{t}</span>)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Job detail */}
          <div style={{ ...GLASS, position: 'sticky', top: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(255,112,67,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{selected.logo}</div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 17, color: '#0F172A' }}>{selected.title}</div>
                <div style={{ fontSize: 13, color: '#64748B' }}>{selected.company} · {selected.location}</div>
              </div>
            </div>

            <div style={{ ...WHITE_CARD, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em' }}>WHY Score</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: selected.why >= 90 ? '#16A34A' : '#D97706' }}>{selected.why}<span style={{ fontSize: 13, color: '#94A3B8' }}>/100</span></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{selected.salary}</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>{selected.type}</div>
              </div>
            </div>

            <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.65, marginBottom: 16 }}>{selected.desc}</div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {selected.tags.map(t => <span key={t} style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: 'rgba(255,112,67,0.1)', color: ORANGE }}>{t}</span>)}
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              <button style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 999, padding: '12px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>Apply Now</button>
              <button style={{ background: 'none', color: ORANGE, border: `1px solid ${ORANGE}`, borderRadius: 999, padding: '12px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>Check My Fit →</button>
              <button style={{ background: 'none', color: '#64748B', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 999, padding: '12px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Pin for Later</button>
            </div>
          </div>
        </div>
      </SeekerLayout>
    </>
  );
}
