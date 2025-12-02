// middleware.js
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Optional site lock: when SITE_LOCK=1, non-public pages require auth
const SITE_LOCK = process.env.SITE_LOCK === "1";
// Signup window toggle: when SIGNUPS_OPEN=1, allow new account creation
const SIGNUPS_OPEN = process.env.SIGNUPS_OPEN === "1";

// Upstash Redis (optional – safe if not configured)
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const ratelimit =
  redis &&
  new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "10 s"),
    analytics: true,
    prefix: "middleware:rl:",
  });

// Public pages allowed when locked
// Everything else is considered PRIVATE by default when SITE_LOCK=1
const PUBLIC_PATHS = new Set([
  "/",                 // landing
  "/waiting-list",
  "/blog",
  "/features",
  "/pricing",
  "/help",             // Help Center: public
  "/privacy",
  "/subprocessors",
  "/terms",
  "/accessibility",
  "/tracking-policy",
  "/login",
  "/auth/signin",      // allow the sign-in page itself
  // /signup is gated by SIGNUPS_OPEN in isPublicPath
  "/contact",
  "/feedback",         // plus nested like /feedback/abc
]);

function isPublicPath(pathname) {
  if (PUBLIC_PATHS.has(pathname)) return true;

  // 🔓 Signup flow – only allowed when SIGNUPS_OPEN=1
  if (SIGNUPS_OPEN) {
    // Allow /signup plus any variants like /signup/, /signup?from=...
    if (pathname === "/signup" || pathname.startsWith("/signup")) {
      return true;
    }

    // Allow the preverify API only while signups are open
    if (pathname.startsWith("/api/auth/preverify")) {
      return true;
    }
  }

  // 🔓 Verification link endpoint should always be accessible
  if (pathname.startsWith("/api/auth/verify")) {
    return true;
  }

  // Allow nested feedback paths
  if (pathname.startsWith("/feedback/")) return true;

  // Static / Next internals always allowed
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/icons")
  ) {
    return true;
  }

  return false;
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Always allow public + static paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Optional site lock: block non-public pages when not authenticated
  if (SITE_LOCK) {
    const hasSessionCookie =
      req.cookies.get("next-auth.session-token") ||
      req.cookies.get("__Secure-next-auth.session-token");

    if (!hasSessionCookie) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Basic rate limiting if Redis is configured
  if (ratelimit) {
    const ip = req.ip ?? req.headers.get("x-forwarded-for") ?? "unknown";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return new NextResponse("Too many requests", { status: 429 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
