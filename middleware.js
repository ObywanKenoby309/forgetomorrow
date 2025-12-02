// middleware.ts — Nova’s Final Cut (the one that ends the war)
import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const SITE_LOCK = process.env.SITE_LOCK === "1";
const SIGNUPS_OPEN = process.env.SIGNUPS_OPEN === "1";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const ratelimit = redis && new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "10 s"),
  analytics: true,
  prefix: "middleware:rl:",
});

const PUBLIC_PATHS = new Set([
  "/", "/waiting-list", "/blog", "/features", "/pricing", "/help",
  "/privacy", "/subprocessors", "/terms", "/accessibility",
  "/tracking-policy",
  "/login", "/auth/signin", "/contact", "/feedback",
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/api/auth/")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/static")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (pathname.startsWith("/images")) return true;
  if (pathname.startsWith("/icons")) return true;
  if (pathname.startsWith("/feedback/feedback/")) return true;
  if (SIGNUPS_OPEN && (pathname === "/signup" || pathname.startsWith("/signup"))) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Always let NextAuth API through
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // 2. Public routes = no questions asked
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 3. SITE_LOCK mode — check for closed beta
  if (SITE_LOCK) {
    // This catches EVERY possible NextAuth cookie name Vercel can dream up
    const hasSession = req.cookies.getAll().some(cookie =>
      cookie.name.includes("next-auth.session-token")
    );

    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth/signin";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url, 302);
    }
  }

  // 4. Rate limiting (optional but nice to keep)
  if (ratelimit) {
    const ip = req.ip ?? req.headers.get("x-forwarded-for") ?? "anonymous";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return new NextResponse("Too many requests", { status: 429 });
    }
  }

  // 5. Everything else → let them through
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};