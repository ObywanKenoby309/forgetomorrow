// middleware.js
// Updated by Nova & Eric — November 2025
// The day we finally beat the lock and made the cron immortal

import { NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ──────────────────────────────────────────────────────────────
// ENV TOGGLES
// SITE_LOCK = "1" → FULL LOCK (all internal pages require auth)
// SITE_LOCK = "0" or unset → public (except /jobs always requiring auth)
// ALLOWED_HOSTS = "example.com,preview.vercel.app"
// ──────────────────────────────────────────────────────────────
const SITE_LOCK = process.env.SITE_LOCK === '1'
const ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS || '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean)

// Public pages allowed when locked
const PUBLIC_PATHS = new Set([
  '/',
  '/waiting-list',
  '/about',
  '/pricing',
  '/features',
  '/login',
  '/contact',
  '/feedback', // nested allowed: /feedback/*
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

// Redis limiter
const redis = Redis.fromEnv()
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(6, '20 m'),
  prefix: 'ft:rl:api',
})

const PROTECTED_API_PATTERN = /ai|resume|roadmap|cover|generate|ats|pay/i

export async function middleware(req) {
  const url = new URL(req.url)
  const { pathname } = url
  const hostname = req.nextUrl.hostname || ''
  const normalized = pathname.replace(/\/$/, '') || '/'
  const hasSession = req.cookies.get?.('ft_session')?.value

  // ──────────────────────────────────────────────────────────
  // 0) STATIC - always allowed
  // ──────────────────────────────────────────────────────────
  if (STATIC_ALLOW.some((re) => re.test(pathname))) {
    const res = NextResponse.next()
    res.headers.set('x-site-lock', SITE_LOCK ? 'on' : 'off')
    return res
  }

  // ──────────────────────────────────────────────────────────
  // NOVA & ERIC'S UNBREAKABLE BACKDOOR — CRON ENDPOINT BYPASS
  // This runs before ANY auth check. Forever.
  // ──────────────────────────────────────────────────────────
  if (pathname.startsWith('/api/cron/')) {
    return NextResponse.next()
  }

  // ──────────────────────────────────────────────────────────
  // 1) Allowed host bypass
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
  // 2) JOBS: always require login
  // ──────────────────────────────────────────────────────────
  if (normalized === '/jobs' || normalized.startsWith('/jobs/')) {
    if (!hasSession) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    const res = NextResponse.next()
    res.headers.set('x-site-lock', 'jobs-auth-required')
    return res
  }

  // ──────────────────────────────────────────────────────────
  // 3) API rate limiting on sensitive API routes
  // ──────────────────────────────────────────────────────────
  if (pathname.startsWith('/api') && PROTECTED_API_PATTERN.test(pathname)) {
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
          headers: { 'Retry-After': retryAfterSeconds.toString() },
        })
      }
    } catch (err) {
      console.error('Rate limit error', err)
    }
  }

  // ──────────────────────────────────────────────────────────
  // 4) If the user is logged in → always allowed
  // ──────────────────────────────────────────────────────────
  if (hasSession) {
    const res = NextResponse.next()
    res.headers.set('x-site-lock', SITE_LOCK ? 'session-allow' : 'off')
    return res
  }

  // ──────────────────────────────────────────────────────────
  // 5) SITE NOT LOCKED → fully public except jobs
  // ──────────────────────────────────────────────────────────
  if (!SITE_LOCK) {
    const res = NextResponse.next()
    res.headers.set('x-site-lock', 'off')
    return res
  }

  // ──────────────────────────────────────────────────────────
  // 6) SITE LOCKED → only PUBLIC_PATHS allowed
  // ──────────────────────────────────────────────────────────
  if (PUBLIC_PATHS.has(normalized)) {
    const res = NextResponse.next()
    res.headers.set('x-site-lock', 'on-public')
    return res
  }

  // allow nested under public prefixes like /feedback/*
  if (
    [...PUBLIC_PATHS].some(
      (p) => p !== '/' && normalized.startsWith(p + '/')
    )
  ) {
    const res = NextResponse.next()
    res.headers.set('x-site-lock', 'on-public-nested')
    return res
  }

  // ──────────────────────────────────────────────────────────
  // 7) ANY locked internal route with no session → LOGIN
  // ──────────────────────────────────────────────────────────
  const res = NextResponse.redirect(new URL('/login', req.url))
  res.headers.set('x-site-lock', 'on-locked-login')
  return res
}

export const config = {
  matcher: '/:path*',
}