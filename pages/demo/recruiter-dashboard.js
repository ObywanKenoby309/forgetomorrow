// pages/demo/recruiter-dashboard.js
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';

const ORANGE = '#FF7043';
const GLASS = { background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 10px 28px rgba(15,23,42,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 18, padding: 16 };
const WHITE_CARD = { background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: 14 };
const ORANGE_LIFT = { textShadow: '0 2px 4px rgba(15,23,42,0.65)', fontWeight: 900 };

const PIPELINE = [
  { stage: 'New Applicants', count: 24, color: '#7C3AED', change: '+8 today' },
  { stage: 'Screening', count: 11, color: '#2563EB', change: '+3 today' },
  { stage: 'Interviewing', count: 6, color: '#D97706', change: '2 scheduled' },
  { stage: 'Offers Out', count: 2, color: '#16A34A', change: '1 pending' },
  { stage: 'Hired', count: 18, color: '#0F766E', change: 'This quarter' },
];

const RECENT_ACTIVITY = [
  { type: 'apply', text: 'Alexandra Chen applied to Senior PM — Platform', time: '12 min ago', avatar: '👩‍💼', score: 94 },
  { type: 'message', text: 'Marcus Johnson replied to your message', time: '34 min ago', avatar: '🧑‍💻', score: null },
  { type: 'apply', text: 'Priya Sharma applied to Head of Design', time: '1 hour ago', avatar: '👩‍🎨', score: 91 },
  { type: 'interview', text: 'Interview confirmed — James Rivera, Thursday 2pm', time: '2 hours ago', avatar: '🧑‍💼', score: null },
  { type: 'apply', text: 'Taylor Kim applied to Senior PM — Platform', time: '3 hours ago', avatar: '🧑‍🔬', score: 85 },
];

const OPEN_ROLES = [
  { title: 'Senior PM — Platform', candidates: 18, new: 8, days: 12, status: 'active' },
  { title: 'VP Engineering', candidates: 9, new: 3, days: 28, status: 'active' },
  { title: 'Head of Design', candidates: 14, new: 5, days: 8, status: 'active' },
  { title: 'Director of Sales', candidates: 22, new: 11, days: 47, status: 'attention' },
];

export default function DemoRecruiterDashboard() {
  return (
    <>
      <Head><title>Recruiter Dashboard — ForgeTomorrow</title></Head>
      <RecruiterLayout>
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Title */}
          <div style={{ ...GLASS, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: ORANGE, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>GOOD MORNING</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: ORANGE, fontStyle: 'italic', ...ORANGE_LIFT }}>Recruiter Command Center</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Your hiring pipeline at a glance — candidates, activity, and open roles.</div>
          </div>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
            {PIPELINE.map(p => (
              <div key={p.stage} style={{ ...GLASS, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: p.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{p.stage}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#0F172A' }}>{p.count}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{p.change}</div>
              </div>
            ))}
          </div>

          {/* Main content */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
            {/* Left — Activity + Open Roles */}
            <div style={{ display: 'grid', gap: 16 }}>
              {/* Recent Activity */}
              <div style={{ ...GLASS }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontWeight: 900, fontSize: 16, color: ORANGE, ...ORANGE_LIFT }}>Live Activity</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', boxShadow: '0 0 0 3px rgba(22,163,74,0.2)' }} />
                    <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 700 }}>Live</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {RECENT_ACTIVITY.map((a, i) => (
                    <div key={i} style={{ ...WHITE_CARD, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,112,67,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{a.avatar}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: '#0F172A', fontWeight: 600 }}>{a.text}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{a.time}</div>
                      </div>
                      {a.score && <div style={{ fontWeight: 900, fontSize: 15, color: a.score >= 90 ? '#16A34A' : '#D97706', flexShrink: 0 }}>{a.score}<span style={{ fontSize: 9, color: '#94A3B8' }}>/100</span></div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Open Roles */}
              <div style={{ ...GLASS }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontWeight: 900, fontSize: 16, color: ORANGE, ...ORANGE_LIFT }}>Open Roles</div>
                  <Link href="#" style={{ fontSize: 12, color: ORANGE, fontWeight: 700, textDecoration: 'none' }}>Manage postings →</Link>
                </div>
                <div style={{ ...WHITE_CARD, padding: 0, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px 80px 80px', gap: 12, padding: '8px 14px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    {['Role', 'Total', 'New', 'Days Open', 'Status'].map(h => <div key={h} style={{ fontSize: 10, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>)}
                  </div>
                  {OPEN_ROLES.map((role, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 60px 80px 80px', gap: 12, padding: '12px 14px', borderBottom: i < OPEN_ROLES.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none', alignItems: 'center', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{role.title}</div>
                      <div style={{ fontSize: 13, color: '#334155' }}>{role.candidates}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: ORANGE }}>+{role.new}</div>
                      <div style={{ fontSize: 13, color: role.days > 45 ? '#DC2626' : '#64748B' }}>{role.days}d</div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: role.status === 'attention' ? 'rgba(220,38,38,0.1)' : 'rgba(22,163,74,0.1)', color: role.status === 'attention' ? '#DC2626' : '#16A34A' }}>
                        {role.status === 'attention' ? '⚠ Attention' : '● Active'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right panel */}
            <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
              <div style={{ ...GLASS }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', marginBottom: 12 }}>Quick Actions</div>
                {[['🔍 Search Candidates', '/demo/recruiter-search'], ['👥 Candidate Center', '/demo/recruiter-candidate-center'], ['🏊 Talent Pools', '/demo/recruiter-pools'], ['📊 Full Analytics', '/demo/recruiter-analytics'], ['📅 Calendar', '#'], ['✉️ Messages', '#']].map(([label, href]) => (
                  <Link key={label} href={href} style={{ display: 'block', textDecoration: 'none', marginBottom: 8 }}>
                    <div style={{ ...WHITE_CARD, fontSize: 13, fontWeight: 700, color: '#334155', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {label} <span style={{ color: ORANGE }}>→</span>
                    </div>
                  </Link>
                ))}
              </div>

              <div style={{ ...GLASS }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', marginBottom: 12 }}>This Week</div>
                {[['New Applications', '34'], ['Messages Sent', '12'], ['Interviews Scheduled', '5'], ['Offers Extended', '1'], ['Avg WHY Score', '87/100']].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: 12, color: '#64748B' }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{val}</div>
                  </div>
                ))}
              </div>

              <div style={{ ...GLASS, background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)' }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#DC2626', marginBottom: 8 }}>⚠ Needs Attention</div>
                <div style={{ fontSize: 12, color: '#7F1D1D', marginBottom: 6 }}>• Director of Sales — open 47 days, past fill benchmark</div>
                <div style={{ fontSize: 12, color: '#7F1D1D' }}>• 3 candidates awaiting your response for 5+ days</div>
              </div>
            </div>
          </div>
        </div>
      </RecruiterLayout>
    </>
  );
}
