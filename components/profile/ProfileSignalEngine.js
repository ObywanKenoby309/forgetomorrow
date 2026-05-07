// components/profile/ProfileSignalEngine.js
//
// ForgeTomorrow Profile Signal Engine
// Live career signal mirror for the profile editor right rail — edit mode only.
// Replaces the dumb ProfileStrengthRail checklist with real signal intelligence.
//
// Architecture:
// - Runs 8 universal hiring signals against the seeker's live profile content
// - Classifies each as Proven / Partial / Missing with recruiter-grade reasoning
// - Each gap has inline AI Assist — generates specific copy, applies directly to profile
// - Wired to /api/intelligence/context for full career context injection
// - Updates live as the seeker edits (debounced, no full reload needed)
//
// Usage (in [slug].js, replaces ProfileStrengthRail in the right prop during editMode):
// import ProfileSignalEngine from '@/components/profile/ProfileSignalEngine';
// right={editMode ? <ProfileSignalEngine profileData={liveProfileData} onApply={handleApplyField} /> : <RightRailPlacementManager />}

import { useEffect, useRef, useState } from 'react';

const ORANGE = '#FF7043';
const SLATE = '#334155';
const DARK = '#1E293B';

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

// ─── Signal definitions ───────────────────────────────────────────────────────
const PROFILE_SIGNALS = [
  {
    key: 'identity',
    label: 'Identity Signal',
    description: 'Headline + name + location clearly communicate who you are',
    field: 'headline',
    fieldLabel: 'Headline',
    check: (p) => {
      const h = String(p.headline || '').trim();
      if (h.length >= 40) return 'direct';
      if (h.length >= 15) return 'adjacent';
      return 'missing';
    },
    gap: (p) => {
      const h = String(p.headline || '').trim();
      if (!h) return 'No headline — recruiters will not know what you do';
      if (h.length < 15) return 'Headline too short — add role + context';
      return 'Headline could be stronger — add strength or impact signal';
    },
  },
  {
    key: 'narrative',
    label: 'Narrative Signal',
    description: 'Summary communicates your value, direction, and voice',
    field: 'aboutMe',
    fieldLabel: 'Summary',
    check: (p) => {
      const a = String(p.aboutMe || '').trim();
      if (a.length >= 400) return 'direct';
      if (a.length >= 120) return 'adjacent';
      return 'missing';
    },
    gap: (p) => {
      const a = String(p.aboutMe || '').trim();
      if (!a) return 'No professional summary — recruiters skip profiles without one';
      if (a.length < 120) return 'Summary too brief — needs more substance and voice';
      return 'Summary could be stronger — add impact or direction';
    },
  },
  {
    key: 'proof',
    label: 'Proof Signal',
    description: 'Skills and certifications demonstrate real capability',
    field: 'skills',
    fieldLabel: 'Skills',
    check: (p) => {
      const s = safeArr(p.skills);
      if (s.length >= 10) return 'direct';
      if (s.length >= 5) return 'adjacent';
      return 'missing';
    },
    gap: (p) => {
      const s = safeArr(p.skills);
      if (!s.length) return 'No skills listed — invisible to recruiter search filters';
      if (s.length < 5) return `Only ${s.length} skill${s.length === 1 ? '' : 's'} — add at least 5 more`;
      return 'Add more skills to strengthen recruiter search match';
    },
  },
  {
    key: 'portfolio',
    label: 'Portfolio Signal',
    description: 'Projects show real work, outcomes, and scope',
    field: 'projects',
    fieldLabel: 'Projects',
    check: (p) => {
      const proj = safeArr(p.projects);
      const withOutcomes = proj.filter(pr => {
        const text = typeof pr === 'string' ? pr : `${pr?.title || ''} ${pr?.description || ''} ${pr?.outcome || ''}`;
        return /\d|%|saved|improved|built|launched|led|reduced|increased/i.test(text);
      });
      if (withOutcomes.length >= 2) return 'direct';
      if (proj.length >= 1) return 'adjacent';
      return 'missing';
    },
    gap: (p) => {
      const proj = safeArr(p.projects);
      if (!proj.length) return 'No portfolio projects — major gap for recruiters evaluating real work';
      return 'Projects need measurable outcomes — add metrics, results, or impact';
    },
  },
  {
    key: 'credentials',
    label: 'Credential Signal',
    description: 'Education and certifications establish baseline credibility',
    field: 'education',
    fieldLabel: 'Education',
    check: (p) => {
      const edu = safeArr(p.education);
      const certs = safeArr(p.certifications);
      if (edu.length >= 1 && certs.length >= 1) return 'direct';
      if (edu.length >= 1 || certs.length >= 1) return 'adjacent';
      return 'missing';
    },
    gap: (p) => {
      const edu = safeArr(p.education);
      const certs = safeArr(p.certifications);
      if (!edu.length && !certs.length) return 'No education or certifications — credential signal is absent';
      if (!certs.length) return 'No certifications — add relevant credentials to strengthen this signal';
      return 'Add education details to complete credential picture';
    },
  },
  {
    key: 'availability',
    label: 'Availability Signal',
    description: 'Work preferences show recruiters you are findable and available',
    field: 'workPreferences',
    fieldLabel: 'Work Preferences',
    check: (p) => {
  const wp = p.workPreferences || {};
  const filled = [
    wp.workStatus,
    wp.workType,
    wp.schedule,
    wp.willingToRelocate,
    wp.startDate,
    wp.scheduleAvailability,
    ...(Array.isArray(wp.locations) ? wp.locations : []),
  ].filter(Boolean).length;

  if (filled >= 4) return 'direct';
  if (filled >= 1) return 'adjacent';
  return 'missing';
},
gap: (p) => {
  const wp = p.workPreferences || {};
  const filled = [
    wp.workStatus,
    wp.workType,
    wp.schedule,
    wp.willingToRelocate,
    wp.startDate,
    wp.scheduleAvailability,
    ...(Array.isArray(wp.locations) ? wp.locations : []),
  ].filter(Boolean).length;

  if (!filled) return 'No work preferences set — recruiters cannot determine your availability';
  if (filled >= 4) return 'Work preference signal is recruiter-usable';
  return 'Add more work preference details to improve recruiter matching';
},
  },
  {
  key: 'language',
  label: 'Language Signal',
  description: 'Languages clarify communication reach without penalizing single-language professionals',
  field: 'languages',
  fieldLabel: 'Languages',
  check: (p) => {
    const l = safeArr(p.languages);
    if (l.length >= 1) return 'direct';
    return 'adjacent';
  },
  gap: (p) => {
    const l = safeArr(p.languages);
    if (!l.length) return 'No languages listed — add your primary professional language if you want this signal complete';
    return 'Language signal is sufficient unless you speak additional languages';
  },
},
  {
    key: 'visibility',
    label: 'Visibility Signal',
    description: 'Public profile, resume, and social links make you findable',
    field: null,
    fieldLabel: null,
    check: (p) => {
      const hasResume = Boolean(p.primaryResume || p.hasResume);
      const isPublic = p.profileVisibility === 'PUBLIC' || p.profileVisibility === 'RECRUITERS_ONLY';
      if (hasResume && isPublic) return 'direct';
      if (hasResume || isPublic) return 'adjacent';
      return 'missing';
    },
    gap: (p) => {
      const hasResume = Boolean(p.primaryResume || p.hasResume);
      const isPublic = p.profileVisibility === 'PUBLIC' || p.profileVisibility === 'RECRUITERS_ONLY';
      if (!hasResume && !isPublic) return 'Profile is private and no resume attached — invisible to recruiters';
      if (!hasResume) return 'No primary resume attached — recruiters cannot download your CV';
      return 'Set profile visibility to Public or Recruiters Only to be found';
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function safeArr(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === 'string') {
    try { const p = JSON.parse(v); return Array.isArray(p) ? p.filter(Boolean) : []; } catch { return []; }
  }
  return [];
}

function classifySignals(profileData) {
  return PROFILE_SIGNALS.map(sig => ({
    ...sig,
    status: sig.check(profileData),
    gapReason: sig.gap(profileData),
  }));
}

function statusConfig(status) {
  if (status === 'direct')   return { label: 'Proven',  riskLabel: 'Low Risk',    color: '#15803D', bg: 'rgba(22,163,74,0.10)',  icon: '✓' };
  if (status === 'adjacent') return { label: 'Partial',  riskLabel: 'Medium Risk', color: '#D97706', bg: 'rgba(234,179,8,0.10)',  icon: '~' };
  return                            { label: 'Missing', riskLabel: 'High Risk',   color: '#DC2626', bg: 'rgba(220,38,38,0.08)', icon: '✗' };
}

function overallVerdict(signals) {
  const proven  = signals.filter(s => s.status === 'direct').length;
  const partial = signals.filter(s => s.status === 'adjacent').length;
  const missing = signals.filter(s => s.status === 'missing').length;

  let verdict;

  if (proven >= 6) {
    verdict = {
      label: 'Strong Profile',
      color: '#15803D',
      score: proven,
    };
  } else if (proven >= 4) {
    verdict = {
      label: 'Competitive Profile',
      color: '#0EA5E9',
      score: proven,
    };
  } else if (proven >= 2) {
    verdict = {
      label: 'Developing Profile',
      color: '#D97706',
      score: proven,
    };
  } else {
    verdict = {
      label: 'Needs Work',
      color: '#DC2626',
      score: proven,
    };
  }

  const priority =
    signals.find(s => s.status === 'missing') ||
    signals.find(s => s.status === 'adjacent') ||
    null;

  return {
    ...verdict,
    proven,
    partial,
    missing,
    priority,
  };
}

// ─── AI Assist panel ──────────────────────────────────────────────────────────
function AssistPanel({ signal, profileData, careerContext, onApply, onClose }) {
  const [busy, setBusy]           = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected]   = useState('');
  const [error, setError]         = useState('');
  const [notes, setNotes]         = useState('');

  const generate = async () => {
    setBusy(true);
    setError('');
    setSuggestions([]);
    try {
      const resp = await fetch('/api/ai/profile-development', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field: signal.field,
          profile: {
  headline: profileData.headline || '',
  aboutMe: profileData.aboutMe || '',
  skills: safeArr(profileData.skills).map(s => typeof s === 'string' ? s : s?.name || '').filter(Boolean),
  languages: safeArr(profileData.languages).map(l => typeof l === 'string' ? l : l?.name || '').filter(Boolean),
  education: safeArr(profileData.education),
  certifications: safeArr(profileData.certifications),
  projects: safeArr(profileData.projects),
  workPreferences: profileData.workPreferences || {},
  profileVisibility: profileData.profileVisibility || '',
  location: profileData.location || '',
},
          careerContext: careerContext || null,
          signalContext: {
            signal: signal.key,
            gapReason: signal.gapReason,
            currentStatus: signal.status,
          },
          notes: notes || null,
        }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.error || 'Generation failed');
      const suggs = Array.isArray(json?.suggestions) ? json.suggestions : [];
      if (!suggs.length) throw new Error('No suggestions returned');
      setSuggestions(suggs);
      setSelected(suggs[0]);
    } catch (e) {
      setError(e?.message || 'AI error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {/* Context note */}
      <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,112,67,0.08)', border: '1px solid rgba(255,112,67,0.20)', fontSize: 11, color: '#9A3412', lineHeight: 1.4, fontWeight: 700 }}>
        {signal.gapReason}
      </div>

      {/* Optional context input */}
      <div style={{ display: 'grid', gap: 4 }}>
        <label style={{ fontSize: 10, fontWeight: 800, color: '#64748B', letterSpacing: 0.3 }}>OPTIONAL CONTEXT (targeting, role, goals)</label>
        <input
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g. targeting Director roles in enterprise SaaS, remote..."
          style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', fontSize: 11, color: DARK, outline: 'none', fontFamily: 'inherit' }}
        />
      </div>

      {/* Generate button */}
      <button type="button" onClick={generate} disabled={busy}
        style={{ padding: '9px 14px', borderRadius: 999, border: 'none', background: busy ? 'rgba(255,112,67,0.50)' : ORANGE, color: 'white', fontWeight: 900, fontSize: 12, cursor: busy ? 'not-allowed' : 'pointer' }}>
        {busy ? 'Generating…' : suggestions.length ? 'Regenerate' : '⚡ Generate suggestions'}
      </button>

      {error && (
        <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.20)', fontSize: 11, color: '#991B1B', fontWeight: 700 }}>
          {error}
        </div>
      )}

      {/* Suggestion cards */}
      {suggestions.length > 0 && (
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', letterSpacing: 0.3 }}>SELECT A SUGGESTION</div>
          {suggestions.slice(0, 3).map((s, i) => (
            <button key={i} type="button" onClick={() => setSelected(s)}
              style={{
                textAlign: 'left', padding: '9px 11px', borderRadius: 10, cursor: 'pointer',
                border: selected === s ? `2px solid ${ORANGE}` : '1px solid rgba(0,0,0,0.10)',
                background: selected === s ? 'rgba(255,112,67,0.06)' : 'rgba(255,255,255,0.86)',
                fontSize: 11, color: DARK, lineHeight: 1.5, fontWeight: 600,
                transition: 'all 0.15s',
              }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: selected === s ? ORANGE : '#94A3B8', marginBottom: 3, letterSpacing: 0.3 }}>OPTION {i + 1}</div>
              {String(s).trim()}
            </button>
          ))}
        </div>
      )}

      {/* Editable draft */}
      {selected && (
        <div style={{ display: 'grid', gap: 4 }}>
          <label style={{ fontSize: 10, fontWeight: 800, color: '#64748B', letterSpacing: 0.3 }}>EDIT BEFORE APPLYING</label>
          {signal.field === 'aboutMe' ? (
            <textarea value={selected} onChange={e => setSelected(e.target.value)} rows={5}
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', fontSize: 11, color: DARK, outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5 }} />
          ) : (
            <input value={selected} onChange={e => setSelected(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', fontSize: 11, color: DARK, outline: 'none', fontFamily: 'inherit' }} />
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onClose}
          style={{ padding: '7px 14px', borderRadius: 999, border: '1px solid rgba(0,0,0,0.12)', background: 'white', color: SLATE, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
          Cancel
        </button>
        {selected && onApply && (
          <button type="button" onClick={() => { onApply(signal.field, selected); onClose(); }}
            style={{ padding: '7px 14px', borderRadius: 999, border: 'none', background: ORANGE, color: 'white', fontWeight: 900, fontSize: 11, cursor: 'pointer' }}>
            ✓ Apply to Profile
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ProfileSignalEngine({ profileData = {}, onApply }) {
  const [signals, setSignals]           = useState([]);
  const [verdict, setVerdict]           = useState(null);
  const [activeAssist, setActiveAssist] = useState(null); // signal key
  const [expandedSignal, setExpandedSignal] = useState(null);
  const [careerContext, setCareerContext] = useState(null);
  const debounceRef = useRef(null);

  // Fetch unified career context once on mount
  useEffect(() => {
    fetch('/api/intelligence/context')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.context) setCareerContext(d.context); })
      .catch(() => {});
  }, []);

  // Re-classify signals whenever profileData or careerContext changes (debounced)
useEffect(() => {
  if (debounceRef.current) clearTimeout(debounceRef.current);

  debounceRef.current = setTimeout(() => {
    const mergedProfileData = {
      ...profileData,

      // Resume fallback from unified intelligence context
      primaryResume:
        profileData?.primaryResume ||
        careerContext?.resume ||
        careerContext?.primaryResume ||
        null,

      hasResume:
        Boolean(
          profileData?.primaryResume ||
          careerContext?.resume ||
          careerContext?.primaryResume ||
          careerContext?.maps?.sourceStatus?.hasResume
        ),
    };

    const classified = classifySignals(mergedProfileData);

    setSignals(classified);
    setVerdict(overallVerdict(classified));
  }, 300);

  return () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };
}, [profileData, careerContext]);

  const proven  = signals.filter(s => s.status === 'direct').length;
  const partial = signals.filter(s => s.status === 'adjacent').length;
  const missing = signals.filter(s => s.status === 'missing').length;

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {/* Header */}
      <div style={{ fontSize: 10, fontWeight: 900, color: ORANGE, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Profile Signal Engine
      </div>

      {/* Verdict card */}
{verdict && (
  <div
    style={{
      padding: '14px 14px',
      borderRadius: 14,
      background: 'rgba(15,23,42,0.92)',
      border: `1px solid ${verdict.color}55`,
      boxShadow: `0 10px 24px rgba(0,0,0,0.16), 0 0 0 1px ${verdict.color}22`,
      display: 'grid',
      gap: 10,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 900,
            color: '#CBD5E1',
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          Live Profile Signal
        </div>

        <div style={{ fontWeight: 950, fontSize: 14, color: 'white', lineHeight: 1.15 }}>
          {verdict.label}
        </div>

        <div style={{ fontSize: 10, color: '#CBD5E1', marginTop: 5, lineHeight: 1.35, fontWeight: 600 }}>
          Recruiter visibility is being measured from your live ForgeTomorrow identity.
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 26, fontWeight: 950, color: verdict.color, lineHeight: 1 }}>
          {verdict.score}/8
        </div>
        <div style={{ fontSize: 9, color: '#CBD5E1', fontWeight: 800, marginTop: 3 }}>
          signals
        </div>
      </div>
    </div>

    <div
      style={{
        height: 7,
        borderRadius: 999,
        background: 'rgba(255,255,255,0.14)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.min(100, Math.max(0, (verdict.score / 8) * 100))}%`,
          height: '100%',
          borderRadius: 999,
          background: verdict.color,
        }}
      />
    </div>

    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 9, fontWeight: 900, color: '#BBF7D0' }}>
        {proven} proven
      </span>
      <span style={{ fontSize: 9, fontWeight: 900, color: '#FDE68A' }}>
        {partial} partial
      </span>
      <span style={{ fontSize: 9, fontWeight: 900, color: '#FECACA' }}>
        {missing} missing
      </span>
    </div>
  </div>
)}

{verdict?.priority && (
  <div
    style={{
      borderRadius: 12,
      border: '1px solid rgba(255,112,67,0.22)',
      background: 'rgba(255,255,255,0.88)',
      padding: '12px 14px',
      display: 'grid',
      gap: 6,
      boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
    }}
  >
    <div
      style={{
        fontSize: 10,
        fontWeight: 900,
        color: ORANGE,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      Highest Leverage Improvement
    </div>

    <div
      style={{
        fontSize: 12,
        fontWeight: 800,
        color: DARK,
        lineHeight: 1.4,
      }}
    >
      {verdict.priority.label}
    </div>

    <div
      style={{
        fontSize: 11,
        color: '#475569',
        lineHeight: 1.45,
        fontWeight: 600,
      }}
    >
      {verdict.priority.gapReason}
    </div>

    {verdict.priority.field && (
      <button
        type="button"
        onClick={() => {
          setExpandedSignal(verdict.priority.key);
          setActiveAssist(verdict.priority.key);
        }}
        style={{
          marginTop: 2,
          width: 'fit-content',
          padding: '7px 12px',
          borderRadius: 999,
          border: 'none',
          background: ORANGE,
          color: 'white',
          fontSize: 11,
          fontWeight: 900,
          cursor: 'pointer',
        }}
      >
        ⚡ Improve This Signal
      </button>
    )}
  </div>
)}

      {/* Signal bands */}
<div style={{ display: 'grid', gap: 6 }}>
  {signals.map(sig => {
    const cfg = statusConfig(sig.status);
    const isOpen = activeAssist === sig.key;
    const isExpanded = expandedSignal === sig.key;

    return (
      <div
        key={sig.key}
        style={{
          borderRadius: 10,
          border: `1px solid ${cfg.color}33`,
          background: cfg.bg,
          overflow: 'hidden',
          transition: 'all 0.15s ease',
        }}
      >
        {/* Compact signal row */}
        <div
          onClick={() =>
            setExpandedSignal(isExpanded ? null : sig.key)
          }
          style={{
            padding: '9px 10px',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            {/* LEFT */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                minWidth: 0,
                flex: 1,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  color: cfg.color,
                  flexShrink: 0,
                }}
              >
                {cfg.icon}
              </span>

              <div
                style={{
                  minWidth: 0,
                  display: 'grid',
                  gap: 1,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: DARK,
                    lineHeight: 1.2,
                  }}
                >
                  {sig.label}
                </div>

                <div
                  style={{
                    fontSize: 9,
                    color: '#64748B',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 170,
                  }}
                >
                  {sig.status === 'direct'
                    ? 'Recruiters can clearly validate this signal'
                    : sig.gapReason}
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: cfg.color,
                  background: 'rgba(255,255,255,0.70)',
                  padding: '2px 7px',
                  borderRadius: 999,
                  border: `1px solid ${cfg.color}44`,
                  whiteSpace: 'nowrap',
                }}
              >
                {cfg.label}
              </span>

              <span
                style={{
                  fontSize: 10,
                  color: '#64748B',
                  fontWeight: 900,
                }}
              >
                {isExpanded ? '−' : '+'}
              </span>
            </div>
          </div>

          {/* Expanded content */}
          {isExpanded && (
            <div
              style={{
                marginTop: 10,
                display: 'grid',
                gap: 10,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: cfg.color,
                  fontWeight: 700,
                  lineHeight: 1.45,
                }}
              >
                {sig.description}
              </div>

            {sig.status !== 'direct' && (
			  <div
				style={{
				  fontSize: 10,
				  color: '#475569',
				  lineHeight: 1.45,
				  fontWeight: 600,
				}}
			  >
				<strong>Recruiter interpretation:</strong> this signal is not fully carrying its weight yet. Strengthen this area to make your profile easier to validate, search, and trust.
			  </div>
			)}

              {sig.field && sig.status !== 'direct' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveAssist(isOpen ? null : sig.key);
                  }}
                  style={{
                    width: 'fit-content',
                    fontSize: 10,
                    fontWeight: 900,
                    color: ORANGE,
                    background: 'rgba(255,112,67,0.10)',
                    border: '1px solid rgba(255,112,67,0.25)',
                    borderRadius: 999,
                    padding: '5px 10px',
                    cursor: 'pointer',
                  }}
                >
                  {isOpen ? 'Close AI Assist' : '⚡ AI Assist'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Inline AI Assist panel */}
        {isOpen && (
          <div
            style={{
              borderTop: `1px solid ${cfg.color}22`,
              padding: '10px 10px',
              background: 'rgba(255,255,255,0.82)',
            }}
          >
            <AssistPanel
              signal={sig}
              profileData={profileData}
              careerContext={careerContext}
              onApply={onApply}
              onClose={() => setActiveAssist(null)}
            />
          </div>
        )}
      </div>
    );
  })}
</div>

      {/* Intelligence note */}
      {careerContext && (
        <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, lineHeight: 1.4, paddingTop: 2 }}>
          ⚡ Powered by your ForgeTomorrow career intelligence — suggestions are calibrated to your full profile history, not generic advice.
        </div>
      )}
    </div>
  );
}