// components/identity/ProfessionalOperatingProfileEngine.js
// v4 — Stepped journey form + compact intelligence output
// Back/forward navigation, persistent state, generate as final action

import { useEffect, useMemo, useState } from 'react';

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  orange: '#FF7043',
  dark:   '#0F172A',
  slate:  '#334155',
  mid:    '#64748B',
  light:  '#94A3B8',
  border: 'rgba(15,23,42,0.08)',
  glass:  'rgba(255,255,255,0.62)',
  white:  'rgba(255,255,255,0.94)',
};

const TONE = {
  orange: { fg: '#FF7043', bg: 'rgba(255,112,67,0.07)', border: 'rgba(255,112,67,0.20)', bar: '#FF7043' },
  green:  { fg: '#15803D', bg: 'rgba(22,163,74,0.07)',  border: 'rgba(22,163,74,0.20)',  bar: '#16A34A' },
  blue:   { fg: '#0369A1', bg: 'rgba(14,165,233,0.07)', border: 'rgba(14,165,233,0.20)', bar: '#0EA5E9' },
  amber:  { fg: '#92400E', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.22)', bar: '#F59E0B' },
  slate:  { fg: '#334155', bg: 'rgba(15,23,42,0.05)',   border: 'rgba(15,23,42,0.12)',   bar: '#475569' },
};

const surface = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.26)',
  background: T.glass,
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
};

const card = {
  borderRadius: 10,
  border: `1px solid ${T.border}`,
  background: T.white,
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
};

const INPUT_BASE = {
  width: '100%', padding: '8px 10px',
  border: `1px solid ${T.border}`, borderRadius: 8,
  fontSize: 13, color: T.dark, background: T.white,
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};

// ── Journey steps ─────────────────────────────────────────────────────────────
const STEPS = [
  {
    id:       'work',
    label:    'How you work',
    subtitle: 'The foundation — your energy, structure, and relationship with uncertainty.',
    fields:   ['energy', 'autonomy', 'ambiguity'],
  },
  {
    id:       'respond',
    label:    'How you respond',
    subtitle: 'Your behavioral patterns under pressure and in conversation.',
    fields:   ['pressure', 'communication', 'challengeStyle'],
  },
  {
    id:       'grow',
    label:    'How you grow',
    subtitle: 'Your learning approach and where you are focused right now.',
    fields:   ['learningStyle', 'growth'],
  },
  {
    id:       'drive',
    label:    'What drives you',
    subtitle: 'The motivations and career hopes that sustain your best work.',
    fields:   ['motivation', 'careerHope'],
  },
  {
    id:       'open',
    label:    'In your own words',
    subtitle: 'Optional — but every answer makes the profile sharper and more specific to you.',
    fields:   ['recentWin', 'drain', 'stressTrigger', 'supportNeed', 'idealImpact', 'recognitionStyle', 'goal'],
    optional: true,
  },
];

const REQUIRED_FIELDS = ['energy','autonomy','ambiguity','pressure','communication',
                         'challengeStyle','learningStyle','growth','motivation','careerHope'];

