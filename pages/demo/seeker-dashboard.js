// pages/demo/seeker-dashboard.js
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import SeekerLayout from '@/components/layouts/SeekerLayout';

const ORANGE = '#FF7043';
const GLASS = { background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 10px 28px rgba(15,23,42,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 18, padding: 16 };
const WHITE_CARD = { background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: 12 };
const ORANGE_LIFT = { textShadow: '0 2px 4px rgba(15,23,42,0.65)', fontWeight: 900 };

const DEMO_KPIS = { Pinned: 3, Applied: 7, Interviewing: 2, Offers: 1, 'Closed Out': 4 };
const DEMO_STRENGTH = [
  { label: 'Professional Signal', value: 'Strong', color: '#16A34A' },
  { label: 'Execution Visibility', value: 'Strong', color: '#16A34A' },
  { label: 'Validation Risk', value: 'Low', color: '#16A34A' },
  { label: 'Portfolio Depth', value: 'Strong', color: '#16A34A' },
  { label: 'Resume Access', value: 'Available', color: '#16A34A' },
];
const ACTION_TILES = [
  { title: 'New Messages', msg: '2 unread from recruiters' },
  { title: 'Job Updates', msg: '3 new matches today' },
  { title: 'Applications', msg: 'Interview request pending' },
  { title: 'Calendar', msg: 'Session tomorrow at 2pm' },
  { title: 'Shared With Me', msg: '1 document shared' },
];
const NEW_MATCHES = [
  { title: 'Senior Product Manager', company: 'Stripe', location: 'Remote', salary: '$180K–$240K', match: 94, matchLabel: 'Strong Match' },
  { title: 'VP of Product', company: 'Airbnb', location: 'San Francisco, CA', salary: '$260K–$320K', match: 91, matchLabel: 'Strong Match' },
  { title: 'Principal PM', company: 'Anthropic', location: 'Remote', salary: '$200K–$280K', match: 78, matchLabel: 'Good Match' },
  { title: 'Director of Product', company: 'Notion', location: 'New York, NY', salary: '$190K–$250K', match: 78, matchLabel: 'Good Match' },
];
const NEXT_YES = [
  { title: 'Technical Account Manager', company: 'Acme Co.', location: 'Remote', pinned: 'Pinned 6/20/2026' },
  { title: 'Director of Professional Button Pushing', company: 'Button Pushers Co.', location: 'Somewhere, USA', pinned: 'Pinned 6/23/2026' },
];
const APP_WEEKS = [
  { week: 'W1', applied: 5, interviews: 0 },
  { week: 'W2', applied: 0, interviews: 0 },
  { week: 'W3', applied: 0, interviews: 0 },
  { week: 'W4', applied: 0, interviews: 0 },
  { week: 'W5', applied: 0, interviews: 0 },
];

export default function DemoSeekerDashboard() {
  return (
    <>
      <Head><title>Seeker Dashboard — ForgeTomorrow</title></Head>
      <SeekerLayout
        hideDesktopRightRail={false}
        header={
          <div style={{ ...GLASS, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: ORANGE, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>GOOD MORNING</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: ORANGE, fontStyle: 'italic', ...ORANGE_LIFT }}>Your Job Seeker Dashboard</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>You're not alone. Track your momentum, see your wins, and keep moving forward.</div>
          </div>
        }
      >
        <div style={{ display: 'grid', gap: 14 }}>

          {/* KPIs + Profile Strength */}
          <div style={{ ...GLASS }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: ORANGE, ...ORANGE_LIFT }}>KPIs</div>
              <Link href="#" style={{ fontSize: 12, color: ORANGE, fontWeight: 700, textDecoration: 'none', ...ORANGE_LIFT }}>Full history →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 10, marginBottom: 16 }}>
              {Object.entries(DEMO_KPIS).map(([stage, count]) => (
                <div key={stage} style={{ ...WHITE_CARD, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>{stage}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A' }}>{count}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 900, fontSize: 15, color: ORANGE, ...ORANGE_LIFT }}>Profile Strength</div>
              <Link href="#" style={{ fontSize: 12, color: ORANGE, fontWeight: 700, textDecoration: 'none', ...ORANGE_LIFT }}>Full read →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 10 }}>
              {DEMO_STRENGTH.map(s => (
                <div key={s.label} style={{ ...WHITE_CARD, textAlign: 'center', borderColor: `${s.color}33` }}>
                  <div style={{ fontSize: 10, color: s.color, fontWeight: 800, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Center */}
          <div style={{ ...GLASS }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: ORANGE, ...ORANGE_LIFT }}>Action Center</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>Click a card to open</span>
                <Link href="#" style={{ fontSize: 12, color: ORANGE, fontWeight: 700, textDecoration: 'none', ...ORANGE_LIFT }}>View all</Link>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 10 }}>
              {ACTION_TILES.map(t => (
                <Link key={t.title} href="#" style={{ textDecoration: 'none' }}>
                  <div style={{ ...WHITE_CARD, minHeight: 80, cursor: 'pointer' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', marginBottom: 6 }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: '#475569' }}>{t.msg}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Bottom row — New Matches | Your Next Yes | Applications Over Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>

            {/* New Matches */}
            <section style={{ ...GLASS }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 18, color: ORANGE, lineHeight: 1.25, letterSpacing: '-0.01em', margin: 0, ...ORANGE_LIFT }}>New Matches</div>
                <Link href="#" style={{ color: ORANGE, fontWeight: 800, fontSize: 13, textDecoration: 'none', ...ORANGE_LIFT }}>View all</Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {NEW_MATCHES.map((job, i) => (
                  <div key={i} style={{ ...WHITE_CARD, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', lineHeight: 1.3, flex: 1 }}>{job.title}</div>
                      <div style={{ flexShrink: 0, textAlign: 'center', background: job.match >= 90 ? 'rgba(255,112,67,0.1)' : 'rgba(217,119,6,0.08)', borderRadius: 8, padding: '4px 6px', border: `1px solid ${job.match >= 90 ? ORANGE : '#D97706'}33` }}>
                        <div style={{ fontSize: 13, fontWeight: 900, color: job.match >= 90 ? ORANGE : '#D97706' }}>{job.match}%</div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: job.match >= 90 ? ORANGE : '#D97706' }}>{job.matchLabel}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{job.company}</div>
                    <div style={{ fontSize: 10, color: '#94A3B8' }}>{job.location} · {job.salary}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Your Next Yes */}
            <section style={{ ...GLASS }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 18, color: ORANGE, lineHeight: 1.25, letterSpacing: '-0.01em', margin: 0, ...ORANGE_LIFT }}>Your Next Yes</div>
                <Link href="#" style={{ color: ORANGE, fontWeight: 800, fontSize: 13, textDecoration: 'none', ...ORANGE_LIFT }}>View all</Link>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {NEXT_YES.map((job, i) => (
                  <div key={i} style={{ ...WHITE_CARD }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{job.title}</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>{job.company}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6 }}>{job.location}</div>
                    <div style={{ fontSize: 11, color: ORANGE, fontWeight: 700 }}>📌 {job.pinned}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Applications Over Time */}
            <section style={{ ...GLASS }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 16, color: ORANGE, lineHeight: 1.25, letterSpacing: '-0.01em', margin: 0, ...ORANGE_LIFT }}>Applications Over Time</div>
                <Link href="#" style={{ color: ORANGE, fontWeight: 800, fontSize: 13, textDecoration: 'none', ...ORANGE_LIFT }}>View all</Link>
              </div>
              <div style={{ ...WHITE_CARD }}>
                <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>WEEK</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.06em' }}>APPLIED</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>INTERVIEWS</div>
                </div>
                {APP_WEEKS.map((row, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr', gap: 8, padding: '6px 0', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{row.week}</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: row.applied > 0 ? '#2563EB' : '#94A3B8' }}>{row.applied}</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: row.interviews > 0 ? '#16A34A' : '#94A3B8' }}>{row.interviews}</div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>
      </SeekerLayout>
    </>
  );
}
