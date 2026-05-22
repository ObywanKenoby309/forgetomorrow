// lib/ai/strikerSiteMap.js
// ForgeTomorrow Striker — Site & Surface Intelligence
//
// Replaces the basic detectSurfaceFromPath in strikerContextBuilders.js.
// Key upgrade: inlay/module awareness. Many ForgeTomorrow hub pages never
// change their URL when a sub-tool opens — the module renders in place.
// This file reads router.query (passed via context.query) to resolve the
// true active surface, not just the base path.
//
// Usage in strikerContextBuilders.js:
//   import { detectSurface } from '@/lib/ai/strikerSiteMap';
//   const surface = detectSurface(pathname, asPath, query);
//
// Usage in send.js (already has detectSurface inline — replace with this):
//   import { detectSurface, getSurfacePlaybook } from '@/lib/ai/strikerSiteMap';

// ─── Surface registry ──────────────────────────────────────────────────────────
// Every named surface Striker knows about. If it's not in here, it's general_workspace.
export const SURFACES = {
  // ── Seeker ──────────────────────────────────────────────────────────────────
  SEEKER_DASHBOARD:         'seeker_dashboard',
  JOB_SEARCH:               'job_search',
  JOB_DETAIL:               'job_detail',
  JOB_APPLY:                'job_apply',
  RESUME_BUILDER:           'resume_builder',
  RESUME_SAVED:             'resume_saved',
  RESUME_VIEW:              'resume_view',
  COVER_BUILDER:            'cover_builder',
  OFFER_NEGOTIATION:        'offer_negotiation',
  PORTFOLIO_PROFILE:        'portfolio_profile',
  MEMBER_PROFILE:           'member_profile',
  SIGNAL_MESSAGES:          'signal_messages',
  CAREER_SIGNAL_FEED:       'career_signal_feed',
  SEEKER_APPLICATIONS:      'seeker_applications',
  SEEKER_CALENDAR:          'seeker_calendar',
  SEEKER_CONTACTS:          'seeker_contacts',
  SEEKER_PINNED_JOBS:       'seeker_pinned_jobs',
  PROFILE_VIEWS:            'profile_views',
  PROFILE_ANALYTICS:        'profile_analytics',

  // ── Anvil (hub + inlays) ────────────────────────────────────────────────────
  ANVIL:                    'anvil',
  ANVIL_PROFILE:            'anvil_profile_development',
  ANVIL_RESUME:             'anvil_resume',
  ANVIL_OFFER:              'anvil_offer_negotiation',
  ANVIL_PROJECT:            'anvil_project_promotion',
  ANVIL_ONBOARDING:         'anvil_onboarding_growth',
  ANVIL_ONBOARDING_SELECT:  'anvil_onboarding_select',
  ANVIL_ONBOARDING_RESULTS: 'anvil_onboarding_results',
  ROADMAP:                  'roadmap',
  ROADMAP_RESULTS:          'roadmap_results',

  // ── The Hearth (hub + inlays) ───────────────────────────────────────────────
  THE_HEARTH:               'the_hearth',
  HEARTH_MENTORSHIP:        'hearth_mentorship',
  HEARTH_EVENTS:            'hearth_events',
  HEARTH_FORUMS:            'hearth_forums',
  HEARTH_RESOURCES:         'hearth_resources',
  HEARTH_SPOTLIGHTS:        'hearth_spotlights',

  // ── Coaching ────────────────────────────────────────────────────────────────
  COACHING_DASHBOARD:       'coaching_dashboard',
  COACHING_CLIENT_HUB:      'coaching_client_hub',
  COACHING_CLIENTS:         'coaching_clients',
  COACHING_CLIENT_DETAIL:   'coaching_client_detail',
  COACHING_SESSIONS:        'coaching_sessions',
  COACHING_FEEDBACK:        'coaching_feedback',
  COACHING_RESOURCES:       'coaching_resources',
  COACHING_HEARTH:          'coaching_hearth',
  COACHING_JOBS:            'coaching_jobs',
  COACHING_NEWSLETTER:      'coaching_newsletter',
  COACHING_WORKSPACE:       'coaching_workspace',

  // ── Recruiter ───────────────────────────────────────────────────────────────
  RECRUITER_DASHBOARD:      'recruiter_dashboard',
  RECRUITER_CANDIDATE_CENTER: 'recruiter_candidate_center',
  RECRUITER_CANDIDATES:     'internal_candidate_search',
  EXTERNAL_CANDIDATE_COMPARE: 'external_candidate_compare',
  TALENT_POOLS:             'talent_pools',
  RECRUITER_JOBS:           'recruiter_jobs',
  RECRUITER_JOB_DETAIL:     'recruiter_job_detail',
  RECRUITER_CALENDAR:       'recruiter_calendar',
  RECRUITER_CONTACTS:       'recruiter_contacts',
  RECRUITER_MESSAGING:      'recruiter_messaging',
  RECRUITER_ANALYTICS:      'recruiter_analytics',
  RECRUITER_SETTINGS:       'recruiter_settings',

  // ── Shared / fallback ───────────────────────────────────────────────────────
  ACTION_CENTER:            'action_center',
  SETTINGS:                 'settings',
  SUPPORT:                  'support',
  GENERAL_WORKSPACE:        'general_workspace',
};