// ── Field definitions ─────────────────────────────────────────────────────────
const FIELD_META = {
  energy: {
    type: 'select', label: 'What type of work gives you the most energy?',
    options: [
      { value:'systems',   label:'Improving systems, processes, and operations' },
      { value:'people',    label:'Helping, advising, coaching, or supporting people' },
      { value:'execution', label:'Getting things done and moving work forward' },
      { value:'strategy',  label:'Planning direction and solving complex problems' },
    ],
  },
  autonomy: {
    type: 'select', label: 'How much autonomy helps you do your best work?',
    options: [
      { value:'high',   label:'High — give me the outcome and trust me' },
      { value:'medium', label:'Balanced with clear check-ins' },
      { value:'low',    label:'Clear structure and defined steps' },
    ],
  },
  ambiguity: {
    type: 'select', label: 'How comfortable are you with ambiguity?',
    options: [
      { value:'high',   label:'Very comfortable — I build through uncertainty' },
      { value:'medium', label:'Comfortable if priorities are clear' },
      { value:'low',    label:'I prefer stable expectations and defined scope' },
    ],
  },
  pressure: {
    type: 'select', label: 'How do you usually respond under pressure?',
    options: [
      { value:'calm',          label:'I get calm and stabilize the situation' },
      { value:'direct',        label:'I make decisions quickly and act' },
      { value:'collaborative', label:'I gather people and coordinate a response' },
      { value:'reflective',    label:'I pause, assess, and choose carefully' },
    ],
  },
  communication: {
    type: 'select', label: 'What communication style fits you best?',
    options: [
      { value:'direct',        label:'Direct, clear, and low-politics' },
      { value:'collaborative', label:'Collaborative, relational, and context-rich' },
      { value:'written',       label:'Written, thoughtful, and well-structured' },
    ],
  },
  challengeStyle: {
    type: 'select', label: 'How do you usually see challenges?',
    options: [
      { value:'builder',    label:'As something to build through or improve' },
      { value:'solver',     label:'As a problem to diagnose and resolve' },
      { value:'stabilizer', label:'As something to calm, organize, and stabilize' },
      { value:'strategist', label:'As a signal that direction or priorities need review' },
    ],
  },
  learningStyle: {
    type: 'select', label: 'How do you learn best?',
    options: [
      { value:'hands_on',       label:'Hands-on — work through the real thing' },
      { value:'mentor_guided',  label:'Mentor-guided — show me the pattern, then let me try' },
      { value:'documentation',  label:'Documentation-first — give me structure and reference material' },
      { value:'trial_and_error',label:'Trial and error — test and adjust' },
    ],
  },
  growth: {
    type: 'select', label: 'What growth opportunity are you most focused on?',
    options: [
      { value:'visibility', label:'Being more visible for the value I create' },
      { value:'delegation', label:'Not carrying too much alone' },
      { value:'focus',      label:'Improving focus and reducing overload' },
      { value:'strategy',   label:'Positioning my work more strategically' },
    ],
  },
  motivation: {
    type: 'select', label: 'What most motivates you professionally?',
    options: [
      { value:'mission',   label:'Mission — doing work that matters' },
      { value:'mastery',   label:'Mastery — becoming excellent at what I do' },
      { value:'impact',    label:'Impact — seeing meaningful results from the work' },
      { value:'ownership', label:'Ownership — being trusted to carry important work' },
      { value:'growth',    label:'Growth — building toward a bigger future' },
    ],
  },
  careerHope: {
    type: 'select', label: 'What do you hope your career gives you more of?',
    options: [
      { value:'purpose',    label:'Purpose and meaningful contribution' },
      { value:'stability',  label:'Stability and room to breathe' },
      { value:'leadership', label:'Leadership influence and responsibility' },
      { value:'craft',      label:'A stronger craft and deeper expertise' },
      { value:'freedom',    label:'Freedom, autonomy, and self-direction' },
    ],
  },
  recentWin:       { type:'textarea', label:'Recent professional win',           placeholder:'A process improved, a problem solved, a delivery under pressure…' },
  drain:           { type:'textarea', label:'What drains you professionally?',    placeholder:'Disconnected leadership, unclear priorities, no ownership…' },
  stressTrigger:   { type:'textarea', label:'Pressure or stress trigger',         placeholder:'Lack of clarity, unstable leadership, overloaded timelines…' },
  supportNeed:     { type:'textarea', label:'Support that helps you perform best', placeholder:'Clear priorities, mentorship, trust, room to focus…' },
  idealImpact:     { type:'textarea', label:'Impact you want to create',           placeholder:'Helping people, improving systems, building something lasting…' },
  recognitionStyle:{ type:'textarea', label:'Recognition preference',              placeholder:'Outcomes, responsibility, compensation, visible appreciation…' },
  goal:            { type:'textarea', label:'What are you trying to understand or decide right now?', placeholder:'Whether to pivot, lead, specialize, build, or better explain your strengths…' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function toArr(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  return [];
}

// ── Primitives ────────────────────────────────────────────────────────────────

function Tag({ children, tone='orange' }) {
  const c = TONE[tone] || TONE.orange;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 999,
      fontSize: 10, fontWeight: 700,
      background: c.bg, color: c.fg, border: `1px solid ${c.border}`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 4, height: 4, borderRadius: '50%', background: c.bar, flexShrink: 0 }} />
      {children}
    </span>
  );
}

function Label({ children, tone='orange' }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 900, letterSpacing: '0.10em',
      textTransform: 'uppercase', color: TONE[tone]?.fg || T.mid, marginBottom: 7,
    }}>{children}</div>
  );
}

function Bullets({ items, tone='slate' }) {
  const arr = toArr(items);
  const bar = TONE[tone]?.bar || T.mid;
  if (!arr.length) return <div style={{ fontSize: 11, color: T.light, fontStyle: 'italic' }}>—</div>;
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
      {arr.map((item, i) => (
        <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: T.slate, lineHeight: 1.5 }}>
          <span style={{ width: 2, minHeight: 14, borderRadius: 1, background: bar, flexShrink: 0, marginTop: 4 }} />
          {item}
        </li>
      ))}
    </ul>
  );
}

