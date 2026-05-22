// lib/ai/strikerToolMap.js
// ForgeTomorrow Striker — Platform Tool Intelligence
//
// Every tool on the platform that Striker knows about:
// what it does, how to guide a user through it, what it produces,
// and what Striker must not do while inside it.
//
// Usage:
//   import { getToolPlaybook, TOOLS } from '@/lib/ai/strikerToolMap';
//   const guidance = getToolPlaybook('forge_hammer');

export const TOOLS = {
  // ── Resume tools ────────────────────────────────────────────────────────────
  FORGE_HAMMER:           'forge_hammer',
  RESUME_BUILDER:         'resume_builder',
  COVER_BUILDER:          'cover_builder',

  // ── Anvil tools ─────────────────────────────────────────────────────────────
  PROFILE_DEVELOPMENT:    'profile_development',
  OFFER_NEGOTIATION:      'offer_negotiation',
  PROJECT_PROMOTION:      'project_promotion',
  ONBOARDING_GROWTH:      'onboarding_growth',
  ROADMAP:                'roadmap',

  // ── Intelligence tools ──────────────────────────────────────────────────────
  DISCOVERY_MATCH:        'discovery_match',
  TARGETING_MATCH:        'targeting_match',
  WHY_ENGINE:             'why_engine',
  EXTERNAL_COMPARE:       'external_compare',
  JD_OPTIMIZER:           'jd_optimizer',
  ATS_BUILDER:            'ats_builder',

  // ── Coaching tools ──────────────────────────────────────────────────────────
  COACHING_INTELLIGENCE:  'coaching_intelligence',
  CLIENT_DOSSIER:         'client_dossier',
  SESSION_PLANNER:        'session_planner',
  COACHING_STRATEGY:      'coaching_strategy',

  // ── Platform tools ──────────────────────────────────────────────────────────
  TALENT_POOLS:           'talent_pools',
  PIPELINE:               'pipeline',
  SIGNAL_MESSAGING:       'signal_messaging',
  SPOTLIGHT:              'spotlight',
  CAREER_FEED:            'career_feed',
};

