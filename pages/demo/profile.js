// pages/demo/profile.js
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const ORANGE = '#FF7043';
const GLASS = { background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 10px 28px rgba(15,23,42,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 18, padding: 20 };
const WHITE_CARD = { background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: 14 };

const PROFILE = {
  name: 'Eric James', title: 'Founder & CEO', company: 'ForgeTomorrow',
  location: 'Nashville, TN', connections: 847, views: 1240,
  about: 'Building the future of career intelligence. ForgeTomorrow is a triple-sided platform connecting job seekers, recruiters, and coaches through AI-powered career signals, explainable matching, and human-centered growth tools.\n\nI believe hiring is broken — for everyone. We\'re fixing it.',
  experience: [
    { title: 'Founder & CEO', company: 'ForgeTomorrow', dates: '2024 – Present', desc: 'Architected ForgeTomorrow — 51 product surfaces, triple-sided marketplace, AI career intelligence engine. Built largely solo with AI collaborators.' },
    { title: 'VP of Product', company: 'TechCorp Inc.', dates: '2020 – 2024', desc: 'Led product organization scaling ARR from $8M to $47M. Launched AI-powered workflow suite adopted by 2,000+ enterprise teams.' },
    { title: 'Director of Product', company: 'GrowthStack', dates: '2017 – 2020', desc: 'Built B2B SaaS analytics platform from 0 to $12M ARR. Managed cross-functional team of 18 across product, design, and engineering.' },
  ],
  skills: ['Product Strategy', 'AI/ML', 'Next.js', 'Go-to-Market', 'Team Leadership', 'PostgreSQL', 'B2B SaaS', 'Career Intelligence'],
  certifications: [{ name: 'AWS Solutions Architect', issuer: 'Amazon Web Services', date: '2023' }, { name: 'Pragmatic Product Management', issuer: 'Pragmatic Institute', date: '2021' }],
  projects: [{ name: 'ForgeTomorrow WHY Engine', desc: 'Proprietary explainable AI candidate matching system scoring 40+ dimensions of role alignment.' }, { name: 'ForgeHammer Resume Intelligence', desc: 'AI coaching engine that scores, diagnoses, and rewrites resumes against any target role.' }],
};

export default function DemoProfile() {
  const [tab, setTab] = useState('About');
  const TABS = ['About', 'Experience', 'Skills', 'Certifications', 'Projects'];

  return (
    <>
      <Head><title>{PROFILE.name} — ForgeTomorrow</title></Head>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #1E293B 0%, #334155 40%, #FF7043 100%)' }}>
        {/* Nav */}
        <div style={{ background: 'rgba(15,23,42,0.95)', padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: ORANGE }}>ForgeTomorrow</div>
          <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
            {['Dashboard', 'The Signal', 'Community Feed', 'Job Postings'].map(n => <span key={n} style={{ cursor: 'pointer' }}>{n}</span>)}
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👤</div>
        </div>

        <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
          <div style={{ display: 'grid', gap: 16 }}>
            {/* Header card */}
            <div style={{ ...GLASS, padding: 0, overflow: 'hidden' }}>
              {/* Banner */}
              <div style={{ height: 140, background: 'linear-gradient(135deg, #FF7043, #FF8A65, #334155)', position: 'relative' }}>
                <div style={{ position: 'absolute', bottom: -36, left: 24, width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,112,67,0.2)', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>👨‍💼</div>
              </div>
              <div style={{ padding: '48px 24px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A' }}>{PROFILE.name}</div>
                    <div style={{ fontSize: 15, color: '#475569', marginTop: 2 }}>{PROFILE.title} at {PROFILE.company}</div>
                    <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>📍 {PROFILE.location}</div>
                    <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
                      <span style={{ fontSize: 13, color: ORANGE, fontWeight: 700 }}>{PROFILE.connections} connections</span>
                      <span style={{ fontSize: 13, color: '#64748B' }}>{PROFILE.views} profile views this month</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 999, padding: '10px 20px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Connect</button>
                    <button style={{ background: 'none', border: `1px solid ${ORANGE}`, color: ORANGE, borderRadius: 999, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Message</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ ...GLASS, padding: 0 }}>
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.07)', padding: '0 20px' }}>
                {TABS.map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    style={{ padding: '14px 16px', fontWeight: tab === t ? 800 : 600, fontSize: 13, color: tab === t ? ORANGE : '#64748B', background: 'none', border: 'none', borderBottom: tab === t ? `2px solid ${ORANGE}` : '2px solid transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t}
                  </button>
                ))}
              </div>
              <div style={{ padding: 20 }}>
                {tab === 'About' && <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.75, whiteSpace: 'pre-line' }}>{PROFILE.about}</div>}
                {tab === 'Experience' && PROFILE.experience.map((e, i) => (
                  <div key={i} style={{ ...WHITE_CARD, marginBottom: 12 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>{e.title}</div>
                    <div style={{ fontSize: 13, color: ORANGE, fontWeight: 700 }}>{e.company}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 8 }}>{e.dates}</div>
                    <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{e.desc}</div>
                  </div>
                ))}
                {tab === 'Skills' && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>{PROFILE.skills.map(s => <span key={s} style={{ fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 999, background: 'rgba(255,112,67,0.1)', color: ORANGE, border: '1px solid rgba(255,112,67,0.25)' }}>{s}</span>)}</div>}
                {tab === 'Certifications' && PROFILE.certifications.map((c, i) => (
                  <div key={i} style={{ ...WHITE_CARD, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{c.issuer}</div>
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{c.date}</div>
                  </div>
                ))}
                {tab === 'Projects' && PROFILE.projects.map((p, i) => (
                  <div key={i} style={{ ...WHITE_CARD, marginBottom: 12 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', marginBottom: 6 }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{p.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right rail */}
          <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
            <div style={{ ...GLASS }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', marginBottom: 12 }}>Profile Strength</div>
              {[['Professional Signal', 92, '#16A34A'], ['Execution Visibility', 88, '#16A34A'], ['Portfolio Depth', 84, '#D97706'], ['Validation Risk', 78, '#D97706']].map(([label, score, color]) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <div style={{ fontSize: 12, color: '#334155' }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color }}>{score}%</div>
                  </div>
                  <div style={{ height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 999 }}>
                    <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ ...GLASS }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', marginBottom: 10 }}>Recent Viewers</div>
              {['👩‍💼 Sarah K. · Recruiter at Stripe', '🧑‍💼 Marcus W. · Talent Lead at Airbnb', '👩 Jennifer C. · HR at Anthropic'].map((v, i) => (
                <div key={i} style={{ fontSize: 12, color: '#475569', padding: '6px 0', borderBottom: i < 2 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>{v}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