function Block({ label, tone='slate', children, span2=false }) {
  return (
    <div style={{ ...card, padding: '13px 15px', display: 'grid', gap: 9,
      gridColumn: span2 ? '1 / -1' : undefined }}>
      <Label tone={tone}>{label}</Label>
      {children}
    </div>
  );
}

function TileGrid({ items, tone='slate' }) {
  const arr = toArr(items);
  const c   = TONE[tone] || TONE.slate;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 7 }}>
      {arr.map((item, i) => (
        <div key={i} style={{
          padding: '9px 11px', borderRadius: 8,
          background: c.bg, border: `1px solid ${c.border}`,
          fontSize: 12, color: T.slate, lineHeight: 1.5,
        }}>
          {item}
        </div>
      ))}
    </div>
  );
}

function ConfidenceBadge({ item }) {
  const level = String(item.level || '');
  const tone  = level.includes('Strong') ? 'green' : level.includes('Moderate') ? 'blue' : 'amber';
  const c     = TONE[tone];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '7px 10px', borderRadius: 7,
      background: c.bg, border: `1px solid ${c.border}`,
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: T.dark }}>{item.label}</span>
      <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.08em', color: c.fg, textTransform: 'uppercase' }}>
        {level.replace(/ signal/i, '')}
      </span>
    </div>
  );
}

function EvidenceSection({ label, items, tone, defaultOpen=false }) {
  const [open, setOpen] = useState(defaultOpen);
  const arr = toArr(items);
  if (!arr.length) return null;
  const c = TONE[tone] || TONE.slate;
  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        padding: '10px 14px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 3, height: 14, borderRadius: 2, background: c.bar, flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: c.fg }}>{label}</span>
          <span style={{ fontSize: 10, color: T.light, fontWeight: 600 }}>
            {arr.length} signal{arr.length !== 1 ? 's' : ''}
          </span>
        </div>
        <span style={{ fontSize: 12, color: T.mid, display: 'inline-block',
          transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: '10px 14px 12px', display: 'grid', gap: 5,
          borderTop: `1px solid ${T.border}` }}>
          {arr.map((item, i) => (
            <div key={i} style={{
              fontSize: 12, color: T.slate, lineHeight: 1.5,
              paddingLeft: 10, borderLeft: `2px solid ${c.border}`,
            }}>{item}</div>
          ))}
        </div>
      )}
    </div>
  );
}