// ─── Surface detector ──────────────────────────────────────────────────────────
// Priority: inlay module/tab query param > path match > fallback
//
// query = router.query object (passed from AiWindow's buildClientContext)
// asPath includes the query string so ?module=offer is detectable from the full URL too
export function detectSurface(pathname = '', asPath = '', query = {}) {
  const path  = String(asPath || pathname || '').toLowerCase();
  const qmod  = String(query?.module  || '').toLowerCase().trim();
  const qtab  = String(query?.tab     || '').toLowerCase().trim();
  const qchrome = String(query?.chrome || '').toLowerCase().trim();

  // ── Anvil inlays (URL stays /anvil, module renders in place) ──────────────
  if (path.includes('/anvil/onboarding-growth/results')) return SURFACES.ANVIL_ONBOARDING_RESULTS;
  if (path.includes('/anvil/onboarding-growth/select'))  return SURFACES.ANVIL_ONBOARDING_SELECT;
  if (path.includes('/anvil/onboarding-growth'))         return SURFACES.ANVIL_ONBOARDING;
  if (path.includes('/anvil')) {
    if (qmod === 'profile')           return SURFACES.ANVIL_PROFILE;
    if (qmod === 'resume')            return SURFACES.ANVIL_RESUME;
    if (qmod === 'offer')             return SURFACES.ANVIL_OFFER;
    if (qmod === 'project-promotion') return SURFACES.ANVIL_PROJECT;
    if (qmod === 'onboarding')        return SURFACES.ANVIL_ONBOARDING;
    return SURFACES.ANVIL;
  }

  // ── Roadmap ───────────────────────────────────────────────────────────────
  if (path.includes('/roadmap/onboarding-growth/results')) return SURFACES.ROADMAP_RESULTS;
  if (path.includes('/roadmap'))                           return SURFACES.ROADMAP;

  // ── The Hearth inlays (URL stays /the-hearth, module renders in place) ────
  if (path.includes('/hearth/spotlights')) return SURFACES.HEARTH_SPOTLIGHTS;
  if (path.includes('/the-hearth') || path.includes('/seeker/the-hearth')) {
    if (qmod === 'mentorship') return SURFACES.HEARTH_MENTORSHIP;
    if (qmod === 'events')     return SURFACES.HEARTH_EVENTS;
    if (qmod === 'forums')     return SURFACES.HEARTH_FORUMS;
    if (qmod === 'resources')  return SURFACES.HEARTH_RESOURCES;
    return SURFACES.THE_HEARTH;
  }

  // ── Resume ────────────────────────────────────────────────────────────────
  if (path.includes('/resume/create'))    return SURFACES.RESUME_BUILDER;
  if (path.includes('/resume/saved'))     return SURFACES.RESUME_SAVED;
  if (path.includes('/resume/view'))      return SURFACES.RESUME_VIEW;
  if (path.includes('/resume-cover'))     return SURFACES.COVER_BUILDER;
  if (path.includes('/cover/create'))     return SURFACES.COVER_BUILDER;

  // ── Offer / negotiation ───────────────────────────────────────────────────
  if (path.includes('/offer-negotiation') || path.includes('negotiation')) return SURFACES.OFFER_NEGOTIATION;

  // ── Jobs ──────────────────────────────────────────────────────────────────
  if (path.includes('/job/') && path.includes('/apply')) return SURFACES.JOB_APPLY;
  if (path.match(/\/job\/[^/]+$/))                       return SURFACES.JOB_DETAIL;
  if (path.includes('/seeker/jobs') || path.includes('/jobs')) return SURFACES.JOB_SEARCH;

  // ── Coaching ──────────────────────────────────────────────────────────────
  if (path.includes('/coaching-dashboard'))                  return SURFACES.COACHING_DASHBOARD;
  if (path.includes('/dashboard/coaching/client-hub'))       {
    if (qtab === 'clients')  return SURFACES.COACHING_CLIENTS;
    if (qtab === 'sessions') return SURFACES.COACHING_SESSIONS;
    if (qtab === 'feedback') return SURFACES.COACHING_FEEDBACK;
    if (qtab === 'requests') return SURFACES.COACHING_CLIENT_HUB;
    return SURFACES.COACHING_CLIENT_HUB;
  }
  if (path.includes('/dashboard/coaching/clients/add'))      return SURFACES.COACHING_CLIENT_HUB;
  if (path.match(/\/dashboard\/coaching\/clients\/[^/]+/))   return SURFACES.COACHING_CLIENT_DETAIL;
  if (path.includes('/dashboard/coaching/clients'))          return SURFACES.COACHING_CLIENTS;
  if (path.includes('/dashboard/coaching/sessions'))         return SURFACES.COACHING_SESSIONS;
  if (path.includes('/dashboard/coaching/feedback'))         return SURFACES.COACHING_FEEDBACK;
  if (path.includes('/dashboard/coaching/resources'))        return SURFACES.COACHING_RESOURCES;
  if (path.includes('/dashboard/coaching/hearth'))           return SURFACES.COACHING_HEARTH;
  if (path.includes('/dashboard/coaching/jobs'))             return SURFACES.COACHING_JOBS;
  if (path.includes('/dashboard/coaching/newsletter'))       return SURFACES.COACHING_NEWSLETTER;
  if (path.includes('/coaching/messaging'))                  return SURFACES.SIGNAL_MESSAGES;
  if (path.includes('/coaching'))                            return SURFACES.COACHING_WORKSPACE;

  // ── Recruiter ─────────────────────────────────────────────────────────────
  if (path.includes('/recruiter/candidate-center')) {
    // Candidate center has internal module tabs: search, compare, pools
    // These are driven by state not query, so surface stays candidate_center
    // but context will carry activeCandidate / activeSearch
    return SURFACES.RECRUITER_CANDIDATE_CENTER;
  }
  if (path.includes('/recruiter/candidates'))  return SURFACES.RECRUITER_CANDIDATES;
  if (path.includes('/recruiter/explain'))     return SURFACES.EXTERNAL_CANDIDATE_COMPARE;
  if (path.includes('/recruiter/pools'))       return SURFACES.TALENT_POOLS;
  if (path.match(/\/recruiter\/job-postings\/[^/]+/)) return SURFACES.RECRUITER_JOB_DETAIL;
  if (path.includes('/recruiter/job-postings') || path.includes('/recruiter/job')) return SURFACES.RECRUITER_JOBS;
  if (path.includes('/recruiter/calendar'))    return SURFACES.RECRUITER_CALENDAR;
  if (path.includes('/recruiter/contacts'))    return SURFACES.RECRUITER_CONTACTS;
  if (path.includes('/recruiter/messaging'))   return SURFACES.RECRUITER_MESSAGING;
  if (path.includes('/recruiter/analytics'))   return SURFACES.RECRUITER_ANALYTICS;
  if (path.includes('/recruiter/settings'))    return SURFACES.RECRUITER_SETTINGS;
  if (path.includes('/recruiter'))             return SURFACES.RECRUITER_DASHBOARD;

  // ── Seeker dashboard (chrome-switched) ───────────────────────────────────
  if (path.includes('/seeker-dashboard')) return SURFACES.SEEKER_DASHBOARD;

  // ── Seeker sub-pages ─────────────────────────────────────────────────────
  if (path.includes('/seeker/applications'))   return SURFACES.SEEKER_APPLICATIONS;
  if (path.includes('/seeker/calendar'))       return SURFACES.SEEKER_CALENDAR;
  if (path.includes('/seeker/contacts') || path.includes('/seeker/contact')) return SURFACES.SEEKER_CONTACTS;
  if (path.includes('/seeker/pinned-jobs'))    return SURFACES.SEEKER_PINNED_JOBS;
  if (path.includes('/seeker/profile-views'))  return SURFACES.PROFILE_VIEWS;
  if (path.includes('/seeker/messages') || path.includes('/signal')) return SURFACES.SIGNAL_MESSAGES;

  // ── Profile & identity ────────────────────────────────────────────────────
  if (path.includes('/profile-analytics'))     return SURFACES.PROFILE_ANALYTICS;
  if (path.includes('/member-profile'))        return SURFACES.MEMBER_PROFILE;
  if (path.includes('/profile/') || path.includes('/u/')) return SURFACES.PORTFOLIO_PROFILE;
  if (path.includes('/profile'))               return SURFACES.PORTFOLIO_PROFILE;

  // ── Feed ──────────────────────────────────────────────────────────────────
  if (path.includes('/feed'))                  return SURFACES.CAREER_SIGNAL_FEED;

  // ── Action center ─────────────────────────────────────────────────────────
  if (path.includes('/action-center'))         return SURFACES.ACTION_CENTER;

  // ── Settings / support ───────────────────────────────────────────────────
  if (path.includes('/settings'))              return SURFACES.SETTINGS;
  if (path.includes('/support'))               return SURFACES.SUPPORT;

  return SURFACES.GENERAL_WORKSPACE;
}

