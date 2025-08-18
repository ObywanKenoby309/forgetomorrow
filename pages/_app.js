// pages/_app.js
import '@/styles/globals.css';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import LandingHeader from '@/components/LandingHeader';
import LandingFooter from '@/components/LandingFooter';
// ⛔ Removed Header/Footer to avoid mixed public headers

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

  // Internal app sections
  const isRecruiterRoute = router.pathname.startsWith('/recruiter');

  // Seeker routes render their own header inside pages
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

  // Coaching routes render their own header inside pages
  const isCoachingRoute =
    router.pathname === '/coaching-dashboard' ||
    router.pathname.startsWith('/dashboard/coaching');

  // Public = not recruiter/seeker/coaching
  const isPublic = !isRecruiterRoute && !isSeekerRoute && !isCoachingRoute;

  // Background image only on these paths (keep your current set)
  const useForgeBackground =
    isPublic && ['/', '/about', '/features'].includes(router.pathname);

  // Public header is fixed (h-14). Add top padding when public header is present.
  const needsTopPadding = isPublic;

  return (
    <div className="relative min-h-screen">
      {useForgeBackground && (
        <>
          <div
            className="fixed inset-0 z-0"
            style={{
              backgroundImage: "url('/images/forge-bg-bw.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
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
            - ALL public pages use LandingHeader (unify look) */}
        {isPublic && <LandingHeader />}

        <PlanProvider>
          <ResumeProvider>
            <RouteTracker />
            {/* Match LandingHeader height (h-14 ~ 56px) */}
            <div className={needsTopPadding ? 'pt-14' : ''}>
              <Component {...pageProps} />
            </div>
          </ResumeProvider>
        </PlanProvider>

        {/* Footers: unify public footer as well */}
        {isPublic && <LandingFooter />}
      </div>
    </div>
  );
}
