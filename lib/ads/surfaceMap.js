// lib/ads/surfaceMap.js

/**
 * Central surface resolver for ad placement.
 * Ads should target Surface IDs + slots, not raw URLs.
 *
 * Keep this file small and explicit. Add routes as you normalize your sheet.
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

const ROUTE_TO_SURFACE = [
  // ✅ Feed (your first ads-enabled surface)
  { match: (p) => p === '/feed', surfaceId: 'community_feed' },

  // ✅ Post view should share the same ad surface as feed
  { match: (p) => p === '/post-view', surfaceId: 'community_feed' },

  // Add more mappings here as you normalize the sheet:
  // { match: (p) => p === '/seeker-dashboard' || p === '/applications' || p === '/pinned-jobs', surfaceId: 'seeker_dashboard' },
  // { match: (p) => p.startsWith('/hearth'), surfaceId: 'hearth' },
  // { match: (p) => p.startsWith('/signal'), surfaceId: 'the_signal' },
];

export function resolveSurfaceId(asPath) {
  const path = normalizePath(asPath);

  for (const rule of ROUTE_TO_SURFACE) {
    try {
      if (rule.match(path)) return rule.surfaceId;
    } catch {
      // ignore bad rule
    }
  }

  // Safe fallback: unknown surface. This should render no ads.
  return 'unknown';
}

export function getDefaultRailSlotsForSurface(surfaceId) {
  // MVP: right rail only. Later, expand per surface.
  if (!surfaceId || surfaceId === 'unknown') return [];
  return ['right_rail_1'];
}
