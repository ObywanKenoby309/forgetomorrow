// pages/demo/profile-analytics.js
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ORANGE = '#FF7043';
const GLASS = { background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 10px 28px rgba(15,23,42,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 18, padding: 16 };
const WHITE_CARD = { background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: 12 };
const CHART_WRAP = { background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12 };

const VIEWS_DATA = [
  { week: 'W1', views: 18 }, { week: 'W2', views: 24 }, { week: 'W3', views: 31 },
  { week: 'W4', views: 28 }, { week: 'W5', views: 42 }, { week: 'W6', views: 47 },
  { week: 'W7', views: 53 }, { week: 'W8', views: 61 },
];

const SEARCH_DATA = [
  { week: 'W1', appearances: 82 }, { week: 'W2', appearances: 95 }, { week: 'W3', appearances: 110 },
  { week: 'W4', appearances: 104 }, { week: 'W5', appearances: 138 }, { week: 'W6', appearances: 152 },
  { week: 'W7', appearances: 167 }, { week: 'W8', appearances: 189 },
];

const RECENT_VIEWERS = [
  { name: 'Jessica Chen', role: 'Senior Recruiter at Stripe', time: '2 hours ago', avatar: '👩‍💼' },
  { name: 'Marcus Webb', role: 'Talent Lead at Airbnb', time: '5 hours ago', avatar: '🧑‍💼' },
  { name: 'Sarah Park', role: 'HR Director at Anthropic', time: 'Yesterday', avatar: '👩' },
  { name: 'David Kim', role: 'Recruiter at Notion', time: '2 days ago', avatar: '🧑' },
];

export default function DemoProfileAnalytics() {
  const [period, setPeriod] = useState('30D');

  return (
    <>
      <Head><title>Profile Analytics — ForgeTomorrow</title></Head>
      <SeekerLayout header={
        <div style={{ ...GLASS, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: ORANGE, fontStyle: 'italic' }}>Profile Analytics</div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Track who's viewing your profile, how you appear in search, and how your signal is performing.</div>
        </div>
      }>
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Period filter */}
          <div style={{ display: 'flex', gap: 8 }}>
            {['7D', '30D', '90D', 'YTD'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{ padding: '7px 18px', borderRadius: 999, border: period === p ? 'none' : '1px solid rgba(0,0,0,0.12)', background: period === p ? ORANGE : 'transparent', color: period === p ? '#fff' : '#64748B', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{p}</button>
            ))}
          </div>

          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[['Profile Views', '304', '+28%'], ['Search Appearances', '1,247', '+41%'], ['Connection Requests', '18', '+12%'], ['Message Requests', '7', '+3%']].map(([label, val, change]) => (
              <div key={label} style={{ ...GLASS }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: ORANGE, marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A' }}>{val}</div>
                <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 700, marginTop: 4 }}>{change} this period</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ ...GLASS }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: ORANGE, marginBottom: 12 }}>Profile Views</div>
              <div style={{ ...CHART_WRAP }}>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={VIEWS_DATA}>
                    <defs>
                      <linearGradient id="viewGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={ORANGE} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="views" stroke={ORANGE} fill="url(#viewGrad)" strokeWidth={2} dot={{ r: 3 }} name="Views" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ ...GLASS }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: ORANGE, marginBottom: 12 }}>Search Appearances</div>
              <div style={{ ...CHART_WRAP }}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={SEARCH_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <Tooltip />
                    <Bar dataKey="appearances" fill={ORANGE} radius={[4, 4, 0, 0]} name="Appearances" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent viewers + strength */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
            <div style={{ ...GLASS }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: ORANGE, marginBottom: 14 }}>Recent Viewers</div>
              <div style={{ ...WHITE_CARD }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px', gap: 12, marginBottom: 10, padding: '0 4px' }}>
                  {['Viewer', 'Company', 'Time'].map(h => <div key={h} style={{ fontSize: 10, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>)}
                </div>
                {RECENT_VIEWERS.map((v, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px', gap: 12, padding: '10px 4px', borderTop: '1px solid rgba(0,0,0,0.05)', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,112,67,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{v.avatar}</div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{v.name}</div>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{v.role.split(' at ')[1]}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{v.time}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...GLASS }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: ORANGE, marginBottom: 14 }}>Signal Strength</div>
              {[['Professional Signal', 92, '#16A34A'], ['Search Visibility', 84, '#16A34A'], ['Keyword Density', 78, '#D97706'], ['Recruiter Appeal', 88, '#16A34A'], ['Network Reach', 71, '#D97706']].map(([label, score, color]) => (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontSize: 12, color: '#334155' }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color }}>{score}%</div>
                  </div>
                  <div style={{ height: 5, background: 'rgba(0,0,0,0.06)', borderRadius: 999 }}>
                    <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
              <Link href="#" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 12, color: ORANGE, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,112,67,0.3)', borderRadius: 999, padding: '7px' }}>Full Profile Strength Report →</Link>
            </div>
          </div>
        </div>
      </SeekerLayout>
    </>
  );
}
