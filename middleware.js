// middleware.js
import { NextResponse } from 'next/server';

// ──────────────────────────────────────────────────────────────
// ENV-BASED LOCK
// SITE_LOCK = "1"  → lock the site (except allowed hosts/static/coming-soon)
// SITE_LOCK = "0"  → public rules (use PUBLIC_PATHS below)
// ALLOWED_HOSTS = "example.com,preview.vercel.app" (optional)
// ──────────────────────────────────────────────────────────────
const SITE_LOCK = process.env.SITE_LOCK === '1';
const ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS || '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);

// Public pages allowed to be visible when NOT locked
const PUBLIC_PATHS = new Set([
  '/', '/waiting-list', '/about',
  '/pricing', '/features', '/login', '/signup', '/contact',
  '/coming-soon',
  // keep public feedback form + any nested routes like /feedback/coach-id
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

  // ✅ Always allow static assets
  if (STATIC_ALLOW.some((re) => re.test(pathname))) {
    return NextResponse.next();
  }

  // ✅ Bypass everything in local dev
  const hostname = req.nextUrl.hostname || '';
  if (
    process.env.NODE_ENV === 'development' ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1'
  ) {
    return NextResponse.next();
  }

  // ✅ If host is explicitly allowed, let it through (useful for previews)
  if (ALLOWED_HOSTS.length > 0) {
    const isAllowedHost = ALLOWED_HOSTS.some(
      (allowed) => hostname === allowed || hostname.endsWith(allowed)
    );
    if (isAllowedHost) {
      return NextResponse.next();
    }
  }

  // 🔒 LOCKED MODE: rewrite everything to /coming-soon
  if (SITE_LOCK) {
    const comingSoon = new URL('/coming-soon', req.url);
    return NextResponse.rewrite(comingSoon);
  }

  // 🌐 PUBLIC MODE: allow listed public pages (handles trailing slash)
  const normalized = pathname.replace(/\/$/, '') || '/';
  if (PUBLIC_PATHS.has(normalized)) return NextResponse.next();

  // Also allow nested under public prefixes (e.g., /feedback/abc)
  if ([...PUBLIC_PATHS].some((p) => p !== '/' && normalized.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // Everything else → Coming Soon
  const comingSoon = new URL('/coming-soon', req.url);
  return NextResponse.rewrite(comingSoon);
}

export const config = {
  matcher: '/:path*',
};
