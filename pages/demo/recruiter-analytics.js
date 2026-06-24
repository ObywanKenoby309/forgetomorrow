// pages/demo/recruiter-analytics.js
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ORANGE = '#FF7043';
const GLASS = { background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 10px 28px rgba(15,23,42,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 18, padding: 16 };
const WHITE_CARD = { background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: 14 };
const ORANGE_LIFT = { textShadow: '0 2px 4px rgba(15,23,42,0.65)', fontWeight: 900 };

const ACTIVITY_DATA = [
  { week: 'W1', applications: 61, interviews: 12 },
  { week: 'W2', applications: 70, interviews: 16 },
  { week: 'W3', applications: 84, interviews: 19 },
  { week: 'W4', applications: 78, interviews: 17 },
  { week: 'W5', applications: 91, interviews: 21 },
  { week: 'W6', applications: 99, interviews: 24 },
  { week: 'W7', applications: 108, interviews: 26 },
  { week: 'W8', applications: 124, interviews: 30 },
];

const FUNNEL_DATA = [
  { stage: 'Views', count: 12458 },
  { stage: 'Applies', count: 842 },
  { stage: 'Screened', count: 312 },
  { stage: 'Interviews', count: 126 },
  { stage: 'Offers', count: 28 },
  { stage: 'Hires', count: 18 },
];

const SOURCE_DATA = [
  { name: 'Forge', value: 48 },
  { name: 'LinkedIn', value: 22 },
  { name: 'Referral', value: 16 },
  { name: 'Indeed', value: 9 },
  { name: 'Other', value: 5 },
];

const INSIGHTS = [
  { type: 'attention', title: '2 roles past fill benchmark', body: '"Senior PM" and "VP Engineering" have been open more than 45 days. Review pipeline health or consider broadening requirements.' },
  { type: 'roadmap', title: 'Source data building', body: 'No applications have been tagged in this window yet. Source performance will appear here as candidates come in.' },
  { type: 'live', title: 'Quality of hire trending up', body: 'Average WHY score for hired candidates increased from 81 to 89 over the past 30 days. Your targeting is improving.' },
  { type: 'live', title: 'Forge outperforming all channels', body: 'Forge-sourced candidates are converting at 3.2x the rate of LinkedIn. Consider shifting budget allocation.' },
];

const INSIGHT_CFG = {
  live: { badge: 'Live', bg: 'rgba(255,112,67,0.1)', color: ORANGE, dot: ORANGE },
  attention: { badge: 'Attention', bg: 'rgba(220,38,38,0.1)', color: '#DC2626', dot: '#DC2626' },
  roadmap: { badge: 'Building', bg: 'rgba(15,118,110,0.1)', color: '#0F766E', dot: '#0F766E' },
};

const SNAP_TILES = [
  { label: 'Top source', value: 'Forge', hint: 'Best-performing inbound channel' },
  { label: 'Offer acceptance', value: '81%', hint: 'Close efficiency signal' },
  { label: 'Apply-to-hire', value: '2.1%', hint: 'Applications converting into hires' },
];

export default function DemoRecruiterAnalytics() {
  const [snapIdx, setSnapIdx] = useState(0);
  const [period, setPeriod] = useState('30D');

  useEffect(() => {
    const t = setInterval(() => setSnapIdx(p => (p + 1) % SNAP_TILES.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <Head><title>Recruiter Analytics — ForgeTomorrow</title></Head>
      <RecruiterLayout>
        <div style={{ display: 'grid', gap: 14 }}>
          {/* Filter bar */}
          <div style={{ ...GLASS, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['7D', '30D', '90D', 'YTD', 'CUSTOM'].map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  style={{ padding: '6px 14px', borderRadius: 999, border: period === p ? 'none' : '1px solid rgba(0,0,0,0.12)', background: period === p ? ORANGE : 'transparent', color: period === p ? '#fff' : '#64748B', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>{p}</button>
              ))}
            </div>
            <div style={{ flex: 1 }} />
            <select style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, padding: '6px 12px', fontSize: 12, outline: 'none' }}><option>All Jobs</option></select>
            <select style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, padding: '6px 12px', fontSize: 12, outline: 'none' }}><option>All Recruiters</option></select>
            <button style={{ background: 'none', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#334155' }}>Export CSV</button>
          </div>

          {/* KPI strip */}
          <div style={{ ...GLASS, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 12 }}>
              {[['Total job views', '12,458'], ['Total applies', '842'], ['Conversion rate', '6.8%'], ['Avg. time-to-fill', '24 days'], ['Interviews', '126'], ['Hires', '18']].map(([label, val]) => (
                <div key={label} style={{ ...WHITE_CARD }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: ORANGE, marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top row — Exec Snapshot + Activity + Forge Insights */}
          <div style={{ display: 'grid', gridTemplateColumns: '240px minmax(0,2fr) 240px', gap: 12, marginLeft: -(240+12), marginRight: -(240+12), marginTop: -8, position: 'relative', zIndex: 0 }}>
            {/* Executive Snapshot */}
            <div style={{ ...GLASS, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#1E293B' }}>Executive Snapshot</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Source quality, interview flow, and close efficiency.</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[['Details', false, true], ['Visuals', false, false], ['Send', true, false]].map(([label, primary, orange]) => (
                  <button key={label} style={{ fontSize: 11, fontWeight: 800, padding: '5px 12px', borderRadius: 999, border: primary ? 'none' : orange ? '1px solid rgba(255,112,67,0.4)' : '1px solid rgba(0,0,0,0.12)', background: primary ? ORANGE : orange ? 'rgba(255,112,67,0.1)' : 'rgba(0,0,0,0.05)', color: primary ? '#fff' : orange ? ORANGE : '#334155', cursor: 'pointer', fontFamily: 'inherit' }}>{label}</button>
                ))}
              </div>
              <div style={{ ...WHITE_CARD, flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{SNAP_TILES[snapIdx].label}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>{SNAP_TILES[snapIdx].value}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{SNAP_TILES[snapIdx].hint}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                {SNAP_TILES.map((_, i) => (
                  <button key={i} onClick={() => setSnapIdx(i)} style={{ width: i === snapIdx ? 20 : 6, height: 6, borderRadius: 999, background: i === snapIdx ? ORANGE : 'rgba(255,112,67,0.25)', border: 'none', padding: 0, cursor: 'pointer', transition: 'width 220ms ease' }} />
                ))}
              </div>
            </div>

            {/* Recruiter Activity chart */}
            <div style={{ ...GLASS }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: ORANGE, ...ORANGE_LIFT }}>Recruiter Activity</div>
                <Link href="#" style={{ fontSize: 13, fontWeight: 800, color: ORANGE, textDecoration: 'none', ...ORANGE_LIFT }}>Full report →</Link>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={ACTIVITY_DATA}>
                  <defs>
                    <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ORANGE} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="intGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="applications" stroke={ORANGE} fill="url(#appGrad)" strokeWidth={2} dot={{ r: 3 }} name="Applications" />
                  <Area type="monotone" dataKey="interviews" stroke="#3B82F6" fill="url(#intGrad)" strokeWidth={2} dot={{ r: 3 }} name="Interviews" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Forge Insights */}
            <div style={{ ...GLASS, height: 420, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexShrink: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: ORANGE, ...ORANGE_LIFT }}>Forge Insights</div>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: ORANGE, boxShadow: '0 0 0 3px rgba(255,112,67,0.18)', display: 'inline-block' }} />
              </div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gap: 10, alignContent: 'start', scrollbarWidth: 'none' }}>
                {INSIGHTS.map((ins, i) => {
                  const cfg = INSIGHT_CFG[ins.type];
                  return (
                    <div key={i} style={{ ...WHITE_CARD }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot, flexShrink: 0, display: 'inline-block' }} />
                        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', background: cfg.bg, color: cfg.color, borderRadius: 6, padding: '2px 7px' }}>{cfg.badge}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#1E293B', flex: 1 }}>{ins.title}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.65 }}>{ins.body}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div style={{ display: 'grid', gridTemplateColumns: '280px minmax(0,1fr) 240px', gap: 12, marginLeft: -(240+12), marginRight: -(240+12) }}>
            {/* Source Performance */}
            <div style={{ ...GLASS }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: ORANGE, ...ORANGE_LIFT }}>Source Performance</div>
                <Link href="#" style={{ fontSize: 13, fontWeight: 800, color: ORANGE, textDecoration: 'none', ...ORANGE_LIFT }}>Full report →</Link>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={SOURCE_DATA} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={60} />
                  <Tooltip />
                  <Bar dataKey="value" fill={ORANGE} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Application Funnel */}
            <div style={{ ...GLASS }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: ORANGE, ...ORANGE_LIFT }}>Application Funnel</div>
                <Link href="#" style={{ fontSize: 13, fontWeight: 800, color: ORANGE, textDecoration: 'none', ...ORANGE_LIFT }}>Full report →</Link>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={FUNNEL_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={ORANGE} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Report Gateways */}
            <div style={{ ...GLASS, height: 400, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: ORANGE, marginBottom: 12, flexShrink: 0, ...ORANGE_LIFT }}>Report Gateways</div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gap: 10, alignContent: 'start', scrollbarWidth: 'none' }}>
                {[['Time-to-Fill', 'See which roles close fastest and where delays build.', '24 days'], ['Quality of Hire', 'Track post-hire quality signals once enough data exists.', 'Building'], ['Talent Intelligence', 'Compare source quality, match reasons, and role signals.', 'Forge']].map(([title, desc, val]) => (
                  <Link key={title} href="#" style={{ textDecoration: 'none' }}>
                    <div style={{ ...WHITE_CARD, minHeight: 110, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Full report</div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#0F172A' }}>{title}</div>
                        <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5, marginTop: 4 }}>{desc}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A' }}>{val}</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: ORANGE }}>Open report →</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </RecruiterLayout>
    </>
  );
}
