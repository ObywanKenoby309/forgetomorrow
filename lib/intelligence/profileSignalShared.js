// lib/intelligence/profileSignalShared.js
// Shared profile signal logic — used by ProfileSignalEngine (React) and packet.zip.js (server)
// No React imports. Pure functions only.
//
// Purpose:
// - Classify profile/portfolio signal quality
// - Keep seeker coaching and recruiter interpretation separate
// - Return richer recruiter-facing intelligence for packet rendering:
//   recruiterInterpretation, evidenceDetected, missingValidation, recruiterRisk,
//   confidenceLevel, signalImpact, evidenceSummary, and seekerCoaching

export function safeArr(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function safeStr(value = '') {
  if (value === null || value === undefined) return '';
  return String(value || '').trim();
}

function objectText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    return value.map(objectText).filter(Boolean).join(' ');
  }

  if (typeof value === 'object') {
    return Object.values(value)
      .map(objectText)
      .filter(Boolean)
      .join(' ');
  }

  return String(value || '');
}

function joinedText(items) {
  return safeArr(items).map(objectText).join(' ').trim();
}

function lowerText(value) {
  return objectText(value).toLowerCase();
}

function compact(items = [], limit = 6) {
  const out = [];
  const seen = new Set();

  for (const item of Array.isArray(items) ? items : []) {
    const text = safeStr(item);
    if (!text) continue;

    const key = text.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(text);

    if (out.length >= limit) break;
  }

  return out;
}

function labelFromItem(item, fallback = '') {
  if (!item) return fallback;
  if (typeof item === 'string') return safeStr(item) || fallback;

  return (
    safeStr(item.name) ||
    safeStr(item.title) ||
    safeStr(item.label) ||
    safeStr(item.degree) ||
    safeStr(item.certification) ||
    safeStr(item.projectName) ||
    safeStr(item.school) ||
    fallback
  );
}

function hasOutcomeText(items) {
  return /\d|%|saved|improved|built|launched|led|reduced|increased|delivered|created|managed|owned|implemented|designed|deployed|grew|cut|lowered|raised|automated|standardized|streamlined/i.test(
    joinedText(items)
  );
}

function countOutcomeItems(items) {
  return safeArr(items).filter((item) =>
    /\d|%|saved|improved|launched|reduced|increased|delivered|implemented|deployed|grew|cut|automated|standardized|streamlined/i.test(objectText(item))
  ).length;
}

