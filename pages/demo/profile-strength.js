// pages/demo/profile-strength.js
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import SeekerLayout from '@/components/layouts/SeekerLayout';

const ORANGE = '#FF7043';
const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};
const WHITE_CARD = {
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 12,
  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
};
const ORANGE_LIFT = {
  textShadow: '0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)',
  fontWeight: 900,
};

const DIMENSIONS = [
  { label: 'Professional Signal', score: 92, status: 'Strong',     color: '#16A34A', desc: 'Your title, tenure, and progression tell a clear upward story. Recruiters can quickly identify your seniority level.',                          tips: ['Add 2 more quantified achievements to your most recent role', 'Ensure your current title matches market-standard terminology'] },
  { label: 'Execution Visibility', score: 88, status: 'Strong',    color: '#16A34A', desc: 'Your profile shows concrete evidence of shipping and delivering outcomes, not just responsibilities.',                                           tips: ['Add metrics to your 3rd and 4th bullet points in current role', 'Consider adding a "Results" section to your portfolio'] },
  { label: 'Validation Risk',      score: 76, status: 'Moderate',  color: '#D97706', desc: 'Some claims in your profile lack supporting evidence. Recruiters may hesitate without third-party validation.',                                  tips: ['Add 1–2 certifications or courses to support your AI/ML claims', 'Request a recommendation from a recent manager or peer'] },
  { label: 'Portfolio Depth',      score: 84, status: 'Strong',    color: '#16A34A', desc: 'You have solid project evidence attached to your profile. The quality and specificity of your case studies is above average.',                  tips: ['Add outcome metrics to your ForgeTomorrow project description', 'Include a link to a live demo or case study document'] },
  { label: 'Resume Access',        score: 100, status: 'Available', color: '#16A34A', desc: 'Your primary resume is attached, public, and ATS-optimized. Recruiters can access it with one click.',                                         tips: [] },
  { label: 'Keyword Alignment',    score: 71, status: 'Needs Work', color: '#DC2626', desc: 'Your profile is missing several high-value keywords that recruiters in your target market search for frequently.',                             tips: ['Add "Product-Led Growth" to your skills or summary', 'Include "Cross-functional leadership" in your experience bullets', 'Add "OKRs" and "roadmap prioritization" to your summary'] },
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
  const overallColor = overall >= 85 ? '#16A34A' : overall >= 70 ? '#D97706' : '#DC2626';
  const overallLabel = overall >= 85 ? 'Strong' : overall >= 70 ? 'Moderate' : 'Needs Work';

  return (
    <>
      <Head><title>Profile Strength — ForgeTomorrow</title></Head>
      <SeekerLayout activeNav="dashboard" contentFullBleed>
        <div style={{ display: 'grid', gap: 16 }}>

          {/* Title card — content area, not header prop */}
          <div style={{ ...GLASS, padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 26, fontWeight: 900, color: ORANGE, fontStyle: 'italic', lineHeight: 1.15, ...ORANGE_LIFT }}>Profile Strength</div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>See your profile through a recruiter's eyes — understand what's working, what's missing, and how to fix it.</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 24 }}>
                <div style={{ fontSize: 48, fontWeight: 900, color: overallColor, lineHeight: 1 }}>{overall}</div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Overall Score</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: overallColor, marginTop: 1 }}>{overallLabel}</div>
              </div>
            </div>

            {/* KPI strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
              {DIMENSIONS.map(d => (
                <div
                  key={d.label}
                  onClick={() => setExpanded(d.label)}
                  style={{ ...WHITE_CARD, padding: 12, textAlign: 'center', borderColor: `${d.color}33`, cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 10, fontWeight: 800, color: d.color, marginBottom: 4, lineHeight: 1.2 }}>{d.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: d.color }}>{d.status}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Main content: dimension list + right panel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>

            {/* Dimension breakdown */}
            <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
              {DIMENSIONS.map(d => (
                <div
                  key={d.label}
                  onClick={() => setExpanded(expanded === d.label ? null : d.label)}
                  style={{
                    ...GLASS,
                    padding: 16,
                    cursor: 'pointer',
                    border: expanded === d.label ? `2px solid ${d.color}` : '1px solid rgba(255,255,255,0.22)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{d.label}</div>
                    <div style={{ fontWeight: 900, fontSize: 18, color: d.color }}>
                      {d.score}<span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>/100</span>
                    </div>
                  </div>
                  <div style={{ height: 6, background: 'rgba(0,0,0,0.08)', borderRadius: 999 }}>
                    <div style={{ height: '100%', width: `${d.score}%`, background: d.color, borderRadius: 999 }} />
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

              {/* Recruiter Lens */}
              <div style={{ ...GLASS, padding: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', marginBottom: 6 }}>Recruiter Lens 👁</div>
                <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6, marginBottom: 12 }}>Questions a recruiter asks when they land on your profile:</div>
                {RECRUITER_QUESTIONS.map((q, i) => (
                  <div key={i} style={{ ...WHITE_CARD, padding: 10, marginBottom: 8, fontSize: 12, color: '#334155', lineHeight: 1.55 }}>
                    "{q}"
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div style={{ ...GLASS, padding: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', marginBottom: 12 }}>Quick Actions</div>
                {[['Edit Profile', '#'], ['Update Resume', '#'], ['Add Certifications', '#'], ['View Analytics', '/demo/profile-analytics']].map(([label, href]) => (
                  <Link key={label} href={href} style={{ display: 'block', textDecoration: 'none', marginBottom: 8 }}>
                    <div style={{ ...WHITE_CARD, padding: 12, fontSize: 13, fontWeight: 700, color: ORANGE, cursor: 'pointer' }}>→ {label}</div>
                  </Link>
                ))}
              </div>

              {/* What's Working */}
              <div style={{ ...GLASS, padding: 16, background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#15803D', marginBottom: 8 }}>✅ What's Working</div>
                {['Clear upward career progression', 'Strong quantified achievements', 'Primary resume attached and ATS-ready', 'Portfolio projects with live links'].map((item, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#166534', marginBottom: 5 }}>• {item}</div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </SeekerLayout>
    </>
  );
}