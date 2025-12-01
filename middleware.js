// middleware.js
import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ──────────────────────────────────────────────────────────────
// ENV TOGGLES
// SITE_LOCK = "1"  → lock the site (only PUBLIC_PATHS; others → /login)
// SITE_LOCK = "0" or unset → fully public (no lock)
// ALLOWED_HOSTS = "example.com,preview.vercel.app" (optional; bypass lock)
// ──────────────────────────────────────────────────────────────
const SITE_LOCK = process.env.SITE_LOCK === '1';
const ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS || '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);

// Public pages allowed when locked
// Everything else is considered PRIVATE by default when SITE_LOCK=1
const PUBLIC_PATHS = new Set([
  '/',                 // landing
  '/waiting-list',
  '/about',
  '/careers',
  '/press',
  '/blog',
  '/features',
  '/pricing',
  '/help',
  '/privacy',
  '/subprocessors',
  '/terms',
  '/security',
  '/accessibility',
  '/tracking-policy',
  '/login',
  '/auth/signin',
  '/signup',           // ← allow signup page to load
  '/contact',
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

// ──────────────────────────────────────────────────────────────
// API RATE LIMITER (Upstash Redis)
// Requires UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
// ──────────────────────────────────────────────────────────────
const redis = Redis.fromEnv();

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(6, '20 m'), // 6 calls per 20 minutes per IP
  prefix: 'ft:rl:api',
});

// Specific API paths that should be rate-limited (heavy / AI / payment)
const PROTECTED_API_PREFIXES = [
  '/api/ai',           // e.g. /api/ai/helpdesk, /api/ai/resume-tailor
  '/api/resume',       // e.g. /api/resume/ats-score
  '/api/roadmap',      // e.g. /api/roadmap/generate
  '/api/cover-letter',
  '/api/ats',
  '/api/pay',          // payment / billing related APIs
];

function isProtectedApiPath(pathname) {
  return PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(req) {
  const url = new URL(req.url);
  const { pathname } = url;
  const hostname = req.nextUrl.hostname || '';

  // normalize path: remove trailing slash, but keep root as '/'
  const normalized = pathname.replace(/\/$/, '') || '/';

  // Session cookies from your auth flows
  const ftSession = req.cookies.get?.('ft_session')?.value;

  // NextAuth session cookies (JWT strategy)
  const nextAuthSession =
    req.cookies.get?.('next-auth.session-token')?.value ||
    req.cookies.get?.('__Secure-next-auth.session-token')?.value;

  // Treat EITHER as a valid session
  const hasSession = Boolean(ftSession || nextAuthSession);

  // ──────────────────────────────────────────────────────────
  // 0) Always allow static assets
  // ──────────────────────────────────────────────────────────
  if (STATIC_ALLOW.some((re) => re.test(pathname))) {
    const res = NextResponse.next();
    res.headers.set('x-site-lock', SITE_LOCK ? 'on' : 'off');
    return res;
  }

  // ──────────────────────────────────────────────────────────
  // 1) Always allow auth APIs
  //    (so /api/auth/session & /api/auth/me return JSON, not login HTML)
  // ──────────────────────────────────────────────────────────
  if (normalized.startsWith('/api/auth/')) {
    const res = NextResponse.next();
    res.headers.set('x-site-lock', 'auth-api');
    return res;
  }

  // ──────────────────────────────────────────────────────────
  // 2) Explicitly allowed hosts (preview domains, etc.)
  // ──────────────────────────────────────────────────────────
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

  // ──────────────────────────────────────────────────────────
  // 3) JOBS: always require a session for /jobs* (even if SITE_LOCK=0)
  // ──────────────────────────────────────────────────────────
  if (normalized === '/jobs' || normalized.startsWith('/jobs/')) {
    if (!hasSession) {
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
    const res = NextResponse.next();
    res.headers.set('x-site-lock', 'jobs-auth-required');
    return res;
  }

  // ──────────────────────────────────────────────────────────
  // 3b) SUPPORT: always require a session for /support* (internal-only)
  // ──────────────────────────────────────────────────────────
  if (normalized === '/support' || normalized.startsWith('/support/')) {
    if (!hasSession) {
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
    const res = NextResponse.next();
    res.headers.set('x-site-lock', 'support-auth-required');
    return res;
  }

  // ──────────────────────────────────────────────────────────
  // 4) API RATE LIMITING (Upstash) for sensitive API routes
  // ──────────────────────────────────────────────────────────
  if (isProtectedApiPath(pathname)) {
    console.log('🛡️ Rate limiter branch hit for', pathname);

    const ip =
      req.ip ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown';

    try {
      const { success, reset } = await ratelimit.limit(ip);

      if (!success) {
        const now = Math.floor(Date.now() / 1000);
        const retryAfterSeconds = Math.max(0, reset - now) || 60;

        return new Response('Rate limit exceeded. Try again later.', {
          status: 429,
          headers: {
            'Retry-After': retryAfterSeconds.toString(),
          },
        });
      }
    } catch (err) {
      console.error('Rate limit error (Upstash)', err);
      // Fail-open on limiter error so we don't self-DoS
    }
  }

  // ──────────────────────────────────────────────────────────
  // 5) If ANY valid session cookie is present, bypass SITE_LOCK
  // ──────────────────────────────────────────────────────────
  if (hasSession) {
    const res = NextResponse.next();
    res.headers.set('x-site-lock', SITE_LOCK ? 'session-allow' : 'off');
    return res;
  }

  // ──────────────────────────────────────────────────────────
  // 6) If NOT locked → fully public (except /jobs above and /support*)
  // ──────────────────────────────────────────────────────────
  if (!SITE_LOCK) {
    const res = NextResponse.next();
    res.headers.set('x-site-lock', 'off');
    return res;
  }

  // ──────────────────────────────────────────────────────────
  // 7) LOCKED: allow only explicit PUBLIC_PATHS; rest → /login
  // ──────────────────────────────────────────────────────────
  if (PUBLIC_PATHS.has(normalized)) {
    const res = NextResponse.next();
    res.headers.set('x-site-lock', 'on-public');
    return res;
  }

  // allow nested under public prefixes (e.g., /feedback/abc, /blog/post-slug)
  if (
    [...PUBLIC_PATHS].some(
      (p) => p !== '/' && normalized.startsWith(p + '/')
    )
  ) {
    const res = NextResponse.next();
    res.headers.set('x-site-lock', 'on-public-nested');
    return res;
  }

  // No session + locked + not public → send to /login
  const loginUrl = new URL('/login', req.url);
  const res = NextResponse.redirect(loginUrl);
  res.headers.set('x-site-lock', 'on-locked');
  return res;
}

export const config = {
  // Apply to everything; logic above decides what happens
  matcher: '/:path*',
};
