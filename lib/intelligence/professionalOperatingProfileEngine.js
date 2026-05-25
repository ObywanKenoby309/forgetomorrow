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

function truncate(text = '', max = 220) {
  const clean = safe(text).replace(/\s+/g, ' ');
  if (!clean) return '';
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 1)).trim()}…`;
}

function labelizeKey(key = '') {
  return safe(key)
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeAnswers(answers = {}) {
  const challengeOrientation =
    answers.challengeOrientation ||
    answers.challengeStyle ||
    '';

  const stressNeed =
    answers.stressNeed ||
    answers.supportNeed ||
    '';

  let learningStyle = answers.learningStyle || '';
  if (learningStyle === 'mentor_guided') learningStyle = 'mentorship';
  if (learningStyle === 'trial_and_error') learningStyle = 'trial_error';

  return {
    ...answers,
    challengeOrientation,
    stressNeed,
    supportNeed: answers.supportNeed || stressNeed,
    learningStyle,
  };
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
    mentor_guided: 'mentorship and guided context',
    structured_training: 'structured training',
    trial_error: 'testing, iteration, and learning by doing',
    trial_and_error: 'testing, iteration, and learning by doing',

    mission: 'mission and purpose',
    mastery: 'mastery and craft improvement',
    impact: 'visible impact',
    ownership: 'ownership and trust',
    growth: 'growth and upward movement',
    stability: 'stability and reliability',
    recognition: 'recognition for real contribution',

    purpose: 'purpose and meaningful contribution',
    leadership: 'leadership influence and responsibility',
    craft: 'a stronger craft and deeper expertise',
    freedom: 'freedom, autonomy, and self-direction',

    builder: 'building through challenges',
    stabilizer: 'stabilizing challenges',
    solver: 'solving practical problems',
    strategist: 'reframing challenges strategically',
    challenger: 'challenging broken assumptions',
  };

  return map[value] || fallback || value;
}

function extractEvidenceLines(items = [], limit = 3, maxChars = 260) {
  return unique(
    toArray(items)
      .map((item) => {
        if (typeof item === 'string') return truncate(item, maxChars);
        if (!item || typeof item !== 'object') return '';

        const title = safe(item.title || item.name || item.projectName || item.company || item.role);
        const description = safe(
          item.description ||
            item.summary ||
            item.details ||
            item.impact ||
            toArray(item.highlights || item.bullets).join(' ')
        );

        return truncate([title, description].filter(Boolean).join(': '), maxChars);
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

  const projectText = textOf((resume.projects?.length ? resume.projects : null) || identityContext.projects);

  return {
    profileText,
    resumeText,
    projectText,
    combinedText: [profileText, resumeText, projectText].filter(Boolean).join(' '),
  };
}

function reflectionSignals(answers = {}) {
  const a = normalizeAnswers(answers);
  const signals = [];

  if (a.energy === 'systems') signals.push('Systems thinker');
  if (a.energy === 'people') signals.push('Relationship builder');
  if (a.energy === 'execution') signals.push('Execution driver');
  if (a.energy === 'strategy') signals.push('Strategic navigator');

  if (a.pressure === 'calm') signals.push('Calm under pressure');
  if (a.pressure === 'direct') signals.push('Decisive problem solver');
  if (a.pressure === 'collaborative') signals.push('Coordinated responder');
  if (a.pressure === 'reflective') signals.push('Measured decision maker');

  if (a.autonomy === 'high') signals.push('Independent operator');
  if (a.ambiguity === 'high') signals.push('Ambiguity-capable builder');

  if (a.learningStyle === 'hands_on') signals.push('Hands-on learner');
  if (a.learningStyle === 'documentation') signals.push('Documentation-based learner');
  if (a.learningStyle === 'mentorship') signals.push('Context-driven learner');
  if (a.learningStyle === 'structured_training') signals.push('Structured learner');
  if (a.learningStyle === 'trial_error') signals.push('Iterative learner');

  if (a.motivation === 'mission') signals.push('Mission-driven contributor');
  if (a.motivation === 'mastery') signals.push('Mastery-driven professional');
  if (a.motivation === 'impact') signals.push('Impact-driven operator');
  if (a.motivation === 'ownership') signals.push('Ownership-driven operator');
  if (a.motivation === 'growth') signals.push('Growth-oriented professional');
  if (a.motivation === 'stability') signals.push('Reliability-centered professional');
  if (a.motivation === 'recognition') signals.push('Contribution-recognition driven');

  if (a.challengeOrientation === 'builder') signals.push('Builder under challenge');
  if (a.challengeOrientation === 'stabilizer') signals.push('Stabilizer under challenge');
  if (a.challengeOrientation === 'solver') signals.push('Practical problem solver');
  if (a.challengeOrientation === 'strategist') signals.push('Strategic reframer');
  if (a.challengeOrientation === 'challenger') signals.push('Constructive challenger');

  return unique(signals, 12);
}

function evidenceBackedSignals(capabilityMatches = [], behavioralSignals = []) {
  const behaviorLabels = behavioralSignals
    .slice(0, 7)
    .map((signal) => signal?.label || labelizeKey(signal?.key))
    .filter(Boolean);

  const capabilityLabels = capabilityMatches
    .slice(0, 6)
    .map((match) => match?.capability?.label)
    .filter(Boolean);

  return unique([...behaviorLabels, ...capabilityLabels], 10);
}

function hasSignal(signals = [], pattern) {
  return signals.some((s) => pattern.test(String(s || '')));
}

function groupedSignals(strengthSignals = []) {
  const groups = {
    identity: [],
    leadership: [],
    execution: [],
    environment: [],
  };

  for (const signal of Array.isArray(strengthSignals) ? strengthSignals : []) {
    const s = String(signal || '');

    if (/systems|builder|ownership|independent|strategic navigator|mission|mastery|impact/i.test(s)) {
      groups.identity.push(s);
    } else if (/leadership|strategic|people|coordinated|relationship/i.test(s)) {
      groups.leadership.push(s);
    } else if (/problem|execution|operational|service|risk|analytics|analytical|process|delivery/i.test(s)) {
      groups.execution.push(s);
    } else if (/ambiguity|pressure|calm|learner|adaptability|stabilizer/i.test(s)) {
      groups.environment.push(s);
    }
  }

  return {
    identity: unique(groups.identity, 5),
    leadership: unique(groups.leadership, 5),
    execution: unique(groups.execution, 5),
    environment: unique(groups.environment, 5),
  };
}

function inferOperatingStyle(answers = {}, capabilityMatches = [], behavioralSignals = []) {
  const a = normalizeAnswers(answers);
  const text = [
    a.energy,
    a.challengeOrientation,
    a.motivation,
    ...capabilityMatches.map((m) => m?.capability?.id || ''),
    ...behavioralSignals.map((b) => b?.key || ''),
  ]
    .filter(Boolean)
    .join(' ');

  const t = safeLower(text);

  if (
    a.energy === 'systems' ||
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
      return 'Systems Architect · Founder Operator';
    }

    return 'Operational Systems Builder';
  }

  if (a.energy === 'strategy' || t.includes('strategic_thinking') || t.includes('business_strategy')) {
    return 'Strategic Direction Setter';
  }

  if (a.energy === 'people' || t.includes('customer_communication') || t.includes('people_leadership')) {
    return 'Trust-Centered Connector';
  }

  return 'Execution-Focused Operator';
}

function buildProfessionalSummary(style) {
  if (style.includes('Founder Operator')) {
    return 'A builder-operator profile. Strongest when moving between system design and execution — creating the infrastructure, strategy, and operating structure that others can work inside. Evidence suggests repeated founder-pattern behavior: building from ambiguity, owning outcomes across the full arc, and converting complex problems into operational models.';
  }

  if (style === 'Operational Systems Builder') {
    return 'A systems-first operator profile. Strongest when turning complexity into reliable structure — improving how work flows, creating repeatable processes, and ensuring teams can operate with less friction and more clarity.';
  }

  if (style === 'Strategic Direction Setter') {
    return 'A direction and synthesis profile. Strongest when connecting disparate signals into a clear forward path — assessing what is working, identifying what needs to change, and shaping the decisions that determine where effort goes next.';
  }

  if (style === 'Trust-Centered Connector') {
    return 'A people-and-relationship profile. Strongest when work depends on trust, guidance, and clear communication — helping people navigate decisions, building coalitions, and creating the conditions where others can do their best work.';
  }

  return 'An execution-oriented profile. Strongest when meaningful outcomes need to move — converting clear goals into visible progress with reliability and forward momentum.';
}

function buildPersonProfile(answers = {}, evidenceSignals = [], identityContext = {}) {
  const a = normalizeAnswers(answers);
  const resume = identityContext.resume || {};
  const projects = toArray((resume.projects?.length ? resume.projects : null) || identityContext.projects);
  const out = [];

  // Lead with motivation — evidence-linked where possible
  if (a.motivation && hasSignal(evidenceSignals, /ownership|leadership|executive|founder/i)) {
    out.push(`Driven by ${optionLabel(a.motivation)} — a pattern that shows up consistently across their resume, portfolio, and project record.`);
  } else if (a.motivation) {
    out.push(`Driven by ${optionLabel(a.motivation)}.`);
  }

  // Career direction — specific, not generic
  if (a.careerHope && a.idealImpact) {
    out.push(`Looking for ${optionLabel(a.careerHope, a.careerHope)} — and wants their work to create tangible impact: ${truncate(a.idealImpact, 180)}`);
  } else if (a.careerHope) {
    out.push(`Looking for more ${optionLabel(a.careerHope, a.careerHope)} from their work.`);
  } else if (a.idealImpact) {
    out.push(`Wants their work to create: ${truncate(a.idealImpact, 200)}`);
  }

  // Project-sourced insight
  if (projects.length >= 2) {
    out.push('Project history suggests someone who takes ownership across the full arc — from problem identification through delivery and follow-through.');
  } else if (projects.length === 1) {
    out.push('Portfolio evidence suggests hands-on ownership orientation — not just contributing, but seeing work through to outcome.');
  }

  // Evidence-backed behavioral read
  if (hasSignal(evidenceSignals, /ownership|accountable|independent|founder/i)) {
    out.push('Evidence across resume and portfolio consistently points to accountability as a core operating value — this person tends to carry things rather than hand them off.');
  } else if (hasSignal(evidenceSignals, /mission|service|people|coaching/i)) {
    out.push('Evidence suggests genuine investment in whether the work lands for others — not just task completion, but meaningful contribution.');
  }

  return unique(out, 5);
}

function buildProfessionalProfile(style, answers = {}, evidenceSignals = [], identityContext = {}) {
  const resume = identityContext.resume || {};
  const projects = toArray((resume.projects?.length ? resume.projects : null) || identityContext.projects);
  const out = [];

  // Core professional read — style-driven
  if (style.includes('Founder Operator')) {
    out.push('Professionally strongest at the intersection of system design and execution — building the infrastructure others work inside, while staying close enough to the work to see where it breaks.');
  } else if (style === 'Operational Systems Builder') {
    out.push('Professionally strongest when improving how work moves — identifying friction, creating structure, and ensuring complex operations run with clarity and less overhead.');
  } else if (style === 'Strategic Direction Setter') {
    out.push('Professionally strongest when direction needs to be set — connecting disparate inputs into a coherent forward path and ensuring the right things get prioritized.');
  } else if (style === 'Trust-Centered Connector') {
    out.push('Professionally strongest in trust-dependent work — where outcomes depend on relationships, communication, and the ability to help people navigate through complexity.');
  } else {
    out.push('Professionally strongest when clear outcomes need to move — converting goals into visible progress with consistent follow-through.');
  }

  // Project-sourced synthesis
  if (projects.length >= 3) {
    out.push(`Project record (${projects.length} projects) indicates consistent delivery across varied scope — someone who can manage ownership from initiation through completion at multiple levels of complexity.`);
  } else if (projects.length >= 1) {
    out.push('Project evidence suggests delivery orientation — work is owned end-to-end, not handed off at the execution phase.');
  }

  // Resume-sourced synthesis
  if (resume.experience?.length >= 3 && hasSignal(evidenceSignals, /leadership|executive|strategy|operations/i)) {
    out.push('Career trajectory indicates progressive scope expansion — each role has added complexity, responsibility, or organizational reach.');
  }

  // Strategic pattern
  if (hasSignal(evidenceSignals, /analysis|strategy|business|platform|product|architect/i)) {
    out.push('Evidence indicates systems-level pattern recognition — the ability to see how components connect into a larger operational picture and act on that understanding.');
  }

  return unique(out, 5);
}
function buildHowTheyPerformBest(answers = {}, evidenceSignals = []) {
  const a = normalizeAnswers(answers);
  const out = [];

  out.push(
    a.autonomy === 'high'
      ? 'Performs best when trusted with ownership, outcome clarity, and enough decision space to solve the problem without unnecessary friction.'
      : a.autonomy === 'medium'
      ? 'Performs best with clear goals, useful check-ins, and enough autonomy to adapt execution as context changes.'
      : 'Performs best with structured expectations, clear handoffs, and frequent alignment.'
  );

  out.push(
    a.ambiguity === 'high'
      ? 'Can operate inside ambiguity when there is a meaningful outcome to build toward.'
      : a.ambiguity === 'medium'
      ? 'Can handle change well when priorities and success criteria are kept visible.'
      : 'Performs best when scope, responsibilities, and success measures are stable.'
  );

  if (hasSignal(evidenceSignals, /operational|systems|process|project|execution/i)) {
    out.push('Likely performs well when they can identify friction, organize moving parts, and create a practical path forward.');
  }

  return unique(out, 5);
}

function buildStressProcessing(answers = {}) {
  const a = normalizeAnswers(answers);
  const out = [];

  out.push(
    a.pressure === 'calm'
      ? 'Under pressure, they tend to stabilize first: slow the noise, assess what matters, and move toward control.'
      : a.pressure === 'direct'
      ? 'Under pressure, they tend to act quickly and make decisions to restore motion.'
      : a.pressure === 'collaborative'
      ? 'Under pressure, they tend to gather context, coordinate people, and create shared understanding.'
      : 'Under pressure, they tend to pause, assess, and choose a careful path rather than reacting immediately.'
  );

  if (a.stressTrigger) {
    out.push(`Likely pressure trigger: ${a.stressTrigger}`);
  }

  if (a.stressNeed) {
    out.push(`Support under stress: ${a.stressNeed}`);
  }

  if (a.drain) {
    out.push(`Likely stress drain: ${a.drain}`);
  }

  return unique(out, 5);
}

function buildChallengeOrientation(answers = {}) {
  const a = normalizeAnswers(answers);
  const out = [];

  out.push(
    a.challengeOrientation === 'builder'
      ? 'When facing a challenge, they are likely to build structure, tools, systems, or repeatable paths through it.'
      : a.challengeOrientation === 'stabilizer'
      ? 'When facing a challenge, they are likely to stabilize the situation, protect continuity, and reduce chaos.'
      : a.challengeOrientation === 'solver'
      ? 'When facing a challenge, they are likely to define the practical problem and work toward resolution.'
      : a.challengeOrientation === 'strategist'
      ? 'When facing a challenge, they are likely to reframe the problem and connect it to broader direction or risk.'
      : a.challengeOrientation === 'challenger'
      ? 'When facing a challenge, they are likely to question assumptions and challenge what is not working.'
      : 'Challenge orientation should be refined through additional reflection.'
  );

  if (a.challengeExample) {
    out.push(`Challenge example: ${a.challengeExample}`);
  }

  return unique(out, 5);
}

function buildLearningProfile(answers = {}) {
  const a = normalizeAnswers(answers);
  const out = [];

  out.push(
    a.learningStyle
      ? `Learns best through ${optionLabel(a.learningStyle)}.`
      : 'Learning style should be captured so onboarding and coaching can be more precise.'
  );

  if (a.learningSupport) {
    out.push(`Best learning support: ${a.learningSupport}`);
  }

  if (a.learningStyle === 'hands_on' || a.learningStyle === 'trial_error') {
    out.push('Will likely absorb new responsibilities faster when allowed to test, build, inspect outcomes, and iterate.');
  }

  if (a.learningStyle === 'documentation' || a.learningStyle === 'structured_training') {
    out.push('Will likely ramp faster when expectations, process, and reference material are clearly documented.');
  }

  if (a.learningStyle === 'mentorship') {
    out.push('Will likely ramp faster when context is shared by someone who can explain the why behind the work.');
  }

  return unique(out, 5);
}

function buildMotivationProfile(answers = {}) {
  const a = normalizeAnswers(answers);
  const out = [];

  out.push(
    a.motivation
      ? `Primary drive signal: ${optionLabel(a.motivation)}.`
      : 'Motivation should be captured so managers, coaches, and the seeker can better understand what sustains performance.'
  );

  if (a.recognitionStyle) {
    out.push(`Preferred recognition pattern: ${a.recognitionStyle}`);
  }

  if (a.idealImpact) {
    out.push(`Desired impact: ${a.idealImpact}`);
  }

  return unique(out, 5);
}

function buildCareerDirection(answers = {}) {
  const a = normalizeAnswers(answers);
  const out = [];

  if (a.careerHope) {
    out.push(`Career hope: ${optionLabel(a.careerHope, a.careerHope)}.`);
  }

  if (a.goal) {
    out.push(`Current reflection goal: ${a.goal}`);
  }

  if (a.growth) {
    out.push(`Current growth focus: ${optionLabel(a.growth, a.growth)}.`);
  }

  return unique(out, 5);
}

function buildThrivesIn(answers = {}, evidenceSignals = []) {
  const a = normalizeAnswers(answers);
  const out = [];

  out.push(
    a.autonomy === 'high'
      ? 'High-ownership environments where trust, outcomes, and accountability matter.'
      : a.autonomy === 'medium'
      ? 'Environments with clear goals, reasonable autonomy, and useful check-ins.'
      : 'Structured environments with clear expectations, defined success measures, and steady alignment.'
  );

  out.push(
    a.ambiguity === 'high'
      ? 'Ambiguous or developing situations where someone needs to create order and momentum.'
      : a.ambiguity === 'medium'
      ? 'Changing environments where priorities are clarified and communication stays consistent.'
      : 'Stable environments where expectations, handoffs, and responsibilities are well defined.'
  );

  out.push(
    a.communication === 'direct'
      ? 'Teams that value direct, low-politics communication and practical problem solving.'
      : a.communication === 'collaborative'
      ? 'Teams that value shared context, discussion, trust, and cross-functional buy-in.'
      : 'Teams that value thoughtful written context, documentation, and well-structured decisions.'
  );

  if (hasSignal(evidenceSignals, /executive|strategy|product|project|operations|platform/i)) {
    out.push('Work where strategy, systems, people, and execution need to connect instead of operating in silos.');
  }

  return unique(out, 5);
}

function buildSupportAreas(answers = {}, evidenceSignals = []) {
  const a = normalizeAnswers(answers);
  const out = [];

  out.push(
    a.growth === 'visibility'
      ? 'May benefit from more consistent documentation and communication of wins so value is visible beyond day-to-day execution.'
      : a.growth === 'delegation'
      ? 'May benefit from support delegating ownership instead of carrying too much alone.'
      : a.growth === 'focus'
      ? 'May benefit from clearer prioritization boundaries when multiple urgent needs compete for attention.'
      : 'May benefit from stronger strategic framing so work is understood as business impact, not just task completion.'
  );

  if (a.drain) {
    out.push(`Should watch for environments that repeat this drain pattern: ${a.drain}.`);
  } else {
    out.push('Should watch for environments that reward politics more than performance or create disconnects between leadership direction and frontline reality.');
  }

  if (a.supportNeed) {
    out.push(`May be best supported by: ${a.supportNeed}`);
  } else if (hasSignal(evidenceSignals, /ownership|execution|leadership|operations/i)) {
    out.push('May need explicit priority agreements so high ownership does not become silent over-extension.');
  } else {
    out.push('Can use this profile as a conversation starter with coaches, mentors, managers, or hiring teams.');
  }

  return unique(out, 5);
}

function buildIntegrationGuidance(answers = {}, evidenceSignals = []) {
  const a = normalizeAnswers(answers);
  const out = [
    'Give this person clarity on the outcome, the operational context, and where success will be measured.',
    a.autonomy === 'high'
      ? 'Provide trust and decision space, then use check-ins to remove blockers instead of micromanaging execution.'
      : 'Provide clear expectations and cadence, then increase autonomy as trust and context develop.',
    a.communication === 'written'
      ? 'Provide written context for complex decisions and allow time to process important tradeoffs.'
      : 'Use direct, timely communication and practical feedback loops to keep momentum strong.',
  ];

  if (a.learningStyle) {
    out.push(`Support onboarding through ${optionLabel(a.learningStyle)} so ramp-up matches how they best absorb new work.`);
  }

  if (hasSignal(evidenceSignals, /process|systems|operations|project|platform/i)) {
    out.push('Invite them into process, system, and workflow conversations early; they are likely to see operational friction before it becomes visible to everyone else.');
  }

  return unique(out, 6);
}

function buildRoleUtilization(answers = {}, evidenceSignals = []) {
  const a = normalizeAnswers(answers);
  const out = [];

  if (hasSignal(evidenceSignals, /operations|systems|process|project|platform/i) || a.energy === 'systems') {
    out.push('Utilize this person where systems need to be clarified, improved, connected, or built into repeatable operating structure.');
  }

  if (hasSignal(evidenceSignals, /leadership|ownership|executive|strategy/i) || a.motivation === 'ownership') {
    out.push('Use them in roles where ownership is real, expectations are meaningful, and they can influence how work is organized.');
  }

  if (a.challengeOrientation === 'stabilizer' || a.pressure === 'calm') {
    out.push('They may be especially useful in situations that need calm assessment, stabilization, and disciplined follow-through.');
  }

  if (a.challengeOrientation === 'builder' || a.ambiguity === 'high') {
    out.push('They may be especially useful in early-stage, messy, or underbuilt environments where someone must create structure from scratch.');
  }

  if (!out.length) {
    out.push('Use this person where their stated work preferences and demonstrated evidence align with clear responsibilities and measurable outcomes.');
  }

  return unique(out, 6);
}

function buildAudienceViews() {
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
  const a = normalizeAnswers(answers);
  const resume = identityContext.resume || {};
  const projects = toArray((resume.projects?.length ? resume.projects : null) || identityContext.projects);

  const selfReflection = unique(
    [
      a.recentWin ? `Professional win: ${truncate(a.recentWin, 260)}` : '',
      a.drain ? `Drain pattern: ${truncate(a.drain, 180)}` : '',
      a.goal ? `Current reflection goal: ${truncate(a.goal, 180)}` : '',
      a.energy ? `Energy pattern: ${optionLabel(a.energy)}` : '',
      a.autonomy ? `Autonomy preference: ${optionLabel(a.autonomy)}` : '',
      a.ambiguity ? `Ambiguity tolerance: ${optionLabel(a.ambiguity)}` : '',
      a.pressure ? `Pressure processing: ${optionLabel(a.pressure)}` : '',
      a.challengeOrientation ? `Challenge orientation: ${optionLabel(a.challengeOrientation)}` : '',
      a.learningStyle ? `Learning style: ${optionLabel(a.learningStyle)}` : '',
      a.motivation ? `Motivation driver: ${optionLabel(a.motivation)}` : '',
      a.careerHope ? `Career hope: ${optionLabel(a.careerHope, a.careerHope)}` : '',
    ],
    9
  );

  const resumeEvidence = unique(
    [
      resume.summary ? `Resume summary: ${truncate(resume.summary, 220)}` : '',
      ...extractEvidenceLines(resume.experience, 2, 260),
      ...toArray(resume.skills).slice(0, 5).map((skill) => `Resume skill: ${skill}`),
      ...toArray(resume.certifications).slice(0, 2).map((cert) => `Resume certification/training: ${truncate(textOf(cert), 140)}`),
    ],
    7
  );

  const portfolioEvidence = unique(
    [
      identityContext.headline ? `Headline: ${truncate(identityContext.headline, 180)}` : '',
      identityContext.aboutMe ? `About/profile: ${truncate(identityContext.aboutMe, 260)}` : '',
      ...toArray(identityContext.skills).slice(0, 5).map((skill) => `Profile skill: ${skill}`),
    ],
    7
  );

  const projectEvidence = extractEvidenceLines(projects, 4, 260).map((item) => `Project evidence: ${item}`);

  const intelligenceEvidence = unique(
    [
      ...capabilityMatches.slice(0, 6).map((m) => {
        const label = m?.capability?.label;
        const terms = unique([...(m?.anchorHits || []), ...(m?.matchedTerms || [])], 4).join(', ');
        return label ? `${label}${terms ? ` — matched: ${terms}` : ''}` : '';
      }),
      ...behavioralSignals.slice(0, 5).map((b) => {
        const terms = unique(b?.matchedTerms || [], 4).join(', ');
        return `${b?.label || labelizeKey(b?.key)}${terms ? ` — matched: ${terms}` : ''}`;
      }),
    ],
    10
  );

  return {
    selfReflection,
    resumeEvidence,
    portfolioEvidence,
    projectEvidence,
    intelligenceEvidence,
  };
}

function buildConfidenceSignals(reflection = [], evidenceSignals = []) {
  const combined = [...reflection, ...evidenceSignals].map((item) => safeLower(item));
  const counts = new Map();

  for (const item of combined) {
    if (!item) continue;

    const buckets = [
      ['Systems & Operations', /system|operational|process|service delivery|workflow|it service/i],
      ['Ownership & Accountability', /ownership|accountable|independent|leadership|executive/i],
      ['Strategic Thinking', /strategic|strategy|business|platform|product|architect/i],
      ['Problem Resolution', /problem|solver|improved|analysis|analytical|diagnos/i],
      ['Pressure Stability', /calm|pressure|stabiliz|risk|resilient/i],
      ['Learning & Adaptability', /learner|ambiguity|adaptability|hands-on|iterative|pivot/i],
    ];

    for (const [bucket, pattern] of buckets) {
      if (pattern.test(item)) counts.set(bucket, (counts.get(bucket) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, count]) => ({
      label,
      level: count >= 3 ? 'Strong signal' : count === 2 ? 'Moderate signal' : 'Emerging signal',
    }));
}

export function buildProfessionalOperatingProfile({ answersJson = {}, identityContext = {} } = {}) {
  const answers = normalizeAnswers(answersJson || {});
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

  // Normalize signals to canonical forms before merging to prevent duplication
  // e.g. "Ownership-driven operator" + "Ownership" -> deduplicated to one
  function normalizeSignalKey(s) {
    return String(s || '').toLowerCase()
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\b(driven|oriented|focused|centered|based|capable)/g, '')
      .replace(/\b(operator|professional|builder|contributor|learner|responder|maker|handler)/g, '')
      .trim();
  }

  const seenSignalKeys = new Set();
  const mergedSignals = [];

  for (const s of [
    ...reflection.slice(0, 6),
    ...evidenceSignals.filter((s) => /ownership|strategic|operational|problem|leadership|service/i.test(s)).slice(0, 6),
  ]) {
    if (!s) continue;
    const key = normalizeSignalKey(s);
    if (!seenSignalKeys.has(key)) {
      seenSignalKeys.add(key);
      mergedSignals.push(s);
    }
    if (mergedSignals.length >= 10) break;
  }

  const topIdentitySignals = mergedSignals;

  const operatingStyle = inferOperatingStyle(answers, capabilityMatches, behavioralSignals);
  const professionalSummary = buildProfessionalSummary(operatingStyle);
  const why = buildWhyEvidence(answers, identityContext, capabilityMatches, behavioralSignals);

  const personProfile = buildPersonProfile(answers, topIdentitySignals, identityContext);
  const professionalProfile = buildProfessionalProfile(operatingStyle, answers, topIdentitySignals, identityContext);
  const howTheyPerformBest = buildHowTheyPerformBest(answers, topIdentitySignals);
  const stressProcessing = buildStressProcessing(answers);
  const challengeOrientation = buildChallengeOrientation(answers);
  const learningProfile = buildLearningProfile(answers);
  const motivationProfile = buildMotivationProfile(answers);
  const careerDirection = buildCareerDirection(answers);
  const roleUtilization = buildRoleUtilization(answers, topIdentitySignals);
  const signalGroups = groupedSignals(topIdentitySignals);
  const confidenceSignals = buildConfidenceSignals(reflection, evidenceSignals);

  return {
    title: 'Professional Operating Profile',
    operatingStyle,
    professionalSummary,

    strengthSignals: topIdentitySignals,

    person: personProfile,
    professional: professionalProfile,
    personProfile,
    professionalProfile,
    howTheyPerformBest,
    stressProcessing,
    pressureGuidance: stressProcessing,
    challengeOrientation,
    learningStyle: learningProfile,
    learningProfile,
    learningGuidance: learningProfile,
    motivationDrivers: motivationProfile,
    motivationProfile,
    motivation: motivationProfile,
    careerDirection,

    thrivesIn: buildThrivesIn(answers, topIdentitySignals),
    supportAreas: buildSupportAreas(answers, topIdentitySignals),
    integrationGuidance: buildIntegrationGuidance(answers, topIdentitySignals),
    roleUtilization,

    signalGroups,
    confidenceSignals,

    why,
    audienceViews: buildAudienceViews(),
    evidence: [
      ...why.selfReflection.slice(0, 4).map((item) => `Self-reflection evidence: ${item}`),
      ...why.resumeEvidence.slice(0, 3).map((item) => `Resume evidence: ${item}`),
      ...why.portfolioEvidence.slice(0, 3).map((item) => `Portfolio evidence: ${item}`),
      ...why.projectEvidence.slice(0, 2),
      ...why.intelligenceEvidence.slice(0, 4).map((item) => `WHY intelligence signal: ${item}`),
    ],
    meta: {
      generatedAt: new Date().toISOString(),
      source: 'professionalOperatingProfileEngine',
      profileVersion: '2.1',
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
}

export default buildProfessionalOperatingProfile;