// ─── Surface playbook registry ────────────────────────────────────────────────
// For each surface: what is Striker trying to accomplish, what can it offer,
// and what should it forward to.
const PLAYBOOKS = {
  [SURFACES.SEEKER_DASHBOARD]: {
    role: 'SEEKER',
    outcome: 'Help the seeker understand their career momentum and decide the best next action.',
    actions: [
      'Review application status and next steps.',
      'Suggest which resume to use for upcoming applications.',
      'Recommend profile improvements that increase Discovery Match visibility.',
      'Surface recommended jobs based on seeker preferences.',
    ],
    forwardTo: ['Resume Builder → /resume/create', 'Job Search → /jobs', 'Anvil → /anvil'],
    guardRails: ['Do not give recruiter pipeline advice.', 'Do not give coaching org advice.'],
  },

  [SURFACES.JOB_SEARCH]: {
    role: 'SEEKER',
    outcome: 'Help the seeker find, evaluate, and decide what to do with job listings.',
    actions: [
      'Explain the role requirements in plain language.',
      'Help the seeker assess fit and missing evidence.',
      'Recommend: save, tailor, apply, skip, or research more.',
      'Guide to Forge Hammer for JD alignment before applying.',
    ],
    forwardTo: ['Forge Hammer via Resume Builder', 'Anvil → /anvil?module=resume'],
    guardRails: ['Do not give recruiter-side hiring advice.'],
  },

  [SURFACES.JOB_DETAIL]: {
    role: 'SEEKER',
    outcome: 'Help the seeker decide whether to apply and how to position themselves.',
    actions: [
      'Break down job requirements into must-have vs nice-to-have.',
      'Identify what evidence the seeker has or is missing.',
      'Recommend apply, tailor first, or skip.',
      'Prompt Hammer alignment before applying.',
    ],
    forwardTo: ['Apply → /job/[id]/apply', 'Resume Builder → /resume/create'],
    guardRails: [],
  },

  [SURFACES.JOB_APPLY]: {
    role: 'SEEKER',
    outcome: 'Help the seeker complete the application with the strongest possible materials.',
    actions: [
      'Confirm primary resume is selected and aligned to the JD.',
      'Guide through application questions with evidence-backed answers.',
      'Draft cover letter content if needed.',
      'Review consent and submission checklist.',
    ],
    forwardTo: ['Cover Builder → /cover/create'],
    guardRails: ['Do not invent experience or credentials.'],
  },

  [SURFACES.RESUME_BUILDER]: {
    role: 'SEEKER',
    outcome: 'Help the seeker complete a stronger resume using real evidence.',
    actions: [
      'Give exact section-level improvements: Summary, Skills, Experience bullets.',
      'Preserve truthfulness — never invent experience.',
      'Tie improvements to JD alignment, metrics, proof, and recruiter readability.',
      'Remind seeker of 4-resume limit and primary designation.',
      'Suggest using Hammer to test alignment against a specific JD.',
      'ForgeFormat: Page 1 = signal page (impact snapshot, core capabilities, employer spine). Pages 2+ = full story.',
    ],
    forwardTo: ['Forge Hammer (load JD in Resume Builder)', 'Job Search → /jobs'],
    guardRails: ['Do not invent skills or experience.', 'Do not rewrite the whole resume unprompted — work section by section.'],
  },

  [SURFACES.RESUME_SAVED]: {
    role: 'SEEKER',
    outcome: 'Help the seeker manage, compare, and select their best resume.',
    actions: [
      'Explain difference between resumes (target roles, alignment scores).',
      'Guide setting primary resume.',
      'Suggest which resume to use for a specific job.',
    ],
    forwardTo: ['Resume Builder → /resume/create'],
    guardRails: [],
  },

  [SURFACES.COVER_BUILDER]: {
    role: 'SEEKER',
    outcome: 'Help the seeker write a focused, evidence-backed cover letter.',
    actions: [
      'Tie cover letter to the specific JD and company.',
      'Keep it 3 paragraphs: fit, proof, enthusiasm.',
      'Do not pad with generic language.',
    ],
    forwardTo: ['Job Apply → /job/[id]/apply'],
    guardRails: ['Do not invent achievements.'],
  },

  [SURFACES.OFFER_NEGOTIATION]: {
    role: 'SEEKER',
    outcome: 'Help the seeker prepare a grounded, professional offer negotiation strategy.',
    actions: [
      'Clarify leverage, constraints, compensation components, risk, and ask structure.',
      'Produce scripts and decision options when asked.',
      'Help evaluate total comp: base, bonus, equity, PTO, remote, title.',
    ],
    forwardTo: [],
    guardRails: [
      'Stay in offer and compensation lane only.',
      'Do not drift into resume advice, job search, or coaching on this surface.',
    ],
  },

  [SURFACES.PORTFOLIO_PROFILE]: {
    role: 'SEEKER',
    outcome: 'Help the seeker improve their professional profile and portfolio signal.',
    actions: [
      'Look for clarity, proof, positioning, project evidence, and recruiter readiness.',
      'Explain how profile strength affects Discovery Match visibility.',
      'Recommend improvements without inventing achievements.',
    ],
    forwardTo: ['Resume Builder → /resume/create'],
    guardRails: ['Do not invent projects or credentials.'],
  },

  [SURFACES.MEMBER_PROFILE]: {
    role: 'SEEKER',
    outcome: 'Help the user understand or interact with another member\'s public profile.',
    actions: [
      'Explain what signal the profile communicates.',
      'Suggest connection or message if appropriate.',
    ],
    forwardTo: [],
    guardRails: [],
  },

  [SURFACES.SIGNAL_MESSAGES]: {
    role: 'SEEKER',
    outcome: 'Help the user communicate clearly and move the conversation forward.',
    actions: [
      'Draft concise, professional messages when asked.',
      'Keep tone human and outcome-oriented.',
      'Advise on follow-up timing and framing.',
    ],
    forwardTo: [],
    guardRails: ['All contact goes through ForgeTomorrow — never advise bypassing the platform.'],
  },

  [SURFACES.CAREER_SIGNAL_FEED]: {
    role: 'SEEKER',
    outcome: 'Help the user turn platform activity into career signal.',
    actions: [
      'Support post ideas, replies, and professional positioning.',
      'Help build credibility through visible work and thought leadership.',
    ],
    forwardTo: [],
    guardRails: [],
  },

  [SURFACES.SEEKER_APPLICATIONS]: {
    role: 'SEEKER',
    outcome: 'Help the seeker track and follow up on active applications.',
    actions: [
      'Explain application stage meanings.',
      'Suggest follow-up timing and approach.',
      'Help identify stalled applications and next moves.',
    ],
    forwardTo: [],
    guardRails: [],
  },

  [SURFACES.SEEKER_CALENDAR]: {
    role: 'SEEKER',
    outcome: 'Help the seeker prepare for scheduled events and interviews.',
    actions: [
      'Guide interview preparation.',
      'Suggest what to research before a scheduled call.',
      'Help draft confirmation or follow-up messages.',
    ],
    forwardTo: [],
    guardRails: [],
  },

  [SURFACES.SEEKER_CONTACTS]: {
    role: 'SEEKER',
    outcome: 'Help the seeker manage and grow their professional network on ForgeTomorrow.',
    actions: [
      'Suggest how to respond to connection requests.',
      'Help draft professional introductions.',
      'Advise on contact management and follow-up.',
    ],
    forwardTo: [],
    guardRails: [],
  },

  [SURFACES.SEEKER_PINNED_JOBS]: {
    role: 'SEEKER',
    outcome: 'Help the seeker prioritize and act on their saved jobs.',
    actions: [
      'Help rank saved jobs by fit and urgency.',
      'Suggest next action for each: apply, tailor, research, or remove.',
    ],
    forwardTo: ['Job Detail → /job/[id]', 'Resume Builder → /resume/create'],
    guardRails: [],
  },

  [SURFACES.PROFILE_VIEWS]: {
    role: 'SEEKER',
    outcome: 'Help the seeker understand who is looking at their profile and what it means.',
    actions: [
      'Interpret recruiter view patterns.',
      'Suggest profile improvements to convert views into connections.',
    ],
    forwardTo: ['Profile → /profile'],
    guardRails: [],
  },

  [SURFACES.PROFILE_ANALYTICS]: {
    role: 'SEEKER',
    outcome: 'Help the seeker understand their platform performance data.',
    actions: [
      'Interpret analytics signals: views, clicks, search appearances.',
      'Recommend actions to improve visibility and engagement.',
    ],
    forwardTo: [],
    guardRails: [],
  },

  // ── Anvil surfaces ──────────────────────────────────────────────────────────

  [SURFACES.ANVIL]: {
    role: 'SEEKER',
    outcome: 'Help the user choose the right Anvil tool for their current goal.',
    actions: [
      'Identify the user\'s goal and route to the correct Anvil module.',
      'Available modules: Profile Development, Resume, Offer Negotiation, Project Promotion, Onboarding Growth.',
      'Guide the user to open the right module.',
    ],
    forwardTo: [
      'Profile Development → ?module=profile',
      'Resume → ?module=resume',
      'Offer Negotiation → ?module=offer',
      'Project Promotion → ?module=project-promotion',
      'Onboarding Growth → ?module=onboarding',
    ],
    guardRails: [],
  },

  [SURFACES.ANVIL_PROFILE]: {
    role: 'SEEKER',
    outcome: 'Help the user develop their professional profile and career positioning.',
    actions: [
      'Guide through profile headline, about, skills, and project evidence.',
      'Strengthen positioning for target role.',
      'Ensure profile signal supports Discovery Match.',
    ],
    forwardTo: ['Profile → /profile'],
    guardRails: ['Do not invent credentials.'],
  },

  [SURFACES.ANVIL_RESUME]: {
    role: 'SEEKER',
    outcome: 'Help the user build or refine a resume inside the Anvil.',
    actions: [
      'Apply ForgeFormat: Page 1 signal page, Pages 2+ story pages.',
      'Focus on evidence, metrics, and recruiter readability.',
      'Guide section by section.',
    ],
    forwardTo: ['Resume Builder → /resume/create'],
    guardRails: ['Do not invent experience.'],
  },

  [SURFACES.ANVIL_OFFER]: {
    role: 'SEEKER',
    outcome: 'Help the user build an offer negotiation strategy inside the Anvil.',
    actions: [
      'Clarify total comp components, leverage, and ask structure.',
      'Produce negotiation scripts when asked.',
    ],
    forwardTo: [],
    guardRails: ['Stay in offer/comp lane.'],
  },

  [SURFACES.ANVIL_PROJECT]: {
    role: 'SEEKER',
    outcome: 'Help the user package and promote a project for career visibility.',
    actions: [
      'Extract scope, ownership, tools, and outcome from the project.',
      'Frame the project for portfolio, resume, and interview use.',
    ],
    forwardTo: ['Profile → /profile', 'Resume Builder → /resume/create'],
    guardRails: [],
  },

  [SURFACES.ANVIL_ONBOARDING]: {
    role: 'SEEKER',
    outcome: 'Help the user build a 30/60/90 day onboarding and growth roadmap.',
    actions: [
      'Identify role, start date, and key priorities.',
      'Build a structured plan: goals, deliverables, learning milestones, stakeholder check-ins.',
      'Tailor by seniority and environment.',
    ],
    forwardTo: ['Roadmap Results → /anvil/onboarding-growth/results'],
    guardRails: [],
  },

  [SURFACES.ROADMAP]: {
    role: 'SEEKER',
    outcome: 'Help the user understand or act on their career roadmap.',
    actions: [
      'Interpret roadmap milestones and priorities.',
      'Suggest next actions based on current stage.',
    ],
    forwardTo: [],
    guardRails: [],
  },

  // ── The Hearth surfaces ─────────────────────────────────────────────────────

  [SURFACES.THE_HEARTH]: {
    role: 'SEEKER',
    outcome: 'Help the user find the right Hearth resource or community feature.',
    actions: [
      'Route to Mentorship, Events, Forums, or Resources based on goal.',
      'Explain what each Hearth module offers.',
    ],
    forwardTo: [
      'Mentorship → ?module=mentorship',
      'Events → ?module=events',
      'Forums → ?module=forums',
      'Resources → ?module=resources',
    ],
    guardRails: [],
  },

  [SURFACES.HEARTH_MENTORSHIP]: {
    role: 'SEEKER',
    outcome: 'Help the seeker find and connect with a mentor or coach through the Hearth.',
    actions: [
      'Explain Spotlight profiles and how to evaluate coaches.',
      'Guide through booking an appointment via RequestAppointmentModal.',
      'Help draft an introduction message.',
    ],
    forwardTo: ['Spotlight → /hearth/spotlights'],
    guardRails: [],
  },

  [SURFACES.HEARTH_EVENTS]: {
    role: 'SEEKER',
    outcome: 'Help the seeker find and prepare for Hearth events.',
    actions: [
      'Surface relevant events based on career goals.',
      'Help the seeker prepare questions or talking points.',
    ],
    forwardTo: [],
    guardRails: [],
  },

  [SURFACES.HEARTH_FORUMS]: {
    role: 'SEEKER',
    outcome: 'Help the seeker participate meaningfully in Hearth community discussions.',
    actions: [
      'Suggest relevant threads or topics.',
      'Help draft thoughtful responses or posts.',
    ],
    forwardTo: [],
    guardRails: [],
  },

  [SURFACES.HEARTH_RESOURCES]: {
    role: 'SEEKER',
    outcome: 'Help the seeker find and use career learning resources.',
    actions: [
      'Surface articles, guides, and tools relevant to their goal.',
      'Explain what premium resources are coming.',
    ],
    forwardTo: [],
    guardRails: [],
  },

  [SURFACES.HEARTH_SPOTLIGHTS]: {
    role: 'SEEKER',
    outcome: 'Help the seeker evaluate and connect with spotlighted coaches or mentors.',
    actions: [
      'Explain what a Spotlight profile communicates.',
      'Guide through booking or connecting.',
    ],
    forwardTo: ['Mentorship → /the-hearth?module=mentorship'],
    guardRails: [],
  },

  // ── Coaching surfaces ───────────────────────────────────────────────────────

  [SURFACES.COACHING_DASHBOARD]: {
    role: 'COACH',
    outcome: 'Help the coach see their workload and decide the most important next action.',
    actions: [
      'Surface pending session requests, active clients, and upcoming sessions.',
      'Route to the right module: Clients, Sessions, or Feedback.',
      'Identify stalled clients or follow-up needs.',
    ],
    forwardTo: ['Client Hub → /dashboard/coaching/client-hub'],
    guardRails: ['Do not give seeker job-search advice here.'],
  },

  [SURFACES.COACHING_CLIENT_HUB]: {
    role: 'COACH',
    outcome: 'Help the coach manage the full client roster and session pipeline.',
    actions: [
      'Navigate Clients, Sessions, and Feedback tabs.',
      'Handle incoming session requests (Appointment Requests tab).',
      'Add new clients via the Add Client flow.',
    ],
    forwardTo: ['Client Detail → /dashboard/coaching/clients/[email]'],
    guardRails: [],
  },

  [SURFACES.COACHING_CLIENTS]: {
    role: 'COACH',
    outcome: 'Help the coach review and act on the active client list.',
    actions: [
      'Identify clients needing follow-up or session scheduling.',
      'Guide to client detail for deep work.',
    ],
    forwardTo: ['Client Detail → /dashboard/coaching/clients/[email]'],
    guardRails: [],
  },

  [SURFACES.COACHING_CLIENT_DETAIL]: {
    role: 'COACH',
    outcome: 'Help the coach turn client evidence into session strategy and next steps.',
    actions: [
      'Focus on client goal, narrative, blockers, roadmap, and homework.',
      'Apply Coaching Intelligence Engine environment lens: ENTERPRISE / STARTUP / NONPROFIT / FAITH-BASED / GOVERNMENT / MIXED.',
      'Keep outputs coach-facing unless client-facing language is explicitly requested.',
      'Build action plan: goal → blocker → evidence → action → homework → next session focus.',
    ],
    forwardTo: ['Dossier → /dashboard/coaching/clients/dossier'],
    guardRails: [
      'Do not make hiring decisions.',
      'Do not give seeker job-search advice unless explicitly coaching the client on it.',
    ],
  },

  [SURFACES.COACHING_SESSIONS]: {
    role: 'COACH',
    outcome: 'Help the coach prepare for, run, and document coaching sessions.',
    actions: [
      'Build session agenda based on client goal and prior notes.',
      'Document session outcomes and homework.',
      'Handle appointment request responses.',
    ],
    forwardTo: ['Session Calendar → /dashboard/coaching/sessions/calendar'],
    guardRails: [],
  },

  [SURFACES.COACHING_FEEDBACK]: {
    role: 'COACH',
    outcome: 'Help the coach review and act on client feedback and CSAT.',
    actions: [
      'Interpret feedback trends.',
      'Suggest coaching adjustments based on patterns.',
    ],
    forwardTo: [],
    guardRails: [],
  },

  [SURFACES.COACHING_RESOURCES]: {
    role: 'COACH',
    outcome: 'Help the coach find and use coaching tools and reference material.',
    actions: [
      'Surface relevant frameworks, templates, and tools.',
      'Help adapt resources for specific client situations.',
    ],
    forwardTo: [],
    guardRails: [],
  },

  [SURFACES.COACHING_WORKSPACE]: {
    role: 'COACH',
    outcome: 'Help the coach manage coaching work and produce useful client outputs.',
    actions: [
      'Structure session plans, feedback, homework, and client strategy.',
      'Route to the specific coaching tool that fits the need.',
    ],
    forwardTo: ['Client Hub → /dashboard/coaching/client-hub'],
    guardRails: [],
  },

  // ── Recruiter surfaces ──────────────────────────────────────────────────────

  [SURFACES.RECRUITER_DASHBOARD]: {
    role: 'RECRUITER',
    outcome: 'Help the recruiter understand their hiring pipeline and choose the next action.',
    actions: [
      'Surface active job postings, pipeline health, and candidate activity.',
      'Route to the right tool: Candidates, Candidate Center, or Job Postings.',
      'Identify stalled candidates or jobs needing attention.',
    ],
    forwardTo: [
      'Candidate Center → /recruiter/candidate-center',
      'Internal Search → /recruiter/candidates',
      'Job Postings → /recruiter/job-postings',
    ],
    guardRails: ['Do not give seeker job-search advice.'],
  },

  [SURFACES.RECRUITER_CANDIDATE_CENTER]: {
    role: 'RECRUITER',
    outcome: 'Help the recruiter choose and complete the correct candidate workflow.',
    actions: [
      'Identify whether the need is: internal discovery (Search tab), external compare (Compare tab), or pipeline organization (Pools tab).',
      'Route thinking toward next concrete action, not generic explanation.',
      'Clarify Discovery Match vs Targeting Match only when directly relevant.',
      'Candidate evaluation path: strongest evidence → biggest risk → shortlist / screen / keep warm / skip.',
    ],
    forwardTo: [
      'Internal Search → /recruiter/candidates',
      'External Compare → /recruiter/explain',
      'Talent Pools → /recruiter/pools',
    ],
    guardRails: ['Do not coach the candidate — support recruiter decision-making.'],
  },

  [SURFACES.RECRUITER_CANDIDATES]: {
    role: 'RECRUITER',
    outcome: 'Help the recruiter find, evaluate, compare, and act on ForgeTomorrow candidates.',
    actions: [
      'Use Discovery Match as broad semantic relevance — role family, not exact title.',
      'Use Targeting Match as stricter qualification and automation-ready scoring.',
      'Search strategy: broad first → add location/work pref only if it matters → Targeting filters after first spread → WHY only for candidates you\'ll act on.',
      'Help refine search terms, targeting filters, candidate comparison, outreach, and WHY review.',
    ],
    forwardTo: ['WHY → /recruiter/candidates?why=true', 'Candidate Center → /recruiter/candidate-center'],
    guardRails: [
      'Never present AI as the hiring decision-maker.',
      'Give evidence, risks, validation prompts, and next actions.',
    ],
  },

  [SURFACES.EXTERNAL_CANDIDATE_COMPARE]: {
    role: 'RECRUITER',
    outcome: 'Help the recruiter turn an external resume and JD into an evidence-backed candidate read.',
    actions: [
      'Focus on evidence, fit, gaps, risk, and interview validation.',
      'Do not coach the candidate — support recruiter decision-making.',
      'Produce concise screening questions and next-step recommendations when asked.',
      'Conversion path: if candidate is worth continuing with → invite to ForgeTomorrow → becomes internal candidate with full signal.',
    ],
    forwardTo: ['Internal Search → /recruiter/candidates'],
    guardRails: [],
  },

  [SURFACES.TALENT_POOLS]: {
    role: 'RECRUITER',
    outcome: 'Help the recruiter organize candidates into reusable hiring pipelines.',
    actions: [
      'Suggest pool names, segmentation logic, follow-up timing, and next actions.',
      'Keep talent pool advice tied to recruiter workflow and evidence.',
    ],
    forwardTo: [],
    guardRails: [],
  },

  [SURFACES.RECRUITER_JOBS]: {
    role: 'RECRUITER',
    outcome: 'Help the recruiter create clearer, fairer, better-structured job posts.',
    actions: [
      'Build JD in this order: title → summary → must-haves → preferred → responsibilities → work type → publish/draft.',
      'Separate role requirements from company boilerplate.',
      'Identify must-have vs nice-to-have.',
      'Keep descriptions clean, evidence-oriented, and candidate-readable.',
      'Keep EEO/legal language outside the main requirements block.',
    ],
    forwardTo: ['New Job Posting → /recruiter/job-postings'],
    guardRails: ['Do not add vague personality traits unless they map to real work.'],
  },

  [SURFACES.RECRUITER_JOB_DETAIL]: {
    role: 'RECRUITER',
    outcome: 'Help the recruiter review, improve, or act on a specific job posting.',
    actions: [
      'JD cleanup: separate role work from boilerplate → split must-have vs preferred → remove vague traits → add measurable responsibilities.',
      'Surface candidate pipeline status for this job.',
      'Suggest targeting filter improvements.',
    ],
    forwardTo: ['Candidate Center → /recruiter/candidate-center'],
    guardRails: [],
  },

  [SURFACES.RECRUITER_CALENDAR]: {
    role: 'RECRUITER',
    outcome: 'Help the recruiter manage scheduled interviews and candidate touchpoints.',
    actions: [
      'Prep interview questions based on candidate context.',
      'Help structure interview agendas.',
      'Advise on follow-up timing after interviews.',
    ],
    forwardTo: [],
    guardRails: [],
  },

  [SURFACES.RECRUITER_CONTACTS]: {
    role: 'RECRUITER',
    outcome: 'Help the recruiter manage professional relationships and network.',
    actions: [
      'Advise on contact management and follow-up strategy.',
      'Help draft professional outreach.',
    ],
    forwardTo: [],
    guardRails: [],
  },

  [SURFACES.RECRUITER_MESSAGING]: {
    role: 'RECRUITER',
    outcome: 'Help the recruiter communicate clearly with candidates and contacts.',
    actions: [
      'Draft concise, professional recruiter messages.',
      'Advise on outreach timing and follow-up.',
    ],
    forwardTo: [],
    guardRails: ['All contact goes through ForgeTomorrow — never advise bypassing the platform.'],
  },

  [SURFACES.RECRUITER_ANALYTICS]: {
    role: 'RECRUITER',
    outcome: 'Help the recruiter interpret hiring analytics and improve pipeline performance.',
    actions: [
      'Interpret time-to-fill, pipeline health, and quality-of-hire signals.',
      'Suggest targeting or JD improvements based on data patterns.',
    ],
    forwardTo: [],
    guardRails: [],
  },

  [SURFACES.ACTION_CENTER]: {
    role: 'ALL',
    outcome: 'Help the user triage and act on platform notifications and pending items.',
    actions: [
      'Surface the most urgent item: application stage change, connection request, session request, or message.',
      'Guide to the right destination for each action.',
    ],
    forwardTo: [],
    guardRails: [],
  },

  [SURFACES.SETTINGS]: {
    role: 'ALL',
    outcome: 'Help the user configure their ForgeTomorrow account and preferences.',
    actions: [
      'Guide through profile URL, billing, notification, and privacy settings.',
      'Explain plan features and upgrade paths.',
    ],
    forwardTo: ['Billing → /settings?tab=billing'],
    guardRails: [],
  },

  [SURFACES.SUPPORT]: {
    role: 'ALL',
    outcome: 'Help the user find answers or submit a support request.',
    actions: [
      'Answer platform questions from known ForgeTomorrow knowledge.',
      'Guide to support ticket if the issue needs human review.',
    ],
    forwardTo: ['Support Ticket → /support'],
    guardRails: [],
  },

  [SURFACES.GENERAL_WORKSPACE]: {
    role: 'ALL',
    outcome: 'Help the user complete the current ForgeTomorrow task.',
    actions: [
      'Ask for one outcome in one sentence.',
      'Do not guess — prompt: "Tell me the outcome you want and I\'ll walk you there."',
      'Prefer concrete next actions, checklists, or direct outputs.',
    ],
    forwardTo: [],
    guardRails: [],
  },
};

