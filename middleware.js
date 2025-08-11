import { NextResponse } from 'next/server';

// Public pages allowed to be visible
const PUBLIC_PATHS = new Set(['/', '/waiting-list', '/about']);

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

  // Allow static assets
  if (STATIC_ALLOW.some((re) => re.test(pathname))) {
    return NextResponse.next();
  }

  // Allow public pages
  if (PUBLIC_PATHS.has(pathname) || PUBLIC_PATHS.has(pathname.replace(/\/$/, ''))) {
    return NextResponse.next();
  }

  // Everything else → Coming Soon page
  const url = new URL('/coming-soon', req.url);
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: '/:path*',
};
