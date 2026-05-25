// lib/intelligence/professionalOperatingProfileEngine.js
// ForgeTomorrow Professional Operating Profile Engine
// Identity composer over the shared ForgeTomorrow intelligence stack.
// Pure functions only. No Prisma. No HTTP. No React.

import {
  detectBehavioralSignals,
  detectCapabilityMatches,
} from '@/lib/intelligence/operationalInference';

import {
  capabilityGuidance,
} from '@/lib/intelligence/capabilityGuidance';

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

function truncate(text = '', max = 240) {
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

function capabilityIds(matches = []) {
  return unique(matches.map((m) => m?.capability?.id).filter(Boolean), 50);
}

function capabilityLabels(matches = [], limit = 8) {
  return unique(matches.map((m) => m?.capability?.label).filter(Boolean), limit);
}

function domainCounts(matches = []) {
  const counts = new Map();

  for (const match of Array.isArray(matches) ? matches : []) {
    const domain = safe(match?.capability?.domain);
    if (!domain) continue;
    counts.set(domain, (counts.get(domain) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count);
}

function hasAnyCapability(matches = [], ids = []) {
  const set = new Set(capabilityIds(matches));
  return ids.some((id) => set.has(id));
}

function hasDomain(matches = [], pattern) {
  return matches.some((m) => pattern.test(safe(m?.capability?.domain)));
}

function hasText(text = '', pattern) {
  return pattern.test(safeLower(text));
}

function canonicalSignal(label = '') {
  const raw = safe(label);
  const l = raw.toLowerCase();

  if (!raw) return null;

  const rules = [
    [/ownership|accountab|end-to-end|end to end|independent/i, 'Ownership & accountability'],
    [/system|architecture|platform|workflow|process/i, 'Systems thinking'],
    [/problem|diagnos|troubleshoot|root cause|resolution/i, 'Problem resolution'],
    [/leadership|managed|supervis|direct reports|executive/i, 'Leadership presence'],
    [/customer|client|service|support|relationship/i, 'Service orientation'],
    [/data|analytics|reporting|kpi|metric|bi/i, 'Analytical visibility'],
    [/training|enablement|documentation|knowledge|mentor/i, 'Knowledge transfer'],
    [/risk|compliance|security|governance|safety/i, 'Risk awareness'],
    [/project|delivery|implementation|rollout/i, 'Delivery ownership'],
    [/calm|pressure|stabil/i, 'Pressure stability'],
    [/ambiguity|adapt|change|pivot/i, 'Adaptability'],
    [/collaborat|coordinate|stakeholder/i, 'Cross-functional coordination'],
  ];

  for (const rule of rules) {
    const rx = rule[0];
    const canonical = rule[1];

    if (rx.test(l)) return String(canonical);
  }

  return String(raw);
}

function uniqueSignals(items = [], limit = 10) {
  const out = [];
  const seen = new Set();

  for (const item of Array.isArray(items) ? items : []) {
    const clean = canonicalSignal(item);
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
    if (out.length >= limit) break;
  }

  return out;
}

function reflectionSignals(answers = {}) {
  const a = normalizeAnswers(answers);
  const signals = [];

  if (a.energy === 'systems') signals.push('Systems thinking');
  if (a.energy === 'people') signals.push('Relationship building');
  if (a.energy === 'execution') signals.push('Execution discipline');
  if (a.energy === 'strategy') signals.push('Strategic synthesis');

  if (a.pressure === 'calm') signals.push('Pressure stability');
  if (a.pressure === 'direct') signals.push('Decisive action');
  if (a.pressure === 'collaborative') signals.push('Coordinated response');
  if (a.pressure === 'reflective') signals.push('Measured judgment');

  if (a.autonomy === 'high') signals.push('Ownership & accountability');
  if (a.ambiguity === 'high') signals.push('Adaptability');

  if (a.learningStyle === 'hands_on') signals.push('Hands-on learning');
  if (a.learningStyle === 'documentation') signals.push('Documentation-based learning');
  if (a.learningStyle === 'mentorship') signals.push('Context-guided learning');
  if (a.learningStyle === 'structured_training') signals.push('Structured learning');
  if (a.learningStyle === 'trial_error') signals.push('Iterative learning');

  if (a.motivation === 'mission') signals.push('Mission orientation');
  if (a.motivation === 'mastery') signals.push('Mastery orientation');
  if (a.motivation === 'impact') signals.push('Impact orientation');
  if (a.motivation === 'ownership') signals.push('Ownership & accountability');
  if (a.motivation === 'growth') signals.push('Growth orientation');
  if (a.motivation === 'stability') signals.push('Reliability orientation');
  if (a.motivation === 'recognition') signals.push('Recognition for contribution');

  if (a.challengeOrientation === 'builder') signals.push('Builder response');
  if (a.challengeOrientation === 'stabilizer') signals.push('Stabilizer response');
  if (a.challengeOrientation === 'solver') signals.push('Problem resolution');
  if (a.challengeOrientation === 'strategist') signals.push('Strategic synthesis');
  if (a.challengeOrientation === 'challenger') signals.push('Constructive challenge');

  return uniqueSignals(signals, 12);
}

function evidenceBackedSignals(capabilityMatches = [], behavioralSignals = []) {
  const behaviorLabels = behavioralSignals
    .slice(0, 8)
    .map((signal) => signal?.label || labelizeKey(signal?.key))
    .filter(Boolean);

  const capLabels = capabilityMatches
    .slice(0, 10)
    .map((match) => match?.capability?.label)
    .filter(Boolean);

  return uniqueSignals([...behaviorLabels, ...capLabels], 12);
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

    if (/ownership|systems|mission|impact|mastery|growth|reliability/i.test(s)) {
      groups.identity.push(s);
    } else if (/leadership|relationship|coordination|stakeholder|service/i.test(s)) {
      groups.leadership.push(s);
    } else if (/problem|execution|delivery|analysis|visibility|knowledge|risk/i.test(s)) {
      groups.execution.push(s);
    } else if (/pressure|adaptability|learning|stabilizer|measured|decisive/i.test(s)) {
      groups.environment.push(s);
    }
  }

  return {
    identity: uniqueSignals(groups.identity, 5),
    leadership: uniqueSignals(groups.leadership, 5),
    execution: uniqueSignals(groups.execution, 5),
    environment: uniqueSignals(groups.environment, 5),
  };
}

function inferOperatingStyle(answers = {}, capabilityMatches = [], behavioralSignals = [], sourceText = {}) {
  const a = normalizeAnswers(answers);
  const evidenceText = [
    sourceText.profileText,
    sourceText.resumeText,
    sourceText.projectText,
    textOf(answers),
  ].join(' ');

  const founderEvidence =
    hasAnyCapability(capabilityMatches, ['executive_leadership', 'product_management', 'platform_architecture']) &&
    hasText(evidenceText, /\b(founder|ceo|chief executive|company|startup|investor|business model)\b/i);

  if (founderEvidence) return 'Systems Architect · Founder Operator';

  if (hasAnyCapability(capabilityMatches, ['desktop_technical_support', 'endpoint_management', 'identity_access_management', 'it_service_management'])) {
    return 'Technical Service Resolver';
  }

  if (hasAnyCapability(capabilityMatches, ['customer_service_support', 'customer_success_account_management', 'service_delivery'])) {
    return a.energy === 'people' ? 'Trust-Centered Service Partner' : 'Client Experience Operator';
  }

  if (hasAnyCapability(capabilityMatches, ['healthcare_administration', 'clinical_operations', 'clinical_laboratory_science'])) {
    return 'Care Operations Coordinator';
  }

  if (hasAnyCapability(capabilityMatches, ['education_training', 'training_enablement', 'content_communications'])) {
    return 'Learning & Enablement Builder';
  }

  if (hasAnyCapability(capabilityMatches, ['manufacturing_production', 'logistics_supply_chain', 'retail_store_operations', 'hospitality_guest_experience', 'food_service_operations', 'construction_trades', 'transportation_fleet'])) {
    return 'Operational Reliability Contributor';
  }

  if (hasAnyCapability(capabilityMatches, ['finance_accounting', 'financial_planning_analysis', 'legal_compliance', 'governance_risk_compliance', 'insurance_claims', 'banking_financial_services'])) {
    return 'Precision & Compliance Operator';
  }

  if (hasAnyCapability(capabilityMatches, ['hr_people_operations', 'recruiting_talent_acquisition', 'employee_benefits_workers_comp', 'community_social_services'])) {
    return 'People Operations Connector';
  }

  if (hasAnyCapability(capabilityMatches, ['software_engineering', 'qa_testing', 'devops_sre', 'cloud_infrastructure', 'systems_administration', 'database_administration'])) {
    return 'Technical Systems Builder';
  }

  if (hasAnyCapability(capabilityMatches, ['data_analytics_bi', 'data_engineering', 'business_analysis', 'research_analysis'])) {
    return 'Analytical Insight Builder';
  }

  if (hasAnyCapability(capabilityMatches, ['project_management', 'program_portfolio_management', 'technical_program_management', 'change_management'])) {
    return 'Structured Delivery Operator';
  }

  if (hasAnyCapability(capabilityMatches, ['operations_process_improvement', 'procurement_vendor_management', 'facilities_real_estate', 'business_continuity'])) {
    return 'Workflow Optimization Operator';
  }

  if (a.energy === 'people') return 'Relationship-Centered Contributor';
  if (a.energy === 'strategy') return 'Strategic Direction Setter';
  if (a.energy === 'systems') return 'Process Improvement Operator';
  if (a.energy === 'execution') return 'Execution-Focused Operator';

  return 'Professional Operating Profile';
}

function styleFamily(style = '') {
  const s = safeLower(style);
  if (s.includes('founder')) return 'founder_operator';
  if (s.includes('technical service')) return 'technical_service';
  if (s.includes('client') || s.includes('service partner')) return 'customer_client';
  if (s.includes('care')) return 'healthcare';
  if (s.includes('learning')) return 'enablement';
  if (s.includes('reliability')) return 'frontline_operations';
  if (s.includes('precision')) return 'precision_compliance';
  if (s.includes('people operations')) return 'people_ops';
  if (s.includes('technical systems')) return 'technical_systems';
  if (s.includes('analytical')) return 'analysis';
  if (s.includes('delivery')) return 'delivery';
  if (s.includes('workflow')) return 'operations';
  if (s.includes('relationship')) return 'relationship';
  if (s.includes('strategy')) return 'strategy';
  if (s.includes('process')) return 'process';
  return 'execution';
}

function buildProfessionalSummary(style, capabilityMatches = [], answers = {}) {
  const labels = capabilityLabels(capabilityMatches, 4);
  const family = styleFamily(style);

  const capabilityPhrase = labels.length ? ` Evidence centers around ${labels.join(', ')}.` : '';

  const summaries = {
    founder_operator:
      'A builder-operator profile. Strongest when moving between system design and execution — creating infrastructure, strategy, and operating structure that others can work inside.',
    technical_service:
      'A technical service profile. Strongest when diagnosing issues, clarifying user impact, and moving problems toward resolution without losing sight of communication and follow-through.',
    customer_client:
      'A client-facing operating profile. Strongest when trust, communication, issue ownership, and practical follow-through determine whether the work lands well for the person being served.',
    healthcare:
      'A care-operations profile. Strongest where accuracy, coordination, patient or stakeholder experience, and dependable follow-through shape the quality of service.',
    enablement:
      'A learning-and-enablement profile. Strongest when knowledge needs to be made usable for others through guidance, documentation, training, or clearer shared context.',
    frontline_operations:
      'A reliability-centered operating profile. Strongest when consistency, safety, service quality, and steady execution matter more than abstract strategy.',
    precision_compliance:
      'A precision-and-control profile. Strongest where accuracy, documentation, judgment, and risk-aware execution support trust and operational confidence.',
    people_ops:
      'A people-operations profile. Strongest when work depends on trust, coordination, support, fairness, and helping people move through processes with clarity.',
    technical_systems:
      'A technical systems profile. Strongest when building, maintaining, troubleshooting, or improving technology environments where reliability and practical execution matter.',
    analysis:
      'An analytical insight profile. Strongest when information needs to be organized, interpreted, and turned into clearer decisions or next steps.',
    delivery:
      'A structured delivery profile. Strongest when work needs to move from plan to outcome through coordination, scope control, and follow-through.',
    operations:
      'A workflow optimization profile. Strongest when work processes need to be clarified, improved, connected, or made more reliable.',
    relationship:
      'A relationship-centered contributor profile. Strongest when trust, communication, and helping others move through work or decisions are central to the outcome.',
    strategy:
      'A direction-setting profile. Strongest when signals need to be connected, priorities need to be clarified, and effort needs a clearer path forward.',
    process:
      'A process-improvement profile. Strongest when complexity can be turned into clearer structure and better ways of working.',
    execution:
      'An execution-focused profile. Strongest when meaningful work needs to move forward through consistency, ownership, and visible progress.',
  };

  return `${summaries[family] || summaries.execution}${capabilityPhrase}`;
}

function buildPersonProfile(answers = {}, capabilityMatches = [], evidenceSignals = [], identityContext = {}) {
  const a = normalizeAnswers(answers);
  const resume = identityContext.resume || {};
  const projects = toArray((resume.projects?.length ? resume.projects : null) || identityContext.projects);
  const out = [];

  if (a.motivation) {
    const motivation = optionLabel(a.motivation);
    const reinforced = hasSignal(evidenceSignals, /ownership|service|mission|impact|leadership|reliability/i);
    out.push(
      reinforced
        ? `Driven by ${motivation}, with supporting evidence across reflection and professional record.`
        : `Driven by ${motivation}.`
    );
  }

  if (a.careerHope && a.idealImpact) {
    out.push(`Looking for ${optionLabel(a.careerHope, a.careerHope)} and wants their work to create tangible impact: ${truncate(a.idealImpact, 180)}`);
  } else if (a.careerHope) {
    out.push(`Looking for more ${optionLabel(a.careerHope, a.careerHope)} from their work.`);
  } else if (a.idealImpact) {
    out.push(`Wants their work to create: ${truncate(a.idealImpact, 200)}`);
  }

  if (projects.length >= 2) {
    out.push('Project evidence adds proof of follow-through across more than one body of work, strengthening the read beyond self-description alone.');
  } else if (projects.length === 1) {
    out.push('Project evidence provides an additional proof point for how this person turns work into an observable outcome.');
  }

  if (hasSignal(evidenceSignals, /service|relationship|support/i)) {
    out.push('Evidence suggests this person cares about whether the work lands clearly for the people affected by it.');
  } else if (hasSignal(evidenceSignals, /ownership|delivery|execution/i)) {
    out.push('Evidence suggests this person tends to carry responsibility through to outcome rather than only contributing a narrow piece.');
  } else if (hasSignal(evidenceSignals, /analysis|precision|risk/i)) {
    out.push('Evidence suggests this person values accuracy, clarity, and making sense of details before moving forward.');
  }

  return unique(out, 5);
}

function buildProfessionalProfile(style = '', capabilityMatches = [], evidenceSignals = [], identityContext = {}) {
  const resume = identityContext.resume || {};
  const projects = toArray((resume.projects?.length ? resume.projects : null) || identityContext.projects);
  const labels = capabilityLabels(capabilityMatches, 4);
  const family = styleFamily(style);
  const out = [];

  const lead = {
    founder_operator:
      'Professionally strongest at the intersection of system design and execution — building structures others can work inside while staying close enough to the work to see where it breaks.',
    technical_service:
      'Professionally strongest when practical troubleshooting, user communication, ticket or issue ownership, and service follow-through need to work together.',
    customer_client:
      'Professionally strongest when customer/client trust, issue ownership, communication, and relationship continuity directly affect outcomes.',
    healthcare:
      'Professionally strongest where coordination, accuracy, care experience, and reliable process execution shape the quality of support.',
    enablement:
      'Professionally strongest when knowledge must be translated into something repeatable, teachable, or easier for others to use.',
    frontline_operations:
      'Professionally strongest in environments where reliability, consistency, safety, service quality, and steady execution are essential.',
    precision_compliance:
      'Professionally strongest where accuracy, documentation, judgment, and risk-aware execution are required to protect quality and trust.',
    people_ops:
      'Professionally strongest when people, process, communication, and support need to be connected with care and consistency.',
    technical_systems:
      'Professionally strongest where systems need to be built, maintained, secured, debugged, or improved with practical execution.',
    analysis:
      'Professionally strongest when information needs to be organized, investigated, interpreted, and converted into usable insight.',
    delivery:
      'Professionally strongest when ownership, coordination, scope, timeline, and follow-through determine whether work reaches completion.',
    operations:
      'Professionally strongest when workflows, handoffs, resources, or operating processes need to become clearer and more reliable.',
    relationship:
      'Professionally strongest in trust-dependent work where communication and guidance help people move through complexity.',
    strategy:
      'Professionally strongest when direction, priorities, and decisions need to be shaped from incomplete or competing signals.',
    process:
      'Professionally strongest when complexity can be turned into structure and better ways of working.',
    execution:
      'Professionally strongest when clear outcomes need to become visible progress through dependable action.',
  };

  out.push(lead[family] || lead.execution);

  if (labels.length) {
    const top = labels.slice(0, 3).join(', ');
    out.push(`Capability evidence most strongly points toward ${top}.`);
  }

  if (projects.length >= 1) {
    out.push('Project evidence contributes to the professional read by showing applied work beyond role titles or self-reflection.');
  }

  if (Array.isArray(resume.experience) && resume.experience.length >= 2) {
    out.push('Resume history adds context about repeated professional environments, responsibilities, and scope over time.');
  }

  return unique(out, 5);
}

function hasSignal(signals = [], pattern) {
  return signals.some((s) => pattern.test(String(s || '')));
}

function buildHowTheyPerformBest(answers = {}, evidenceSignals = []) {
  const a = normalizeAnswers(answers);
  const out = [];

  out.push(
    a.autonomy === 'high'
      ? 'Performs best when trusted with outcome clarity and enough decision space to solve the problem without unnecessary friction.'
      : a.autonomy === 'medium'
      ? 'Performs best with clear goals, useful check-ins, and enough autonomy to adapt execution as context changes.'
      : 'Performs best with structured expectations, clear handoffs, and frequent alignment.'
  );

  out.push(
    a.ambiguity === 'high'
      ? 'Can operate inside ambiguity when there is a meaningful outcome to build toward.'
      : a.ambiguity === 'medium'
      ? 'Can handle change when priorities and success criteria remain visible.'
      : 'Performs best when scope, responsibilities, and success measures are stable.'
  );

  if (hasSignal(evidenceSignals, /service|relationship|support/i)) {
    out.push('Likely performs well when they can clarify needs, maintain trust, and close the loop for the person or team depending on them.');
  } else if (hasSignal(evidenceSignals, /systems|process|delivery|operations/i)) {
    out.push('Likely performs well when they can identify friction, organize moving parts, and create a practical path forward.');
  } else if (hasSignal(evidenceSignals, /analysis|precision|risk/i)) {
    out.push('Likely performs well when there is time and context to inspect details, validate assumptions, and reduce avoidable errors.');
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

  if (a.stressTrigger) out.push(`Likely pressure trigger: ${a.stressTrigger}`);
  if (a.stressNeed) out.push(`Support under stress: ${a.stressNeed}`);
  if (a.drain) out.push(`Likely stress drain: ${a.drain}`);

  return unique(out, 5);
}

function buildChallengeOrientation(answers = {}) {
  const a = normalizeAnswers(answers);

  return unique([
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
      : 'Challenge orientation should be refined through additional reflection.',
    a.challengeExample ? `Challenge example: ${a.challengeExample}` : '',
  ], 5);
}

function buildLearningProfile(answers = {}) {
  const a = normalizeAnswers(answers);
  const out = [];

  out.push(
    a.learningStyle
      ? `Learns best through ${optionLabel(a.learningStyle)}.`
      : 'Learning style should be captured so onboarding and coaching can be more precise.'
  );

  if (a.learningSupport) out.push(`Best learning support: ${a.learningSupport}`);

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

  return unique([
    a.motivation ? `Primary drive signal: ${optionLabel(a.motivation)}.` : '',
    a.recognitionStyle ? `Preferred recognition pattern: ${a.recognitionStyle}` : '',
    a.idealImpact ? `Desired impact: ${a.idealImpact}` : '',
  ], 5);
}

function buildCareerDirection(answers = {}) {
  const a = normalizeAnswers(answers);

  return unique([
    a.careerHope ? `Career hope: ${optionLabel(a.careerHope, a.careerHope)}.` : '',
    a.goal ? `Current reflection goal: ${a.goal}` : '',
    a.growth ? `Current growth focus: ${optionLabel(a.growth, a.growth)}.` : '',
  ], 5);
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

  if (hasSignal(evidenceSignals, /service|relationship|support/i)) {
    out.push('Work where trust, communication, and follow-through directly affect the quality of the outcome.');
  } else if (hasSignal(evidenceSignals, /systems|process|operations|delivery/i)) {
    out.push('Work where systems, handoffs, process, and execution need to connect instead of operating in silos.');
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
      : 'May benefit from stronger strategic framing so work is understood as impact, not just task completion.'
  );

  if (a.drain) {
    out.push(`Should watch for environments that repeat this drain pattern: ${a.drain}.`);
  } else {
    out.push('Should watch for environments where expectations, support, or communication are unclear.');
  }

  if (a.supportNeed) {
    out.push(`May be best supported by: ${a.supportNeed}`);
  } else if (hasSignal(evidenceSignals, /ownership|delivery|execution/i)) {
    out.push('May need explicit priority agreements so high ownership does not become silent over-extension.');
  }

  return unique(out, 5);
}

function buildIntegrationGuidance(answers = {}, evidenceSignals = []) {
  const a = normalizeAnswers(answers);
  const out = [
    'Clarify the outcome, operating context, and how success will be measured.',
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

  if (hasSignal(evidenceSignals, /service|relationship|support/i)) {
    out.push('Keep communication loops clear so the person can maintain trust with stakeholders, customers, clients, or teammates.');
  } else if (hasSignal(evidenceSignals, /process|systems|operations|delivery/i)) {
    out.push('Bring them into workflow, process, or delivery conversations early so they can identify friction before it becomes expensive.');
  }

  return unique(out, 6);
}

function buildRoleUtilization(style = '', capabilityMatches = [], answers = {}, evidenceSignals = []) {
  const family = styleFamily(style);
  const labels = capabilityLabels(capabilityMatches, 3);
  const out = [];

  if (labels.length) {
    out.push(`Utilize this person where ${labels.join(', ')} are relevant to the work context.`);
  }

  const byFamily = {
    founder_operator: 'Use them where systems, strategy, ownership, and execution need to be connected into something usable.',
    technical_service: 'Use them where technical issues need diagnosis, user communication, documented follow-through, and practical resolution.',
    customer_client: 'Use them where customer/client experience, trust, issue ownership, and relationship continuity matter.',
    healthcare: 'Use them where care coordination, accuracy, process reliability, and stakeholder experience matter.',
    enablement: 'Use them where knowledge needs to be transferred, documented, taught, or made repeatable for others.',
    frontline_operations: 'Use them where reliability, consistency, safety, service quality, and steady execution are essential.',
    precision_compliance: 'Use them where accuracy, documentation, controls, and risk-aware decisions protect quality.',
    people_ops: 'Use them where people, policy, coordination, support, and communication need to be handled with care.',
    technical_systems: 'Use them where systems need to be built, maintained, troubleshot, secured, or improved.',
    analysis: 'Use them where information needs to be organized, analyzed, and converted into clearer decisions.',
    delivery: 'Use them where work needs to move from plan to outcome through scope, coordination, and follow-through.',
    operations: 'Use them where workflows, handoffs, resources, or operating processes need to become clearer and more reliable.',
    relationship: 'Use them where trust, guidance, and communication help people move through complexity.',
    strategy: 'Use them where competing signals need to be synthesized into clearer direction.',
    process: 'Use them where complexity needs to be converted into practical structure.',
    execution: 'Use them where clear outcomes need steady action and visible progress.',
  };

  out.push(byFamily[family] || byFamily.execution);

  if (answers.pressure === 'calm') {
    out.push('They may be especially useful in situations that require calm assessment and disciplined follow-through.');
  }

  if (answers.ambiguity === 'high') {
    out.push('They may be especially useful when the path is not fully defined but the outcome matters.');
  }

  return unique(out, 6);
}

function buildAudienceViews() {
  return {
    seeker:
      'Use this profile to explain how you operate, what conditions help you perform, and what support helps you contribute without overextending.',
    coach:
      'Use this profile to shape coaching conversations around evidence-backed strengths, growth areas, role fit, confidence, and professional narrative.',
    recruiter:
      'Use this profile to support placement, onboarding, team integration, and management alignment. This should not act as a hidden score or screening filter.',
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
      ...capabilityMatches.slice(0, 8).map((m) => {
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

function buildSourceInfluence(identityContext = {}, capabilityMatches = []) {
  const resume = identityContext.resume || {};
  const projects = toArray((resume.projects?.length ? resume.projects : null) || identityContext.projects);
  const labels = capabilityLabels(capabilityMatches, 5);

  return unique([
    labels.length ? `Capability inference came from shared ForgeTomorrow taxonomy matches: ${labels.join(', ')}.` : '',
    resume.summary || toArray(resume.experience).length ? 'Resume evidence influenced professional scope, capability confidence, and repeated work-pattern conclusions.' : '',
    identityContext.headline || identityContext.aboutMe ? 'Portfolio evidence influenced public narrative, positioning, and professional identity framing.' : '',
    projects.length ? 'Project evidence influenced applied-work conclusions by showing proof beyond job titles and self-reflection.' : '',
  ], 6);
}

function buildCapabilityGuidance(capabilityMatches = []) {
  return capabilityMatches
    .slice(0, 5)
    .map((match) => {
      const label = match?.capability?.label;
      if (!label) return null;

      const guidance = capabilityGuidance(label);

      return {
        label,
        family: guidance?.family || 'general',
        strength: guidance?.strength || '',
        validation: guidance?.validation || '',
        questionTip: guidance?.questionTip || '',
      };
    })
    .filter(Boolean);
}

function buildConfidenceSignals(reflection = [], evidenceSignals = [], capabilityMatches = []) {
  const combined = [
    ...reflection,
    ...evidenceSignals,
    ...capabilityLabels(capabilityMatches, 12),
  ].map((item) => safeLower(item));

  const counts = new Map();

  const buckets = [
    ['Systems & Operations', /system|operational|process|workflow|it service|platform|delivery/i],
    ['Ownership & Accountability', /ownership|accountab|independent|delivery|project|follow-through/i],
    ['Service & Relationship', /service|customer|client|support|relationship|care|people/i],
    ['Problem Resolution', /problem|resolver|troubleshoot|diagnos|root cause|analysis/i],
    ['Precision & Risk Awareness', /precision|risk|compliance|governance|accuracy|safety|security/i],
    ['Learning & Adaptability', /learner|learning|ambiguity|adaptability|change|training|enablement/i],
    ['Strategic Thinking', /strategic|strategy|business|product|architecture|direction/i],
  ];

  for (const item of combined) {
    if (!item) continue;

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
  const strengthSignals = uniqueSignals([...reflection, ...evidenceSignals], 10);

  const operatingStyle = inferOperatingStyle(answers, capabilityMatches, behavioralSignals, sourceText);
  const professionalSummary = buildProfessionalSummary(operatingStyle, capabilityMatches, answers);
  const why = buildWhyEvidence(answers, identityContext, capabilityMatches, behavioralSignals);

  const personProfile = buildPersonProfile(answers, capabilityMatches, strengthSignals, identityContext);
  const professionalProfile = buildProfessionalProfile(operatingStyle, capabilityMatches, strengthSignals, identityContext);
  const howTheyPerformBest = buildHowTheyPerformBest(answers, strengthSignals);
  const stressProcessing = buildStressProcessing(answers);
  const challengeOrientation = buildChallengeOrientation(answers);
  const learningProfile = buildLearningProfile(answers);
  const motivationProfile = buildMotivationProfile(answers);
  const careerDirection = buildCareerDirection(answers);
  const roleUtilization = buildRoleUtilization(operatingStyle, capabilityMatches, answers, strengthSignals);
  const signalGroups = groupedSignals(strengthSignals);
  const confidenceSignals = buildConfidenceSignals(reflection, evidenceSignals, capabilityMatches);
  const sourceInfluence = buildSourceInfluence(identityContext, capabilityMatches);
  const capabilityGuidanceItems = buildCapabilityGuidance(capabilityMatches);

  return {
    title: 'Professional Operating Profile',
    operatingStyle,
    professionalSummary,

    strengthSignals,

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

    thrivesIn: buildThrivesIn(answers, strengthSignals),
    supportAreas: buildSupportAreas(answers, strengthSignals),
    integrationGuidance: buildIntegrationGuidance(answers, strengthSignals),
    roleUtilization,

    signalGroups,
    confidenceSignals,

    why: {
      ...why,
      sourceInfluence,
    },
    sourceInfluence,
    capabilityGuidance: capabilityGuidanceItems,
    audienceViews: buildAudienceViews(),
    evidence: [
      ...sourceInfluence.map((item) => `Source influence: ${item}`),
      ...why.selfReflection.slice(0, 3).map((item) => `Self-reflection evidence: ${item}`),
      ...why.resumeEvidence.slice(0, 2).map((item) => `Resume evidence: ${item}`),
      ...why.portfolioEvidence.slice(0, 2).map((item) => `Portfolio evidence: ${item}`),
      ...why.projectEvidence.slice(0, 2),
      ...why.intelligenceEvidence.slice(0, 3).map((item) => `WHY intelligence signal: ${item}`),
    ],
    meta: {
      generatedAt: new Date().toISOString(),
      source: 'professionalOperatingProfileEngine',
      profileVersion: '2.2.1-shared-intelligence-json-safe',
      evidenceSources: {
        selfReflection: why.selfReflection.length,
        resume: why.resumeEvidence.length,
        portfolio: why.portfolioEvidence.length,
        projects: why.projectEvidence.length,
        intelligence: why.intelligenceEvidence.length,
        sourceInfluence: sourceInfluence.length,
      },
      dominantDomains: domainCounts(capabilityMatches).slice(0, 5),
      capabilityIds: capabilityIds(capabilityMatches).slice(0, 12),
      resumeId: identityContext.resumeId || identityContext.resume?.resumeId || null,
      resumeUpdatedAt: identityContext.resumeUpdatedAt || null,
    },
  };
}

export default buildProfessionalOperatingProfile;