function getProfileText(profileData = {}) {
  return [
    profileData.headline,
    profileData.aboutMe,
    joinedText(profileData.skills),
    joinedText(profileData.projects),
    joinedText(profileData.certifications),
    joinedText(profileData.education),
    joinedText(profileData.languages),
    objectText(profileData.primaryResume || profileData.resume || profileData.resumeData),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function getJobText(jobContext = null) {
  if (!jobContext) return '';
  return [
    jobContext.title,
    jobContext.jobTitle,
    jobContext.company,
    jobContext.description,
    jobContext.jobDescription,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function workPreferenceCount(profileData = {}) {
  const wp = profileData.workPreferences || {};
  return [
    wp.workStatus,
    wp.status,
    wp.openTo,
    wp.workType,
    wp.preferredWorkType,
    wp.schedule,
    wp.willingToRelocate,
    wp.startDate,
    wp.earliestStartDate,
    wp.scheduleAvailability,
    ...(Array.isArray(wp.locations) ? wp.locations : []),
    ...(Array.isArray(wp.preferredLocations) ? wp.preferredLocations : []),
  ].filter(Boolean).length;
}

function isPublicOrRecruiterVisible(profileData = {}) {
  return (
    profileData.profileVisibility === 'PUBLIC' ||
    profileData.profileVisibility === 'RECRUITERS_ONLY'
  );
}

function hasResumeAttached(profileData = {}) {
  return Boolean(
    profileData.primaryResume ||
      profileData.hasResume ||
      profileData.resume ||
      profileData.resumeData
  );
}

function credibilityVectors(p = {}) {
  const vectors = [];

  const edu = safeArr(p.education);
  const certs = safeArr(p.certifications);
  const projects = safeArr(p.projects);
  const profileText = getProfileText(p);

  if (edu.length) vectors.push('formal education');
  if (certs.length) vectors.push('certifications / training');

  if (projects.length && hasOutcomeText(projects)) vectors.push('portfolio outcomes');
  else if (projects.length) vectors.push('portfolio work');

  if (/\b(lead|led|leader|leadership|manager|managed|supervisor|supervised|director|owner|owned|mentor|mentored|team of|direct reports|head of|vp|chief|founder)\b/i.test(profileText)) {
    vectors.push('leadership scope');
  }

  if (/\b(military|army|navy|air force|marine|coast guard|veteran|infantry|law enforcement|corrections|police|sheriff|public service|security|firefighter|emt)\b/i.test(profileText)) {
    vectors.push('service background');
  }

  if (/\b(published|patent|portfolio|case study|platform|product|launched|deployed|implementation|go-live|manual|documentation|playbook|archive|system|operating model)\b/i.test(profileText)) {
    vectors.push('documented execution');
  }

  if (/\b(\d+%|\$\d+|\d+\+?\s*(years|yrs|people|users|clients|accounts|teams|projects|tickets|cases|direct reports))\b/i.test(profileText)) {
    vectors.push('quantified experience');
  }

  return Array.from(new Set(vectors));
}

function detectIdentityEvidence(p = {}) {
  const out = [];
  if (safeStr(p.headline).length >= 15) out.push(`Headline present: ${safeStr(p.headline).slice(0, 90)}`);
  if (safeStr(p.location)) out.push(`Location present: ${safeStr(p.location)}`);
  return compact(out, 4);
}

function detectNarrativeEvidence(p = {}) {
  const out = [];
  const about = safeStr(p.aboutMe);
  if (about.length >= 120) out.push('Professional summary contains enough substance to support recruiter review');
  if (/\b(led|built|managed|improved|delivered|created|owned|launched|supported|designed|implemented)\b/i.test(about)) {
    out.push('Summary includes action-oriented professional language');
  }
  if (/\b(goal|mission|direction|seeking|focused|specialize|passion|value)\b/i.test(about)) {
    out.push('Summary communicates professional direction or intent');
  }
  return compact(out, 5);
}

function detectProofEvidence(p = {}) {
  const skills = safeArr(p.skills)
    .map((s) => labelFromItem(s))
    .filter(Boolean);

  const certs = safeArr(p.certifications)
    .map((c) => labelFromItem(c))
    .filter(Boolean);

  return compact(
    [
      skills.length ? `${skills.length} listed skill${skills.length === 1 ? '' : 's'}` : '',
      ...skills.slice(0, 5).map((s) => `Skill: ${s}`),
      ...certs.slice(0, 3).map((c) => `Credential/training: ${c}`),
    ],
    7
  );
}

function detectPortfolioEvidence(p = {}) {
  const projects = safeArr(p.projects);
  const outcomeCount = countOutcomeItems(projects);

  const names = projects
    .map((project, index) => labelFromItem(project, `Project ${index + 1}`))
    .filter(Boolean)
    .slice(0, 5);

  const evidence = [
    projects.length ? `${projects.length} project${projects.length === 1 ? '' : 's'} listed` : '',
    outcomeCount ? `${outcomeCount} project${outcomeCount === 1 ? '' : 's'} include measurable or outcome-oriented language` : '',
    ...names.map((name) => `Project: ${name}`),
  ];

  return compact(evidence, 7);
}

function detectCredentialEvidence(p = {}) {
  const vectors = credibilityVectors(p);
  const edu = safeArr(p.education)
    .map((e) => labelFromItem(e))
    .filter(Boolean);
  const certs = safeArr(p.certifications)
    .map((c) => labelFromItem(c))
    .filter(Boolean);

  return compact(
    [
      ...vectors.map((v) => `Credibility vector: ${v}`),
      ...edu.slice(0, 3).map((e) => `Education: ${e}`),
      ...certs.slice(0, 3).map((c) => `Certification/training: ${c}`),
    ],
    8
  );
}

function detectAvailabilityEvidence(p = {}) {
  const wp = p.workPreferences || {};
  const out = [];

  if (wp.workStatus || wp.status || wp.openTo) out.push(`Work status: ${wp.workStatus || wp.status || wp.openTo}`);
  if (wp.workType || wp.preferredWorkType) out.push(`Work type: ${wp.workType || wp.preferredWorkType}`);
  if (wp.schedule) out.push(`Schedule: ${wp.schedule}`);
  if (wp.willingToRelocate !== undefined && wp.willingToRelocate !== null && String(wp.willingToRelocate).trim()) {
    out.push(`Relocation: ${wp.willingToRelocate}`);
  }
  if (wp.startDate || wp.earliestStartDate) out.push(`Start timing: ${wp.startDate || wp.earliestStartDate}`);
  if (Array.isArray(wp.locations) && wp.locations.length) out.push(`Preferred locations: ${wp.locations.slice(0, 4).join(', ')}`);
  if (Array.isArray(wp.preferredLocations) && wp.preferredLocations.length) out.push(`Preferred locations: ${wp.preferredLocations.slice(0, 4).join(', ')}`);

  return compact(out, 6);
}

function detectLanguageEvidence(p = {}) {
  const languages = safeArr(p.languages)
    .map((l) => labelFromItem(l))
    .filter(Boolean);

  return compact(
    languages.length
      ? languages.map((l) => `Language: ${l}`)
      : ['No language details listed; this should not be treated as a negative signal'],
    5
  );
}

function detectVisibilityEvidence(p = {}) {
  const out = [];
  if (hasResumeAttached(p)) out.push('Primary resume evidence is available');
  if (isPublicOrRecruiterVisible(p)) out.push(`Profile visibility: ${p.profileVisibility}`);
  if (safeStr(p.profileVisibility)) out.push(`Visibility setting present: ${p.profileVisibility}`);
  return compact(out, 5);
}

function evidenceDetectedForSignal(sig, profileData = {}) {
  switch (sig.key) {
    case 'identity':
      return detectIdentityEvidence(profileData);
    case 'narrative':
      return detectNarrativeEvidence(profileData);
    case 'proof':
      return detectProofEvidence(profileData);
    case 'portfolio':
      return detectPortfolioEvidence(profileData);
    case 'credentials':
      return detectCredentialEvidence(profileData);
    case 'availability':
      return detectAvailabilityEvidence(profileData);
    case 'language':
      return detectLanguageEvidence(profileData);
    case 'visibility':
      return detectVisibilityEvidence(profileData);
    default:
      return [];
  }
}

function missingValidationForSignal(sig, profileData = {}) {
  const status = sig.status;
  if (status === 'direct') return [];

  switch (sig.key) {
    case 'identity':
      return compact([
        safeStr(profileData.headline).length < 40 ? 'Sharper headline with role, level, and professional focus' : '',
        !safeStr(profileData.location) ? 'Location or work-market context' : '',
      ]);

    case 'narrative':
      return compact([
        'Clearer value proposition',
        'Specific audience or role direction',
        'Proof of outcomes, scope, or measurable impact',
      ]);

    case 'proof': {
      const skills = safeArr(profileData.skills);
      return compact([
        skills.length < 10 ? 'More role-relevant skills for recruiter search visibility' : '',
        'Clearer separation of technical, operational, leadership, and domain skills',
        'Certifications/training if relevant to target roles',
      ]);
    }

    case 'portfolio': {
      const projects = safeArr(profileData.projects);
      return compact([
        !projects.length ? 'At least one project or proof-of-work entry' : '',
        'Measurable outcomes such as adoption, time saved, revenue influence, cost reduction, quality improvement, or launch scope',
        'Project scope, stakeholder impact, and candidate ownership',
        'Links, artifacts, case studies, screenshots, or documentation where appropriate',
      ]);
    }

    case 'credentials': {
      const vectors = credibilityVectors(profileData);
      return compact([
        !vectors.length ? 'Structured proof of credibility beyond job titles' : '',
        'Education, certifications, training, service background, portfolio outcomes, leadership scope, or documented execution',
        'If formal education is not the strongest proof point, make alternate credibility evidence explicit',
      ]);
    }

    case 'availability':
      return compact([
        'Work status / openness',
        'Preferred work type',
        'Location or remote/hybrid/on-site preference',
        'Start timing or schedule availability',
      ]);

    case 'language':
      return compact([
        'Primary professional language if the candidate wants this signal fully completed',
      ]);

    case 'visibility':
      return compact([
        !hasResumeAttached(profileData) ? 'Primary resume attached to profile/application packet' : '',
        !isPublicOrRecruiterVisible(profileData) ? 'Public or recruiter-visible profile setting' : '',
      ]);

    default:
      return compact(['More explicit evidence would strengthen this signal']);
  }
}

function riskLevelForSignal(status) {
  if (status === 'direct') return 'Low';
  if (status === 'adjacent') return 'Medium';
  return 'High';
}

function confidenceLevelForSignal(sig, profileData = {}) {
  const evidenceCount = evidenceDetectedForSignal(sig, profileData).length;

  if (sig.status === 'direct' && evidenceCount >= 3) return 'High';
  if (sig.status === 'direct') return 'Moderate-High';
  if (sig.status === 'adjacent' && evidenceCount >= 2) return 'Moderate';
  if (sig.status === 'adjacent') return 'Low-Moderate';
  return evidenceCount ? 'Low-Moderate' : 'Low';
}

function recruiterInterpretationForSignal(sig, profileData = {}, jobContext = null) {
  const status = sig.status;
  const evidence = evidenceDetectedForSignal(sig, profileData);
  const jobText = getJobText(jobContext);
  const hasJobContext = Boolean(jobText);

  if (status === 'direct') {
    switch (sig.key) {
      case 'credentials': {
        const vectors = credibilityVectors(profileData);
        return `ForgeTomorrow sees a strong professional credibility signal supported by ${vectors.length ? vectors.join(', ') : 'multiple credibility sources'}. This should be read as practical credibility evidence, not only formal academic pedigree.`;
      }
      case 'portfolio':
        return 'ForgeTomorrow sees project evidence that is recruiter-usable. The portfolio gives the reviewer real work, scope, and outcome signals beyond a traditional resume.';
      case 'visibility':
        return 'ForgeTomorrow sees the candidate as discoverable and easier to validate because resume/profile visibility evidence is available.';
      default:
        return `${sig.label} is clear and recruiter-usable. This area provides visible evidence that supports profile validation${hasJobContext ? ' for this role context' : ''}.`;
    }
  }

  switch (sig.key) {
    case 'identity':
      return status === 'adjacent'
        ? 'ForgeTomorrow sees a basic professional identity signal, but the headline could better clarify role, level, and direction. Recruiters may understand the candidate broadly, but not instantly.'
        : 'ForgeTomorrow does not yet see enough headline identity evidence. Recruiters may have difficulty quickly placing the candidate without opening deeper resume/profile material.';

    case 'narrative':
      return status === 'adjacent'
        ? 'ForgeTomorrow sees a usable professional narrative, but it needs sharper value, direction, and proof. Recruiters may understand the background, but may still need clearer positioning.'
        : 'ForgeTomorrow does not yet see enough narrative context. This makes the profile more dependent on resume parsing and can weaken recruiter confidence in fit.';

    case 'proof':
      return status === 'adjacent'
        ? 'ForgeTomorrow sees some capability evidence, but the skills section is not yet carrying enough search and screening weight. Recruiters may need to infer strengths from resume/project context.'
        : 'ForgeTomorrow sees limited structured skills evidence. This can reduce search visibility even when the candidate has experience elsewhere.';

    case 'portfolio':
      return status === 'adjacent'
        ? 'ForgeTomorrow sees real project activity, but the current portfolio evidence emphasizes work performed more than measurable business impact. Recruiters may view the candidate as capable, while still wanting clearer proof of outcomes, scale, and ownership.'
        : 'ForgeTomorrow does not yet see project or proof-of-work evidence. Recruiters have less context to validate execution beyond resume claims.';

    case 'credentials': {
      const vectors = credibilityVectors(profileData);
      if (status === 'adjacent') {
        return `ForgeTomorrow sees partial professional credibility through ${vectors.length ? vectors.join(', ') : 'available experience signals'}. Recruiters should not treat lack of a university degree as an automatic weakness; they should review execution evidence, service background, leadership scope, certifications, and portfolio proof.`;
      }
      return 'ForgeTomorrow does not yet see enough structured credibility proof. This should not be treated as an automatic rejection, but recruiters may need clearer evidence through education, certifications, training, service background, leadership scope, portfolio outcomes, or documented execution.';
    }

    case 'availability':
      return status === 'adjacent'
        ? 'ForgeTomorrow sees some availability information, but role logistics are not fully clear. Recruiters may still need to confirm location, schedule, work type, or start timing.'
        : 'ForgeTomorrow does not yet see availability details. Recruiters may not know whether the candidate is reachable, open, or aligned to the role logistics.';

    case 'language':
      return 'ForgeTomorrow treats language as an informational signal, not a penalty. If no languages are listed, recruiters should only infer that communication reach has not been specified.';

    case 'visibility':
      return status === 'adjacent'
        ? 'ForgeTomorrow sees partial discoverability. The candidate can be evaluated, but profile visibility or attached resume evidence should be strengthened to improve recruiter validation.'
        : 'ForgeTomorrow sees limited discoverability. The candidate may be harder to find or validate because profile visibility and/or attached resume evidence is incomplete.';

    default:
      return evidence.length
        ? 'ForgeTomorrow sees partial evidence, but the signal needs more validation before it should be treated as a strong proof point.'
        : 'ForgeTomorrow does not yet see enough evidence for this signal. Recruiters should treat this as an area for follow-up rather than an automatic disqualifier.';
  }
}

function signalImpactForSignal(sig) {
  switch (sig.key) {
    case 'identity':
      return 'A clearer identity signal improves first-pass recruiter comprehension and profile click-through confidence.';
    case 'narrative':
      return 'A stronger narrative helps recruiters understand the candidate’s direction, value, and professional story faster.';
    case 'proof':
      return 'More structured skill evidence improves search visibility, screening confidence, and capability validation.';
    case 'portfolio':
      return 'Stronger portfolio outcomes increase recruiter confidence by proving execution, ownership, and business impact beyond resume claims.';
    case 'credentials':
      return 'Clear credibility evidence helps recruiters evaluate trust, preparedness, and professional foundation without over-relying on degree status.';
    case 'availability':
      return 'Clear availability reduces recruiter friction and helps determine whether the candidate can realistically move forward.';
    case 'language':
      return 'Language detail clarifies communication reach, especially for remote, international, customer-facing, or multilingual environments.';
    case 'visibility':
      return 'Visibility and resume access directly affect discoverability, validation, and recruiter follow-through.';
    default:
      return 'Improving this signal increases recruiter confidence and reduces the need for assumptions.';
  }
}

function seekerCoachingForSignal(sig) {
  if (sig.status === 'direct') {
    return 'This signal is already recruiter-usable. Keep it current and make sure it stays aligned to target roles.';
  }

  switch (sig.key) {
    case 'identity':
      return 'Strengthen the headline with role target, seniority, specialization, and a clear value cue.';
    case 'narrative':
      return 'Expand the summary with who you help, what you solve, what evidence supports it, and where you are headed.';
    case 'proof':
      return 'Add more role-relevant skills and organize them around capabilities recruiters actually search for.';
    case 'portfolio':
      return 'Add measurable outcomes to projects: adoption, savings, efficiency, revenue influence, launch scope, users, teams, or stakeholder impact.';
    case 'credentials':
      return 'Add any credibility evidence available: certifications, training, service, leadership scope, portfolio proof, documented execution, or formal education if applicable.';
    case 'availability':
      return 'Complete work preferences so recruiters can understand location, work type, schedule, and start timing.';
    case 'language':
      return 'Add your primary professional language. Add additional languages only if they strengthen your market signal.';
    case 'visibility':
      return 'Attach a primary resume and set profile visibility to Public or Recruiters Only if you want to be discoverable.';
    default:
      return 'Add specific evidence that helps a recruiter validate this signal quickly.';
  }
}

function buildSignalAssessment(sig, profileData = {}, jobContext = null) {
  const evidenceDetected = evidenceDetectedForSignal(sig, profileData);
  const missingValidation = missingValidationForSignal(sig, profileData);
  const recruiterRisk = riskLevelForSignal(sig.status);
  const confidenceLevel = confidenceLevelForSignal(sig, profileData);

  return {
    recruiterInterpretation: recruiterInterpretationForSignal(sig, profileData, jobContext),
    evidenceDetected,
    missingValidation,
    recruiterRisk,
    confidenceLevel,
    signalImpact: signalImpactForSignal(sig),
    seekerCoaching: seekerCoachingForSignal(sig),
    evidenceSummary: evidenceDetected.length
      ? evidenceDetected.slice(0, 3).join(' • ')
      : 'No strong structured evidence detected yet.',
  };
}

export const PROFILE_SIGNALS = [
  {
    key: 'identity',
    label: 'Identity Signal',
    description: 'Headline + name + location clearly communicate who you are',
    field: 'headline',
    fieldLabel: 'Headline',
    check: (p) => {
      const h = safeStr(p.headline);
      if (h.length >= 40) return 'direct';
      if (h.length >= 15) return 'adjacent';
      return 'missing';
    },
    gap: (p) => {
      const h = safeStr(p.headline);
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
      const a = safeStr(p.aboutMe);
      if (a.length >= 400) return 'direct';
      if (a.length >= 120) return 'adjacent';
      return 'missing';
    },
    gap: (p) => {
      const a = safeStr(p.aboutMe);
      if (!a) return 'No professional summary — recruiters skip profiles without one';
      if (a.length < 120) return 'Summary too brief — needs more substance and voice';
      return 'Summary could be stronger — add impact or direction';
    },
  },
  {
    key: 'proof',
    label: 'Proof Signal',
    description: 'Skills and capability evidence demonstrate what the candidate can actually do',
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
    description: 'Projects show real work, outcomes, ownership, and scope',
    field: 'projects',
    fieldLabel: 'Projects',
    check: (p) => {
      const proj = safeArr(p.projects);
      const withOutcomes = proj.filter((pr) => {
        const text = objectText(pr);
        return /\d|%|saved|improved|built|launched|led|reduced|increased|delivered|implemented|deployed|automated|standardized|streamlined/i.test(text);
      });
      if (withOutcomes.length >= 2) return 'direct';
      if (proj.length >= 1) return 'adjacent';
      return 'missing';
    },
    gap: (p) => {
      const proj = safeArr(p.projects);
      if (!proj.length) return 'No portfolio projects — major gap for recruiters evaluating real work';
      return 'Projects need measurable outcomes — add metrics, results, scope, or impact';
    },
  },
  {
    key: 'credentials',
    label: 'Professional Credibility Signal',
    description: 'Credibility can come from education, certifications, training, service, leadership, portfolio proof, and measurable execution — not only a university degree',
    field: 'education',
    fieldLabel: 'Professional Credibility',
    check: (p) => {
      const vectors = credibilityVectors(p);
      if (vectors.length >= 3) return 'direct';
      if (vectors.length >= 1) return 'adjacent';
      return 'missing';
    },
    gap: (p) => {
      const vectors = credibilityVectors(p);
      if (!vectors.length) {
        return 'No structured credibility evidence yet — add education, certifications, training, service, leadership, portfolio outcomes, or documented execution';
      }
      if (vectors.length < 3) {
        return `Credibility is partially supported by ${vectors.join(', ')} — add another credibility proof point if available`;
      }
      return `Credibility is supported by ${vectors.join(', ')}`;
    },
  },
  {
    key: 'availability',
    label: 'Availability Signal',
    description: 'Work preferences show recruiters whether role logistics are realistic',
    field: 'workPreferences',
    fieldLabel: 'Work Preferences',
    check: (p) => {
      const filled = workPreferenceCount(p);
      if (filled >= 4) return 'direct';
      if (filled >= 1) return 'adjacent';
      return 'missing';
    },
    gap: (p) => {
      const filled = workPreferenceCount(p);
      if (!filled) return 'No work preferences set — recruiters cannot determine availability';
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
      return 'Language signal is sufficient unless additional languages strengthen the role context';
    },
  },
  {
    key: 'visibility',
    label: 'Visibility Signal',
    description: 'Public profile, recruiter visibility, and primary resume access make the candidate easier to validate',
    field: null,
    fieldLabel: null,
    check: (p) => {
      const hasResume = hasResumeAttached(p);
      const isPublic = isPublicOrRecruiterVisible(p);
      if (hasResume && isPublic) return 'direct';
      if (hasResume || isPublic) return 'adjacent';
      return 'missing';
    },
    gap: (p) => {
      const hasResume = hasResumeAttached(p);
      const isPublic = isPublicOrRecruiterVisible(p);
      if (!hasResume && !isPublic) return 'Profile is private and no resume attached — invisible to recruiters';
      if (!hasResume) return 'No primary resume attached — recruiters cannot download or validate resume evidence';
      return 'Set profile visibility to Public or Recruiters Only to be found';
    },
  },
];

export function classifySignals(profileData = {}, jobContext = null) {
  const baseSignals = PROFILE_SIGNALS.map((sig) => {
    const status = sig.check(profileData);
    const next = {
      ...sig,
      status,
      gapReason: sig.gap(profileData),
    };

    return {
      ...next,
      ...buildSignalAssessment(next, profileData, jobContext),
    };
  });

  const jdText = getJobText(jobContext);
  if (!jdText) return baseSignals;

  const profileText = getProfileText(profileData);
  if (!profileText) return baseSignals;

  return baseSignals.map((sig) => {
    if (sig.status === 'missing') return sig;

    const labelWords = safeStr(sig.label)
      .toLowerCase()
      .replace('signal', '')
      .split(/\s+/)
      .filter((w) => w.length >= 4);

    const hasJobOverlap = labelWords.some((w) => jdText.includes(w));

    if (!hasJobOverlap) return sig;

    const adjusted = {
      ...sig,
      gapReason:
        sig.status === 'direct'
          ? `${sig.label} is present and relevant to this job context.`
          : `${sig.label} is partially present, but should be strengthened for this job context.`,
      jobContextRelevant: true,
    };

    return {
      ...adjusted,
      ...buildSignalAssessment(adjusted, profileData, jobContext),
    };
  });
}

export function statusConfig(status) {
  if (status === 'direct') {
    return {
      label: 'Proven',
      riskLabel: 'Low Risk',
      color: '#15803D',
      bg: 'rgba(22,163,74,0.10)',
      icon: '✓',
    };
  }

  if (status === 'adjacent') {
    return {
      label: 'Partial',
      riskLabel: 'Medium Risk',
      color: '#D97706',
      bg: 'rgba(234,179,8,0.10)',
      icon: '~',
    };
  }

  return {
    label: 'Missing',
    riskLabel: 'High Risk',
    color: '#DC2626',
    bg: 'rgba(220,38,38,0.08)',
    icon: '✗',
  };
}

export function overallVerdict(signals = []) {
  const proven = signals.filter((s) => s.status === 'direct').length;
  const partial = signals.filter((s) => s.status === 'adjacent').length;
  const missing = signals.filter((s) => s.status === 'missing').length;

  let verdict;

  if (proven >= 6) verdict = { label: 'Strong Profile', color: '#15803D', score: proven };
  else if (proven >= 4) verdict = { label: 'Competitive Profile', color: '#0EA5E9', score: proven };
  else if (proven >= 2) verdict = { label: 'Developing Profile', color: '#D97706', score: proven };
  else verdict = { label: 'Needs Work', color: '#DC2626', score: proven };

  const priority =
    signals.find((s) => s.status === 'missing') ||
    signals.find((s) => s.status === 'adjacent') ||
    null;

  return { ...verdict, proven, partial, missing, priority };
}

// Converts overallVerdict output to a 0-100 percentage score
// for use in packet PDF and unified WHY scoring
export function signalScoreToPercent(verdict) {
  if (!verdict) return null;
  return Math.round((verdict.proven / 8) * 100);
}

// JD-aware profile signal score — same engine, JD context injected
// Zero API cost — pure JS computation
export function signalScoreVsJD(profileData, jobContext) {
  if (!profileData) return null;

  const signals = classifySignals(profileData, jobContext || null);
  const verdict = overallVerdict(signals);
  const score = signalScoreToPercent(verdict);

  const jdText = getJobText(jobContext);
  const hasJDContext = Boolean(jdText);

  return {
    score,
    label: verdict.label,
    proven: verdict.proven,
    partial: verdict.partial,
    missing: verdict.missing,
    hasJDContext,
    signals: signals.map((s) => ({
      key: s.key,
      label: s.label,
      status: s.status,
      gapReason: s.gapReason,
      description: s.description,
      recruiterInterpretation: s.recruiterInterpretation,
      evidenceDetected: s.evidenceDetected,
      missingValidation: s.missingValidation,
      recruiterRisk: s.recruiterRisk,
      confidenceLevel: s.confidenceLevel,
      signalImpact: s.signalImpact,
      seekerCoaching: s.seekerCoaching,
      evidenceSummary: s.evidenceSummary,
      jobContextRelevant: Boolean(s.jobContextRelevant),
    })),
  };
}
