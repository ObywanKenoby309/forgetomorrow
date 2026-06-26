// pages/demo/recruiter-search.js
import React, { useState } from 'react';
import Head from 'next/head';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';

const ORANGE = '#FF7043';
const SLATE  = '#1E293B';
const MUTED  = '#64748B';
const GAP    = 16;

const GLASS = {
  borderRadius: 18,
  border: '1px solid rgba(255,255,255,0.28)',
  background: 'rgba(255,255,255,0.74)',
  boxShadow: '0 8px 22px rgba(15,23,42,0.10)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};
const WHITE_CARD = {
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 16,
  boxShadow: '0 6px 18px rgba(15,23,42,0.10)',
  boxSizing: 'border-box',
  position: 'relative',
  overflow: 'hidden',
};
const ORANGE_LIFT = {
  textShadow: '0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)',
  fontWeight: 900,
};

// Initials avatar colors — mirrors real page
const AVATAR_COLORS = [
  '#E53935','#8E24AA','#1E88E5','#00897B',
  '#F4511E','#6D4C41','#546E7A','#43A047',
];

function InitialsAvatar({ name, size = 44 }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const color = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div style={{ width: size, height: size, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontSize: size * 0.35, fontWeight: 900 }}>
      {initials}
    </div>
  );
}

const CANDIDATES = [
  {
    name: 'Alexandra Henshaw', title: 'Desktop Support · Client Services',
    location: 'Richmond, VA', workType: 'Flexible',
    status: 'Open to Opportunities', why: 100,
    skills: ['Active Directory', 'Cisco Meraki', 'SCCM', 'Intune', 'Kioware'],
    summary: ['Project Management & Team Leadership', 'Customer Success & Escalation Management', 'Helpdesk Operations & Tier I–III Support'],
  },
  {
    name: 'Frank Bradshaw', title: 'Client Experience Manager',
    location: null, workType: null,
    status: null, why: 100,
    skills: ['Technical Support', 'Active Directory', 'Customer Escalation Resolution', 'Customer Feedback Analysis'],
    summary: ['Project Management & Team Leadership', 'Customer Success & Escalation Management'],
  },
  {
    name: 'Eduardo Riviera', title: 'Customer Support Supervisor',
    location: 'Phoenix, AZ', workType: 'Remote',
    status: 'Not Looking', why: 100,
    skills: ['Client Success Leadership', 'Escalation Management', 'SLA Management', 'Technical Support Management (Tiered Support)'],
    summary: [],
  },
  {
    name: 'Scott Smith', title: 'Senior Desktop Tech at Healthcare Network',
    location: 'Seattle, WA', workType: 'On-site',
    status: 'Open to Opportunities', why: 76,
    extra: 'Open to relocate',
    skills: ['Hardware Distribution', 'Active Directory', 'Software Support', 'SCCM Imaging', 'Ticket Queue Management'],
    summary: [],
  },
  {
    name: 'Jenny Dobson', title: 'Patient Experience Manager',
    location: 'Springfield, IL', workType: 'Hybrid',
    status: 'Actively Seeking', why: 71,
    skills: ['Escalation Management', 'Team Leadership', 'Process Improvement', 'Performance Metrics', 'Stakeholder Communication'],
    summary: [],
  },
  {
    name: 'Susan Whitmore', title: 'Software QA Tester',
    location: 'San Diego, CA', workType: null,
    status: null, why: 36,
    skills: ['Software Testing', 'Communication', 'Quality Control', 'Problem Solving', 'User Acceptance Testing'],
    summary: [],
  },
];

const STATUS_PILL = {
  'Open to Opportunities': { bg: 'rgba(37,99,235,0.08)', color: '#2563EB', border: '1px solid rgba(37,99,235,0.2)' },
  'Actively Seeking':      { bg: 'rgba(22,163,74,0.08)',  color: '#16A34A', border: '1px solid rgba(22,163,74,0.2)' },
  'Not Looking':           { bg: 'rgba(100,116,139,0.08)', color: '#64748B', border: '1px solid rgba(100,116,139,0.2)' },
  'Open to relocate':      { bg: 'rgba(168,85,247,0.08)', color: '#7C3AED', border: '1px solid rgba(168,85,247,0.2)' },
};

