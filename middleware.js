// middleware.js — Updated PUBLIC PAGES version
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const SITE_LOCK = process.env.SITE_LOCK === "1";
const SIGNUPS_OPEN = process.env.SIGNUPS_OPEN === "1";

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

/* -----------------------------------------------
   PUBLIC PAGES (FULL EXTERNAL SITE)
------------------------------------------------ */
const PUBLIC_PATHS = new Set([
  "/",                     // Home
  "/about",                // About Us
  "/pricing",              // Pricing / Signup
  "/help",                 // Help Center (NOT Support Center)
  "/contact",              // Contact
  "/features",             // Features overview
  "/careers",              // Careers
  "/press",                // Press Kit
  "/blog",                 // Blog landing
  "/privacy",              // Privacy Policy
  "/terms",                // Terms of Service
  "/security",             // Security
  "/accessibility",        // Accessibility
  "/tracking-policy",      // Cookies / Tracking
  "/login",                // Login page
  "/auth/signin",          // NextAuth Signin
  "/feedback",             // Feedback landing
  "/subprocessors",        // Subprocessor list
]);

function isPublicPath(pathname) {
  // Direct matches
  if (PUBLIC_PATHS.has(pathname)) return true;

  // Wildcard sections: allow all children
  if (pathname.startsWith("/blog/")) return true;
  if (pathname.startsWith("/help/")) return true;
  if (pathname.startsWith("/features/")) return true;
  if (pathname.startsWith("/feedback/")) return true;

  // Public assets
  if (pathname.startsWith("/api/auth/")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/static")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (pathname.startsWith("/images")) return true;
  if (pathname.startsWith("/icons")) return true;

  // Signup / Register flow
  if (SIGNUPS_OPEN && pathname.startsWith("/signup")) return true;

  return false;
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // 1. Always allow NextAuth API
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // 2. Public routes
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 3. SITE_LOCK protected mode
  if (SITE_LOCK) {
    const hasSession = req.cookies
      .getAll()
      .some((cookie) => cookie.name.includes("next-auth.session-token"));

    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/signin";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url, 302);
    }
  }

  // 4. Rate limiting
  if (ratelimit) {
    const ip = req.ip ?? req.headers.get("x-forwarded-for") ?? "anonymous";
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
