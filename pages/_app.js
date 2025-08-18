// pages/_app.js
import '@/styles/globals.css';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import LandingHeader from '@/components/LandingHeader';
import LandingFooter from '@/components/LandingFooter';
import Footer from '@/components/Footer'; // internal footer

import { ResumeProvider } from '@/context/ResumeContext';
import { PlanProvider } from '@/context/PlanContext';

function RouteTracker() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initial = router.asPath || '/';
    if (!initial.startsWith('/feedback/')) {
      try { sessionStorage.setItem('lastRoute', initial); } catch {}
    }

    const handleStart = () => {
      const curr = router.asPath || '/';
      if (!curr.startsWith('/feedback/')) {
        try { sessionStorage.setItem('lastRoute', curr); } catch {}
      }
    };

    router.events.on('routeChangeStart', handleStart);
    return () => router.events.off('routeChangeStart', handleStart);
  }, [router]);

  return null;
}

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // --- Internal app sections by path prefix
  const isRecruiterRoute = router.pathname.startsWith('/recruiter');

  const isSeekerRoute =
    router.pathname.startsWith('/seeker') ||
    router.pathname.startsWith('/resume') ||
    [
      '/the-hearth',
      '/jobs',
      '/applications',
      '/pinned-jobs',
      '/resume-cover',
      '/roadmap',
    ].includes(router.pathname);

  const isCoachingRoute =
    router.pathname === '/coaching-dashboard' ||
    router.pathname.startsWith('/dashboard/coaching');
	
  // ✅ Treat Settings as internal-only
  const isSettingsRoute = router.pathname === '/settings';

  // Public = not recruiter/seeker/coaching (default behavior)
  const isPublicByPath = !isRecruiterRoute && !isSeekerRoute && !isCoachingRoute;

  // --- Shared routes (can be viewed both publicly and internally)
  const sharedRoutes = new Set([
    '/help',
    '/privacy',
    '/terms',
    '/security',
    '/accessibility',
    '/cookies',
  ]);

  // Determine if a shared route should render as "internal" using lastRoute heuristic
  const [sharedAsInternal, setSharedAsInternal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isShared = sharedRoutes.has(router.pathname);
    if (!isShared) {
      // Reset when navigating off shared routes
      setSharedAsInternal(false);
      return;
    }

    // Look at lastRoute to infer context (set by RouteTracker)
    let lastRoute = null;
    try { lastRoute = sessionStorage.getItem('lastRoute') || ''; } catch {}

    const cameFromInternal =
      !!lastRoute &&
      (lastRoute.startsWith('/seeker') ||
        lastRoute.startsWith('/recruiter') ||
        lastRoute.startsWith('/dashboard/coaching') ||
        lastRoute === '/coaching-dashboard');

    setSharedAsInternal(cameFromInternal);
  }, [router.pathname]);

  // Effective "public" flag: if on shared route and came from internal, treat as internal
  const isPublicEffective = sharedRoutes.has(router.pathname)
    ? (isPublicByPath && !sharedAsInternal)
    : isPublicByPath;

  // Background image only on these paths (keep your current set) and only for public rendering
  const useForgeBackground =
    isPublicEffective && ['/', '/about', '/features'].includes(router.pathname);

  // Nudge background on home to reveal the forge more (About stays centered)
  const forgeBgPosition = router.pathname === '/' ? '35% center' : 'center';

  // Public header is fixed (h-14). Add top padding when public header is present.
  const needsTopPadding = isPublicEffective;

  return (
    <div className="relative min-h-screen">
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

      <div
        className={`relative z-10 min-h-screen flex flex-col justify-between ${
          !useForgeBackground ? 'bg-[#ECEFF1]' : ''
        }`}
      >
        {/* Headers:
            - Internal (recruiter/seeker/coaching) use their own in-page headers
            - Public or shared-rendered-as-public uses LandingHeader */}
        {isPublicEffective && <LandingHeader />}

        <PlanProvider>
          <ResumeProvider>
            <RouteTracker />
            {/* Match LandingHeader height (h-14 ~ 56px) */}
            <div className={needsTopPadding ? 'pt-14' : ''}>
              <Component {...pageProps} />
            </div>
          </ResumeProvider>
        </PlanProvider>

        {/* Footers:
            - Public or shared-rendered-as-public => LandingFooter
            - Internal or shared-rendered-as-internal => Footer */}
        {isPublicEffective ? <LandingFooter /> : <Footer />}
      </div>
    </div>
  );
}