// ── Welcome screen ────────────────────────────────────────────────────────────
function WelcomeScreen({ onStart, profileSlug = '' }) {
  const WHAT_IT_DOES = [
    { icon: '◉', label: 'Operating style',      desc: 'How you work, learn, and respond under pressure.' },
    { icon: '⬡', label: 'Strength signal map',  desc: 'What you do best — backed by evidence, not assumptions.' },
    { icon: '◈', label: 'Business integration', desc: 'How to place, utilize, and support you effectively.' },
    { icon: '◎', label: 'Evidence trail',        desc: 'Every conclusion is explainable and traceable to a source.' },
  ];

  const EVIDENCE_SOURCES = [
    { tone: 'orange', label: 'Your reflection',  desc: '10 guided questions + optional free-text answers.' },
    { tone: 'blue',   label: 'Your resume',       desc: 'Upload your primary resume for richer signal.' },
    { tone: 'slate',  label: 'Your portfolio',    desc: 'Complete your profile and about section for stronger results.' },
    { tone: 'green',  label: 'Platform intelligence', desc: 'ForgeTomorrow operational signals from your activity.' },
  ];

  return (
    <div style={{ display: 'grid', gap: 0 }}>

      {/* Hero */}
      <div style={{
        ...surface, padding: '24px 24px 20px',
        borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
        borderBottom: '1px solid rgba(255,112,67,0.12)',
        background: 'rgba(255,255,255,0.75)',
      }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {['Voluntary', 'Evidence-backed', 'User-controlled'].map(l => (
            <Tag key={l} tone="slate">{l}</Tag>
          ))}
        </div>

        <h2 style={{
          margin: '0 0 10px', fontSize: 22, fontWeight: 900,
          color: T.orange, letterSpacing: '-0.025em', lineHeight: 1.2,
        }}>
          Professional Operating Profile
        </h2>

        <p style={{ margin: '0 0 16px', fontSize: 13, color: T.slate, lineHeight: 1.65, maxWidth: 680 }}>
          A voluntary, evidence-backed reflection that helps you understand how you operate
          professionally — and helps the people you work with understand how to work with you.
          Not a personality test. Not a score. A structured professional intelligence profile
          you own and control.
        </p>

        <p style={{ margin: 0, fontSize: 12, color: T.mid, lineHeight: 1.6, maxWidth: 680 }}>
          The profile draws from your answers, your resume, your portfolio, and ForgeTomorrow's
          intelligence signals. The more complete your profile and resume are before you begin,
          the richer and more specific your output will be.
        </p>
      </div>

      {/* Body */}
      <div style={{
        ...surface, padding: '20px 24px 24px',
        borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none',
        display: 'grid', gap: 20,
      }}>

        {/* What it produces */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.10em',
            textTransform: 'uppercase', color: T.orange, marginBottom: 12 }}>
            What you'll get
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
            {WHAT_IT_DOES.map(item => (
              <div key={item.label} style={{
                ...card, padding: '12px 14px',
                display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <span style={{ fontSize: 16, lineHeight: 1, color: T.orange, flexShrink: 0, marginTop: 2 }}>
                  {item.icon}
                </span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.dark, marginBottom: 3 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 11, color: T.mid, lineHeight: 1.5 }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence sources + nudge */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.10em',
            textTransform: 'uppercase', color: T.mid, marginBottom: 12 }}>
            How the profile is built
          </div>
          <div style={{ display: 'grid', gap: 7 }}>
            {EVIDENCE_SOURCES.map(src => {
              const c = TONE[src.tone] || TONE.slate;
              const isResume    = src.tone === 'blue';
              const isPortfolio = src.tone === 'slate';
              return (
                <div key={src.label} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 9,
                  background: c.bg, border: `1px solid ${c.border}`,
                }}>
                  <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2,
                    background: c.bar, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.dark, marginBottom: 2 }}>
                      {src.label}
                    </div>
                    <div style={{ fontSize: 11, color: T.mid, lineHeight: 1.45 }}>
                      {src.desc}
                    </div>
                  </div>
                  {(isResume || isPortfolio) && (
                    <a
                      href={isResume ? '/resume/create' : profileSlug ? `/profile/${profileSlug}?edit=1` : '/profile'}
                      style={{
                        flexShrink: 0, fontSize: 11, fontWeight: 700,
                        color: c.fg, textDecoration: 'none',
                        padding: '5px 10px', borderRadius: 6,
                        border: `1px solid ${c.border}`, background: 'white',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isResume ? 'Add resume →' : 'Complete profile →'}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Ground rules */}
        <div style={{
          padding: '12px 16px', borderRadius: 10,
          background: 'rgba(15,23,42,0.03)', border: `1px solid ${T.border}`,
          display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start',
        }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: T.light, flexShrink: 0, paddingTop: 2 }}>
            Ground rules
          </div>
          {['Patterns, not labels.','Evidence, not assumptions.','Guidance, not diagnosis.','You decide what gets shared.'].map(r => (
            <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: T.light, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: T.mid }}>{r}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, color: T.mid, lineHeight: 1.55, maxWidth: 480 }}>
            The reflection takes about <strong style={{ color: T.slate }}>5 minutes</strong> to complete.
            You can return and edit your answers at any time.
          </div>
          <button type="button" onClick={onStart} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 28px', borderRadius: 10, border: 'none',
            background: T.orange, color: 'white',
            fontSize: 14, fontWeight: 900, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(255,112,67,0.30)',
            letterSpacing: '-0.01em', whiteSpace: 'nowrap',
          }}>
            Begin reflection →
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Progress indicator ────────────────────────────────────────────────────────
function StepProgress({ current, total, stepLabel }) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.mid }}>
          Step {current} of {total}
        </span>
        <span style={{ fontSize: 11, fontWeight: 900, color: T.orange }}>{stepLabel}</span>
      </div>
      {/* Segmented bar */}
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 999,
            background: i < current ? T.orange : 'rgba(255,112,67,0.15)',
            transition: 'background 0.25s ease',
          }} />
        ))}
      </div>
    </div>
  );
}

