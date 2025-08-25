// middleware.js
import { NextResponse } from 'next/server';

// Public pages allowed to be visible
const PUBLIC_PATHS = new Set([
  '/', '/waiting-list', '/about',
  '/pricing', '/features', '/login', '/signup', '/contact',
  '/coming-soon'
]);

// Static files always allowed
const STATIC_ALLOW = [
  /^\/_next\//,
  /^\/favicon\.ico$/,
  /^\/icons?\//,
  /^\/images?\//,
  /^\/fonts?\//,
  /\.(png|jpe?g|gif|svg|webp|ico|css|js|map|txt|xml|woff2?|ttf|otf)$/i,
];

// ---- helper: read roles from a cookie you set at auth (e.g., "coach,seeker") ----
function isCoach(req) {
  try {
    const raw = req.cookies.get('ft_roles')?.value || '';
    return raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .includes('coach');
  } catch {
    return false;
  }
}

export function middleware(req) {
  const url = new URL(req.url);
  const { pathname, searchParams } = url;

  // ✅ Bypass in dev / localhost
  const hostname = req.nextUrl.hostname;
  if (
    process.env.NODE_ENV === 'development' ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1'
  ) {
    return NextResponse.next();
  }

  // Allow static assets
  if (STATIC_ALLOW.some((re) => re.test(pathname))) {
    return NextResponse.next();
  }

  // ---------- LOCKDOWN ADDITIONS (run before public/coming-soon logic) ----------
  const coach = isCoach(req);

  // A) Strip ?chrome=coach on seeker pages for non-coaches
  const isSeekerArea =
    pathname.startsWith('/seeker') ||
    pathname === '/resume-cover' ||
    pathname === '/applications' ||
    pathname === '/roadmap';

  if (!coach && isSeekerArea && searchParams.get('chrome') === 'coach') {
    searchParams.delete('chrome');
    url.search = searchParams.toString();
    return NextResponse.redirect(url);
  }

  // B) Block coaching routes for non-coaches
  const isCoachingRoute =
    pathname === '/coaching-dashboard' ||
    pathname.startsWith('/dashboard/coaching');

  if (isCoachingRoute && !coach) {
    // Redirect to a PUBLIC page to avoid hitting the coming-soon rewrite
    const redirectUrl = new URL('/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }
  // ---------------------------------------------------------------------------

  // Allow public pages (handles trailing slash)
  if (PUBLIC_PATHS.has(pathname) || PUBLIC_PATHS.has(pathname.replace(/\/$/, ''))) {
    return NextResponse.next();
  }

  // Everything else → Coming Soon
  const comingSoon = new URL('/coming-soon', req.url);
  return NextResponse.rewrite(comingSoon);
}

export const config = {
  matcher: '/:path*',
};
