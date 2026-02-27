// pages/_app.js
import '@/styles/globals.css';
import { useRouter } from 'next/router';
import { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import LandingHeader from '@/components/LandingHeader';
import LandingFooter from '@/components/LandingFooter';
import Footer from '@/components/Footer';
import UniversalHeader from '@/components/UniversalHeader';
import { ResumeProvider } from '@/context/ResumeContext';
import { PlanProvider, usePlan } from '@/context/PlanContext';
import { AiUsageProvider } from '@/context/AiUsageContext';
import { useUserWallpaper } from '@/hooks/useUserWallpaper';
import SupportFloatingButton from '@/components/SupportFloatingButton';
import { SessionProvider } from 'next-auth/react';

// ✅ Global Desktop Striker host (rendered on all internal pages)
import AiWindowsHost from '@/components/ai/AiWindowsHost';

function RouteTracker() {
  const router = useRouter();
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initial = router.asPath || '/';
    if (!initial.startsWith('/feedback/')) {
      try {
        sessionStorage.setItem('lastRoute', initial);
      } catch {}
    }

    const handleStart = () => {
      const curr = router.asPath || '/';
      if (!curr.startsWith('/feedback/')) {
        try {
          sessionStorage.setItem('lastRoute', curr);
        } catch {}
      }
    };

    router.events.on('routeChangeStart', handleStart);
    return () => router.events.off('routeChangeStart', handleStart);
  }, [router]);
  return null;
}

// ✅ Decide which Striker brains are available, gated by raw DB tier.
//
// Tier values from DB:
//   FREE       → no Striker (free seeker)
//   PRO        → Seeker Striker only
//   COACH      → Seeker + Coaching Striker
//   SMALL_BIZ  → Seeker + Recruiting Striker
//   ENTERPRISE → Seeker + Recruiting Striker
//
// Role is used to disambiguate COACH vs RECRUITER vs plain SEEKER
// for PRO/SMALL_BIZ/ENTERPRISE tier accounts.
//
// Rules:
//   - Free plan (tier === 'FREE' or null): no Striker at all
//   - COACH role: ['seeker', 'coach']
//   - RECRUITER / OWNER / ADMIN / BILLING / SITE_ADMIN role: ['seeker', 'recruiter']
//   - Everyone else with a paid tier: ['seeker']

function GlobalStriker({ enabled }) {
  const { isLoaded: planLoaded, tier, role } = usePlan();

  const allowedModes = useMemo(() => {
    if (!enabled) return [];
    if (!planLoaded) return [];

    // Gate on raw DB tier — FREE (or null/missing) gets nothing
    if (!tier || tier === 'FREE') return [];

    const r = String(role || '').toUpperCase().trim();

    const isRecruiterLike =
      r === 'RECRUITER' ||
      r === 'OWNER' ||
      r === 'ADMIN' ||
      r === 'BILLING' ||
      r === 'SITE_ADMIN';

    if (r === 'COACH') return ['seeker', 'coach'];
    if (isRecruiterLike) return ['seeker', 'recruiter'];

    // Default paid seeker
    return ['seeker'];
  }, [enabled, planLoaded, tier, role]);

  // Desktop only
  const [isMobile, setIsMobile] = useState(true);
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 1024);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) return null;
  if (!allowedModes.length) return null;

  return <AiWindowsHost allowedModes={allowedModes} />;
}

