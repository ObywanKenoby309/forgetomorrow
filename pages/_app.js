// pages/_app.js
import '@/styles/globals.css';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import LandingHeader from '@/components/LandingHeader';
import LandingFooter from '@/components/LandingFooter';
import Footer from '@/components/Footer';
import UniversalHeader from '@/components/UniversalHeader';
import { ResumeProvider } from '@/context/ResumeContext';
import { PlanProvider } from '@/context/PlanContext';
import { AiUsageProvider } from '@/context/AiUsageContext';
import { useUserWallpaper } from '@/hooks/useUserWallpaper';
import SupportFloatingButton from '@/components/SupportFloatingButton';
import { SessionProvider } from 'next-auth/react';

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

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  const router = useRouter();

  // Pull user wallpaper (internal pages only)
  const { wallpaperUrl } = useUserWallpaper();

  const isRecruiterRoute = router.pathname.startsWith('/recruiter');

  // ✅ NEW: Admin routes are INTERNAL (no external header/footer)
  const isAdminRoute = router.pathname.startsWith('/admin');

  // Treat all Hearth routes as internal seeker-style pages
  const isSeekerRoute =
    router.pathname.startsWith('/seeker') ||
    router.pathname.startsWith('/resume') ||
    router.pathname.startsWith('/cover') ||
    router.pathname.startsWith('/apply') ||
    router.pathname.startsWith('/hearth') ||
    router.pathname.startsWith('/offer-negotiation') ||
    [
      '/the-hearth',
      '/jobs',
      '/applications',
      '/pinned-jobs',
      '/resume-cover',
      '/roadmap', // legacy (redirects to /anvil)
      '/anvil',   // ✅ NEW canonical
      '/profile',
      '/profile-analytics',
      '/feed',
      '/member-profile',
      '/messages',
    ].includes(router.pathname);

  const isCoachingRoute =
    router.pathname === '/coaching-dashboard' ||
    router.pathname.startsWith('/dashboard/coaching') ||
    router.pathname.startsWith('/coach') ||
    router.pathname.startsWith('/resources/mentors');

  const isSettingsRoute = router.pathname === '/settings';

  // Treat Support Center as internal (shared tool for logged-in users)
  const isSupportRoute =
    router.pathname === '/support' ||
    router.pathname === '/support/chat' ||
    router.pathname.startsWith('/support/');

  // ✅ UPDATED: admin routes are NOT public
  const isPublicByPath =
    !isRecruiterRoute &&
    !isAdminRoute &&
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
    '/cookies',
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
        lastRoute.startsWith('/admin') || // ✅ NEW
        lastRoute.startsWith('/dashboard/coaching') ||
        lastRoute === '/coaching-dashboard' ||
        lastRoute === '/feed' ||
        lastRoute === '/settings' ||
        lastRoute.startsWith('/anvil') ||   // ✅ NEW (handles querystring too)
        lastRoute.startsWith('/roadmap'));  // legacy (handles querystring too)

    setSharedAsInternal(cameFromInternal);
  }, [router.pathname]);

  const isPublicEffective = sharedRoutes.has(router.pathname)
    ? isPublicByPath && !sharedAsInternal
    : isPublicByPath;

  // Marketing pages (Forge hammer background)
  const useForgeBackground =
    !isUniversalPage &&
    isPublicEffective &&
    ['/', '/about', '/features', '/press', '/status'].includes(router.pathname);

  const forgeBgPosition = router.pathname === '/' ? '35% center' : 'center';
  const renderLandingHeader = isPublicEffective && !isUniversalPage;

  // Only load cookie banner on production hostname
  const isBrowser = typeof window !== 'undefined';
  const hostname = isBrowser ? window.location.hostname : '';
  const shouldLoadCookieScript =
    isBrowser && (hostname === 'forgetomorrow.com' || hostname.endsWith('.forgetomorrow.com'));

  // Decide if we should show user wallpaper (internal only)
  const shouldUseWallpaper = !isUniversalPage && !isPublicEffective && !!wallpaperUrl;

  // Decide if internal shell should be gray (when no wallpaper)
  const shouldUseGrayInternalBg = !useForgeBackground && !isPublicEffective && !wallpaperUrl;

  return (
    <>
      <Head>
        <title>ForgeTomorrow</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {shouldLoadCookieScript && (
        <Script
          src="https://cdn.cookie-script.com/s/ff274d476e18526f8fd0a8c8114bbaf3.js"
          strategy="afterInteractive"
          onLoad={() => console.log('Cookie banner initialized once (prod)')}
        />
      )}

      <div className="relative min-h-screen">
        {/* BACKGROUND LAYERS */}

        {/* 1) Forge hammer background for public marketing pages */}
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

        {/* 2) User wallpaper for internal pages */}
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
          <SessionProvider session={session}>
            <PlanProvider>
              <ResumeProvider>
                <AiUsageProvider>
                  <RouteTracker />
                  {renderLandingHeader && <LandingHeader />}
                  {isUniversalPage && <UniversalHeader />}
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
          </SessionProvider>
        </div>
      </div>
    </>
  );
}
