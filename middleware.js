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

// --- Helpers ---
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

function isAuthed(req) {
  try {
    const roles = req.cookies.get('ft_roles')?.value || '';
    const nextAuth =
      req.cookies.get('__Secure-next-auth.session-token')?.value ||
      req.cookies.get('next-auth.session-token')?.value;
    const preview = req.cookies.get('ft_preview')?.value === '1';
    return Boolean(roles || nextAuth || preview);
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

  // 👇 Preview access: ?preview=KEY sets a short-lived cookie so you can browse internal pages
  const PREVIEW_KEY = process.env.PREVIEW_KEY || ''; // set in Vercel → Project → Settings → Env
  const pv = searchParams.get('preview');
  if (pv && (!PREVIEW_KEY || pv === PREVIEW_KEY)) {
    // strip the preview param and set a cookie
    searchParams.delete('preview');
    url.search = searchParams.toString();

    const res = NextResponse.redirect(url);
    res.cookies.set('ft_preview', '1', {
      path: '/',
      httpOnly: false,
      sameSite: 'Lax',
      secure: true,
      maxAge: 60 * 60 * 24, // 1 day
    });
    return res;
  }

  const coach = isCoach(req);
  const authed = isAuthed(req);

  // ---------- Coach lock-down (unchanged in spirit) ----------
  // A) Strip ?chrome=coach on Seeker pages for non-coaches
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
    // redirect to PUBLIC page to avoid Coming Soon rewrite loop
    const redirectUrl = new URL('/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }
  // -----------------------------------------------------------

  // Allow public pages (handles trailing slash)
  if (PUBLIC_PATHS.has(pathname) || PUBLIC_PATHS.has(pathname.replace(/\/$/, ''))) {
    return NextResponse.next();
  }

  // 🔓 Allow authed/preview users to access internal pages
  if (authed) {
    return NextResponse.next();
  }

  // Everything else → Coming Soon
  const comingSoon = new URL('/coming-soon', req.url);
  return NextResponse.rewrite(comingSoon);
}

export const config = {
  matcher: '/:path*',
};
