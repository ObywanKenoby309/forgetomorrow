// pages/demo/coaching-analytics.js
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';

const ORANGE = '#FF7043';
const GLASS = { background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 10px 28px rgba(15,23,42,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 18, padding: 16 };
const WHITE_CARD = { background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: 14 };
const ORANGE_LIFT = { textShadow: '0 2px 4px rgba(15,23,42,0.65)', fontWeight: 900 };

const SESSION_DATA = [
  { month: 'Jan', sessions: 8, hours: 8.5 },
  { month: 'Feb', sessions: 11, hours: 11.75 },
  { month: 'Mar', sessions: 14, hours: 15.0 },
  { month: 'Apr', sessions: 12, hours: 12.5 },
  { month: 'May', sessions: 16, hours: 17.25 },
  { month: 'Jun', sessions: 18, hours: 19.5 },
];

const OUTCOME_DATA = [
  { client: 'Sarah M.', goal: 'New Role', outcome: 'Offer received', sessions: 8, rating: 5.0 },
  { client: 'Marcus T.', goal: 'Raise', outcome: 'In progress', sessions: 5, rating: 4.7 },
  { client: 'Jennifer P.', goal: 'Career Pivot', outcome: '2 offers in hand', sessions: 12, rating: 5.0 },
  { client: 'David C.', goal: 'Promotion', outcome: 'Interview stage', sessions: 3, rating: 4.8 },
  { client: 'Alex R.', goal: 'Reentry', outcome: '3 interviews', sessions: 6, rating: 4.6 },
];

const RADAR_DATA = [
  { subject: 'Resume', score: 92 },
  { subject: 'Interviews', score: 87 },
  { subject: 'Negotiation', score: 78 },
  { subject: 'Networking', score: 83 },
  { subject: 'Strategy', score: 95 },
  { subject: 'Mindset', score: 89 },
];

export default function DemoCoachingAnalytics() {
  const [period, setPeriod] = useState('6M');

  return (
    <>
      <Head><title>Coaching Analytics — ForgeTomorrow</title></Head>
      <CoachingLayout>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ ...GLASS, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: ORANGE, fontStyle: 'italic' }}>Coaching Analytics</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Track session volume, client outcomes, and your coaching impact over time.</div>
          </div>

          {/* Period filter */}
          <div style={{ display: 'flex', gap: 8 }}>
            {['1M', '3M', '6M', 'YTD', 'All'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{ padding: '7px 18px', borderRadius: 999, border: period === p ? 'none' : '1px solid rgba(0,0,0,0.12)', background: period === p ? ORANGE : 'transparent', color: period === p ? '#fff' : '#64748B', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{p}</button>
            ))}
          </div>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
            {[['Total Sessions', '79', '↑ 24%'], ['Total Hours', '84.5', '↑ 18%'], ['Active Clients', '4', '—'], ['Avg Rating', '4.82/5', '↑ 0.3'], ['Outcomes', '3/5', '60% success']].map(([label, val, change]) => (
              <div key={label} style={{ ...GLASS, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: ORANGE, marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A' }}>{val}</div>
                <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 700, marginTop: 4 }}>{change}</div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ ...GLASS }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: ORANGE, marginBottom: 12, ...ORANGE_LIFT }}>Sessions Over Time</div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={SESSION_DATA}>
                  <defs>
                    <linearGradient id="sessGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ORANGE} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="sessions" stroke={ORANGE} fill="url(#sessGrad)" strokeWidth={2} dot={{ r: 4 }} name="Sessions" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ ...GLASS }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: ORANGE, marginBottom: 12, ...ORANGE_LIFT }}>Coaching Focus Areas</div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={RADAR_DATA}>
                  <PolarGrid stroke="rgba(0,0,0,0.08)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <Radar name="Score" dataKey="score" stroke={ORANGE} fill={ORANGE} fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Client Outcomes */}
          <div style={{ ...GLASS }}>
            <div style={{ fontWeight: 900, fontSize: 16, color: ORANGE, marginBottom: 14, ...ORANGE_LIFT }}>Client Outcomes</div>
            <div style={{ ...WHITE_CARD, padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px 80px 80px', gap: 12, padding: '8px 16px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                {['Client', 'Goal', 'Outcome', 'Sessions', 'Rating'].map(h => <div key={h} style={{ fontSize: 10, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>)}
              </div>
              {OUTCOME_DATA.map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px 80px 80px', gap: 12, padding: '12px 16px', borderBottom: i < OUTCOME_DATA.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none', alignItems: 'center', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{row.client}</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{row.goal}</div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: row.outcome.includes('offer') || row.outcome.includes('Offer') ? 'rgba(22,163,74,0.1)' : row.outcome.includes('progress') ? 'rgba(217,119,6,0.1)' : 'rgba(255,112,67,0.1)', color: row.outcome.includes('offer') || row.outcome.includes('Offer') ? '#16A34A' : row.outcome.includes('progress') ? '#D97706' : ORANGE }}>
                      {row.outcome}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#334155' }}>{row.sessions}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#D97706' }}>⭐ {row.rating}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hours breakdown */}
          <div style={{ ...GLASS }}>
            <div style={{ fontWeight: 900, fontSize: 16, color: ORANGE, marginBottom: 12, ...ORANGE_LIFT }}>Hours by Session Type</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={[{ type: 'Strategy', hours: 31 }, { type: 'Resume', hours: 18 }, { type: 'Interview', hours: 14 }, { type: 'Negotiation', hours: 11 }, { type: 'Follow-Up', hours: 10.5 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="hours" fill={ORANGE} radius={[4, 4, 0, 0]} name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CoachingLayout>
    </>
  );
}
