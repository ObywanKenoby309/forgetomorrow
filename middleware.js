// middleware.js
import { NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const SITE_LOCK = process.env.SITE_LOCK === '1'
const ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS || '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean)

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
  '/contact',
  '/feedback',
  '/signup',           // 👈 NEW: allow signup page even when locked
])

const STATIC_ALLOW = [
  /^\/_next\//,
  /^\/favicon\.ico$/,
  /^\/icons?\//,
  /^\/images?\//,
  /^\/fonts?\//,
  /\.(png|jpe?g|gif|svg|webp|ico|css|js|map|txt|xml|woff2?|ttf|otf)$/i,
]

const redis = Redis.fromEnv()

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(6, '20 m'),
  prefix: 'ft:rl:api',
})

const PROTECTED_API_PREFIXES = [
  '/api/ai',
  '/api/resume',
  '/api/roadmap',
  '/api/cover-letter',
  '/api/ats',
  '/api/pay',
]

function isProtectedApiPath(pathname) {
  return PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export async function middleware(req) {
  const url = new URL(req.url)
  const { pathname } = url
  const hostname = req.nextUrl.hostname || ''

  const normalized = pathname.replace(/\/$/, '') || '/'

  const ftSession = req.cookies.get?.('ft_session')?.value

  const nextAuthSession =
    req.cookies.get?.('next-auth.session-token')?.value ||
    req.cookies.get?.('__Secure-next-auth.session-token')?.value

  const hasSession = Boolean(ftSession || nextAuthSession)

  // ─────────────────────────────────────
  // 0) Always allow static assets
  // ─────────────────────────────────────
  if (STATIC_ALLOW.some((re) => re.test(pathname))) {
    const res = NextResponse.next()
    res.headers.set('x-site-lock', SITE_LOCK ? 'on' : 'off')
    return res
  }

  // ─────────────────────────────────────
  // 1) Always allow auth APIs
  //    (so /api/auth/session & /api/auth/me return JSON, not login HTML)
  // ─────────────────────────────────────
  if (normalized.startsWith('/api/auth/')) {
    const res = NextResponse.next()
    res.headers.set('x-site-lock', 'auth-api')
    return res
  }

  // ─────────────────────────────────────
  // 2) Explicitly allowed hosts (preview domains, etc.)
  // ─────────────────────────────────────
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

  // ─────────────────────────────────────
  // 3) JOBS: require session
  // ─────────────────────────────────────
  if (normalized === '/jobs' || normalized.startsWith('/jobs/')) {
    if (!hasSession) {
      const loginUrl = new URL('/login', req.url)
      return NextResponse.redirect(loginUrl)
    }
    const res = NextResponse.next()
    res.headers.set('x-site-lock', 'jobs-auth-required')
    return res
  }

  // ─────────────────────────────────────
  // 3b) SUPPORT: require session
  // ─────────────────────────────────────
  if (normalized === '/support' || normalized.startsWith('/support/')) {
    if (!hasSession) {
      const loginUrl = new URL('/login', req.url)
      return NextResponse.redirect(loginUrl)
    }
    const res = NextResponse.next()
    res.headers.set('x-site-lock', 'support-auth-required')
    return res
  }

  // ─────────────────────────────────────
  // 4) API RATE LIMITING for sensitive APIs
  // ─────────────────────────────────────
  if (isProtectedApiPath(pathname)) {
    console.log('🛡️ Rate limiter branch hit for', pathname)

    const ip =
      req.ip ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown'

    try {
      const { success, reset } = await ratelimit.limit(ip)

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
    }
  }

  // ─────────────────────────────────────
  // 5) Any valid session bypasses SITE_LOCK
  // ─────────────────────────────────────
  if (hasSession) {
    const res = NextResponse.next()
    res.headers.set('x-site-lock', SITE_LOCK ? 'session-allow' : 'off')
    return res
  }

  // ─────────────────────────────────────
  // 6) If not locked → fully public (except jobs/support above)
  // ─────────────────────────────────────
  if (!SITE_LOCK) {
    const res = NextResponse.next()
    res.headers.set('x-site-lock', 'off')
    return res
  }

  // ─────────────────────────────────────
  // 7) LOCKED: only PUBLIC_PATHS; rest → /login
  // ─────────────────────────────────────
  if (PUBLIC_PATHS.has(normalized)) {
    const res = NextResponse.next()
    res.headers.set('x-site-lock', 'on-public')
    return res
  }

  if (
    [...PUBLIC_PATHS].some(
      (p) => p !== '/' && normalized.startsWith(p + '/')
    )
  ) {
    const res = NextResponse.next()
    res.headers.set('x-site-lock', 'on-public-nested')
    return res
  }

  const loginUrl = new URL('/login', req.url)
  const res = NextResponse.redirect(loginUrl)
  res.headers.set('x-site-lock', 'on-locked')
  return res
}

export const config = {
  matcher: '/:path*',
}
