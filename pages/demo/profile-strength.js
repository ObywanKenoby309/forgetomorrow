// pages/demo/profile-strength.js
import React from 'react';
import Head from 'next/head';
import SeekerAnalyticsLayout from '@/components/layouts/SeekerAnalyticsLayout';

// ─── Design tokens (mirrors real page exactly) ────────────────────────────────
const ORANGE = '#FF7043';
const SLATE  = '#1E293B';
const MUTED  = '#475569';
const GAP    = 12;

const GLASS = {
  border: '1px solid rgba(0,0,0,0.08)',
  background: 'rgba(255,255,255,0.78)',
  boxShadow: '0 10px 28px rgba(15,23,42,0.12)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderRadius: 18,
};
const GLASS_SOFT = {
  border: '1px solid rgba(0,0,0,0.06)',
  background: 'rgba(255,255,255,0.88)',
  boxShadow: '0 8px 22px rgba(15,23,42,0.10)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  borderRadius: 12,
};
const ORANGE_LIFT = {
  textShadow: '0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)',
  fontWeight: 900,
};

// Bleed constants — match real profile-strength.js exactly
const LEFT_BLEED  = -(240 + 12);  // -252
const RIGHT_BLEED = -(240 + 12);  // -252

// ─── Demo data ────────────────────────────────────────────────────────────────
const PROVEN_COUNT = 8;

const RECRUITER_ASSESSMENT = `Delivery leadership exposure with project execution, requirements translation, change/process coordination, and stakeholder alignment indicators. The strongest visible story is Operations / process improvement, Service delivery, IT service management. I would be comfortable moving this profile into a serious fit conversation if the role matches the direction shown here. The main things I would still validate are project ownership and outcomes.`;

const STRONGEST_EVIDENCE = [
  '18 years experience',
  '30 direct reports',
  'Project evidence: ForgeTomorrow Career & Recruiting Platform',
  'Skill: Client Success Leadership',
  'Credential/training: ITIL V4 Foundations',
  'Project evidence: EWJ Innovations Technology Archive',
  'Skill: Customer Operations & Escalation Management',
  'Skill: Support Delivery & SLA Management',
];

const PROOF_PROJECTS = [
  { label: 'Project Evidence', title: 'ForgeTomorrow Career & Recruiting Platform' },
  { label: 'Project Evidence', title: 'EWJ Innovations Technology Archive' },
];

const STRENGTH_SIGNALS = [
  { label: 'Professional Signal',  value: 'Strong',    color: '#16A34A' },
  { label: 'Execution Visibility', value: 'Strong',    color: '#16A34A' },
  { label: 'Validation Risk',      value: 'Low',       color: '#16A34A' },
  { label: 'Portfolio Depth',      value: 'Strong',    color: '#16A34A' },
  { label: 'Resume Access',        value: 'Available', color: '#16A34A' },
];

const WHY_MATCH = {
  roleSignal: 'BEST-FIT ROLE SIGNAL',
  role: 'Director of Customer Success Operations',
  desc: 'Strong customer operations, service delivery, escalation, and support-leadership alignment.',
  signals: [
    '8 proven profile signals',
    'Primary resume evidence available',
    '2 portfolio projects listed',
    '1 credential/training signal',
    'Operations / process improvement',
    'Service delivery',
  ],
};

const PLACEMENT_ROLES = [
  { title: 'Director of Customer Success Operations', pct: 94, desc: 'Strong customer operations, service delivery, escalation, and support-leadership alignment.' },
  { title: 'Service Delivery Director',               pct: 91, desc: 'Visible delivery ownership, SLA/process discipline, and client-facing operations signals.' },
  { title: 'Customer Success Leader',                 pct: 88, desc: 'Customer relationship, adoption, retention, and operational support signals are present.' },
  { title: 'Operations Director',                     pct: 85, desc: 'Operational execution, process improvement, and cross-functional delivery signals are visible.' },
  { title: 'Business Operations Lead',                pct: 82, desc: 'Process, reporting, workflow, and execution evidence supports business operations fit.' },
];

