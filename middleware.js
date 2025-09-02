// middleware.js
import { NextResponse } from 'next/server';

// ──────────────────────────────────────────────────────────────
// ENV TOGGLES
// SITE_LOCK = "1"  → lock the site (only public paths + /coming-soon)
// SITE_LOCK = "0"  → fully public (no lock)
// ALLOWED_HOSTS = "example.com,preview.vercel.app" (optional; bypass lock)
// ──────────────────────────────────────────────────────────────
const SITE_LOCK = process.env.SITE_LOCK === '1';
const ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS || '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);

// Public pages allowed when locked
const PUBLIC_PATHS = new Set([
  '/', '/waiting-list', '/about',
  '/pricing', '/features', '/login', '/signup', '/contact',
  '/coming-soon',
  // keep public feedback form + nested routes (e.g., /feedback/abc)
  '/feedback',
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

export function middleware(req) {
  const url = new URL(req.url);
  const { pathname } = url;
  const hostname = req.nextUrl.hostname || '';

  // Always allow static assets
  if (STATIC_ALLOW.some((re) => re.test(pathname))) {
    const res = NextResponse.next();
    res.headers.set('x-site-lock', SITE_LOCK ? 'on' : 'off');
    return res;
  }

  // Local/dev bypass (you see everything on localhost)
  if (
    process.env.NODE_ENV === 'development' ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1'
  ) {
    const res = NextResponse.next();
    res.headers.set('x-site-lock', 'dev-bypass');
    return res;
  }

  // If host is explicitly allowed, bypass lock (useful for previews)
  if (ALLOWED_HOSTS.length > 0) {
    const allowed = ALLOWED_HOSTS.some(
      (h) => hostname === h || hostname.endsWith(h)
    );
    if (allowed) {
      const res = NextResponse.next();
      res.headers.set('x-site-lock', 'allowed-host');
      return res;
    }
  }

  // If NOT locked → fully public
  if (!SITE_LOCK) {
    const res = NextResponse.next();
    res.headers.set('x-site-lock', 'off');
    return res;
  }

  // LOCKED: allow only public paths; everything else → /coming-soon
  const normalized = pathname.replace(/\/$/, '') || '/';
  if (PUBLIC_PATHS.has(normalized)) {
    const res = NextResponse.next();
    res.headers.set('x-site-lock', 'on-public');
    return res;
  }
  // allow nested under public prefixes (e.g., /feedback/abc)
  if ([...PUBLIC_PATHS].some((p) => p !== '/' && normalized.startsWith(p + '/'))) {
    const res = NextResponse.next();
    res.headers.set('x-site-lock', 'on-public-nested');
    return res;
  }

  const comingSoon = new URL('/coming-soon', req.url);
  const res = NextResponse.rewrite(comingSoon);
  res.headers.set('x-site-lock', 'on-locked');
  return res;
}

export const config = {
  matcher: '/:path*',
};
