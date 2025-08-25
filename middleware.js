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

export function middleware(req) {
  // 🔓 EMERGENCY BYPASS FOR DEADLINE
  // If set to '1' in Vercel env, skip the Coming Soon gate entirely.
  if (process.env.NEXT_PUBLIC_OPEN_SITE === '1') {
    return NextResponse.next();
  }

  const { pathname } = new URL(req.url);

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

  // Allow public pages (handles trailing slash)
  if (PUBLIC_PATHS.has(pathname) || PUBLIC_PATHS.has(pathname.replace(/\/$/, ''))) {
    return NextResponse.next();
  }

  // Everything else → Coming Soon
  const url = new URL('/coming-soon', req.url);
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: '/:path*',
};
