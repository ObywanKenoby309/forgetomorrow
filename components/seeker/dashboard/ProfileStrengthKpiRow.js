// components/seeker/dashboard/ProfileStrengthKpiRow.js
// Recruiter-facing profile signal row for the seeker dashboard.
// Self-contained: fetches profile data, computes strength signals client-side
// using the same WHY engine intelligence as profile-analytics.js.
// All 5 tiles route to /profile-analytics?tab=strength on click.

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { inferCandidateOperationalProfile } from '@/lib/intelligence/operationalInference';
import { classifySignals, overallVerdict, signalScoreToPercent } from '@/lib/intelligence/profileSignalShared';

// ─── Color tokens per signal value ───────────────────────────────────────────
function tileColors(label, value) {
  const v = String(value || '').toLowerCase();

  // Validation Risk is inverted — Low is good, High is bad
  if (label === 'Validation Risk') {
    if (v === 'low')      return { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' };
    if (v === 'moderate') return { bg: '#FFF8E1', text: '#F57F17', border: '#FFE082' };
    return                       { bg: '#FDECEA', text: '#C62828', border: '#EF9A9A' };
  }

  // All other signals — positive values are green, negative red
  if (['strong', 'available', 'advance-worthy'].includes(v))
    return { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' };
  if (['competitive', 'building', 'partial'].includes(v))
    return { bg: '#FFF8E1', text: '#F57F17', border: '#FFE082' };
  if (['developing', 'limited', 'missing', 'needs work'].includes(v))
    return { bg: '#FDECEA', text: '#C62828', border: '#EF9A9A' };

  return { bg: '#ECEFF1', text: '#37474F', border: '#B0BEC5' };
}

// ─── Helpers (mirrors profile-analytics.js) ───────────────────────────────────
function safeArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === 'object' && Array.isArray(v.items)) return v.items.filter(Boolean);
  if (typeof v === 'string') { try { return JSON.parse(v).filter(Boolean); } catch { return []; } }
  return [];
}