const TOOL_PLAYBOOKS = {

  // ── Forge Hammer ─────────────────────────────────────────────────────────────
  [TOOLS.FORGE_HAMMER]: {
    name: 'Forge Hammer',
    role: 'SEEKER',
    description: 'Resume-to-JD alignment engine. Scores how well a seeker\'s resume matches a specific job description and surfaces evidence gaps.',
    where: 'Inside Resume Builder (/resume/create). Also accessible from job detail pages.',
    whatItProduces: 'Alignment score, strength highlights, gap analysis, improvement recommendations.',
    howToGuide: [
      '1. Load or paste the target JD into Hammer.',
      '2. Run the alignment review.',
      '3. Fix only evidence-backed gaps — never invent skills.',
      '4. Strengthen Summary, Skills, and Experience bullets around the JD\'s actual requirements.',
      '5. Re-run after edits to confirm improvement.',
      'Goal: clearer evidence, not keyword stuffing.',
    ],
    strikerCanDo: [
      'Explain what the alignment score means.',
      'Identify which resume sections have the weakest evidence.',
      'Suggest specific language improvements grounded in real experience.',
      'Advise on which resume to use for a specific job.',
    ],
    strikerCannotDo: [
      'Invent skills, titles, or experience the seeker does not have.',
      'Guarantee ATS pass rates.',
      'Make hiring decisions.',
    ],
  },

  // ── Resume Builder ────────────────────────────────────────────────────────────
  [TOOLS.RESUME_BUILDER]: {
    name: 'Resume Builder',
    role: 'SEEKER',
    description: 'Full resume creation and editing tool with template support. Inline editing directly on the resume. 4-resume limit with primary designation.',
    where: '/resume/create',
    whatItProduces: 'Formatted resume. Supports ForgeFormat two-layer architecture.',
    howToGuide: [
      'ForgeFormat: Page 1 is the signal page — impact snapshot, core capabilities, employer spine.',
      'Pages 2+ are full chronological story pages.',
      'Edit sections inline — Summary, Skills, Experience, Education, Projects, Certifications.',
      'Designate one resume as primary (used by default in Discovery Match and applications).',
      'Stay under 4 resumes — each should target a different role family or context.',
      'Use Hammer to test alignment before finalizing.',
    ],
    strikerCanDo: [
      'Improve specific sections with concrete, evidence-backed language.',
      'Explain ForgeFormat architecture and why it works.',
      'Suggest which template fits the target role.',
      'Advise on primary resume designation.',
      'Route to Hammer for JD alignment testing.',
    ],
    strikerCannotDo: [
      'Invent experience, credentials, or skills.',
      'Rewrite the entire resume without being asked — work section by section.',
    ],
    templates: [
      'ReverseResumeTemplate — signal-first layout, impact before history.',
      'HybridResumeTemplate — balanced signal + story.',
      'SignalResumeTestTemplate — experimental ForgeFormat signal page.',
    ],
  },

  // ── Cover Builder ─────────────────────────────────────────────────────────────
  [TOOLS.COVER_BUILDER]: {
    name: 'Cover Letter Builder',
    role: 'SEEKER',
    description: 'AI-assisted cover letter creation tied to a specific job and company.',
    where: '/cover/create',
    whatItProduces: 'Formatted cover letter, PDF-ready.',
    howToGuide: [
      '3-paragraph structure: fit and enthusiasm → proof and accomplishments → call to action.',
      'Tie every paragraph to the specific JD and company.',
      'Do not pad with generic language or buzzwords.',
      'Keep under 400 words.',
    ],
    strikerCanDo: [
      'Draft cover letter content for a specific role.',
      'Improve weak paragraphs.',
      'Make the letter more specific to the company.',
    ],
    strikerCannotDo: [
      'Invent achievements or credentials.',
    ],
  },

  // ── Anvil: Profile Development ────────────────────────────────────────────────
  [TOOLS.PROFILE_DEVELOPMENT]: {
    name: 'Profile Development',
    role: 'SEEKER',
    description: 'Guided tool for building and strengthening a seeker\'s professional profile and portfolio signal.',
    where: '/anvil?module=profile',
    whatItProduces: 'Improved headline, about section, skills, and project evidence. Stronger Discovery Match signal.',
    howToGuide: [
      'Start with the headline — it\'s the first thing recruiters read in Discovery Match.',
      'About section: position for the target role, not a biography.',
      'Skills: add only demonstrated skills — these feed Targeting Match.',
      'Projects: extract scope, ownership, tools, and outcome for each.',
      'Education and certifications: keep current and complete.',
    ],
    strikerCanDo: [
      'Suggest stronger headline language.',
      'Rewrite the about section for target role positioning.',
      'Help frame projects with scope + ownership + tools + outcome.',
    ],
    strikerCannotDo: [
      'Invent credentials or experience.',
    ],
  },

  // ── Anvil: Offer Negotiation ──────────────────────────────────────────────────
  [TOOLS.OFFER_NEGOTIATION]: {
    name: 'Offer Negotiation',
    role: 'SEEKER',
    description: 'Guided offer evaluation and negotiation strategy builder.',
    where: '/anvil?module=offer or /offer-negotiation',
    whatItProduces: 'Negotiation strategy, scripts, counter-offer framing, total comp breakdown.',
    howToGuide: [
      'Capture offer components: base, bonus, equity, PTO, remote, title, start date.',
      'Identify leverage: competing offers, market data, unique skills.',
      'Build ask structure: primary ask → fallback (bonus/equity/PTO).',
      'Script the conversation: gratitude → data → justified ask → fallback.',
      'Risk: know the company\'s flexibility signals before asking.',
    ],
    strikerCanDo: [
      'Help evaluate total comp components.',
      'Draft negotiation scripts.',
      'Suggest fallback positions.',
      'Frame the ask professionally.',
    ],
    strikerCannotDo: [
      'Promise salary outcomes.',
      'Drift into resume or job search advice on this surface.',
    ],
  },

  // ── Anvil: Project Promotion ──────────────────────────────────────────────────
  [TOOLS.PROJECT_PROMOTION]: {
    name: 'Project Promotion',
    role: 'SEEKER',
    description: 'Tool for packaging a work project into a portfolio-ready, interview-ready, resume-ready asset.',
    where: '/anvil?module=project-promotion',
    whatItProduces: 'Structured project narrative with scope, ownership, tools, outcome, and impact.',
    howToGuide: [
      'Extract four elements: scope (what was the project), ownership (what was your role), tools (what did you use), outcome (what was the result).',
      'Add measurable impact wherever possible: $, %, time saved, users affected.',
      'Frame for three use cases: portfolio, resume bullet, interview story (STAR format).',
    ],
    strikerCanDo: [
      'Help extract the four project elements.',
      'Write portfolio-ready project descriptions.',
      'Convert to resume bullet and STAR interview story.',
    ],
    strikerCannotDo: [
      'Invent impact numbers or outcomes.',
    ],
  },

  // ── Anvil: Onboarding Growth / Roadmap ────────────────────────────────────────
  [TOOLS.ONBOARDING_GROWTH]: {
    name: 'Onboarding Growth Roadmap',
    role: 'SEEKER',
    description: '30/60/90 day success plan builder for new roles.',
    where: '/anvil?module=onboarding or /anvil/onboarding-growth',
    whatItProduces: 'Structured 30/60/90 plan with goals, deliverables, learning milestones, stakeholder check-ins.',
    howToGuide: [
      'Capture: role title, start date, seniority level, team size, key stakeholders.',
      '30 days: learn the landscape — processes, tools, people, expectations.',
      '60 days: start contributing — first deliverables, relationships built.',
      '90 days: prove value — measurable outcomes, expanded scope.',
      'Tailor by environment: startup vs enterprise vs nonprofit vs government.',
    ],
    strikerCanDo: [
      'Build a full 30/60/90 plan.',
      'Tailor by role seniority and environment.',
      'Suggest stakeholder check-in formats.',
    ],
    strikerCannotDo: [],
  },

  // ── Discovery Match ────────────────────────────────────────────────────────────
  [TOOLS.DISCOVERY_MATCH]: {
    name: 'Discovery Match',
    role: 'RECRUITER',
    description: 'Broader internal candidate discovery score. NOT the same as Targeting Match or External Compare.',
    whatItIs: 'Semantic relevance engine. Finds candidates who may fit using adjacent-role logic, portfolio/profile signal, primary resume support, skills, preferences, and visible platform evidence.',
    whenToUse: 'Start here. Use when exploring — role family, not exact title. Find possible fits and adjacent fits.',
    vsTargeting: 'Discovery is broad exploration. Targeting is precision qualification. Use Discovery first, Targeting to refine.',
    strikerCanDo: [
      'Explain Discovery Match score to recruiters.',
      'Suggest search strategies that improve Discovery results.',
      'Advise on role family vs exact title search approach.',
    ],
    strikerCannotDo: [
      'Tell seekers how to game the Discovery Match algorithm.',
      'Describe Discovery Match as external candidate matching.',
    ],
  },

  // ── Targeting Match ────────────────────────────────────────────────────────────
  [TOOLS.TARGETING_MATCH]: {
    name: 'Targeting Match',
    role: 'RECRUITER',
    description: 'Stricter internal candidate qualification score. NOT the same as Discovery Match or External Compare.',
    whatItIs: 'Precision qualification engine. Evaluates against explicit recruiter criteria: title, skills, status, location, education, languages, work preferences, and saved targeting rules.',
    whenToUse: 'After Discovery. Use when you need precision — shortlisting, saved automation, repeatable workflows.',
    vsDiscovery: 'Targeting is conservative — it scores tighter criteria. If a candidate lacks an explicit requirement, their Targeting score drops. Use after you\'ve seen the Discovery spread.',
    strikerCanDo: [
      'Explain Targeting Match score to recruiters.',
      'Advise on which targeting filters to use.',
      'Help build saved targeting automation.',
    ],
    strikerCannotDo: [
      'Tell seekers how to game the Targeting Match algorithm.',
      'Describe Targeting Match as external candidate matching.',
    ],
  },

  // ── WHY Engine ─────────────────────────────────────────────────────────────────
  [TOOLS.WHY_ENGINE]: {
    name: 'WHY Engine',
    role: 'RECRUITER',
    description: 'Explainability layer that shows recruiters WHY a candidate ranked where they did.',
    whatItIs: 'Provides: match score, strongest alignment signals, biggest gaps, and reasons for ranking.',
    whenToUse: 'Open WHY only for candidates you\'re actually considering acting on. Don\'t open WHY for every result.',
    evaluationPath: [
      '1. Strongest evidence: title match, skills, portfolio/profile signal, resume support.',
      '2. Biggest validation risk: missing proof, weak title match, logistics mismatch.',
      '3. Decision: strong evidence + low risk = shortlist/message. Adjacent evidence = screen. Weak + high risk = keep warm or skip.',
      '4. Best probe: ask for one example proving scope + ownership + tools + outcome.',
    ],
    strikerCanDo: [
      'Translate WHY score into a concrete hiring recommendation.',
      'Identify the strongest and weakest evidence signals.',
      'Suggest targeted interview validation questions based on WHY gaps.',
    ],
    strikerCannotDo: [
      'Make the hiring decision.',
      'Present AI as the decision-maker.',
    ],
  },

  // ── External Compare ────────────────────────────────────────────────────────────
  [TOOLS.EXTERNAL_COMPARE]: {
    name: 'External Compare',
    role: 'RECRUITER',
    description: 'Recruiter tool for evaluating external resumes (pasted or uploaded) against a job description.',
    where: '/recruiter/explain',
    whatItIs: 'Separate from internal candidate search. For candidates not yet on ForgeTomorrow.',
    whatItProduces: 'Evidence read: fit, gaps, risks, interview validation questions, next-step recommendation.',
    conversionPath: [
      'Evaluate external candidate.',
      'If worth pursuing → invite them to ForgeTomorrow.',
      'Once they join → they become an internal candidate with full signal (profile, portfolio, resume).',
      'Then use internal tools (Discovery/Targeting/WHY) instead of external-only evaluation.',
    ],
    strikerCanDo: [
      'Help evaluate an external resume against a JD.',
      'Produce screening questions.',
      'Advise on invite-to-platform conversion.',
    ],
    strikerCannotDo: [
      'Coach the external candidate — only support the recruiter.',
    ],
  },

  // ── JD Optimizer ───────────────────────────────────────────────────────────────
  [TOOLS.JD_OPTIMIZER]: {
    name: 'JD Optimizer',
    role: 'RECRUITER',
    description: 'AI tool that restructures and improves job descriptions for clarity, ATS compatibility, and candidate alignment.',
    where: 'Accessible from Recruiter tools. API: /api/recruiter/jd-optimize and /api/ai/generate?tool=optimizeJD.',
    whatItProduces: 'Cleaned, restructured JD with: clear role summary, split must-have/preferred requirements, measurable responsibilities, EEO language properly placed.',
    howToGuide: [
      '1. Separate role work from company boilerplate.',
      '2. Split requirements: must-have vs nice-to-have.',
      '3. Remove vague personality traits unless they map to real work.',
      '4. Add measurable responsibilities where possible.',
      '5. Keep EEO/legal language outside the main requirements block.',
      '6. Keep company boilerplate short — heavy boilerplate dilutes alignment quality.',
    ],
    strikerCanDo: [
      'Paste the JD and restructure it.',
      'Identify what\'s boilerplate vs role-specific.',
      'Flag vague requirements.',
    ],
    strikerCannotDo: [
      'Help seekers write or fake a JD.',
    ],
  },

  // ── Coaching Intelligence Engine ───────────────────────────────────────────────
  [TOOLS.COACHING_INTELLIGENCE]: {
    name: 'Coaching Intelligence Engine',
    role: 'COACH',
    description: 'Universal Context Adaptation System. Auto-detects the dominant target environment and switches all coaching output lenses simultaneously.',
    where: '/pages/api/coaching/clients/strategy.js',
    environments: {
      ENTERPRISE:   'Large organizations. Focus: executive presence, stakeholder management, structured career ladders, formal reviews.',
      STARTUP:      'Early-stage or growth companies. Focus: adaptability, ownership, speed, wearing many hats.',
      NONPROFIT:    'Mission-driven orgs. Focus: impact narrative, budget constraints, grant/fundraising context, values alignment.',
      FAITH_BASED:  'Faith-based organizations. Focus: values alignment, community service, servant leadership framing.',
      GOVERNMENT:   'Public sector. Focus: civil service structures, policy, stability, GS/equivalent ladders.',
      MIXED:        'Client targeting multiple environments. Balanced lens across all.',
    },
    howToGuide: [
      'Identify the client\'s target environment from their goal and job targets.',
      'Apply the matching lens to all coaching outputs: language, framing, emphasis.',
      'Switch lens when the client\'s targets change.',
    ],
    strikerCanDo: [
      'Identify the right environment lens for a client.',
      'Reframe coaching advice through the correct lens.',
      'Flag when a client\'s language doesn\'t match their target environment.',
    ],
    strikerCannotDo: [],
  },

  // ── Client Dossier ─────────────────────────────────────────────────────────────
  [TOOLS.CLIENT_DOSSIER]: {
    name: 'Client Dossier',
    role: 'COACH',
    description: 'Live-generated coaching packet per client. No new DB fields — derived from existing client data. Used as session prep and coach handoff document.',
    where: '/pages/dashboard/coaching/clients/dossier.js',
    whatItProduces: 'Structured client summary: goal, blocker, evidence, session history, action plan, homework, next focus.',
    howToGuide: [
      'Review before every session.',
      'Use as handoff document when transferring a client to another coach.',
      'Dossier is live — always reflects the current state of the client record.',
    ],
    strikerCanDo: [
      'Help interpret dossier data.',
      'Suggest session prep questions based on the dossier.',
      'Help frame handoff notes.',
    ],
    strikerCannotDo: [],
  },

  // ── Session Planner ────────────────────────────────────────────────────────────
  [TOOLS.SESSION_PLANNER]: {
    name: 'Session Planner',
    role: 'COACH',
    description: 'Tool for building and documenting coaching session agendas, notes, and homework.',
    where: '/dashboard/coaching/sessions',
    whatItProduces: 'Session agenda, notes, homework assignments, follow-up actions.',
    howToGuide: [
      'Before session: review dossier, set agenda, prep 2-3 targeted questions.',
      'During: capture key insights and decisions.',
      'After: document homework, set next session focus.',
      'Appointment requests appear in the Agenda | Appointment Requests tab strip.',
    ],
    strikerCanDo: [
      'Build session agendas from client context.',
      'Suggest targeted coaching questions.',
      'Help document session outcomes.',
    ],
    strikerCannotDo: [],
  },

  // ── Coaching Strategy ──────────────────────────────────────────────────────────
  [TOOLS.COACHING_STRATEGY]: {
    name: 'Coaching Strategy',
    role: 'COACH',
    description: 'AI-powered strategy generation for individual coaching clients.',
    where: '/api/coaching/clients/strategy.js',
    whatItProduces: 'Structured coaching strategy: direction, risks, targets, execution plan.',
    howToGuide: [
      'Capture client goal and current blocker first.',
      'Strategy tool generates: Overview → Direction → Risks → Targets → Execution.',
      'CommandBrief shows results in 5-tab system with globally collapsible reasoning.',
      'Execution plan should end with concrete homework and next-session focus.',
    ],
    strikerCanDo: [
      'Help interpret strategy output.',
      'Suggest refinements to the execution plan.',
      'Translate strategy into client-facing language when needed.',
    ],
    strikerCannotDo: [],
  },

  // ── Talent Pools ───────────────────────────────────────────────────────────────
  [TOOLS.TALENT_POOLS]: {
    name: 'Talent Pools',
    role: 'RECRUITER',
    description: 'System for organizing internal candidates into named, reusable hiring pipelines.',
    where: '/recruiter/pools',
    whatItProduces: 'Named pools with candidate lists, follow-up timing, and next actions.',
    howToGuide: [
      'Name pools by role family or hiring need, not by candidate names.',
      'Add candidates from Discovery or Targeting search results.',
      'Set follow-up timing for warm candidates (typically 30-60 days).',
      'Use pools for repeatable hiring patterns — same role family opens repeatedly.',
    ],
    strikerCanDo: [
      'Suggest pool naming and segmentation logic.',
      'Advise on follow-up timing.',
      'Help identify which candidates to move between pools.',
    ],
    strikerCannotDo: [],
  },

  // ── Pipeline ───────────────────────────────────────────────────────────────────
  [TOOLS.PIPELINE]: {
    name: 'Hiring Pipeline',
    role: 'RECRUITER',
    description: 'Candidate pipeline management with stage tracking per job posting.',
    where: '/api/recruiter/pipeline.js',
    stages: ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected', 'On Hold'],
    platformPolicy: 'Recruiters cannot unilaterally remove seekers. All stage changes funnel through ForgeTomorrow for review. Seeker protection is a core platform principle.',
    strikerCanDo: [
      'Explain stage meanings and next actions.',
      'Advise on when to advance, hold, or close a candidate.',
      'Help draft stage-change communication.',
    ],
    strikerCannotDo: [
      'Advise bypassing the ForgeTomorrow review process.',
      'Recommend unilateral seeker removal.',
    ],
  },

  // ── Signal Messaging ────────────────────────────────────────────────────────────
  [TOOLS.SIGNAL_MESSAGING]: {
    name: 'Signal Messaging',
    role: 'ALL',
    description: 'Ghost conversation system that protects seekers from unsolicited contact. All recruiter-seeker communication goes through ForgeTomorrow.',
    platformPolicy: 'Ghost conversation threads prevent unsolicited candidate contact. Recruiters cannot message seekers directly without a connection or contact request being accepted first.',
    strikerCanDo: [
      'Help draft professional messages for both seekers and recruiters.',
      'Advise on message timing and follow-up.',
      'Explain how the contact request and ghost conversation system works.',
    ],
    strikerCannotDo: [
      'Advise bypassing the ghost conversation system.',
      'Suggest contacting candidates outside the platform.',
    ],
  },

  // ── Spotlight ──────────────────────────────────────────────────────────────────
  [TOOLS.SPOTLIGHT]: {
    name: 'Hearth Spotlight',
    role: 'ALL',
    description: 'Coach and mentor spotlight profiles in The Hearth. Seekers can discover, connect with, and book coaches.',
    where: '/hearth/spotlights and /the-hearth?module=mentorship',
    bookingPath: 'Book CTA triggers RequestAppointmentModal → creates AppointmentRequest + ContactRequest atomically → coach responds via RespondModal → on Confirm: accepts contact, creates CoachingClient + CoachingSession + ghost conversation.',
    strikerCanDo: [
      'Help seekers evaluate spotlight profiles.',
      'Guide through booking flow.',
      'Help coaches create or improve their spotlight content.',
    ],
    strikerCannotDo: [],
  },

  // ── Career Feed ────────────────────────────────────────────────────────────────
  [TOOLS.CAREER_FEED]: {
    name: 'Career Signal Feed',
    role: 'SEEKER',
    description: 'Community feed for professional posts, reactions, and career signal building.',
    where: '/feed',
    strikerCanDo: [
      'Help draft posts that build professional credibility.',
      'Suggest topics aligned with the seeker\'s target role.',
      'Help craft responses to other members\' posts.',
    ],
    strikerCannotDo: [
      'Post on behalf of the user.',
    ],
  },
};

