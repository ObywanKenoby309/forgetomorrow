// middleware.js
import { NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ──────────────────────────────────────────────────────────────
// ENV TOGGLES
// SITE_LOCK = "1"  → lock the site (only PUBLIC_PATHS + /coming-soon)
// SITE_LOCK = "0" or unset → fully public (no lock)
// ALLOWED_HOSTS = "example.com,preview.vercel.app" (optional; bypass lock)
// ──────────────────────────────────────────────────────────────
const SITE_LOCK = process.env.SITE_LOCK === '1'
const ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS || '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean)

// Public pages allowed when locked
// Everything else is considered PRIVATE by default when SITE_LOCK=1
const PUBLIC_PATHS = new Set([
  '/',
  '/waiting-list',
  '/about',
  '/pricing',
  '/features',
  '/login',
  '/contact',
  '/coming-soon',
  '/feedback', // plus nested like /feedback/abc
])

// Static files always allowed
const STATIC_ALLOW = [
  /^\/_next\//,
  /^\/favicon\.ico$/,
  /^\/icons?\//,
  /^\/images?\//,
  /^\/fonts?\//,
  /\.(png|jpe?g|gif|svg|webp|ico|css|js|map|txt|xml|woff2?|ttf|otf)$/i,
]

// ──────────────────────────────────────────────────────────────
// API RATE LIMITER (Upstash Redis)
// Requires UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
// ──────────────────────────────────────────────────────────────
const redis = Redis.fromEnv()

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(6, '20 m'), // 6 calls per 20 minutes per IP
  prefix: 'ft:rl:api',
})

// Keywords that trigger extra protection on API routes
const PROTECTED_API_PATTERN = /ai|resume|roadmap|cover|generate|ats|pay|rate-limit-test/i

export async function middleware(req) {
  const url = new URL(req.url)
  const { pathname } = url
  const hostname = req.nextUrl.hostname || ''
  const normalized = pathname.replace(/\/$/, '') || '/'

  // Session cookie from your auth flow
  const hasSession = req.cookies.get?.('ft_session')?.value

  // ──────────────────────────────────────────────────────────
  // 0) Always allow static assets
  // ──────────────────────────────────────────────────────────
  if (STATIC_ALLOW.some((re) => re.test(pathname))) {
    const res = NextResponse.next()
    res.headers.set('x-site-lock', SITE_LOCK ? 'on' : 'off')
    return res
  }

  // ──────────────────────────────────────────────────────────
  // 1) Local/dev bypass (you see everything on localhost)
  // ──────────────────────────────────────────────────────────
 // if (
 //   process.env.NODE_ENV === 'development' ||
  //  hostname === 'localhost' ||
  //  hostname === '127.0.0.1'
  //) {
   // const res = NextResponse.next()
   // res.headers.set('x-site-lock', 'dev-bypass')
   // return res
  //}

  // ──────────────────────────────────────────────────────────
  // 2) Explicitly allowed hosts (preview domains, etc.)
  // ──────────────────────────────────────────────────────────
  if (ALLOWED_HOSTS.length > 0) {
    const allowed = ALLOWED_HOSTS.some(
      (h) => hostname === h || hostname.endsWith(h)
    )
    if (allowed) {
      const res = NextResponse.next()
      res.headers.set('x-site-lock', 'allowed-host')
      return res
    }
  }

  // ──────────────────────────────────────────────────────────
  // 3) JOBS: always require a session for /jobs* (even if SITE_LOCK=0)
  // ──────────────────────────────────────────────────────────
  if (normalized === '/jobs' || normalized.startsWith('/jobs/')) {
    if (!hasSession) {
      const loginUrl = new URL('/login', req.url)
      return NextResponse.redirect(loginUrl)
    }
    const res = NextResponse.next()
    res.headers.set('x-site-lock', 'jobs-auth-required')
    return res
  }

  // ──────────────────────────────────────────────────────────
  // 4) API RATE LIMITING (Upstash) for sensitive API routes
  // ──────────────────────────────────────────────────────────
  if (pathname.startsWith('/api') && PROTECTED_API_PATTERN.test(pathname)) {
  console.log('🛡️ Rate limiter branch hit for', pathname)

  const ip =
    req.ip ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'

  try {
    const { success, reset } = await ratelimit.limit(ip)
    // ...

      if (!success) {
        const now = Math.floor(Date.now() / 1000)
        const retryAfterSeconds = Math.max(0, reset - now) || 60

        return new Response('Rate limit exceeded. Try again later.', {
          status: 429,
          headers: {
            'Retry-After': retryAfterSeconds.toString(),
          },
        })
      }
    } catch (err) {
      console.error('Rate limit error (Upstash)', err)
      // Fail-open on limiter error so we don't self-DoS
    }
  }

  // ──────────────────────────────────────────────────────────
  // 5) If a valid session cookie is present, bypass SITE_LOCK
  // ──────────────────────────────────────────────────────────
  if (hasSession) {
    const res = NextResponse.next()
    res.headers.set('x-site-lock', SITE_LOCK ? 'session-allow' : 'off')
    return res
  }

  // ──────────────────────────────────────────────────────────
  // 6) If NOT locked → fully public (except /jobs above)
  // ──────────────────────────────────────────────────────────
  if (!SITE_LOCK) {
    const res = NextResponse.next()
    res.headers.set('x-site-lock', 'off')
    return res
  }

  // ──────────────────────────────────────────────────────────
  // 7) LOCKED: allow only explicit PUBLIC_PATHS; rest → /coming-soon
  // ──────────────────────────────────────────────────────────
  if (PUBLIC_PATHS.has(normalized)) {
    const res = NextResponse.next()
    res.headers.set('x-site-lock', 'on-public')
    return res
  }

  // allow nested under public prefixes (e.g., /feedback/abc)
  if (
    [...PUBLIC_PATHS].some(
      (p) => p !== '/' && normalized.startsWith(p + '/')
    )
  ) {
    const res = NextResponse.next()
    res.headers.set('x-site-lock', 'on-public-nested')
    return res
  }

  const comingSoon = new URL('/coming-soon', req.url)
  const res = NextResponse.rewrite(comingSoon)
  res.headers.set('x-site-lock', 'on-locked')
  return res
}

export const config = {
  // Apply to everything; logic above decides what happens
  matcher: '/:path*',
}