function Pill({ label }) {
  const s = STATUS_PILL[label] || { bg: 'rgba(0,0,0,0.04)', color: MUTED, border: '1px solid rgba(0,0,0,0.1)' };
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: s.bg, color: s.color, border: s.border, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

function SkillTag({ label }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.04)', color: MUTED, border: '1px solid rgba(0,0,0,0.08)', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

function CandidateCard({ c, comparing, onToggleCompare }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const whyColor = c.why >= 90 ? '#16A34A' : c.why >= 70 ? '#D97706' : MUTED;

  return (
    <div style={{ ...WHITE_CARD, padding: '18px 20px' }}>
      {/* WHY score — top right */}
      <div style={{ position: 'absolute', top: 16, right: 20, fontSize: 22, fontWeight: 900, color: whyColor, lineHeight: 1 }}>
        {c.why}<span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>/100</span>
      </div>

      {/* 3-dot menu */}
      <div style={{ position: 'absolute', bottom: 16, right: 20 }}>
        <button onClick={() => setMenuOpen(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: MUTED, padding: 4 }}>⋮</button>
        {menuOpen && (
          <div style={{ position: 'absolute', bottom: 28, right: 0, background: 'white', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', border: '1px solid rgba(0,0,0,0.08)', minWidth: 140, zIndex: 99, overflow: 'hidden' }}>
            {['View Profile', 'Add to Pool', 'Flag', 'Archive'].map(action => (
              <button key={action} onClick={() => setMenuOpen(false)} style={{ display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', fontSize: 13, color: SLATE, cursor: 'pointer', borderBottom: action !== 'Archive' ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                {action}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 10, paddingRight: 80 }}>
        <InitialsAvatar name={c.name} size={44} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: SLATE, marginBottom: 2 }}>{c.name}</div>
          {c.title && <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.4, marginBottom: 6 }}>{c.title}</div>}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {c.location && (
              <span style={{ fontSize: 11, color: MUTED, display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 12 }}>📍</span>{c.location}
              </span>
            )}
            {c.workType && <Pill label={c.workType} />}
            {c.status && <Pill label={c.status} />}
            {c.extra && <Pill label={c.extra} />}
          </div>
        </div>
      </div>

      {/* Summary lines */}
      {c.summary.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {c.summary.map((s, i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.04)', color: SLATE, border: '1px solid rgba(0,0,0,0.07)' }}>{s}</span>
          ))}
        </div>
      )}

      {/* Skill tags */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
        {c.skills.slice(0, 5).map((s, i) => <SkillTag key={i} label={s} />)}
        {c.skills.length > 5 && <SkillTag label={`+${c.skills.length - 5} more`} />}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 999, padding: '7px 16px', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>Message</button>
        <button style={{ background: 'none', color: SLATE, border: '1px solid rgba(0,0,0,0.14)', borderRadius: 999, padding: '7px 14px', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>View profile</button>
        <button style={{ background: 'none', color: ORANGE, border: `1px solid rgba(255,112,67,0.35)`, borderRadius: 999, padding: '7px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontWeight: 900 }}>+</span> WHY
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
          <input
            type="checkbox"
            checked={comparing.includes(c.name)}
            onChange={() => onToggleCompare(c.name)}
            style={{ width: 15, height: 15, accentColor: ORANGE, cursor: 'pointer' }}
          />
          <span style={{ fontSize: 11, color: MUTED }}>Compare</span>
        </div>
      </div>
    </div>
  );
}

export default function DemoRecruiterSearch() {
  const [nameQuery, setNameQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [advancedQuery, setAdvancedQuery] = useState('("CSM" OR "CS Manager") AND SaaS');
  const [comparing, setComparing] = useState([]);
  const [showTargeting, setShowTargeting] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Role: Customer Service');
  const [mode, setMode] = useState('Discovery Match');

  function toggleCompare(name) {
    setComparing(prev => prev.includes(name) ? prev.filter(n => n !== name) : prev.length < 2 ? [...prev, name] : prev);
  }

  const filtered = CANDIDATES.filter(c =>
    c.name.toLowerCase().includes(nameQuery.toLowerCase())
  );

  return (
    <>
      <Head><title>Candidate Center — ForgeTomorrow</title></Head>
      <RecruiterLayout
        title="Candidate Center | ForgeTomorrow"
        activeNav="candidate-center"
        right={
          <img
            src="/ads/house/recruiter-house-ad.png"
            alt="Advertise with ForgeTomorrow"
            style={{ width: '100%', borderRadius: 14, display: 'block' }}
          />
        }
        rightVariant="light"
      >
        <div style={{ display: 'grid', gap: GAP }}>

          {/* Title card */}
          <div style={{ ...GLASS, padding: '18px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: ORANGE, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>GOOD EVENING</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: ORANGE, fontStyle: 'italic', ...ORANGE_LIFT }}>Candidate Center</div>
            <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>Choose the recruiter tool you want to open. Each workspace stays separate and loads inside Candidate Center.</div>
          </div>

          {/* Workspace header */}
          <div style={{ ...GLASS, padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: ORANGE, ...ORANGE_LIFT, marginBottom: 4 }}>Internal Candidate Search</div>
                <div style={{ fontSize: 13, color: MUTED }}>Explainable internal candidate search, targeting, comparing, and workflow tools.</div>
              </div>
              {/* Discovery / Targeting match selector */}
              <div style={{ ...GLASS, padding: '12px 16px', minWidth: 240, flexShrink: 0 }}>
                {[
                  { label: 'Discovery Match', desc: 'Broader semantic + adjacent-role candidate discovery' },
                  { label: 'Targeting Match', desc: 'Stricter qualification + automation-ready scoring' },
                ].map(m => (
                  <div key={m.label} onClick={() => setMode(m.label)} style={{ cursor: 'pointer', marginBottom: m.label !== 'Targeting Match' ? 10 : 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: mode === m.label ? ORANGE : SLATE }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.4 }}>{m.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Breadcrumb */}
            <button style={{ background: 'none', color: ORANGE, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: 14 }}>
              Candidate Center Main
            </button>

            {/* 3-col search bar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginBottom: 10 }}>
              <input value={nameQuery} onChange={e => setNameQuery(e.target.value)} placeholder="Name or role..." style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, padding: '9px 14px', fontSize: 13, outline: 'none', background: 'rgba(255,255,255,0.9)', color: SLATE }} />
              <input value={locationQuery} onChange={e => setLocationQuery(e.target.value)} placeholder="Location..." style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, padding: '9px 14px', fontSize: 13, outline: 'none', background: 'rgba(255,255,255,0.9)', color: SLATE }} />
              <input value={advancedQuery} onChange={e => setAdvancedQuery(e.target.value)} placeholder='Advanced: ("CSM" OR "CS Manager") AND SaaS' style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, padding: '9px 14px', fontSize: 13, outline: 'none', background: 'rgba(255,255,255,0.9)', color: SLATE }} />
              <button onClick={() => setShowTargeting(p => !p)} style={{ background: 'rgba(255,112,67,0.08)', color: ORANGE, border: '1px solid rgba(255,112,67,0.3)', borderRadius: 8, padding: '9px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {showTargeting ? 'Hide' : 'Show'} Targeting
                <span style={{ marginLeft: 6, background: ORANGE, color: '#fff', borderRadius: 999, padding: '1px 6px', fontSize: 10, fontWeight: 900 }}>1</span>
              </button>
            </div>

            {/* Active filter + count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: MUTED }}>{filtered.length} candidates</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,112,67,0.08)', border: '1px solid rgba(255,112,67,0.2)', borderRadius: 999, padding: '4px 10px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: ORANGE }}>Role: Customer Service</span>
                <button onClick={() => {}} style={{ background: 'none', border: 'none', color: ORANGE, cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: 0 }}>×</button>
              </div>
            </div>
          </div>

          {/* Compare banner */}
          {comparing.length === 2 && (
            <div style={{ ...GLASS, background: 'rgba(255,112,67,0.08)', border: '1px solid rgba(255,112,67,0.3)', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: ORANGE }}>Comparing: {comparing.join(' vs ')}</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 999, padding: '8px 18px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>View Side-by-Side →</button>
                <button onClick={() => setComparing([])} style={{ background: 'none', border: '1px solid rgba(255,112,67,0.4)', color: ORANGE, borderRadius: 999, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Clear</button>
              </div>
            </div>
          )}

          {/* 2-col candidate grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: GAP }}>
            {filtered.map((c, i) => (
              <CandidateCard key={i} c={c} comparing={comparing} onToggleCompare={toggleCompare} />
            ))}
          </div>

        </div>
      </RecruiterLayout>
    </>
  );
}