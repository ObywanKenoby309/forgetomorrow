// middleware.js
import { NextResponse } from 'next/server';

// Public pages allowed to be visible
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
  const { pathname } = new URL(req.url);

  // ✅ Bypass in dev / localhost (you can see everything locally)
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
  const normalized = pathname.replace(/\/$/, '') || '/';
  if (PUBLIC_PATHS.has(normalized)) {
    return NextResponse.next();
  }
  // Also allow nested under listed public prefixes (e.g., /feedback/abc)
  if ([...PUBLIC_PATHS].some((p) => p !== '/' && normalized.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // Everything else → Coming Soon (locked down)
  const url = new URL('/coming-soon', req.url);
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: '/:path*',
};
