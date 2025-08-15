// pages/_app.js
import '@/styles/globals.css';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LandingHeader from '@/components/LandingHeader';
import LandingFooter from '@/components/LandingFooter';

import { ResumeProvider } from '@/context/ResumeContext';
import { PlanProvider } from '@/context/PlanContext';

function RouteTracker() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // On first mount, record current page unless it's a feedback page.
    const initial = router.asPath || '/';
    if (!initial.startsWith('/feedback/')) {
      try {
        sessionStorage.setItem('lastRoute', initial);
      } catch {}
    }

    // Before navigating away, store the *current* page as lastRoute.
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

export default function App({ Component, pageProps }) {
  const router = useRouter();

  const isRecruiterRoute = router.pathname.startsWith('/recruiter');

  // Seeker routes render their own SeekerHeader inside the page.
  // This catches /seeker-dashboard, /seeker-profile, etc., plus specific Seeker pages.
  const isSeekerRoute =
    router.pathname.startsWith('/seeker') ||
    ['/the-hearth', '/jobs', '/applications', '/pinned-jobs', '/resume-cover', '/roadmap'].includes(
      router.pathname
    );

  // Coaching routes render their own CoachingHeader inside the page.
  const isCoachingRoute =
    router.pathname === '/coaching-dashboard' ||
    router.pathname.startsWith('/dashboard/coaching');

  // Landing header/footer only on these paths (and not for recruiter, seeker, or coaching routes)
  const isLandingPage =
    !isRecruiterRoute &&
    !isSeekerRoute &&
    !isCoachingRoute &&
    ['/', '/signup', '/features', '/login', '/about'].includes(router.pathname);

  // Background image only on these paths (and not for recruiter, seeker, or coaching routes)
  const useForgeBackground =
    !isRecruiterRoute &&
    !isSeekerRoute &&
    !isCoachingRoute &&
    ['/', '/about', '/features'].includes(router.pathname);

  // We only need top padding when the fixed main site Header is present
  const needsTopPadding = !isRecruiterRoute && !isSeekerRoute && !isCoachingRoute && !isLandingPage;

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
        {/* Header logic:
            - Recruiter, Seeker, and Coaching routes render their own headers inside the page.
            - Else, show LandingHeader on landing pages, Header everywhere else. */}
        {!isRecruiterRoute && !isSeekerRoute && !isCoachingRoute && (isLandingPage ? <LandingHeader /> : <Header />)}

        {/* Global providers (Plan first so usePlan() is available everywhere) */}
        <PlanProvider>
          <ResumeProvider>
            <RouteTracker />
            <div className={needsTopPadding ? 'pt-20' : ''}>
              <Component {...pageProps} />
            </div>
          </ResumeProvider>
        </PlanProvider>

        {/* Footer remains visible on Seeker/Coaching pages only if you want; currently hidden like header */}
        {!isRecruiterRoute && !isSeekerRoute && !isCoachingRoute && (isLandingPage ? <LandingFooter /> : <Footer />)}
      </div>
    </div>
  );
}
