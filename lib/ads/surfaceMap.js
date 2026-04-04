// lib/ads/surfaceMap.js

/**
 * Central surface resolver for ForgeTomorrow ad placement.
 *
 * Ads target PAGE INTENT, not user identity.
 *
 * Segments:
 *   seeker    → career tools, education, empowerment
 *   recruiter → hiring tools, HR tech, conferences
 *   coaching  → coach tools, certification, client mgmt
 *   community → all 3 house ads rotating carousel
 *   none      → no ads rendered (auth, legal, admin, internal)
 *
 * To add a new page: add a rule to ROUTE_TO_SURFACE.
 * Do not put user-targeting logic here — intent only.
 */

function normalizePath(asPath) {
  try {
    const s = String(asPath || '');
    if (!s) return '/';
    const q = s.indexOf('?');
    const hash = s.indexOf('#');

    let end = s.length;
    if (q !== -1) end = Math.min(end, q);
    if (hash !== -1) end = Math.min(end, hash);

    const path = s.slice(0, end) || '/';
    return path.startsWith('/') ? path : `/${path}`;
  } catch {
    return '/';
  }
}

/**
 * Each rule:
 *   match(path) → boolean
 *   surfaceId   → unique string key
 *   segment     → 'seeker' | 'recruiter' | 'coaching' | 'community' | 'none'
 *   carousel    → true if all 3 house ads should rotate (community only)
 */
