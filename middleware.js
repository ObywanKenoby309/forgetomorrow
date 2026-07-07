// middleware.js — Updated PUBLIC PAGES version with profile + asset + billing/stripe bypass + Foundry protection
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
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

const DEMO_SECRET = process.env.DEMO_SECRET || null;

const PUBLIC_PATHS = new Set([
  "/",
  "/about",
  "/pricing",
  "/help",
  "/contact",
  "/features",
  "/careers",
  "/press",
  "/blog",
  "/privacy",
  "/terms",
  "/community-guidelines",
  "/security",
  "/accessibility",
  "/tracking-policy",
  "/company",
  "/product",
  "/investor-relations",
  "/legal",
  "/login",
  "/auth/signin",
  "/feedback",
  "/subprocessors",
]);

const INTERNAL_PREFIXES = ["/internal", "/workspace"];

const AUTH_PREFIXES = [
  "/action-center",
  "/profile",
  "/profile-strength",
  "/search",
];

const FOUNDRY_PREFIXES = ["/foundry", "/api/foundry"];

function isPublicPath(pathname) {
  if (PUBLIC_PATHS.has(pathname)) return true;

  if (pathname.startsWith("/blog/")) return true;
  if (pathname.startsWith("/help/")) return true;
  if (pathname.startsWith("/features/")) return true;
  if (pathname.startsWith("/feedback/")) return true;

  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/static")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (pathname.startsWith("/images")) return true;
  if (pathname.startsWith("/icons")) return true;

  if (pathname.startsWith("/corporate-banners")) return true;
  if (pathname.startsWith("/profile-wallpapers")) return true;

  if (SIGNUPS_OPEN && pathname.startsWith("/signup")) return true;

  return false;
}

function isInternalPath(pathname) {
  return INTERNAL_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isAuthPath(pathname) {
  return AUTH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isFoundryPath(pathname) {
  return FOUNDRY_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isPublicFoundryGuestPath(pathname) {
  return (
    pathname.startsWith("/foundry/join/") ||
    pathname.startsWith("/foundry/guest/") ||
    pathname === "/api/foundry/guest-token" ||
    pathname === "/api/foundry/resolve-code" ||
    pathname.startsWith("/api/foundry/room-status/") ||
    pathname.match(/^\/api\/foundry\/room\/[^\/]+\/share-file$/) !== null ||
    pathname === "/api/files/download"
  );
}

async function hasValidNextAuthSession(req) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  return !!token;
}

function redirectToSignin(req, pathname) {
  const url = req.nextUrl.clone();
  url.pathname = "/auth/signin";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url, 302);
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // ── Demo pages — gated by DEMO_SECRET cookie or env var ──────────────────
  if (pathname.startsWith("/demo")) {
    if (!DEMO_SECRET) {
      // No secret set — block entirely in production
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url, 302);
    }
    // Check for demo session cookie
    const demoCookie = req.cookies.get("demo_access")?.value;
    const demoParam = req.nextUrl.searchParams.get("demo_key");
    if (demoCookie === DEMO_SECRET || demoParam === DEMO_SECRET) {
      const res = NextResponse.next();
      if (demoParam === DEMO_SECRET) {
        // Set cookie so they don't need to keep passing the param
        res.cookies.set("demo_access", DEMO_SECRET, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 8 });
      }
      return res;
    }
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url, 302);
  }

  if (pathname === "/roadmap") {
    const url = req.nextUrl.clone();
    url.pathname = "/anvil";
    return NextResponse.redirect(url, 301);
  }

  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/resume/public-download")) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/api/stripe") ||
    pathname.startsWith("/api/billing") ||
    pathname === "/billing/checkout" ||
    pathname === "/billing/success" ||
    pathname === "/billing/cancel"
  ) {
    return NextResponse.next();
  }

  if (isPublicFoundryGuestPath(pathname)) {
    return NextResponse.next();
  }

  if (isFoundryPath(pathname)) {
    const hasSession = await hasValidNextAuthSession(req);

    if (!hasSession) {
      return redirectToSignin(req, pathname);
    }

    return NextResponse.next();
  }

  if (pathname === "/u" || pathname.startsWith("/u/")) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (isAuthPath(pathname)) {
    const hasSession = await hasValidNextAuthSession(req);

    if (!hasSession) {
      return redirectToSignin(req, pathname);
    }

    return NextResponse.next();
  }

  if (isInternalPath(pathname)) {
    const hasSession = await hasValidNextAuthSession(req);

    if (!hasSession) {
      return redirectToSignin(req, pathname);
    }

    return NextResponse.next();
  }

  if (SITE_LOCK) {
    const hasSession = await hasValidNextAuthSession(req);

    if (!hasSession) {
      return redirectToSignin(req, pathname);
    }
  }

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