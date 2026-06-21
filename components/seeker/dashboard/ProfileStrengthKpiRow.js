// components/seeker/dashboard/ProfileStrengthKpiRow.js
// Recruiter-facing profile signal row for the seeker dashboard.

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { inferCandidateOperationalProfile } from '@/lib/intelligence/operationalInference';
import { classifySignals, overallVerdict, signalScoreToPercent } from '@/lib/intelligence/profileSignalShared';

function tileColors(label, value) {
  const v = String(value || '').toLowerCase();

  if (label === 'Validation Risk') {
    if (v === 'low') return { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' };
    if (v === 'moderate') return { bg: '#FFF8E1', text: '#F57F17', border: '#FFE082' };
    return { bg: '#FDECEA', text: '#C62828', border: '#EF9A9A' };
  }

  if (['strong', 'available', 'advance-worthy'].includes(v)) return { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' };
  if (['competitive', 'building', 'partial'].includes(v)) return { bg: '#FFF8E1', text: '#F57F17', border: '#FFE082' };
  if (['developing', 'limited', 'missing', 'needs work'].includes(v)) return { bg: '#FDECEA', text: '#C62828', border: '#EF9A9A' };

  return { bg: '#ECEFF1', text: '#37474F', border: '#B0BEC5' };
}

function safeParse(v) {
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

function safeArray(v) {
  const parsed = safeParse(v);
  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed.filter(Boolean);
  if (typeof parsed === 'object' && Array.isArray(parsed.items)) return parsed.items.filter(Boolean);
  if (typeof parsed === 'object' && Array.isArray(parsed.data)) return parsed.data.filter(Boolean);
  return [];
}

function safeObject(v) {
  const parsed = safeParse(v);
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
}

function firstValue(...values) {
  return values.find((v) => v !== undefined && v !== null && String(v).trim() !== '') || '';
}

function skillNamesFromAny(s) {
  return safeArray(s)
    .map((x) => (typeof x === 'string' ? x : x?.name || x?.label || x?.title || ''))
    .map((v) => String(v || '').trim())
    .filter(Boolean);
}

function unwrapDetails(json) {
  return (
    json?.details ||
    json?.profileDetails ||
    json?.profile ||
    json?.user?.profileDetails ||
    json?.user?.profile ||
    json?.data?.details ||
    json?.data?.profileDetails ||
    json?.data?.profile ||
    json?.data ||
    json ||
    null
  );
}

function unwrapPrimaryResume(json) {
  return (
    json?.primaryResume ||
    json?.resume ||
    json?.primary ||
    json?.data?.primaryResume ||
    json?.data?.resume ||
    json?.data?.primary ||
    null
  );
}

function hasResumeEvidence(primaryResume, profileDetails) {
  return Boolean(
    primaryResume?.id ||
      primaryResume?.resumeId ||
      primaryResume?.url ||
      primaryResume?.fileUrl ||
      primaryResume?.title ||
      primaryResume?.name ||
      profileDetails?.primaryResumeId ||
      profileDetails?.resumeId ||
      profileDetails?.hasResume ||
      profileDetails?.primaryResume ||
      profileDetails?.resume ||
      profileDetails?.resumeData
  );
}

export default function ProfileStrengthKpiRow({ isMobile = false }) {
  const router = useRouter();

  const chrome = String(router.query?.chrome || '').toLowerCase();
  const dest = `/profile-analytics?tab=strength${chrome ? `&chrome=${chrome}` : ''}`;

  const [profileDetails, setProfileDetails] = useState(null);
  const [primaryResume, setPrimaryResume] = useState(null);
  const [loading, setLoading] = useState(true);

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

        setProfileDetails(unwrapDetails(dJson));
        setPrimaryResume(unwrapPrimaryResume(pJson));
      } catch {
        if (alive) {
          setProfileDetails(null);
          setPrimaryResume(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const signals = useMemo(() => {
    if (!profileDetails) return null;

    const workPrefs = safeObject(
      profileDetails?.workPreferences ||
        profileDetails?.workPreferencesJson ||
        profileDetails?.preferencesJson ||
        profileDetails?.preferences
    );

    const skills = Array.from(
      new Set([
        ...skillNamesFromAny(profileDetails?.skillsJson),
        ...skillNamesFromAny(profileDetails?.skills),
        ...skillNamesFromAny(profileDetails?.skillsProfile),
        ...skillNamesFromAny(profileDetails?.skillsResume),
        ...skillNamesFromAny(profileDetails?.skillSet),
      ])
    )
      .filter(Boolean)
      .slice(0, 40);

    const projects = [
      ...safeArray(profileDetails?.projectsJson),
      ...safeArray(profileDetails?.projects),
      ...safeArray(profileDetails?.portfolioProjects),
      ...safeArray(profileDetails?.portfolioItems),
      ...safeArray(profileDetails?.projectHighlights),
    ];

    const experience = [
      ...safeArray(profileDetails?.experienceJson),
      ...safeArray(profileDetails?.experience),
      ...safeArray(profileDetails?.workHistory),
      ...safeArray(profileDetails?.employmentHistory),
    ];

    const certifications = [
      ...safeArray(profileDetails?.certificationsJson),
      ...safeArray(profileDetails?.certifications),
      ...safeArray(profileDetails?.trainingJson),
      ...safeArray(profileDetails?.training),
    ];

    const education = [
      ...safeArray(profileDetails?.educationJson),
      ...safeArray(profileDetails?.education),
      ...safeArray(profileDetails?.educationList),
    ];

    const languages = [
      ...safeArray(profileDetails?.languagesJson),
      ...safeArray(profileDetails?.languages),
    ]
      .map((x) => (typeof x === 'string' ? x : x?.name || x?.label || ''))
      .filter(Boolean);

    const hasResume = hasResumeEvidence(primaryResume, profileDetails);

    const signalData = {
      headline: String(firstValue(profileDetails?.headline, profileDetails?.professionalHeadline, profileDetails?.title)).trim(),
      aboutMe: String(firstValue(profileDetails?.aboutMe, profileDetails?.summary, profileDetails?.bio, profileDetails?.professionalSummary)).trim(),
      skills,
      languages,
      education,
      certifications,
      projects,
      workPreferences: workPrefs,
      profileVisibility: String(firstValue(profileDetails?.profileVisibility, profileDetails?.visibility, 'PUBLIC')).toUpperCase(),
      location: String(firstValue(profileDetails?.location, profileDetails?.city, profileDetails?.region)).trim(),
      primaryResume: primaryResume || profileDetails?.primaryResume || profileDetails?.resume || null,
      hasResume,
    };

    const profileSignals = classifySignals(signalData, null);
    const verdict = overallVerdict(profileSignals);
    const score = signalScoreToPercent(verdict) ?? 0;

    const operationalInference = inferCandidateOperationalProfile({
      experience,
      skills,
      projects,
      hasResume,
    });

    const partial = profileSignals.filter((s) => s.status === 'adjacent');
    const missing = profileSignals.filter((s) => s.status === 'missing');
    const portfolioSignal = profileSignals.find((s) => s.key === 'portfolio');

    const professionalSignal = score >= 75 ? 'Strong' : score >= 50 ? 'Competitive' : score >= 25 ? 'Developing' : 'Needs Work';
    const executionVisibility = projects.length || operationalInference.signals?.length >= 5 ? 'Strong' : operationalInference.signals?.length ? 'Building' : 'Limited';
    const validationRisk = missing.length >= 3 ? 'High' : missing.length || partial.length >= 3 ? 'Moderate' : 'Low';
    const portfolioDepth = portfolioSignal?.status === 'direct' ? 'Strong' : portfolioSignal?.status === 'adjacent' ? 'Partial' : 'Missing';
    const resumeAccess = hasResume ? 'Available' : 'Missing';

    return { professionalSignal, executionVisibility, validationRisk, portfolioDepth, resumeAccess };
  }, [profileDetails, primaryResume]);

  const tiles = [
    { label: 'Professional Signal', value: signals?.professionalSignal ?? '—' },
    { label: 'Execution Visibility', value: signals?.executionVisibility ?? '—' },
    { label: 'Validation Risk', value: signals?.validationRisk ?? '—' },
    { label: 'Portfolio Depth', value: signals?.portfolioDepth ?? '—' },
    { label: 'Resume Access', value: signals?.resumeAccess ?? '—' },
  ];

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, minmax(0,1fr))' : 'repeat(5, minmax(0,1fr))',
    gap: isMobile ? 8 : 12,
    cursor: loading ? 'default' : 'pointer',
  };

  const handleClick = () => {
    if (!loading) router.push(dest);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') handleClick();
  };

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