const ROUTE_TO_SURFACE = [

  // ─── COMMUNITY (carousel — all 3 images rotate) ──────────────────────────
  {
    match: (p) => p === '/feed' || p === '/post-view',
    surfaceId: 'community_feed',
    segment: 'community',
    carousel: true,
  },
  {
    match: (p) =>
      p === '/the-hearth' ||
      p.startsWith('/hearth') ||
      p.startsWith('/seeker/the-hearth'),
    surfaceId: 'the_hearth',
    segment: 'community',
    carousel: true,
  },

  // ─── SEEKER ───────────────────────────────────────────────────────────────
  {
    match: (p) =>
      p === '/seeker-dashboard' ||
      p === '/dashboard',
    surfaceId: 'seeker_dashboard',
    segment: 'seeker',
  },
  {
    match: (p) =>
      p === '/jobs' ||
      p === '/seeker/jobs' ||
      p === '/seeker/pinned-jobs' ||
      p.startsWith('/job/'),
    surfaceId: 'job_search',
    segment: 'seeker',
  },
  {
    match: (p) =>
      p === '/apply' ||
      p.startsWith('/apply/'),
    surfaceId: 'application_flow',
    segment: 'seeker',
  },
  {
    match: (p) =>
      p === '/seeker/applications',
    surfaceId: 'applications',
    segment: 'seeker',
  },
  {
    match: (p) =>
      p.startsWith('/resume/') ||
      p === '/resume-cover',
    surfaceId: 'resume_tools',
    segment: 'seeker',
  },
  {
    match: (p) =>
      p.startsWith('/cover/'),
    surfaceId: 'cover_tools',
    segment: 'seeker',
  },
  {
    match: (p) =>
      p.startsWith('/offer-negotiation/'),
    surfaceId: 'offer_negotiation',
    segment: 'seeker',
  },
  {
    match: (p) =>
      p.startsWith('/anvil') ||
      p.startsWith('/roadmap/'),
    surfaceId: 'career_roadmap',
    segment: 'seeker',
  },
  {
    match: (p) =>
      p.startsWith('/profile/') ||
      p.startsWith('/u/') ||
      p === '/profile',
    surfaceId: 'profile',
    segment: 'seeker',
  },
  {
    match: (p) =>
      p === '/profile-analytics',
    surfaceId: 'profile_analytics',
    segment: 'seeker',
  },
  {
    match: (p) =>
      p === '/seeker/contact-center' ||
      p === '/seeker/contacts' ||
      p === '/seeker/contact-incoming' ||
      p === '/seeker/contact-outgoing' ||
      p === '/seeker/profile-views',
    surfaceId: 'seeker_network',
    segment: 'seeker',
  },
  {
    match: (p) =>
      p === '/seeker/messages' ||
      p === '/seeker/calendar',
    surfaceId: 'seeker_comms',
    segment: 'seeker',
  },
  {
    match: (p) =>
      p === '/action-center',
    surfaceId: 'action_center',
    segment: 'seeker',
  },
  {
    match: (p) =>
      p === '/tools',
    surfaceId: 'tools',
    segment: 'seeker',
  },
  {
    match: (p) =>
      p === '/member-profile',
    surfaceId: 'member_profile',
    segment: 'seeker',
  },

  // ─── RECRUITER ────────────────────────────────────────────────────────────
  {
    match: (p) =>
      p === '/recruiter/dashboard' ||
      p === '/business-dashboard',
    surfaceId: 'recruiter_dashboard',
    segment: 'recruiter',
  },
  {
    match: (p) =>
      p === '/recruiter/job-postings' ||
      p.startsWith('/recruiter/job-postings/'),
    surfaceId: 'recruiter_job_postings',
    segment: 'recruiter',
  },
  {
    match: (p) =>
      p === '/recruiter/candidates' ||
      p === '/recruiter/candidate-center',
    surfaceId: 'recruiter_candidates',
    segment: 'recruiter',
  },
  {
    match: (p) =>
      p.startsWith('/recruiter/analytics'),
    surfaceId: 'recruiter_analytics',
    segment: 'recruiter',
  },
  {
    match: (p) =>
      p === '/recruiter/messaging',
    surfaceId: 'recruiter_messaging',
    segment: 'recruiter',
  },
  {
    match: (p) =>
      p === '/recruiter/contacts',
    surfaceId: 'recruiter_contacts',
    segment: 'recruiter',
  },
  {
    match: (p) =>
      p === '/recruiter/calendar',
    surfaceId: 'recruiter_calendar',
    segment: 'recruiter',
  },
  {
    match: (p) =>
      p === '/recruiter/pools',
    surfaceId: 'recruiter_pools',
    segment: 'recruiter',
  },
  {
    match: (p) =>
      p === '/recruiter/job-tracker',
    surfaceId: 'recruiter_job_tracker',
    segment: 'recruiter',
  },
  {
    match: (p) =>
      p === '/recruiter/explain',
    surfaceId: 'recruiter_explain',
    segment: 'recruiter',
  },
  {
    match: (p) =>
      p === '/recruiter/upgrade',
    surfaceId: 'recruiter_upgrade',
    segment: 'recruiter',
  },

  // ─── COACHING ─────────────────────────────────────────────────────────────
  {
    match: (p) =>
      p === '/coaching-dashboard' ||
      p === '/mentor-dashboard',
    surfaceId: 'coaching_dashboard',
    segment: 'coaching',
  },
  {
    match: (p) =>
      p.startsWith('/dashboard/coaching/'),
    surfaceId: 'coaching_tools',
    segment: 'coaching',
  },
  {
    match: (p) =>
      p.startsWith('/coaching/'),
    surfaceId: 'coaching_comms',
    segment: 'coaching',
  },
  {
    match: (p) =>
      p.startsWith('/resources/mentors/'),
    surfaceId: 'mentor_resources',
    segment: 'coaching',
  },
  {
    match: (p) =>
      p.startsWith('/feedback/'),
    surfaceId: 'coach_feedback',
    segment: 'coaching',
  },

  // ─── NO ADS ───────────────────────────────────────────────────────────────
  // Auth, legal, admin, internal, settings, support — never show ads
  {
    match: (p) =>
      p === '/login' ||
      p === '/logout' ||
      p === '/signup' ||
      p.startsWith('/register') ||
      p.startsWith('/auth/') ||
      p === '/forgot-password' ||
      p === '/reset-password' ||
      p.startsWith('/verify-email') ||
      p === '/check-email' ||
      p === '/post-login',
    surfaceId: 'no_ad',
    segment: 'none',
  },
  {
    match: (p) =>
      p === '/privacy' ||
      p === '/terms' ||
      p === '/legal' ||
      p === '/cookies' ||
      p === '/security' ||
      p === '/accessibility' ||
      p === '/tracking-policy' ||
      p === '/subprocessors' ||
      p === '/community-guidelines',
    surfaceId: 'no_ad',
    segment: 'none',
  },
  {
    match: (p) =>
      p.startsWith('/admin/') ||
      p.startsWith('/internal/') ||
      p.startsWith('/api/'),
    surfaceId: 'no_ad',
    segment: 'none',
  },
  {
    match: (p) =>
      p.startsWith('/settings/') ||
      p === '/settings',
    surfaceId: 'no_ad',
    segment: 'none',
  },
  {
    match: (p) =>
      p.startsWith('/support/') ||
      p === '/support' ||
      p === '/help',
    surfaceId: 'no_ad',
    segment: 'none',
  },
  {
    match: (p) =>
      p === '/coming-soon' ||
      p === '/status' ||
      p === '/changelog' ||
      p === '/bulk-export' ||
      p === '/shortcuts' ||
      p === '/video',
    surfaceId: 'no_ad',
    segment: 'none',
  },
];

/**
 * Resolves the surface config for a given path.
 * Returns { surfaceId, segment, carousel } or null if no ads.
 */
export function resolveSurface(asPath) {
  const path = normalizePath(asPath);

  for (const rule of ROUTE_TO_SURFACE) {
    try {
      if (rule.match(path)) {
        return {
          surfaceId: rule.surfaceId,
          segment: rule.segment,
          carousel: rule.carousel || false,
        };
      }
    } catch {
      // ignore bad rule
    }
  }

  // Unmapped path — no ads
  return { surfaceId: 'unknown', segment: 'none', carousel: false };
}

/**
 * Legacy compat — returns just the surfaceId string.
 * Used by existing RightRailPlacementManager.
 */
export function resolveSurfaceId(asPath) {
  return resolveSurface(asPath).surfaceId;
}

/**
 * Returns allowed slots for a surface.
 * Expand per surface as the ad system grows.
 */
export function getDefaultRailSlotsForSurface(surfaceId) {
  if (!surfaceId || surfaceId === 'unknown' || surfaceId === 'no_ad') return [];
  return ['right_rail_1'];
}