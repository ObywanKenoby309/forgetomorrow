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

// --- Role helper (from cookie you may set later) ---
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

  // ✅ Dev / localhost bypass
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

  // 🔓 Preview access (no login yet): visit any URL with ?preview=YOUR_KEY
  // Set PREVIEW_KEY in Vercel → Project → Settings → Environment Variables
  const PREVIEW_KEY = process.env.PREVIEW_KEY || '';
  const pv = searchParams.get('preview');
  const hasPreviewCookie = req.cookies.get('ft_preview')?.value === '1';

  if (pv && (!PREVIEW_KEY || pv === PREVIEW_KEY)) {
    // Strip ?preview and set a cookie so you can browse internally
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

  const allowPreview = hasPreviewCookie; // treat preview cookie as "let them in"

  // ---------- Coach-specific UI rules (kept, but bypassed for preview) ----------
  const coach = isCoach(req);

  // A) Strip ?chrome=coach on Seeker pages for non-coaches (unless preview)
  const isSeekerArea =
    pathname.startsWith('/seeker') ||
    pathname === '/resume-cover' ||
    pathname === '/applications' ||
    pathname === '/roadmap';

  if (!coach && !allowPreview && isSeekerArea && searchParams.get('chrome') === 'coach') {
    searchParams.delete('chrome');
    url.search = searchParams.toString();
    return NextResponse.redirect(url);
  }

  // B) Block coaching routes for non-coaches (unless preview)
  const isCoachingRoute =
    pathname === '/coaching-dashboard' ||
    pathname.startsWith('/dashboard/coaching'