// ── Single field renderer ─────────────────────────────────────────────────────
function FieldRenderer({ fieldKey, value, onChange }) {
  const meta = FIELD_META[fieldKey];
  if (!meta) return null;

  if (meta.type === 'select') {
    return (
      <div style={{ display: 'grid', gap: 6 }}>
        <label style={{ fontSize: 15, fontWeight: 700, color: T.dark, lineHeight: 1.4 }}>
          {meta.label}
        </label>
        <div style={{ display: 'grid', gap: 8, marginTop: 4 }}>
          {meta.options.map(opt => {
            const selected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                style={{
                  textAlign: 'left', padding: '12px 16px',
                  borderRadius: 10, cursor: 'pointer',
                  border: selected
                    ? `1.5px solid ${T.orange}`
                    : `1px solid ${T.border}`,
                  background: selected
                    ? 'rgba(255,112,67,0.07)'
                    : T.white,
                  color: selected ? T.dark : T.slate,
                  fontSize: 13, fontWeight: selected ? 700 : 400,
                  lineHeight: 1.45,
                  display: 'flex', alignItems: 'center', gap: 12,
                  transition: 'border-color 0.12s, background 0.12s',
                }}
              >
                {/* Selection indicator */}
                <span style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  border: selected ? `5px solid ${T.orange}` : `1.5px solid ${T.light}`,
                  background: 'white',
                  transition: 'border 0.12s',
                }} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (meta.type === 'textarea') {
    return (
      <div style={{ display: 'grid', gap: 6 }}>
        <label style={{ fontSize: 14, fontWeight: 700, color: T.dark, lineHeight: 1.4 }}>
          {meta.label}
          <span style={{ fontSize: 11, fontWeight: 500, color: T.light, marginLeft: 6 }}>optional</span>
        </label>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={meta.placeholder}
          style={{
            ...INPUT_BASE,
            minHeight: 80, resize: 'vertical', lineHeight: 1.55,
            fontSize: 13,
          }}
        />
      </div>
    );
  }

  return null;
}

// ── Step screen ───────────────────────────────────────────────────────────────
function StepScreen({ step, stepIndex, totalSteps, form, setField, onBack, onNext, onGenerate, generating, error }) {
  const isLast     = stepIndex === totalSteps - 1;
  const isOptional = step.optional;

  // Check if required fields for this step are complete
  const stepComplete = step.fields.every(f => {
    if (REQUIRED_FIELDS.includes(f)) return Boolean(form[f]);
    return true; // optional fields never block progress
  });

  return (
    <div style={{ display: 'grid', gap: 0 }}>

      {/* Header */}
      <div style={{
        ...surface,
        padding: '16px 20px',
        borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
        borderBottom: `1px solid rgba(255,112,67,0.12)`,
        background: 'rgba(255,255,255,0.75)',
      }}>
        <div style={{ marginBottom: 14 }}>
          <StepProgress current={stepIndex + 1} total={totalSteps} stepLabel={step.label} />
        </div>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 900, color: T.dark, letterSpacing: '-0.02em' }}>
          {step.label}
        </h2>
        <p style={{ margin: 0, fontSize: 12, color: T.mid, lineHeight: 1.55 }}>
          {step.subtitle}
        </p>
      </div>

      {/* Fields */}
      <div style={{
        ...surface,
        borderTopLeftRadius: 0, borderTopRightRadius: 0,
        borderTop: 'none', padding: '20px 20px 24px',
        display: 'grid', gap: 20,
      }}>
        {step.fields.map(fieldKey => (
          <FieldRenderer
            key={fieldKey}
            fieldKey={fieldKey}
            value={form[fieldKey] || ''}
            onChange={v => setField(fieldKey, v)}
          />
        ))}

        {error && (
          <div style={{ padding: '9px 12px', borderRadius: 8,
            background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.20)',
            color: '#B91C1C', fontSize: 12, fontWeight: 700 }}>
            {error}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 4 }}>

          {/* Back */}
          {stepIndex > 0 ? (
            <button type="button" onClick={onBack} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', borderRadius: 10, cursor: 'pointer',
              border: `1px solid ${T.border}`, background: T.white,
              color: T.mid, fontSize: 13, fontWeight: 700,
            }}>
              ← Back
            </button>
          ) : <div />}

          {/* Next / Generate */}
          {isLast ? (
            <button type="button" onClick={onGenerate} disabled={generating} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 10, cursor: generating ? 'not-allowed' : 'pointer',
              border: 'none',
              background: generating ? '#9CA3AF' : T.orange,
              color: 'white', fontSize: 14, fontWeight: 900,
              boxShadow: generating ? 'none' : '0 4px 16px rgba(255,112,67,0.30)',
              letterSpacing: '-0.01em',
            }}>
              {generating ? (
                <>
                  <span style={{ width: 14, height: 14, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: 'white', display: 'inline-block',
                    animation: 'spin 0.7s linear infinite' }} />
                  Generating…
                  <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
                </>
              ) : 'Generate My Professional Operating Profile →'}
            </button>
          ) : (
            <button type="button" onClick={onNext}
              disabled={!isOptional && !stepComplete}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '11px 22px', borderRadius: 10,
                cursor: (!isOptional && !stepComplete) ? 'not-allowed' : 'pointer',
                border: 'none',
                background: (!isOptional && !stepComplete) ? 'rgba(255,112,67,0.25)' : T.orange,
                color: 'white', fontSize: 13, fontWeight: 900,
                boxShadow: (!isOptional && !stepComplete) ? 'none' : '0 3px 12px rgba(255,112,67,0.28)',
              }}>
              Next →
            </button>
          )}
        </div>

        {/* Optional step skip hint */}
        {isLast && (
          <div style={{ textAlign: 'center', marginTop: -8 }}>
            <button type="button" onClick={onGenerate} disabled={generating} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, color: T.light, textDecoration: 'underline',
            }}>
              Skip optional questions and generate now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Output tabs ───────────────────────────────────────────────────────────────
