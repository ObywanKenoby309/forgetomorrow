// pages/demo/profile-strength.js
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import SeekerLayout from '@/components/layouts/SeekerLayout';

const ORANGE = '#FF7043';
const GLASS = { background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 10px 28px rgba(15,23,42,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 18, padding: 16 };
const WHITE_CARD = { background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: 14 };

const DIMENSIONS = [
  { label: 'Professional Signal', score: 92, status: 'Strong', color: '#16A34A', desc: 'Your title, tenure, and progression tell a clear upward story. Recruiters can quickly identify your seniority level.', tips: ['Add 2 more quantified achievements to your most recent role', 'Ensure your current title matches market-standard terminology'] },
  { label: 'Execution Visibility', score: 88, status: 'Strong', color: '#16A34A', desc: 'Your profile shows concrete evidence of shipping and delivering outcomes, not just responsibilities.', tips: ['Add metrics to your 3rd and 4th bullet points in current role', 'Consider adding a "Results" section to your portfolio'] },
  { label: 'Validation Risk', score: 76, status: 'Moderate', color: '#D97706', desc: 'Some claims in your profile lack supporting evidence. Recruiters may hesitate without third-party validation.', tips: ['Add 1–2 certifications or courses to support your AI/ML claims', 'Request a recommendation from a recent manager or peer'] },
  { label: 'Portfolio Depth', score: 84, status: 'Strong', color: '#16A34A', desc: 'You have solid project evidence attached to your profile. The quality and specificity of your case studies is above average.', tips: ['Add outcome metrics to your ForgeTomorrow project description', 'Include a link to a live demo or case study document'] },
  { label: 'Resume Access', score: 100, status: 'Available', color: '#16A34A', desc: 'Your primary resume is attached, public, and ATS-optimized. Recruiters can access it with one click.', tips: [] },
  { label: 'Keyword Alignment', score: 71, status: 'Needs Work', color: '#DC2626', desc: 'Your profile is missing several high-value keywords that recruiters in your target market search for frequently.', tips: ['Add "Product-Led Growth" to your skills or summary', 'Include "Cross-functional leadership" in your experience bullets', 'Add "OKRs" and "roadmap prioritization" to your summary'] },
];

const RECRUITER_QUESTIONS = [
  'What does this person actually ship? I need proof of delivery.',
  'Are they a strategic thinker or a feature factory?',
  'Can they lead without authority across engineering and design?',
  'Why are they looking? Is this a step up or a lateral escape?',
];

export default function DemoProfileStrength() {
  const [expanded, setExpanded] = useState('Keyword Alignment');
  const overall = Math.round(DIMENSIONS.reduce((s, d) => s + d.score, 0) / DIMENSIONS.length);

  return (
    <>
      <Head><title>Profile Strength — ForgeTomorrow</title></Head>
      <SeekerLayout header={
        <div style={{ ...GLASS }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: ORANGE, fontStyle: 'italic', marginBottom: 4 }}>Profile Strength</div>
              <div style={{ fontSize: 13, color: '#64748B' }}>See your profile through a recruiter's eyes — understand what's working, what's missing, and how to fix it.</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 52, fontWeight: 900, color: overall >= 85 ? '#16A34A' : overall >= 70 ? '#D97706' : '#DC2626', lineHeight: 1 }}>{overall}</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Overall Score</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', marginTop: 2 }}>Strong</div>
            </div>
          </div>

          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginTop: 16 }}>
            {DIMENSIONS.map(d => (
              <div key={d.label} style={{ ...WHITE_CARD, textAlign: 'center', borderColor: `${d.color}33`, cursor: 'pointer' }} onClick={() => setExpanded(d.label)}>
                <div style={{ fontSize: 10, fontWeight: 800, color: d.color, marginBottom: 4, lineHeight: 1.2 }}>{d.label}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: d.color }}>{d.status}</div>
              </div>
            ))}
          </div>
        </div>
      }>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
          {/* Dimension breakdown */}
          <div style={{ display: 'grid', gap: 10 }}>
            {DIMENSIONS.map(d => (
              <div key={d.label} style={{ ...GLASS, cursor: 'pointer', border: expanded === d.label ? `2px solid ${d.color}` : '1px solid rgba(0,0,0,0.08)' }} onClick={() => setExpanded(expanded === d.label ? null : d.label)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>{d.label}</div>
                      <div style={{ fontWeight: 900, fontSize: 18, color: d.color }}>{d.score}<span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>/100</span></div>
                    </div>
                    <div style={{ height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 999 }}>
                      <div style={{ height: '100%', width: `${d.score}%`, background: d.color, borderRadius: 999 }} />
                    </div>
                  </div>
                </div>

                {expanded === d.label && (
                  <div style={{ marginTop: 14, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 14 }}>
                    <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.65, marginBottom: d.tips.length > 0 ? 12 : 0 }}>{d.desc}</div>
                    {d.tips.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Recommended Actions</div>
                        {d.tips.map((tip, i) => (
                          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                            <span style={{ color: ORANGE, flexShrink: 0, fontWeight: 700 }}>→</span>
                            <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{tip}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right panel */}
          <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
            <div style={{ ...GLASS }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', marginBottom: 12 }}>Recruiter Lens 👁</div>
              <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6, marginBottom: 12 }}>Questions a recruiter asks when they land on your profile:</div>
              {RECRUITER_QUESTIONS.map((q, i) => (
                <div key={i} style={{ ...WHITE_CARD, marginBottom: 8, fontSize: 12, color: '#334155', lineHeight: 1.55, borderLeft: `3px solid ${ORANGE}` }}>
                  "{q}"
                </div>
              ))}
            </div>

            <div style={{ ...GLASS }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', marginBottom: 12 }}>Quick Actions</div>
              {[['Edit Profile', '/profile'], ['Update Resume', '/resume/create'], ['Add Certifications', '/profile'], ['View Analytics', '/demo/profile-analytics']].map(([label, href]) => (
                <Link key={label} href={href} style={{ display: 'block', textDecoration: 'none', marginBottom: 8 }}>
                  <div style={{ ...WHITE_CARD, fontSize: 13, fontWeight: 700, color: ORANGE, cursor: 'pointer' }}>→ {label}</div>
                </Link>
              ))}
            </div>

            <div style={{ ...GLASS, background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#15803D', marginBottom: 8 }}>✅ What's Working</div>
              {['Clear upward career progression', 'Strong quantified achievements', 'Primary resume attached and ATS-ready', 'Portfolio projects with live links'].map((item, i) => (
                <div key={i} style={{ fontSize: 12, color: '#166534', marginBottom: 5 }}>• {item}</div>
              ))}
            </div>
          </div>
        </div>
      </SeekerLayout>
    </>
  );
}
