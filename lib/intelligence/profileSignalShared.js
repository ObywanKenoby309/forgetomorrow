// lib/intelligence/profileSignalShared.js
// Shared profile signal logic — used by ProfileSignalEngine (React) and packet.zip.js (server)
// No React imports. Pure functions only.

export function safeArr(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === 'string') {
    try { const p = JSON.parse(v); return Array.isArray(p) ? p.filter(Boolean) : []; } catch { return []; }
  }
  return [];
}

export const PROFILE_SIGNALS = [
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
        wp.workStatus, wp.workType, wp.schedule, wp.willingToRelocate,
        wp.startDate, wp.scheduleAvailability,
        ...(Array.isArray(wp.locations) ? wp.locations : []),
      ].filter(Boolean).length;
      if (filled >= 4) return 'direct';
      if (filled >= 1) return 'adjacent';
      return 'missing';
    },
    gap: (p) => {
      const wp = p.workPreferences || {};
      const filled = [
        wp.workStatus, wp.workType, wp.schedule, wp.willingToRelocate,
        wp.startDate, wp.scheduleAvailability,
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

export function classifySignals(profileData, jobContext = null) {
  const baseSignals = PROFILE_SIGNALS.map(sig => ({
    ...sig,
    status: sig.check(profileData),
    gapReason: sig.gap(profileData),
  }));
  if (!jobContext) return baseSignals;
  const jdText = String(jobContext?.jobDescription || jobContext?.description || '').toLowerCase();
  const jobTitle = String(jobContext?.title || jobContext?.jobTitle || '').toLowerCase();
  if (!jdText && !jobTitle) return baseSignals;
  const profileText = [
    profileData?.headline,
    profileData?.aboutMe,
    safeArr(profileData?.skills).join(' '),
    safeArr(profileData?.projects).map((p) =>
      typeof p === 'string' ? p : `${p?.title || ''} ${p?.description || ''} ${p?.outcome || ''}`
    ).join(' '),
    safeArr(profileData?.certifications).join(' '),
    safeArr(profileData?.education).map((e) =>
      typeof e === 'string' ? e : `${e?.degree || ''} ${e?.field || ''} ${e?.school || ''}`
    ).join(' '),
  ].filter(Boolean).join(' ').toLowerCase();
  return baseSignals.map((sig) => {
    if (!profileText) return sig;
    if (sig.status === 'missing') return sig;
    const labelWords = String(sig.label || '').toLowerCase().replace('signal', '').split(/\s+/).filter((w) => w.length >= 4);
    const hasJobOverlap = labelWords.some((w) => jdText.includes(w) || jobTitle.includes(w));
    if (!hasJobOverlap) return sig;
    return {
      ...sig,
      gapReason: sig.status === 'direct'
        ? `${sig.label} is present and relevant to this job context.`
        : `${sig.label} is partially present, but should be strengthened for this job context.`,
    };
  });
}

export function statusConfig(status) {
  if (status === 'direct')   return { label: 'Proven',  riskLabel: 'Low Risk',    color: '#15803D', bg: 'rgba(22,163,74,0.10)',  icon: '✓' };
  if (status === 'adjacent') return { label: 'Partial', riskLabel: 'Medium Risk', color: '#D97706', bg: 'rgba(234,179,8,0.10)',  icon: '~' };
  return                            { label: 'Missing', riskLabel: 'High Risk',   color: '#DC2626', bg: 'rgba(220,38,38,0.08)', icon: '✗' };
}

export function overallVerdict(signals) {
  const proven  = signals.filter(s => s.status === 'direct').length;
  const partial = signals.filter(s => s.status === 'adjacent').length;
  const missing = signals.filter(s => s.status === 'missing').length;
  let verdict;
  if (proven >= 6)      verdict = { label: 'Strong Profile',      color: '#15803D', score: proven };
  else if (proven >= 4) verdict = { label: 'Competitive Profile', color: '#0EA5E9', score: proven };
  else if (proven >= 2) verdict = { label: 'Developing Profile',  color: '#D97706', score: proven };
  else                  verdict = { label: 'Needs Work',          color: '#DC2626', score: proven };
  const priority =
    signals.find(s => s.status === 'missing') ||
    signals.find(s => s.status === 'adjacent') ||
    null;
  return { ...verdict, proven, partial, missing, priority };
}

// Converts overallVerdict output to a 0-100 percentage score
// for use in packet PDF and unified WHY scoring
export function signalScoreToPercent(verdict) {
  if (!verdict) return null;
  return Math.round((verdict.proven / 8) * 100);
}