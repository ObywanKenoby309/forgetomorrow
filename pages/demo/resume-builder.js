// pages/demo/resume-builder.js
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const ORANGE = '#FF7043';
const GLASS = { background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 10px 28px rgba(15,23,42,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 18, padding: 16 };
const WHITE_CARD = { background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: 14 };

const SECTIONS = ['Contact Info', 'Summary', 'Work Experience', 'Skills', 'Education', 'Certifications', 'Projects'];

const RESUME_DATA = {
  name: 'Eric James',
  title: 'Founder & Chief Executive Officer',
  email: 'eric@forgetomorrow.com',
  location: 'Nashville, TN',
  summary: 'Visionary technology founder with 15+ years building high-growth SaaS platforms. Architect of ForgeTomorrow — the industry\'s first triple-sided career intelligence platform. Deep expertise in AI/ML product strategy, human-centered design, and organizational leadership.',
  experience: [
    { title: 'Founder & CEO', company: 'ForgeTomorrow', dates: '2024 – Present', bullets: ['Architected and launched a 51-surface career intelligence platform in under 5 months', 'Built dual-sided marketplace connecting job seekers, recruiters, and career coaches', 'Developed proprietary WHY engine delivering explainable AI-powered candidate matching'] },
    { title: 'VP of Product', company: 'TechCorp Inc.', dates: '2020 – 2024', bullets: ['Led 12-person product org across 3 flagship enterprise SaaS products', 'Drove ARR from $8M to $47M through strategic roadmap execution', 'Launched AI-powered workflow automation reducing customer onboarding time by 60%'] },
  ],
  skills: ['Product Strategy', 'AI/ML Product', 'Go-to-Market', 'Team Leadership', 'Next.js', 'PostgreSQL', 'Prisma', 'Python'],
};

export default function DemoResumeBuilder() {
  const [activeSection, setActiveSection] = useState('Work Experience');
  const [atsScore, setAtsScore] = useState(87);

  return (
    <>
      <Head><title>Resume Builder — ForgeTomorrow</title></Head>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #FF7043 0%, #FF8A65 50%, #334155 100%)', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ background: 'rgba(15,23,42,0.95)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="#" style={{ color: '#FF7043', fontWeight: 900, fontSize: 16, textDecoration: 'none' }}>← ForgeTomorrow</Link>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Resume Builder</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 999, padding: '6px 14px' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>ATS Score</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: atsScore >= 80 ? '#4ADE80' : '#FBBF24' }}>{atsScore}%</div>
            </div>
            <button style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 999, padding: '8px 18px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Export PDF</button>
            <button style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 999, padding: '8px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Save Draft</button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '220px 1fr 420px', gap: 0, overflow: 'hidden' }}>
          {/* Section nav */}
          <div style={{ background: 'rgba(15,23,42,0.92)', borderRight: '1px solid rgba(255,255,255,0.08)', padding: '16px 0', overflowY: 'auto' }}>
            <div style={{ padding: '0 16px 12px', fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sections</div>
            {SECTIONS.map(s => (
              <div key={s} onClick={() => setActiveSection(s)}
                style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 13, fontWeight: activeSection === s ? 700 : 500, color: activeSection === s ? '#FF7043' : 'rgba(255,255,255,0.65)', background: activeSection === s ? 'rgba(255,112,67,0.12)' : 'transparent', borderLeft: activeSection === s ? `3px solid ${ORANGE}` : '3px solid transparent' }}>
                {s}
              </div>
            ))}
            <div style={{ padding: '16px 16px 0', borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 12 }}>
              <button style={{ width: '100%', background: 'rgba(255,112,67,0.15)', color: ORANGE, border: '1px dashed rgba(255,112,67,0.4)', borderRadius: 8, padding: '8px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>+ Add Section</button>
            </div>
          </div>

          {/* Editor */}
          <div style={{ padding: 24, overflowY: 'auto', background: 'rgba(15,23,42,0.6)' }}>
            <div style={{ ...GLASS, marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#0F172A', marginBottom: 14 }}>{activeSection}</div>

              {activeSection === 'Work Experience' && RESUME_DATA.experience.map((exp, i) => (
                <div key={i} style={{ ...WHITE_CARD, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <input defaultValue={exp.title} style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', border: 'none', outline: 'none', background: 'transparent', width: '100%' }} />
                      <input defaultValue={exp.company} style={{ fontSize: 13, color: '#64748B', border: 'none', outline: 'none', background: 'transparent' }} />
                    </div>
                    <input defaultValue={exp.dates} style={{ fontSize: 12, color: '#94A3B8', border: 'none', outline: 'none', background: 'transparent', textAlign: 'right' }} />
                  </div>
                  {exp.bullets.map((b, j) => (
                    <div key={j} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                      <span style={{ color: ORANGE, flexShrink: 0, marginTop: 2 }}>•</span>
                      <textarea defaultValue={b} style={{ flex: 1, fontSize: 12, color: '#334155', border: 'none', outline: 'none', background: 'transparent', resize: 'none', lineHeight: 1.5, fontFamily: 'inherit' }} rows={2} />
                    </div>
                  ))}
                  <button style={{ fontSize: 11, color: ORANGE, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, marginTop: 4 }}>+ Add bullet</button>
                </div>
              ))}

              {activeSection === 'Summary' && (
                <textarea defaultValue={RESUME_DATA.summary} style={{ width: '100%', minHeight: 120, border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10, padding: 12, fontSize: 13, color: '#334155', lineHeight: 1.65, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
              )}

              {activeSection === 'Skills' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {RESUME_DATA.skills.map(s => (
                    <span key={s} style={{ fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 999, background: 'rgba(255,112,67,0.1)', color: ORANGE, border: '1px solid rgba(255,112,67,0.25)' }}>{s} ×</span>
                  ))}
                  <button style={{ fontSize: 12, padding: '6px 14px', borderRadius: 999, border: '1px dashed rgba(0,0,0,0.2)', color: '#64748B', background: 'none', cursor: 'pointer' }}>+ Add skill</button>
                </div>
              )}

              {!['Work Experience', 'Summary', 'Skills'].includes(activeSection) && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8', fontSize: 13 }}>Click to add {activeSection.toLowerCase()} entries</div>
              )}
            </div>
          </div>

          {/* Live preview */}
          <div style={{ background: '#f8fafc', borderLeft: '1px solid rgba(0,0,0,0.1)', overflowY: 'auto', padding: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, textAlign: 'center' }}>Live Preview</div>
            <div style={{ background: '#fff', borderRadius: 8, padding: 28, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 12, color: '#0F172A', fontFamily: 'Georgia, serif' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #FF7043', paddingBottom: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>{RESUME_DATA.name}</div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{RESUME_DATA.title}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{RESUME_DATA.email} · {RESUME_DATA.location}</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: ORANGE, marginBottom: 6 }}>Summary</div>
              <div style={{ fontSize: 11, color: '#334155', lineHeight: 1.6, marginBottom: 14 }}>{RESUME_DATA.summary}</div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: ORANGE, marginBottom: 8 }}>Experience</div>
              {RESUME_DATA.experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>{exp.title}</div>
                    <div style={{ fontSize: 10, color: '#94A3B8' }}>{exp.dates}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>{exp.company}</div>
                  {exp.bullets.map((b, j) => <div key={j} style={{ fontSize: 10, color: '#475569', marginBottom: 3, paddingLeft: 10, position: 'relative' }}>• {b}</div>)}
                </div>
              ))}
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: ORANGE, marginBottom: 6 }}>Skills</div>
              <div style={{ fontSize: 10, color: '#475569' }}>{RESUME_DATA.skills.join(' · ')}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
