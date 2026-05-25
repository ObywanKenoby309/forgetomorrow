// lib/intelligence/professionalOperatingProfileEngine.js
// ForgeTomorrow Professional Operating Profile Engine
// Purpose: convert seeker-owned reflection + profile/resume/project evidence into
// an explainable Professional Operating Profile.
// Pure functions only. No Prisma. No HTTP. No React.

import {
  detectBehavioralSignals,
  detectCapabilityMatches,
} from '@/lib/intelligence/operationalInference';

function safe(value = '') {
  return String(value || '').trim();
}

function safeLower(value = '') {
  return safe(value).toLowerCase();
}

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return value
        .split(/[,|]/g)
        .map((item) => safe(item))
        .filter(Boolean);
    }
  }

  return [];
}

function textOf(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(textOf).filter(Boolean).join(' ');
  if (typeof value === 'object') return Object.values(value).map(textOf).filter(Boolean).join(' ');
  return String(value || '');
}

function unique(items = [], limit = 10) {
  const out = [];
  const seen = new Set();

  for (const item of Array.isArray(items) ? items : []) {
    const clean = safe(item);
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
    if (out.length >= limit) break;
  }

  return out;
}

function labelizeKey(key = '') {
  return safe(key)
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function optionLabel(value = '', fallback = '') {
  const map = {
    systems: 'systems, process, and operational improvement',
    people: 'people support, guidance, trust, and communication',
    execution: 'execution, delivery, and visible progress',
    strategy: 'strategy, direction-setting, and complex problem solving',

    high: 'high autonomy',
    medium: 'balanced structure and autonomy',
    low: 'clear structure and close alignment',

    calm: 'stabilizing pressure calmly',
    direct: 'deciding and acting quickly under pressure',
    collaborative: 'coordinating people and context under pressure',
    reflective: 'pausing, assessing, and choosing carefully under pressure',

    hands_on: 'hands-on practice',
    documentation: 'documentation and written reference',
    mentorship: 'mentorship and guided context',
    structured_training: 'structured training',
    trial_error: 'testing, iteration, and learning by doing',

    mission: 'mission and purpose',
    mastery: 'mastery and craft improvement',
    impact: 'visible impact',
    ownership: 'ownership and trust',
    growth: 'growth and upward movement',
    stability: 'stability and reliability',
    recognition: 'recognition for real contribution',

    builder: 'building through challenges',
    stabilizer: 'stabilizing challenges',
    solver: 'solving practical problems',
    strategist: 'reframing challenges strategically',
    challenger: 'challenging broken assumptions',
  };

  return map[value] || fallback || value;
}

function extractEvidenceLines(items = [], limit = 5) {
  return unique(
    toArray(items)
      .map((item) => {
        if (typeof item === 'string') return item;
        if (!item || typeof item !== 'object') return '';

        const title = safe(item.title || item.name || item.projectName || item.company || item.role);
        const description = safe(
          item.description ||
            item.summary ||
            item.details ||
            item.impact ||
            toArray(item.highlights || item.bullets).join(' ')
        );

        return [title, description].filter(Boolean).join(': ');
      })
      .filter(Boolean),
    limit
  );
}

function buildEvidenceSourceText(identityContext = {}) {
  const profileText = [
    identityContext.headline,
    identityContext.aboutMe,
    textOf(identityContext.skills),
    textOf(identityContext.education),
    textOf(identityContext.languages),
    textOf(identityContext.workPreferences),
  ]
    .filter(Boolean)
    .join(' ');

  const resume = identityContext.resume || {};

  const resumeText = [
    resume.summary,
    textOf(resume.skills),
    textOf(resume.experience),
    textOf(resume.certifications),
  ]
    .filter(Boolean)
    .join(' ');

  const projectText = textOf(resume.projects || identityContext.projects);

  return {
    profileText,
    resumeText,
    projectText,
    combinedText: [profileText, resumeText, projectText].filter(Boolean).join(' '),
  };
}

function reflectionSignals(answers = {}) {
  const signals = [];

  if (answers.energy === 'systems') signals.push('Systems thinker');
  if (answers.energy === 'people') signals.push('Relationship builder');
  if (answers.energy === 'execution') signals.push('Execution driver');
  if (answers.energy === 'strategy') signals.push('Strategic navigator');

  if (answers.pressure === 'calm') signals.push('Calm under pressure');
  if (answers.pressure === 'direct') signals.push('Decisive problem solver');
  if (answers.pressure === 'collaborative') signals.push('Coordinated responder');
  if (answers.pressure === 'reflective') signals.push('Measured decision maker');

  if (answers.autonomy === 'high') signals.push('Independent operator');
  if (answers.ambiguity === 'high') signals.push('Ambiguity-capable builder');

  if (answers.learningStyle === 'hands_on') signals.push('Hands-on learner');
  if (answers.learningStyle === 'documentation') signals.push('Documentation-based learner');
  if (answers.learningStyle === 'mentorship') signals.push('Context-driven learner');
  if (answers.learningStyle === 'structured_training') signals.push('Structured learner');
  if (answers.learningStyle === 'trial_error') signals.push('Iterative learner');

  if (answers.motivation === 'mission') signals.push('Mission-driven contributor');
  if (answers.motivation === 'mastery') signals.push('Mastery-driven professional');
  if (answers.motivation === 'impact') signals.push('Impact-driven operator');
  if (answers.motivation === 'ownership') signals.push('Ownership-driven operator');
  if (answers.motivation === 'growth') signals.push('Growth-oriented professional');
  if (answers.motivation === 'stability') signals.push('Reliability-centered professional');
  if (answers.motivation === 'recognition') signals.push('Contribution-recognition driven');

  if (answers.challengeOrientation === 'builder') signals.push('Builder under challenge');
  if (answers.challengeOrientation === 'stabilizer') signals.push('Stabilizer under challenge');
  if (answers.challengeOrientation === 'solver') signals.push('Practical problem solver');
  if (answers.challengeOrientation === 'strategist') signals.push('Strategic reframer');
  if (answers.challengeOrientation === 'challenger') signals.push('Constructive challenger');

  return unique(signals, 14);
}

function evidenceBackedSignals(capabilityMatches = [], behavioralSignals = []) {
  const capabilityLabels = capabilityMatches
    .slice(0, 8)
    .map((match) => match?.capability?.label)
    .filter(Boolean);

  const behaviorLabels = behavioralSignals
    .slice(0, 8)
    .map((signal) => signal?.label || labelizeKey(signal?.key))
    .filter(Boolean);

  return unique([...behaviorLabels, ...capabilityLabels], 14);
}

function hasSignal(signals = [], pattern) {
  return signals.some((s) => pattern.test(String(s || '')));
}

function inferOperatingStyle(answers = {}, capabilityMatches = [], behavioralSignals = []) {
  const text = [
    answers.energy,
    answers.challengeOrientation,
    answers.motivation,
    ...capabilityMatches.map((m) => m?.capability?.id || ''),
    ...behavioralSignals.map((b) => b?.key || ''),
  ]
    .filter(Boolean)
    .join(' ');

  const t = safeLower(text);

  if (
    answers.energy === 'systems' ||
    t.includes('operations_process_improvement') ||
    t.includes('operational_rigor') ||
    t.includes('it_service_management') ||
    t.includes('platform_architecture')
  ) {
    if (
      t.includes('executive_leadership') ||
      t.includes('business_strategy') ||
      t.includes('product_management') ||
      t.includes('founder')
    ) {
      return 'Operational Systems Builder with Strategic Founder Signals';
    }

    return 'Operational Systems Builder';
  }

  if (answers.energy === 'strategy' || t.includes('strategic_thinking') || t.includes('business_strategy')) {
    return 'Strategic Direction Setter';
  }

  if (answers.energy === 'people' || t.includes('customer_communication') || t.includes('people_leadership')) {
    return 'Trust-Centered Connector';
  }

  return 'Execution-Focused Operator';
}

function buildPersonProfile(answers = {}, evidenceSignals = []) {
  const out = [];

  out.push(
    answers.motivation
      ? `Motivated primarily by ${optionLabel(answers.motivation)}.`
      : 'Motivation pattern should be refined through additional reflection.'
  );

  out.push(
    answers.careerHope
      ? `Career hope: ${answers.careerHope}`
      : 'Career hope should be captured so the profile can explain where the person is trying to grow.'
  );

  if (answers.values) {
    out.push(`Values signal: ${answers.values}`);
  }

  if (hasSignal(evidenceSignals, /mission|ownership|impact|leadership|service/i)) {
    out.push('Evidence suggests the person is likely to care about useful work, accountability, and whether effort translates into visible value.');
  }

  return unique(out, 5);
}

function buildProfessionalProfile(style, answers = {}, evidenceSignals = []) {
  const out = [];

  out.push(
    style.includes('Strategic Founder')
      ? 'Professionally, this person appears strongest when converting ambiguity into usable systems, strategy, and operating structure.'
      : style === 'Operational Systems Builder'
      ? 'Professionally, this person appears strongest when improving systems, clarifying workflows, and making work repeatable.'
      : style === 'Strategic Direction Setter'
      ? 'Professionally, this person appears strongest when connecting signals, setting direction, and shaping what should happen next.'
      : style === 'Trust-Centered Connector'
      ? 'Professionally, this person appears strongest when trust, communication, guidance, and people-centered execution matter.'
      : 'Professionally, this person appears strongest when clear outcomes need to be executed with reliability and momentum.'
  );

  if (hasSignal(evidenceSignals, /project|delivery|execution|ownership/i)) {
    out.push('Evidence indicates delivery orientation: they are likely to care about moving work from idea to usable outcome.');
  }

  if (hasSignal(evidenceSignals, /analysis|strategy|business|platform|product/i)) {
    out.push('Evidence indicates strategic pattern recognition: they are likely to see how separate pieces connect into a larger operating picture.');
  }

  return unique(out, 5);
}

function buildHowTheyPerformBest(answers = {}, evidenceSignals = []) {
  const out = [];

  out.push(
    answers.autonomy === 'high'
      ? 'Performs best when trusted with ownership, outcome clarity, and enough decision space to solve the problem without unnecessary friction.'
      : answers.autonomy === 'medium'
      ? 'Performs best with clear goals, useful check-ins, and enough autonomy to adapt execution as context changes.'
      : 'Performs best with structured expectations, clear handoffs, and frequent alignment.'
  );

  out.push(
    answers.ambiguity === 'high'
      ? 'Can operate inside ambiguity when there is a meaningful outcome to build toward.'
      : answers.ambiguity === 'medium'
      ? 'Can handle change well when priorities and success criteria are kept visible.'
      : 'Performs best when scope, responsibilities, and success measures are stable.'
  );

  if (hasSignal(evidenceSignals, /operational|systems|process|project|execution/i)) {
    out.push('Likely performs well when they can identify friction, organize moving parts, and create a practical path forward.');
  }

  return unique(out, 5);
}

function buildStressProcessing(answers = {}) {
  const out = [];

  out.push(
    answers.pressure === 'calm'
      ? 'Under pressure, they tend to stabilize first: slow the noise, assess what matters, and move toward control.'
      : answers.pressure === 'direct'
      ? 'Under pressure, they tend to act quickly and make decisions to restore motion.'
      : answers.pressure === 'collaborative'
      ? 'Under pressure, they tend to gather context, coordinate people, and create shared understanding.'
      : 'Under pressure, they tend to pause, assess, and choose a careful path rather than reacting immediately.'
  );

  if (answers.stressNeed) {
    out.push(`Support under stress: ${answers.stressNeed}`);
  }

  if (answers.drain) {
    out.push(`Likely stress drain: ${answers.drain}`);
  }

  return unique(out, 5);
}

function buildChallengeOrientation(answers = {}) {
  const out = [];

  out.push(
    answers.challengeOrientation === 'builder'
      ? 'When facing a challenge, they are likely to build structure, tools, systems, or repeatable paths through it.'
      : answers.challengeOrientation === 'stabilizer'
      ? 'When facing a challenge, they are likely to stabilize the situation, protect continuity, and reduce chaos.'
      : answers.challengeOrientation === 'solver'
      ? 'When facing a challenge, they are likely to define the practical problem and work toward resolution.'
      : answers.challengeOrientation === 'strategist'
      ? 'When facing a challenge, they are likely to reframe the problem and connect it to broader direction or risk.'
      : answers.challengeOrientation === 'challenger'
      ? 'When facing a challenge, they are likely to question assumptions and challenge what is not working.'
      : 'Challenge orientation should be refined through additional reflection.'
  );

  if (answers.challengeExample) {
    out.push(`Challenge example: ${answers.challengeExample}`);
  }

  return unique(out, 5);
}

function buildLearningProfile(answers = {}) {
  const out = [];

  out.push(
    answers.learningStyle
      ? `Learns best through ${optionLabel(answers.learningStyle)}.`
      : 'Learning style should be captured so onboarding and coaching can be more precise.'
  );

  if (answers.learningSupport) {
    out.push(`Best learning support: ${answers.learningSupport}`);
  }

  if (answers.learningStyle === 'hands_on' || answers.learningStyle === 'trial_error') {
    out.push('Will likely absorb new responsibilities faster when allowed to test, build, inspect outcomes, and iterate.');
  }

  if (answers.learningStyle === 'documentation' || answers.learningStyle === 'structured_training') {
    out.push('Will likely ramp faster when expectations, process, and reference material are clearly documented.');
  }

  if (answers.learningStyle === 'mentorship') {
    out.push('Will likely ramp faster when context is shared by someone who can explain the why behind the work.');
  }

  return unique(out, 5);
}

function buildMotivationProfile(answers = {}) {
  const out = [];

  out.push(
    answers.motivation
      ? `Primary drive signal: ${optionLabel(answers.motivation)}.`
      : 'Motivation should be captured so managers, coaches, and the seeker can better understand what sustains performance.'
  );

  if (answers.careerHope) {
    out.push(`Career direction signal: ${answers.careerHope}`);
  }

  if (answers.motivationDetail) {
    out.push(`Motivation detail: ${answers.motivationDetail}`);
  }

  return unique(out, 5);
}

function buildProfessionalSummary(style, answers = {}, evidenceSignals = []) {
  if (style.includes('Strategic Founder')) {
    return 'This profile suggests a professional who can build systems from ambiguity, connect strategy to execution, and turn complex professional problems into operating models others can actually use.';
  }

  if (style === 'Operational Systems Builder') {
    return 'This profile suggests a professional who performs best when turning complexity into structure, improving how work moves, and creating repeatable systems that help teams operate more effectively.';
  }

  if (style === 'Strategic Direction Setter') {
    return 'This profile suggests a professional who performs best when assessing direction, connecting signals, solving complex problems, and helping shape what should happen next.';
  }

  if (style === 'Trust-Centered Connector') {
    return 'This profile suggests a professional who performs best when work depends on trust, guidance, communication, and helping people move through decisions or challenges with clarity.';
  }

  return 'This profile suggests a professional who performs best when meaningful work needs to move forward, outcomes are clear, and visible progress matters.';
}

function buildThrivesIn(answers = {}, evidenceSignals = []) {
  const out = [];

  out.push(
    answers.autonomy === 'high'
      ? 'High-ownership environments where trust, outcomes, and accountability matter.'
      : answers.autonomy === 'medium'
      ? 'Environments with clear goals, reasonable autonomy, and useful check-ins.'
      : 'Structured environments with clear expectations, defined success measures, and steady alignment.'
  );

  out.push(
    answers.ambiguity === 'high'
      ? 'Ambiguous or developing situations where someone needs to create order and momentum.'
      : answers.ambiguity === 'medium'
      ? 'Changing environments where priorities are clarified and communication stays consistent.'
      : 'Stable environments where expectations, handoffs, and responsibilities are well defined.'
  );

  out.push(
    answers.communication === 'direct'
      ? 'Teams that value direct, low-politics communication and practical problem solving.'
      : answers.communication === 'collaborative'
      ? 'Teams that value shared context, discussion, trust, and cross-functional buy-in.'
      : 'Teams that value thoughtful written context, documentation, and well-structured decisions.'
  );

  if (hasSignal(evidenceSignals, /executive|strategy|product|project|operations|platform/i)) {
    out.push('Work where strategy, systems, people, and execution need to connect instead of operating in silos.');
  }

  return unique(out, 5);
}

function buildSupportAreas(answers = {}, evidenceSignals = []) {
  const out = [];

  out.push(
    answers.growth === 'visibility'
      ? 'May benefit from more consistent documentation and communication of wins so value is visible beyond day-to-day execution.'
      : answers.growth === 'delegation'
      ? 'May benefit from support delegating ownership instead of carrying too much alone.'
      : answers.growth === 'focus'
      ? 'May benefit from clearer prioritization boundaries when multiple urgent needs compete for attention.'
      : 'May benefit from stronger strategic framing so work is understood as business impact, not just task completion.'
  );

  if (answers.drain) {
    out.push(`Should watch for environments that repeat this drain pattern: ${answers.drain}.`);
  } else {
    out.push('Should watch for environments that reward politics more than performance or create disconnects between leadership direction and frontline reality.');
  }

  if (answers.supportNeed) {
    out.push(`May be best supported by: ${answers.supportNeed}`);
  } else if (hasSignal(evidenceSignals, /ownership|execution|leadership|operations/i)) {
    out.push('May need explicit priority agreements so high ownership does not become silent over-extension.');
  } else {
    out.push('Can use this profile as a conversation starter with coaches, mentors, managers, or hiring teams.');
  }

  return unique(out, 5);
}

function buildIntegrationGuidance(answers = {}, evidenceSignals = []) {
  const out = [
    'Give this person clarity on the outcome, the operational context, and where success will be measured.',
    answers.autonomy === 'high'
      ? 'Provide trust and decision space, then use check-ins to remove blockers instead of micromanaging execution.'
      : 'Provide clear expectations and cadence, then increase autonomy as trust and context develop.',
    answers.communication === 'written'
      ? 'Provide written context for complex decisions and allow time to process important tradeoffs.'
      : 'Use direct, timely communication and practical feedback loops to keep momentum strong.',
  ];

  if (answers.learningStyle) {
    out.push(`Support onboarding through ${optionLabel(answers.learningStyle)} so ramp-up matches how they best absorb new work.`);
  }

  if (hasSignal(evidenceSignals, /process|systems|operations|project|platform/i)) {
    out.push('Invite them into process, system, and workflow conversations early; they are likely to see operational friction before it becomes visible to everyone else.');
  }

  return unique(out, 6);
}

function buildRoleUtilization(answers = {}, evidenceSignals = []) {
  const out = [];

  if (hasSignal(evidenceSignals, /operations|systems|process|project|platform/i) || answers.energy === 'systems') {
    out.push('Utilize this person where systems need to be clarified, improved, connected, or built into repeatable operating structure.');
  }

  if (hasSignal(evidenceSignals, /leadership|ownership|executive|strategy/i) || answers.motivation === 'ownership') {
    out.push('Use them in roles where ownership is real, expectations are meaningful, and they can influence how work is organized.');
  }

  if (answers.challengeOrientation === 'stabilizer' || answers.pressure === 'calm') {
    out.push('They may be especially useful in situations that need calm assessment, stabilization, and disciplined follow-through.');
  }

  if (answers.challengeOrientation === 'builder' || answers.ambiguity === 'high') {
    out.push('They may be especially useful in early-stage, messy, or underbuilt environments where someone must create structure from scratch.');
  }

  if (!out.length) {
    out.push('Use this person where their stated work preferences and demonstrated evidence align with clear responsibilities and measurable outcomes.');
  }

  return unique(out, 6);
}

function buildAudienceViews(snapshot = {}) {
  return {
    seeker:
      'Use this profile to explain how you operate, what conditions help you perform, and what support helps you contribute without overextending.',
    coach:
      'Use this profile to position the seeker around evidence-backed strengths, clarify growth areas, and guide conversations about role fit, confidence, and professional narrative.',
    recruiter:
      'Use this profile only if the seeker chooses to share it. It should support placement, onboarding, team integration, and management alignment — not act as a hidden score or screening filter.',
  };
}

function buildWhyEvidence(answers = {}, identityContext = {}, capabilityMatches = [], behavioralSignals = []) {
  const resume = identityContext.resume || {};
  const projects = toArray(resume.projects || identityContext.projects);

  const selfReflection = unique(
    [
      answers.recentWin ? `Professional win: ${answers.recentWin}` : '',
      answers.drain ? `Drain pattern: ${answers.drain}` : '',
      answers.goal ? `Current reflection goal: ${answers.goal}` : '',
      answers.energy ? `Energy pattern: ${optionLabel(answers.energy)}` : '',
      answers.autonomy ? `Autonomy preference: ${optionLabel(answers.autonomy)}` : '',
      answers.ambiguity ? `Ambiguity tolerance: ${optionLabel(answers.ambiguity)}` : '',
      answers.pressure ? `Pressure processing: ${optionLabel(answers.pressure)}` : '',
      answers.challengeOrientation ? `Challenge orientation: ${optionLabel(answers.challengeOrientation)}` : '',
      answers.learningStyle ? `Learning style: ${optionLabel(answers.learningStyle)}` : '',
      answers.motivation ? `Motivation driver: ${optionLabel(answers.motivation)}` : '',
      answers.careerHope ? `Career hope: ${answers.careerHope}` : '',
    ],
    12
  );

  const resumeEvidence = unique(
    [
      resume.summary ? `Resume summary: ${safe(resume.summary).slice(0, 220)}` : '',
      ...extractEvidenceLines(resume.experience, 5),
      ...toArray(resume.skills).slice(0, 8).map((skill) => `Resume skill: ${skill}`),
      ...toArray(resume.certifications).slice(0, 4).map((cert) => `Resume certification/training: ${textOf(cert)}`),
    ],
    12
  );

  const portfolioEvidence = unique(
    [
      identityContext.headline ? `Headline: ${identityContext.headline}` : '',
      identityContext.aboutMe ? `About/profile: ${safe(identityContext.aboutMe).slice(0, 260)}` : '',
      ...toArray(identityContext.skills).slice(0, 8).map((skill) => `Profile skill: ${skill}`),
    ],
    12
  );

  const projectEvidence = extractEvidenceLines(projects, 8).map((item) => `Project evidence: ${item}`);

  const intelligenceEvidence = unique(
    [
      ...capabilityMatches.slice(0, 7).map((m) => {
        const label = m?.capability?.label;
        const terms = unique([...(m?.anchorHits || []), ...(m?.matchedTerms || [])], 5).join(', ');
        return label ? `${label}${terms ? ` — matched: ${terms}` : ''}` : '';
      }),
      ...behavioralSignals.slice(0, 7).map((b) => {
        const terms = unique(b?.matchedTerms || [], 5).join(', ');
        return `${b?.label || labelizeKey(b?.key)}${terms ? ` — matched: ${terms}` : ''}`;
      }),
    ],
    14
  );

  return {
    selfReflection,
    resumeEvidence,
    portfolioEvidence,
    projectEvidence,
    intelligenceEvidence,
  };
}

export function buildProfessionalOperatingProfile({ answersJson = {}, identityContext = {} } = {}) {
  const answers = answersJson || {};
  const sourceText = buildEvidenceSourceText(identityContext);

  const capabilityMatches = detectCapabilityMatches(
    {
      profile: sourceText.profileText,
      resume: sourceText.resumeText,
      projects: sourceText.projectText,
    },
    { limit: 12 }
  );

  const behavioralSignals = detectBehavioralSignals({
    profile: sourceText.profileText,
    resume: sourceText.resumeText,
    projects: sourceText.projectText,
    reflection: textOf(answers),
  });

  const reflection = reflectionSignals(answers);
  const evidenceSignals = evidenceBackedSignals(capabilityMatches, behavioralSignals);
  const strengthSignals = unique([...reflection, ...evidenceSignals], 14);

  const operatingStyle = inferOperatingStyle(answers, capabilityMatches, behavioralSignals);
  const professionalSummary = buildProfessionalSummary(operatingStyle, answers, strengthSignals);
  const why = buildWhyEvidence(answers, identityContext, capabilityMatches, behavioralSignals);

  const profile = {
    title: 'Professional Operating Profile',
    operatingStyle,
    professionalSummary,
    strengthSignals,

    personProfile: buildPersonProfile(answers, strengthSignals),
    professionalProfile: buildProfessionalProfile(operatingStyle, answers, strengthSignals),
    howTheyPerformBest: buildHowTheyPerformBest(answers, strengthSignals),
    stressProcessing: buildStressProcessing(answers),
    challengeOrientation: buildChallengeOrientation(answers),
    learningProfile: buildLearningProfile(answers),
    motivationProfile: buildMotivationProfile(answers),

    thrivesIn: buildThrivesIn(answers, strengthSignals),
    supportAreas: buildSupportAreas(answers, strengthSignals),
    integrationGuidance: buildIntegrationGuidance(answers, strengthSignals),
    roleUtilization: buildRoleUtilization(answers, strengthSignals),

    why,
    audienceViews: {},
    evidence: [
      ...why.selfReflection.slice(0, 5).map((item) => `Self-reflection evidence: ${item}`),
      ...why.resumeEvidence.slice(0, 4).map((item) => `Resume evidence: ${item}`),
      ...why.portfolioEvidence.slice(0, 4).map((item) => `Portfolio evidence: ${item}`),
      ...why.projectEvidence.slice(0, 4),
      ...why.intelligenceEvidence.slice(0, 5).map((item) => `WHY intelligence signal: ${item}`),
    ],
    meta: {
      generatedAt: new Date().toISOString(),
      source: 'professionalOperatingProfileEngine',
      profileVersion: '2.0',
      evidenceSources: {
        selfReflection: why.selfReflection.length,
        resume: why.resumeEvidence.length,
        portfolio: why.portfolioEvidence.length,
        projects: why.projectEvidence.length,
        intelligence: why.intelligenceEvidence.length,
      },
      resumeId: identityContext.resumeId || identityContext.resume?.resumeId || null,
      resumeUpdatedAt: identityContext.resumeUpdatedAt || null,
    },
  };

  profile.audienceViews = buildAudienceViews(profile);

  return profile;
}

export default buildProfessionalOperatingProfile;