// ─── Public API ────────────────────────────────────────────────────────────────

export function getSurfacePlaybook(surface) {
  return PLAYBOOKS[surface] || PLAYBOOKS[SURFACES.GENERAL_WORKSPACE];
}

export function getSurfaceLabel(surface) {
  const labels = {
    [SURFACES.SEEKER_DASHBOARD]:          'Seeker Dashboard',
    [SURFACES.JOB_SEARCH]:                'Job Search',
    [SURFACES.JOB_DETAIL]:                'Job Detail',
    [SURFACES.JOB_APPLY]:                 'Job Application',
    [SURFACES.RESUME_BUILDER]:            'Resume Builder',
    [SURFACES.RESUME_SAVED]:              'Saved Resumes',
    [SURFACES.RESUME_VIEW]:               'Resume View',
    [SURFACES.COVER_BUILDER]:             'Cover Letter Builder',
    [SURFACES.OFFER_NEGOTIATION]:         'Offer Negotiation',
    [SURFACES.PORTFOLIO_PROFILE]:         'Portfolio / Profile',
    [SURFACES.MEMBER_PROFILE]:            'Member Profile',
    [SURFACES.SIGNAL_MESSAGES]:           'Signal Messages',
    [SURFACES.CAREER_SIGNAL_FEED]:        'Career Signal Feed',
    [SURFACES.SEEKER_APPLICATIONS]:       'Applications',
    [SURFACES.SEEKER_CALENDAR]:           'Seeker Calendar',
    [SURFACES.SEEKER_CONTACTS]:           'Contacts',
    [SURFACES.SEEKER_PINNED_JOBS]:        'Pinned Jobs',
    [SURFACES.PROFILE_VIEWS]:             'Profile Views',
    [SURFACES.PROFILE_ANALYTICS]:         'Profile Analytics',
    [SURFACES.ANVIL]:                     'The Anvil',
    [SURFACES.ANVIL_PROFILE]:             'Anvil — Profile Development',
    [SURFACES.ANVIL_RESUME]:              'Anvil — Resume',
    [SURFACES.ANVIL_OFFER]:               'Anvil — Offer Negotiation',
    [SURFACES.ANVIL_PROJECT]:             'Anvil — Project Promotion',
    [SURFACES.ANVIL_ONBOARDING]:          'Anvil — Onboarding Growth',
    [SURFACES.ROADMAP]:                   'Career Roadmap',
    [SURFACES.THE_HEARTH]:                'The Hearth',
    [SURFACES.HEARTH_MENTORSHIP]:         'The Hearth — Mentorship',
    [SURFACES.HEARTH_EVENTS]:             'The Hearth — Events',
    [SURFACES.HEARTH_FORUMS]:             'The Hearth — Forums',
    [SURFACES.HEARTH_RESOURCES]:          'The Hearth — Resources',
    [SURFACES.HEARTH_SPOTLIGHTS]:         'Hearth Spotlights',
    [SURFACES.COACHING_DASHBOARD]:        'Coaching Dashboard',
    [SURFACES.COACHING_CLIENT_HUB]:       'Client Hub',
    [SURFACES.COACHING_CLIENTS]:          'Coaching Clients',
    [SURFACES.COACHING_CLIENT_DETAIL]:    'Client Detail',
    [SURFACES.COACHING_SESSIONS]:         'Coaching Sessions',
    [SURFACES.COACHING_FEEDBACK]:         'Coaching Feedback',
    [SURFACES.COACHING_RESOURCES]:        'Coaching Resources',
    [SURFACES.COACHING_WORKSPACE]:        'Coaching Workspace',
    [SURFACES.RECRUITER_DASHBOARD]:       'Recruiter Dashboard',
    [SURFACES.RECRUITER_CANDIDATE_CENTER]:'Candidate Center',
    [SURFACES.RECRUITER_CANDIDATES]:      'Internal Candidate Search',
    [SURFACES.EXTERNAL_CANDIDATE_COMPARE]:'External Candidate Compare',
    [SURFACES.TALENT_POOLS]:              'Talent Pools',
    [SURFACES.RECRUITER_JOBS]:            'Job Postings',
    [SURFACES.RECRUITER_JOB_DETAIL]:      'Job Posting Detail',
    [SURFACES.RECRUITER_CALENDAR]:        'Recruiter Calendar',
    [SURFACES.RECRUITER_CONTACTS]:        'Recruiter Contacts',
    [SURFACES.RECRUITER_MESSAGING]:       'Recruiter Messaging',
    [SURFACES.RECRUITER_ANALYTICS]:       'Recruiter Analytics',
    [SURFACES.ACTION_CENTER]:             'Action Center',
    [SURFACES.SETTINGS]:                  'Settings',
    [SURFACES.SUPPORT]:                   'Support',
    [SURFACES.GENERAL_WORKSPACE]:         'ForgeTomorrow',
  };
  return labels[surface] || 'ForgeTomorrow';
}

// Convenience: build surface context summary for system prompt injection
export function buildSurfaceSystemBlock(surface) {
  const playbook = getSurfacePlaybook(surface);
  const label    = getSurfaceLabel(surface);
  const lines    = [
    `Current workspace: ${label} (${surface})`,
    `Striker goal: ${playbook.outcome}`,
    `Operating actions:`,
    ...playbook.actions.map(a => `  - ${a}`),
  ];
  if (playbook.forwardTo?.length) {
    lines.push(`Forward paths: ${playbook.forwardTo.join(' | ')}`);
  }
  if (playbook.guardRails?.length) {
    lines.push(`Surface guard rails:`);
    playbook.guardRails.forEach(g => lines.push(`  - ${g}`));
  }
  return lines.filter(Boolean).join('\n');
}