function AppShell({ Component, pageProps }) {
  const router = useRouter();

  // Pull user wallpaper (internal pages only) now inside SessionProvider
  const { wallpaperUrl } = useUserWallpaper();

  const isRecruiterRoute = router.pathname.startsWith('/recruiter');

  // Admin routes are INTERNAL (no external header/footer)
  const isAdminRoute = router.pathname.startsWith('/admin');

  // Internal / Workspace routes are INTERNAL (no external header/footer)
  const isInternalRoute = router.pathname.startsWith('/internal');
  const isWorkspaceRoute = router.pathname.startsWith('/workspace');

  // Job apply route should be treated as INTERNAL seeker-style page
  const isJobApplyRoute = router.pathname === '/job/[id]/apply';

  // Treat all Hearth routes as internal seeker-style pages
  const isSeekerRoute =
    router.pathname.startsWith('/seeker') ||
    router.pathname.startsWith('/resume') ||
    router.pathname.startsWith('/cover') ||
    router.pathname.startsWith('/apply') ||
    router.pathname.startsWith('/hearth') ||
    router.pathname.startsWith('/offer-negotiation') ||
    isJobApplyRoute ||
    [
      '/the-hearth',
      '/jobs',
      '/applications',
      '/pinned-jobs',
      '/resume-cover',
      '/roadmap', // legacy (redirects to /anvil)
      '/anvil', // canonical
      '/profile',
      '/profile-analytics',
      '/feed',
      '/post-view', // Post full view is INTERNAL (prevents public header/footer)
      '/member-profile',
      '/messages',
      '/action-center',
    ].includes(router.pathname);

  const isCoachingRoute =
    router.pathname === '/coaching-dashboard' ||
    router.pathname.startsWith('/dashboard/coaching') ||
    router.pathname.startsWith('/coach') ||
    router.pathname.startsWith('/resources/mentors');

  const isSettingsRoute = router.pathname === '/settings';

  // Treat Support Center as internal (shared tool for logged-in users)
  const isSupportRoute =
    router.pathname === '/support' || router.pathname === '/support/chat' || router.pathname.startsWith('/support/');

  // admin/internal/workspace routes are NOT public
  const isPublicByPath =
    !isRecruiterRoute &&
    !isAdminRoute &&
    !isInternalRoute &&
    !isWorkspaceRoute &&
    !isSeekerRoute &&
    !isCoachingRoute &&
    !isSettingsRoute &&
    !isSupportRoute;

  const universalHeaderRoutes = new Set([]);
  const isUniversalPage = universalHeaderRoutes.has(router.pathname) && !router.query?.chrome;

  const sharedRoutes = new Set([
    '/help',
    '/privacy',
    '/terms',
    '/security',
    '/accessibility',
    '/tracking-policy', // canonical (replaces /cookies)
  ]);

  const [sharedAsInternal, setSharedAsInternal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isShared = sharedRoutes.has(router.pathname);
    if (!isShared) {
      setSharedAsInternal(false);
      return;
    }

    let lastRoute = '';
    try {
      lastRoute = sessionStorage.getItem('lastRoute') || '';
    } catch {}

    const cameFromInternal =
      !!lastRoute &&
      (lastRoute.startsWith('/seeker') ||
        lastRoute.startsWith('/recruiter') ||
        lastRoute.startsWith('/admin') ||
        lastRoute.startsWith('/internal') ||
        lastRoute.startsWith('/workspace') ||
        lastRoute.startsWith('/dashboard/coaching') ||
        lastRoute === '/coaching-dashboard' ||
        lastRoute === '/feed' ||
        lastRoute === '/settings' ||
        lastRoute.startsWith('/anvil') ||
        lastRoute.startsWith('/roadmap'));

    setSharedAsInternal(cameFromInternal);
  }, [router.pathname]);

  const isPublicEffective = sharedRoutes.has(router.pathname) ? isPublicByPath && !sharedAsInternal : isPublicByPath;

  // Marketing pages (Forge hammer background)
  const useForgeBackground =
    !isUniversalPage &&
    isPublicEffective &&
    ['/', '/about', '/features', '/press', '/status', '/company', '/product', '/legal'].includes(router.pathname);

  const forgeBgPosition = router.pathname === '/' ? '35% center' : 'center';
  const renderLandingHeader = isPublicEffective && !isUniversalPage;

  // Only load cookie banner on production hostname
  const isBrowser = typeof window !== 'undefined';
  const hostname = isBrowser ? window.location.hostname : '';
  const shouldLoadCookieScript = isBrowser && (hostname === 'forgetomorrow.com' || hostname.endsWith('.forgetomorrow.com'));

  // ✅ MIN ADD: prevent mobile from landing at the bottom (cookie banner focus/scroll)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!shouldLoadCookieScript) return;

    const isMobile = window.innerWidth < 1024; // match your "mobile" idea used elsewhere
    if (!isMobile) return;

    const forceTop = () => {
      try {
        // If a hash is present, allow the browser to honor anchor navigation
        if (window.location.hash) return;

        // If we're already near the top, do nothing
        if (window.scrollY <= 5) return;

        // Nudge back to top after DOM settles (cookie banner often injects/focuses late)
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        setTimeout(() => {
          try {
            if (!window.location.hash && window.scrollY > 5) {
              window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            }
          } catch {}
        }, 450);
      } catch {}
    };

    // Run once on mount
    setTimeout(forceTop, 0);

    // Run on route changes
    const onDone = () => setTimeout(forceTop, 0);
    router.events.on('routeChangeComplete', onDone);
    return () => router.events.off('routeChangeComplete', onDone);
  }, [router, shouldLoadCookieScript]);

  // Internal/workspace should NOT use wallpaper (presentation-safe, plain background)
  const forcePlainInternalBg = isInternalRoute || isWorkspaceRoute;

  // Decide if we should show user wallpaper (internal only)
  const shouldUseWallpaper = !forcePlainInternalBg && !isUniversalPage && !isPublicEffective && !!wallpaperUrl;

  // Decide if internal shell should be gray (when no wallpaper OR forced plain bg)
  const shouldUseGrayInternalBg = !useForgeBackground && !isPublicEffective && (forcePlainInternalBg || !wallpaperUrl);

  // Striker on all internal pages (everything that is not public effective)
  const shouldShowGlobalStriker = !isPublicEffective;

  return (
    <>
      <Head>
        <title>ForgeTomorrow</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {shouldLoadCookieScript && (
        <Script
          src="https://cdn.cookie-script.com/s/ff274d476e18526f8fd0a8c8114bbaf3.js"
          strategy="lazyOnload"
          onLoad={() => console.log('Cookie banner initialized once (prod)')}
        />
      )}

      <div className="relative min-h-screen">
        {/* BACKGROUND LAYERS */} {/* 1) Forge hammer background for public marketing pages */}
        {useForgeBackground && (
          <>
            <div
              className="fixed inset-0 z-0"
              style={{
                backgroundImage: "url('/images/forge-bg-bw.png')",
                backgroundSize: 'cover',
                backgroundPosition: forgeBgPosition,
                backgroundAttachment: 'fixed',
              }}
            />
            <div className="fixed inset-0 bg-black opacity-80 z-0" />
          </>
        )}
        {/* 2) User wallpaper for internal pages (disabled for internal/workspace) */}
        {shouldUseWallpaper && (
          <>
            <div
              className="fixed inset-0 z-0"
              style={{
                backgroundImage: `url(${wallpaperUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
              }}
            />
            <div className="fixed inset-0 bg-black/40 z-0" />
          </>
        )}

        {/* FOREGROUND CONTENT */}
        <div
          className={`relative z-10 min-h-screen flex flex-col justify-between ${
            shouldUseGrayInternalBg ? 'bg-[#ECEFF1]' : ''
          }`}
        >
          <PlanProvider>
            <ResumeProvider>
              <AiUsageProvider>
                <RouteTracker />
                {renderLandingHeader && <LandingHeader />}
                {isUniversalPage && <UniversalHeader />}

                {/* ✅ Global Striker (desktop) for all internal pages, gated by tier/role */}
                <GlobalStriker enabled={shouldShowGlobalStriker} />

                <Component {...pageProps} />
              </AiUsageProvider>
            </ResumeProvider>
          </PlanProvider>

          {renderLandingHeader ? <LandingFooter /> : <Footer />}

          {/* Support Floating Button - internal pages only (hidden on mobile via globals.css) */}
          {!isPublicEffective && (
            <div className="ft-support-fab">
              <SupportFloatingButton />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <AppShell Component={Component} pageProps={pageProps} />
    </SessionProvider>
  );
}
```