const OUTPUT_TABS = [
  { id: 'snapshot',  label: 'Profile'     },
  { id: 'work',      label: 'Work Style'  },
  { id: 'business',  label: 'Integration' },
  { id: 'evidence',  label: 'Evidence'    },
  { id: 'share',     label: 'Share'       },
];

// ── Main component ────────────────────────────────────────────────────────────
export default function ProfessionalOperatingProfileEngine({ profileSlug = '' }) {
  const [form, setForm] = useState({
    energy:'', autonomy:'', ambiguity:'', pressure:'', communication:'',
    challengeStyle:'', learningStyle:'', growth:'', motivation:'', careerHope:'',
    recentWin:'', drain:'', stressTrigger:'', supportNeed:'',
    idealImpact:'', recognitionStyle:'', goal:'',
  });

  const [stepIndex, setStepIndex]     = useState(0);
  const [started, setStarted]         = useState(false);
  const [snapshot, setSnapshot]       = useState(null);
  const [activeTab, setActiveTab]     = useState('snapshot');
  const [error, setError]             = useState('');
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [saving, setSaving]           = useState(false);
  const [generating, setGenerating]   = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [shareSettings, setShareSettings] = useState({
    showOnPortfolio: false, shareWithCoach: false, includeInHiringPacket: false,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res  = await fetch('/api/anvil/identity', { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (!alive) return;
        if (res.ok && data?.profile) {
          if (data.profile.answersJson) setForm(p => ({ ...p, ...data.profile.answersJson }));
          if (data.profile.snapshotJson) setSnapshot(data.profile.snapshotJson);
          setShareSettings({
            showOnPortfolio:       Boolean(data.profile.showOnPortfolio),
            shareWithCoach:        Boolean(data.profile.shareWithCoach),
            includeInHiringPacket: Boolean(data.profile.includeInHiringPacket),
          });
        }
      } catch {} finally { if (alive) setLoadingSaved(false); }
    })();
    return () => { alive = false; };
  }, []);

  const setField = (k, v) => { setError(''); setForm(p => ({ ...p, [k]: v })); };

  const handleNext = () => {
    const step = STEPS[stepIndex];
    const missing = step.fields.filter(f => REQUIRED_FIELDS.includes(f) && !form[f]);
    if (missing.length) { setError('Please answer all questions on this step before continuing.'); return; }
    setError('');
    setStepIndex(i => Math.min(i + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setError('');
    setStepIndex(i => Math.max(i - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const generate = async () => {
    const missing = REQUIRED_FIELDS.filter(f => !form[f]);
    if (missing.length) { setError('Please complete all required steps before generating.'); return; }
    setGenerating(true); setError('');
    try {
      const res  = await fetch('/api/anvil/identity', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ answersJson: form, ...shareSettings, generateOnly: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Generation failed.');
      setSnapshot(data?.snapshot || null);
      setActiveTab('snapshot');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { setError(e?.message || 'Generation failed.'); }
    finally { setGenerating(false); }
  };

  const save = async () => {
    if (!snapshot) { setError('Generate before saving.'); return; }
    setSaving(true); setError('');
    try {
      const res  = await fetch('/api/anvil/identity', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ answersJson: form, snapshotJson: snapshot, ...shareSettings }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Save failed.');
      setSnapshot(data?.snapshot || snapshot);
      setSaveMessage('Saved.');
    } catch (e) { setError(e?.message || 'Save failed.'); }
    finally { setSaving(false); }
  };

  const restartJourney = () => {
    setSnapshot(null);
    setStepIndex(0);
    setStarted(true); // skip welcome — they already know what this is
    setError('');
    setSaveMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loadingSaved) return (
    <div style={{ ...surface, padding: '16px 20px', fontSize: 12, color: T.mid }}>
      Loading your Professional Operating Profile…
    </div>
  );

  // ── Welcome screen ───────────────────────────────────────────────────────
  if (!snapshot && !started) return (
    <WelcomeScreen onStart={() => { setStarted(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} profileSlug={profileSlug} />
  );

  // ── Journey form ─────────────────────────────────────────────────────────
  if (!snapshot) return (
    <StepScreen
      step={STEPS[stepIndex]}
      stepIndex={stepIndex}
      totalSteps={STEPS.length}
      form={form}
      setField={setField}
      onBack={handleBack}
      onNext={handleNext}
      onGenerate={generate}
      generating={generating}
      error={error}
    />
  );

  // ── Output view ──────────────────────────────────────────────────────────
  const sigs   = toArr(snapshot?.confidenceSignals);
  const groups = snapshot?.signalGroups || {};
  const why    = snapshot?.why || {};

  return (
    <div style={{ display: 'grid', gap: 0 }}>

      {/* Compact intelligence header */}
      <div style={{
        ...surface, padding: '16px 20px',
        borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
        borderBottom: 'rgba(255,112,67,0.12) 1px solid',
        background: 'rgba(255,255,255,0.75)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.10em',
              textTransform: 'uppercase', color: T.orange, marginBottom: 5 }}>
              Professional Operating Profile · Generated
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: T.dark, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
              {snapshot.operatingStyle}
            </h2>
          </div>
          <button onClick={restartJourney} style={{
            flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '5px 12px', borderRadius: 999,
            border: '1px solid rgba(255,112,67,0.25)', background: 'rgba(255,112,67,0.07)',
            color: T.orange, fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}>
            ↩ Edit answers
          </button>
        </div>
        <p style={{ margin: '0 0 12px', fontSize: 12, color: T.mid, lineHeight: 1.6, maxWidth: 700 }}>
          {snapshot.professionalSummary}
        </p>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {toArr(snapshot.strengthSignals).slice(0, 8).map(s => <Tag key={s} tone="orange">{s}</Tag>)}
        </div>
      </div>

      {/* Tab nav */}
      <div style={{
        display: 'flex', background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${T.border}`,
        overflowX: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none',
      }}>
        {OUTPUT_TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: '0 0 auto', border: 'none', cursor: 'pointer', background: 'none',
              borderBottom: active ? `2px solid ${T.orange}` : '2px solid transparent',
              padding: '10px 16px',
              fontSize: 11, fontWeight: active ? 900 : 600,
              color: active ? T.orange : T.mid,
              whiteSpace: 'nowrap',
            }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{
        ...surface, padding: '16px 18px',
        borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none',
      }}>

        {activeTab === 'snapshot' && (
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
              <Block label="The person" tone="slate">
                <Bullets items={snapshot.person || snapshot.personProfile} tone="slate" />
              </Block>
              <Block label="The professional" tone="orange">
                <Bullets items={snapshot.professional || snapshot.professionalProfile} tone="orange" />
              </Block>
            </div>
            <Block label="Where I thrive" tone="blue" span2>
              <TileGrid items={snapshot.thrivesIn} tone="blue" />
            </Block>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
              <Block label="Confidence signals" tone="green">
                <div style={{ display: 'grid', gap: 5 }}>
                  {sigs.length
                    ? sigs.map((item, i) => <ConfidenceBadge key={i} item={item} />)
                    : <Bullets items={toArr(snapshot.strengthSignals).slice(0,5)} tone="green" />
                  }
                </div>
              </Block>
              <Block label="Signal groups" tone="slate">
                <div style={{ display: 'grid', gap: 10 }}>
                  {['identity','leadership','execution','environment'].map(key =>
                    toArr(groups[key]).length ? (
                      <div key={key}>
                        <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.08em',
                          textTransform: 'uppercase', color: T.light, marginBottom: 5 }}>
                          {key}
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {groups[key].map(s => <Tag key={s} tone="slate">{s}</Tag>)}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              </Block>
            </div>
          </div>
        )}

        {activeTab === 'work' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
            <Block label="How I perform best" tone="green">
              <Bullets items={snapshot.howTheyPerformBest} tone="green" />
            </Block>
            <Block label="How I learn" tone="blue">
              <Bullets items={snapshot.learningProfile || snapshot.learningGuidance} tone="blue" />
            </Block>
            <Block label="How I process pressure" tone="amber">
              <Bullets items={snapshot.stressProcessing || snapshot.pressureGuidance} tone="amber" />
            </Block>
            <Block label="Challenge orientation" tone="slate">
              <Bullets items={snapshot.challengeOrientation} tone="slate" />
            </Block>
            <Block label="What motivates me" tone="orange">
              <Bullets items={snapshot.motivationProfile || snapshot.motivationDrivers} tone="orange" />
            </Block>
            <Block label="Career direction" tone="blue">
              <Bullets items={snapshot.careerDirection} tone="blue" />
            </Block>
          </div>
        )}

        {activeTab === 'business' && (
          <div style={{ display: 'grid', gap: 10 }}>
            <Block label="How to integrate me" tone="green" span2>
              <TileGrid items={snapshot.integrationGuidance} tone="green" />
            </Block>
            <Block label="How to utilize me" tone="orange" span2>
              <TileGrid items={snapshot.roleUtilization} tone="orange" />
            </Block>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
              <Block label="Where I may need support" tone="amber">
                <Bullets items={snapshot.supportAreas} tone="amber" />
              </Block>
              <Block label="Audience guidance" tone="slate">
                <div style={{ display: 'grid', gap: 10 }}>
                  {[
                    { role:'Seeker', key:'seeker', tone:'orange' },
                    { role:'Coach',  key:'coach',  tone:'blue'   },
                    { role:'Recruiter', key:'recruiter', tone:'green' },
                  ].map(({ role, key, tone }) =>
                    snapshot?.audienceViews?.[key] ? (
                      <div key={key}>
                        <Label tone={tone}>{role}</Label>
                        <p style={{ margin: 0, fontSize: 12, color: T.slate, lineHeight: 1.5 }}>
                          {snapshot.audienceViews[key]}
                        </p>
                      </div>
                    ) : null
                  )}
                </div>
              </Block>
            </div>
          </div>
        )}

        {activeTab === 'evidence' && (
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{
              padding: '9px 12px', borderRadius: 8, marginBottom: 4,
              background: 'rgba(255,112,67,0.05)', border: '1px solid rgba(255,112,67,0.12)',
              fontSize: 11, color: T.mid, lineHeight: 1.55,
            }}>
              <strong style={{ color: T.orange }}>Evidence trail.</strong>{' '}
              Every conclusion in this profile is backed by one or more of these sources. Expand any section to inspect the signal.
            </div>
            <EvidenceSection label="Self-reflection"       items={why.selfReflection}      tone="orange" defaultOpen />
            <EvidenceSection label="Resume"                items={why.resumeEvidence}      tone="blue"   />
            <EvidenceSection label="Portfolio"             items={why.portfolioEvidence}   tone="slate"  />
            <EvidenceSection label="Projects"              items={why.projectEvidence}     tone="amber"  />
            <EvidenceSection label="Intelligence signals"  items={why.intelligenceEvidence} tone="green" />
          </div>
        )}

        {activeTab === 'share' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ ...card, padding: '14px 16px', display: 'grid', gap: 12 }}>
              <Label tone="orange">Share controls</Label>
              <p style={{ margin: 0, fontSize: 12, color: T.mid, lineHeight: 1.5 }}>
                Nothing is shared without your explicit choice. You control who sees this profile.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
                {[
                  { key:'showOnPortfolio',      label:'Show on portfolio',        desc:'Visible on your public profile' },
                  { key:'shareWithCoach',        label:'Share with coach',         desc:'Coaches you work with can see this' },
                  { key:'includeInHiringPacket', label:'Include in hiring packet', desc:'Added to recruiter candidate packets' },
                ].map(({ key, label, desc }) => (
                  <label key={key} style={{
                    ...card, padding: '10px 12px', cursor: 'pointer',
                    border: shareSettings[key] ? '1px solid rgba(255,112,67,0.30)' : `1px solid ${T.border}`,
                    background: shareSettings[key] ? 'rgba(255,112,67,0.04)' : T.white,
                    display: 'flex', flexDirection: 'column', gap: 5,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <input type="checkbox" checked={shareSettings[key]}
                        onChange={e => setShareSettings(p => ({ ...p, [key]: e.target.checked }))}
                        style={{ accentColor: T.orange, width: 13, height: 13 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.dark }}>{label}</span>
                    </div>
                    <span style={{ fontSize: 11, color: T.mid, lineHeight: 1.4 }}>{desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && <div style={{ padding: '9px 12px', borderRadius: 8,
              background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.20)',
              color: '#B91C1C', fontSize: 12, fontWeight: 700 }}>{error}</div>}
            {saveMessage && <div style={{ padding: '9px 12px', borderRadius: 8,
              background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.20)',
              color: '#15803D', fontSize: 12, fontWeight: 700 }}>{saveMessage}</div>}

            <button type="button" onClick={save} disabled={saving} style={{
              border: 'none', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer',
              background: saving ? '#9CA3AF' : T.orange, color: 'white',
              padding: '11px 20px', fontSize: 13, fontWeight: 900, alignSelf: 'start',
              boxShadow: saving ? 'none' : '0 3px 12px rgba(255,112,67,0.28)',
            }}>
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}