// pages/demo/seeker-dashboard.js
// Demo page — hardcoded fake data, no API calls, no auth
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import SeekerLayout from '@/components/layouts/SeekerLayout';

const ORANGE = '#FF7043';
const GLASS = { background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 10px 28px rgba(15,23,42,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 18, padding: 16 };
const WHITE_CARD = { background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: 12 };

const DEMO_APPLICATIONS = { Pinned: 3, Applied: 7, Interviewing: 2, Offers: 1, 'Closed Out': 4 };
const DEMO_STRENGTH = [
  { label: 'Professional Signal', value: 'Strong', color: '#16A34A' },
  { label: 'Execution Visibility', value: 'Strong', color: '#16A34A' },
  { label: 'Validation Risk', value: 'Low', color: '#16A34A' },
  { label: 'Portfolio Depth', value: 'Strong', color: '#16A34A' },
  { label: 'Resume Access', value: 'Available', color: '#16A34A' },
];
const ACTION_TILES = [
  { title: 'New Messages', msg: '2 unread from recruiters', href: '#' },
  { title: 'Job Updates', msg: '3 new matches today', href: '#' },
  { title: 'Applications', msg: 'Interview request pending', href: '#' },
  { title: 'Calendar', msg: 'Session tomorrow at 2pm', href: '#' },
  { title: 'Shared With Me', msg: '1 document shared', href: '#' },
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
            <div style={{ fontSize: 28, fontWeight: 900, color: ORANGE, textShadow: '0 2px 8px rgba(255,112,67,0.4)', fontStyle: 'italic' }}>Your Job Seeker Dashboard</div>
            <div style={{ fontSize: 14, color: '#64748B', marginTop: 6 }}>You're not alone. Track your momentum, see your wins, and keep moving forward.</div>
          </div>
        }
      >
        <div style={{ display: 'grid', gap: 16 }}>
          {/* KPIs */}
          <div style={{ ...GLASS }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: ORANGE }}>KPIs</div>
              <Link href="#" style={{ fontSize: 12, color: ORANGE, fontWeight: 700, textDecoration: 'none' }}>Full history →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 10 }}>
              {Object.entries(DEMO_APPLICATIONS).map(([stage, count]) => (
                <div key={stage} style={{ ...WHITE_CARD, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>{stage}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A' }}>{count}</div>
                </div>
              ))}
            </div>

            {/* Profile Strength */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 10 }}>
              <div style={{ fontWeight: 900, fontSize: 15, color: ORANGE }}>Profile Strength</div>
              <Link href="#" style={{ fontSize: 12, color: ORANGE, fontWeight: 700, textDecoration: 'none' }}>Full read →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 10 }}>
              {DEMO_STRENGTH.map((s) => (
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
              <div style={{ fontWeight: 900, fontSize: 16, color: ORANGE }}>Action Center</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>Click a card to open</span>
                <Link href="#" style={{ fontSize: 12, color: ORANGE, fontWeight: 700, textDecoration: 'none' }}>View all</Link>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 10 }}>
              {ACTION_TILES.map((t) => (
                <Link key={t.title} href={t.href} style={{ textDecoration: 'none' }}>
                  <div style={{ ...WHITE_CARD, minHeight: 80, cursor: 'pointer' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', marginBottom: 6 }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: '#475569' }}>{t.msg}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Engagement */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16 }}>
            <div style={{ ...GLASS }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: ORANGE, marginBottom: 12 }}>Recent Activity</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {['Applied to Senior Product Manager at Stripe', 'Profile viewed by TechCorp recruiter', 'New job match: VP of Product at Airbnb (94% fit)', 'Interview scheduled: Acme Co. — Thursday 2pm'].map((item, i) => (
                  <div key={i} style={{ ...WHITE_CARD, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: ORANGE, flexShrink: 0 }} />
                    <div style={{ fontSize: 13, color: '#334155' }}>{item}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...GLASS }}>
              <div style={{ fontWeight: 900, fontSize: 15, color: ORANGE, marginBottom: 12 }}>Engagement</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
                {[['🔍', '47', 'Profile Views', '7 days'], ['💡', '12', 'Search Hits', '7 days'], ['⚡', '94%', 'Completion', 'profile']].map(([icon, val, label, sub]) => (
                  <div key={label} style={{ ...WHITE_CARD, textAlign: 'center' }}>
                    <div style={{ fontSize: 18 }}>{icon}</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: ORANGE }}>{val}</div>
                    <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700 }}>{label}</div>
                    <div style={{ fontSize: 9, color: '#94A3B8' }}>{sub}</div>
                  </div>
                ))}
              </div>
              <Link href="#" style={{ display: 'block', textAlign: 'center', fontSize: 12, color: ORANGE, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,112,67,0.3)', borderRadius: 999, padding: '6px 0' }}>View analytics →</Link>
            </div>
          </div>
        </div>
      </SeekerLayout>
    </>
  );
}