// ─── Public API ────────────────────────────────────────────────────────────────

export function getToolPlaybook(toolKey) {
  return TOOL_PLAYBOOKS[toolKey] || null;
}

export function getToolsForSurface(surface) {
  const surfaceToolMap = {
    resume_builder:             [TOOLS.RESUME_BUILDER, TOOLS.FORGE_HAMMER],
    anvil:                      [TOOLS.PROFILE_DEVELOPMENT, TOOLS.RESUME_BUILDER, TOOLS.OFFER_NEGOTIATION, TOOLS.PROJECT_PROMOTION, TOOLS.ONBOARDING_GROWTH],
    anvil_profile_development:  [TOOLS.PROFILE_DEVELOPMENT],
    anvil_resume:               [TOOLS.RESUME_BUILDER, TOOLS.FORGE_HAMMER],
    anvil_offer_negotiation:    [TOOLS.OFFER_NEGOTIATION],
    anvil_project_promotion:    [TOOLS.PROJECT_PROMOTION],
    anvil_onboarding_growth:    [TOOLS.ONBOARDING_GROWTH],
    job_search:                 [TOOLS.FORGE_HAMMER, TOOLS.RESUME_BUILDER],
    job_detail:                 [TOOLS.FORGE_HAMMER, TOOLS.COVER_BUILDER],
    job_apply:                  [TOOLS.COVER_BUILDER, TOOLS.FORGE_HAMMER],
    offer_negotiation:          [TOOLS.OFFER_NEGOTIATION],
    cover_builder:              [TOOLS.COVER_BUILDER],
    internal_candidate_search:  [TOOLS.DISCOVERY_MATCH, TOOLS.TARGETING_MATCH, TOOLS.WHY_ENGINE],
    recruiter_candidate_center: [TOOLS.DISCOVERY_MATCH, TOOLS.TARGETING_MATCH, TOOLS.WHY_ENGINE, TOOLS.EXTERNAL_COMPARE, TOOLS.TALENT_POOLS],
    external_candidate_compare: [TOOLS.EXTERNAL_COMPARE],
    talent_pools:               [TOOLS.TALENT_POOLS],
    recruiter_jobs:             [TOOLS.JD_OPTIMIZER],
    recruiter_job_detail:       [TOOLS.JD_OPTIMIZER, TOOLS.DISCOVERY_MATCH],
    coaching_client_detail:     [TOOLS.COACHING_INTELLIGENCE, TOOLS.CLIENT_DOSSIER, TOOLS.SESSION_PLANNER, TOOLS.COACHING_STRATEGY],
    coaching_sessions:          [TOOLS.SESSION_PLANNER],
    coaching_client_hub:        [TOOLS.SESSION_PLANNER, TOOLS.COACHING_STRATEGY],
    hearth_mentorship:          [TOOLS.SPOTLIGHT],
    hearth_spotlights:          [TOOLS.SPOTLIGHT],
    signal_messages:            [TOOLS.SIGNAL_MESSAGING],
    recruiter_messaging:        [TOOLS.SIGNAL_MESSAGING],
    career_signal_feed:         [TOOLS.CAREER_FEED],
  };
  return (surfaceToolMap[surface] || []).map(key => TOOL_PLAYBOOKS[key]).filter(Boolean);
}

// Build a compact tool context block for system prompt injection
export function buildToolContextBlock(toolKeys = []) {
  if (!toolKeys.length) return '';
  const blocks = toolKeys
    .map(key => TOOL_PLAYBOOKS[key])
    .filter(Boolean)
    .map(t => `Tool: ${t.name}\nPurpose: ${t.description}`)
    .join('\n\n');
  return blocks ? `Available tools on this surface:\n\n${blocks}` : '';
}