function skillNamesFromAny(s) {
  return safeArray(s)
    .map((x) => (typeof x === 'string' ? x : x?.name || x?.label || ''))
    .map((v) => String(v || '').trim())
    .filter(Boolean);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProfileStrengthKpiRow({ isMobile = false }) {
  const router = useRouter();

  const chrome = String(router.query?.chrome || '').toLowerCase();
  const dest = `/profile-analytics?tab=strength${chrome ? `&chrome=${chrome}` : ''}`;

  const [profileDetails, setProfileDetails] = useState(null);
  const [primaryResume, setPrimaryResume]   = useState(null);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [dRes, pRes] = await Promise.all([
          fetch('/api/profile/details'),
          fetch('/api/profile/primaries'),
        ]);
        const dJson = await dRes.json().catch(() => ({}));
        const pJson = await pRes.json().catch(() => ({}));
        if (!alive) return;
        setProfileDetails(dJson?.details || dJson || null);
        setPrimaryResume(pJson?.primaryResume || null);
      } catch { /* silent */ }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const signals = useMemo(() => {
    if (!profileDetails) return null;

    const skills = Array.from(new Set([
      ...skillNamesFromAny(profileDetails?.skillsJson),
      ...skillNamesFromAny(profileDetails?.skills),
      ...skillNamesFromAny(profileDetails?.skillsProfile),
    ])).filter(Boolean).slice(0, 40);

    const projects = safeArray(
      profileDetails?.projectsJson || profileDetails?.projects || profileDetails?.portfolioProjects
    );

    const experience = safeArray(
      profileDetails?.experienceJson || profileDetails?.experience || profileDetails?.workHistory
    );

    const certifications = safeArray(
      profileDetails?.certificationsJson || profileDetails?.certifications
    );

    const education = safeArray(
      profileDetails?.educationJson || profileDetails?.education
    );

    const languages = safeArray(
      profileDetails?.languagesJson || profileDetails?.languages
    ).map((x) => (typeof x === 'string' ? x : x?.name || x?.label || '')).filter(Boolean);

    const hasResume    = Boolean(primaryResume?.id);
    const workPrefs    = profileDetails?.workPreferences || {};

    const signalData = {
      headline:          String(profileDetails?.headline || '').trim(),
      aboutMe:           String(profileDetails?.aboutMe || profileDetails?.summary || '').trim(),
      skills,
      languages,
      education,
      certifications,
      projects,
      workPreferences:   workPrefs,
      profileVisibility: profileDetails?.profileVisibility || 'PUBLIC',
      location:          profileDetails?.location || '',
      primaryResume:     primaryResume || null,
      hasResume,
    };

    const profileSignals  = classifySignals(signalData, null);
    const verdict         = overallVerdict(profileSignals);
    const score           = signalScoreToPercent(verdict) ?? 0;

    const operationalInference = inferCandidateOperationalProfile({ experience, skills, projects, hasResume });

    const proven   = profileSignals.filter((s) => s.status === 'direct');
    const partial  = profileSignals.filter((s) => s.status === 'adjacent');
    const missing  = profileSignals.filter((s) => s.status === 'missing');

    const portfolioSignal = profileSignals.find((s) => s.key === 'portfolio');

    const professionalSignal   = score >= 75 ? 'Strong' : score >= 50 ? 'Competitive' : score >= 25 ? 'Developing' : 'Needs Work';
    const executionVisibility  = projects.length || operationalInference.signals?.length >= 5 ? 'Strong' : operationalInference.signals?.length ? 'Building' : 'Limited';
    const validationRisk       = missing.length >= 3 ? 'High' : (missing.length || partial.length >= 3) ? 'Moderate' : 'Low';
    const portfolioDepth       = portfolioSignal?.status === 'direct' ? 'Strong' : portfolioSignal?.status === 'adjacent' ? 'Partial' : 'Missing';
    const resumeAccess         = hasResume ? 'Available' : 'Missing';

    return { professionalSignal, executionVisibility, validationRisk, portfolioDepth, resumeAccess };
  }, [profileDetails, primaryResume]);

  const tiles = [
    { label: 'Professional Signal',  value: signals?.professionalSignal  ?? '—' },
    { label: 'Execution Visibility', value: signals?.executionVisibility  ?? '—' },
    { label: 'Validation Risk',      value: signals?.validationRisk       ?? '—' },
    { label: 'Portfolio Depth',      value: signals?.portfolioDepth       ?? '—' },
    { label: 'Resume Access',        value: signals?.resumeAccess         ?? '—' },
  ];

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, minmax(0,1fr))' : 'repeat(5, minmax(0,1fr))',
    gap: isMobile ? 8 : 12,
    cursor: loading ? 'default' : 'pointer',
  };

  const handleClick = () => { if (!loading) router.push(dest); };
  const handleKey   = (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); };

  if (loading) {
    return (
      <div style={gridStyle}>
        {tiles.map(({ label }) => (
          <div
            key={label}
            style={{
              background: '#ECEFF1',
              border: '1px solid #B0BEC5',
              borderRadius: 10,
              padding: isMobile ? '6px 4px' : '10px 12px',
              textAlign: 'center',
              minHeight: isMobile ? 52 : 62,
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      style={gridStyle}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKey}
      aria-label="View recruiter profile read"
    >
      {tiles.map(({ label, value }) => {
        const c = tileColors(label, value);
        return (
          <div
            key={label}
            style={{
              background: c.bg,
              color: c.text,
              border: `1px solid ${c.border}`,
              borderRadius: 10,
              padding: isMobile ? '6px 4px' : '10px 12px',
              display: 'grid',
              gap: isMobile ? 2 : 4,
              textAlign: 'center',
              minWidth: 0,
            }}
          >
            <div
              style={{
                fontSize: isMobile ? 9 : 11,
                fontWeight: 700,
                opacity: 0.88,
                lineHeight: 1.1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                paddingLeft: isMobile ? 2 : 4,
                paddingRight: isMobile ? 2 : 4,
              }}
            >
              {label}
            </div>
            <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, lineHeight: 1.1 }}>
              {value}
            </div>
          </div>
        );
      })}
    </div>
  );
}