const RECRUITER_QUESTIONS = [
  {
    question: 'Walk me through ForgeTomorrow Career & Recruiting Platform. What did you personally own, what changed, and what result can you point to?',
    context: 'Recruiters use project stories to separate participation from ownership. They are listening for scope, decisions, obstacles, and measurable outcome.',
  },
  {
    question: 'Walk me through EWJ Innovations Technology Archive. What did you personally own, what changed, and what result can you point to?',
    context: 'Recruiters use project stories to separate participation from ownership. They are listening for scope, decisions, obstacles, and measurable outcome.',
  },
  {
    question: 'Tell me about a project or process improvement you personally owned from problem identification through implementation.',
    context: 'This closes the biggest validation gap: direct ownership, stakeholder impact, and measurable outcome.',
  },
  {
    question: 'Which role direction are you most intentionally targeting next, and what evidence from your background supports that move?',
    context: 'Recruiters want to understand if the candidate has self-awareness about their positioning and transition story.',
  },
];

// ─── Recruiter Readiness carousel slides ─────────────────────────────────────
// ─── Right rail: Ad + Recruiter Readiness ────────────────────────────────────

function RecruiterReadinessCard() {
  return (
    <div style={{ ...GLASS, padding: 12 }}>
      <div style={{ fontSize: 15, color: ORANGE, marginBottom: 10, ...ORANGE_LIFT }}>Recruiter Readiness</div>

      {/* Score — always visible */}
      <div style={{ ...GLASS_SOFT, padding: 14, background: 'rgba(15,23,42,0.94)', textAlign: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 900, color: ORANGE, letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 4 }}>Overall Score</div>
        <div style={{ fontSize: 32, fontWeight: 900, color: 'white', lineHeight: 1 }}>100%</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.80)', marginTop: 4 }}>Strong</div>
      </div>

      {/* Scrolling detail cards */}
      <div style={{ overflowY: 'auto', maxHeight: 180, display: 'grid', gap: 8 }}>
        <div style={{ ...GLASS_SOFT, padding: '10px 12px', border: '1px solid rgba(22,163,74,0.22)', background: 'rgba(22,163,74,0.06)' }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: '#16A34A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Strengths</div>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#166534' }}>8 Proven Signals</div>
        </div>
        <div style={{ ...GLASS_SOFT, padding: '10px 12px' }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Biggest Risk</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: ORANGE }}>Project ownership and outcomes</div>
        </div>
        <div style={{ ...GLASS_SOFT, padding: '10px 12px' }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Recruiter Confidence</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#16A34A' }}>High</div>
        </div>
      </div>
    </div>
  );
}

function DemoRightRail() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
      {/* Ad — no glass, renders on wallpaper */}
      <img
        src="/ads/house/seeker-house-ad.png"
        alt="Advertise with ForgeTomorrow"
        style={{ width: '100%', borderRadius: 14, display: 'block' }}
      />
      <RecruiterReadinessCard />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DemoProfileStrength() {
  return (
    <>
      <Head><title>Profile Strength — ForgeTomorrow</title></Head>
      <SeekerAnalyticsLayout
        suiteTitle="Profile Strength"
        activeTab="overview"
        pageSubtitle="See how recruiters are likely to interpret your profile, evidence, and positioning."
        right={<DemoRightRail />}
      >
        <div style={{ display: 'grid', gap: GAP }}>

          {/* KPI strip */}
          <div style={{ ...GLASS, padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: GAP }}>
              {STRENGTH_SIGNALS.map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bleed row: Execution Proof (left) | Recruiter Lens Hero (center) */}
          <div style={{
            marginLeft: LEFT_BLEED,
            marginRight: RIGHT_BLEED,
            marginTop: 8,
            display: 'flex',
            alignItems: 'flex-end',
            gap: GAP,
            width: `calc(100% + ${Math.abs(LEFT_BLEED)}px + ${Math.abs(RIGHT_BLEED)}px)`,
            position: 'relative',
            zIndex: 2,
          }}>

            {/* Execution Proof — 240px, sits over left sidebar */}
            <div style={{ width: 240, flexShrink: 0 }}>
              <div style={{ ...GLASS, padding: 14, height: '100%', boxSizing: 'border-box' }}>
                <div style={{ fontSize: 18, color: ORANGE, marginBottom: 12, ...ORANGE_LIFT }}>Execution Proof</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {PROOF_PROJECTS.map((p, i) => (
                    <div key={i} style={{ ...GLASS_SOFT, padding: '10px 12px' }}>
                      <div style={{ fontSize: 9, fontWeight: 900, color: ORANGE, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{p.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: SLATE, lineHeight: 1.3 }}>{p.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recruiter Lens Hero — fills remaining space */}
            <div style={{ ...GLASS, padding: 20, flex: '1 1 auto', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: ORANGE, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Recruiter Lens</div>
                  <div style={{ fontSize: 22, color: ORANGE, fontWeight: 900, lineHeight: 1.2, ...ORANGE_LIFT }}>If We Were Recruiting You</div>
                </div>
                <div style={{ ...GLASS_SOFT, padding: '10px 14px', textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: ORANGE, lineHeight: 1 }}>{PROVEN_COUNT}</div>
                  <div style={{ fontSize: 9, fontWeight: 800, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Proven Signals</div>
                </div>
              </div>

              <div style={{ ...GLASS_SOFT, padding: 16, background: 'rgba(255,255,255,0.76)' }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: MUTED, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Recruiter Assessment</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: SLATE, lineHeight: 1.65, marginBottom: 14 }}>{RECRUITER_ASSESSMENT}</div>

                <div style={{ border: '1px solid rgba(255,112,67,0.18)', borderRadius: 12, padding: 14, background: 'rgba(255,255,255,0.60)' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: ORANGE, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>Strongest Evidence Found</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px' }}>
                    {STRONGEST_EVIDENCE.map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span style={{ color: ORANGE, fontWeight: 900, flexShrink: 0 }}>•</span>
                        <span style={{ fontSize: 12, color: SLATE, lineHeight: 1.45, fontWeight: 600 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right spacer — matches right rail width so hero doesn't bleed under it */}
            <div style={{ width: 240, flexShrink: 0 }} />
          </div>

          {/* Bottom bleed row: Why You Match | Where Recruiters Place You | What Recruiters May Ask */}
          <div style={{
            marginLeft: LEFT_BLEED,
            marginRight: RIGHT_BLEED,
            marginTop: 8,
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)',
            gap: GAP,
            width: `calc(100% + ${Math.abs(LEFT_BLEED)}px + ${Math.abs(RIGHT_BLEED)}px)`,
            position: 'relative',
            zIndex: 1,
          }}>

            {/* Why You Match */}
            <div style={{ ...GLASS, padding: 18 }}>
              <div style={{ fontSize: 22, color: ORANGE, marginBottom: 14, ...ORANGE_LIFT }}>Why You Match</div>
              <div style={{ ...GLASS_SOFT, padding: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 9, fontWeight: 900, color: ORANGE, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>{WHY_MATCH.roleSignal}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: SLATE, lineHeight: 1.3, marginBottom: 6 }}>{WHY_MATCH.role}</div>
                <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55 }}>{WHY_MATCH.desc}</div>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {WHY_MATCH.signals.map((sig, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: '#16A34A', fontWeight: 900, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 13, color: SLATE, lineHeight: 1.35 }}>{sig}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Where Recruiters Place You */}
            <div style={{ ...GLASS, padding: 18 }}>
              <div style={{ fontSize: 22, color: ORANGE, marginBottom: 14, ...ORANGE_LIFT }}>Where Recruiters Are Most Likely To Place You</div>
              <div style={{ display: 'grid', gap: 10 }}>
                {PLACEMENT_ROLES.map((role, i) => (
                  <div key={i} style={{ ...GLASS_SOFT, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: SLATE, lineHeight: 1.3 }}>{role.title}</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: ORANGE, flexShrink: 0 }}>{role.pct}%</div>
                    </div>
                    <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.45 }}>{role.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* What Recruiters May Ask */}
            <div style={{ ...GLASS, padding: 18 }}>
              <div style={{ fontSize: 22, color: ORANGE, marginBottom: 6, ...ORANGE_LIFT }}>What Recruiters May Ask</div>
              <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55, marginBottom: 14 }}>Based on your portfolio, these are the questions a recruiter is most likely to ask. Use these to prepare before any conversation.</div>
              <div style={{ display: 'grid', gap: 10 }}>
                {RECRUITER_QUESTIONS.map((item, i) => (
                  <div key={i} style={{ ...GLASS_SOFT, padding: 14, border: '1px solid rgba(100,116,139,0.14)' }}>
                    <div style={{ fontSize: 13, fontWeight: 900, color: SLATE, lineHeight: 1.35, marginBottom: 6 }}>{item.question}</div>
                    <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5 }}>{item.context}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </SeekerAnalyticsLayout>
    </>
  );
}